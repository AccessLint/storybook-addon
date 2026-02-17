import { createChunkedAudit, getActiveRules, getRuleById, configureRules } from "@accesslint/core";

// Defined by the accesslintTest() Vite plugin when tags.skip is configured
declare const __ACCESSLINT_SKIP_TAGS__: string[];

// Disable rules that don't apply to individual components in Storybook
configureRules({
  disabledRules: ["accesslint-045"],
});

const BUDGET_MS = 12;

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function scopeViolations<T extends { selector: string }>(violations: T[]): T[] {
  const root = document.getElementById("storybook-root");
  if (!root) return violations;
  return violations.filter((v) => {
    const local = v.selector.replace(/^.*>>>\s*iframe>\s*/, "");
    try {
      const el = document.querySelector(local);
      return el && root.contains(el);
    } catch {
      return false;
    }
  });
}

function enrichViolations(violations: { ruleId: string; selector: string; html: string; impact: string; message: string; context?: string; element?: Element }[]) {
  return violations.map((v) => {
    const rule = getRuleById(v.ruleId);
    return {
      ...v,
      element: undefined, // not serializable
      description: rule?.description,
      wcag: rule?.wcag,
      level: rule?.level,
      guidance: rule?.guidance,
    };
  });
}

// Runs AccessLint after each story test. The vitest addon auto-discovers this
// via previewAnnotations and runs it for every story during test execution.
export const afterEach = async ({
  reporting,
  parameters,
  viewMode,
  tags,
}: {
  reporting: { addReport: (report: Record<string, unknown>) => void };
  parameters: Record<string, unknown>;
  viewMode: string;
  tags?: string[];
}) => {
  const accesslintParam = parameters?.accesslint as
    | { disable?: boolean; test?: string }
    | undefined;

  if (accesslintParam?.disable === true || accesslintParam?.test === "off") return;
  if (viewMode !== "story") return;

  // Tags-based filtering: skip stories tagged with "no-a11y" or custom skip tags
  const skipTags: string[] =
    typeof __ACCESSLINT_SKIP_TAGS__ !== "undefined" ? __ACCESSLINT_SKIP_TAGS__ : [];
  const allSkipTags = ["no-a11y", ...skipTags];
  const matchedTag = tags?.find((t) => allSkipTags.includes(t));
  if (matchedTag) {
    reporting.addReport({
      type: "accesslint",
      version: 1,
      result: { skipped: true, reason: matchedTag },
      status: "passed",
    });
    return;
  }

  const audit = createChunkedAudit(document);
  while (audit.processChunk(BUDGET_MS)) {
    await yieldToMain();
  }

  const violations = audit.getViolations();
  const scoped = scopeViolations(violations);
  const enriched = enrichViolations(scoped);

  const hasViolations = enriched.length > 0;
  const mode = accesslintParam?.test === "todo" ? "warning" : "failed";

  reporting.addReport({
    type: "accesslint",
    version: 1,
    result: {
      violations: enriched,
      ruleCount: getActiveRules().length,
    },
    status: hasViolations ? mode : "passed",
  });
};
