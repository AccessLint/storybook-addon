import { runAudit, getRuleById, configureRules } from "@accesslint/core";

// Defined by the accesslintTest() Vite plugin when tags.skip is configured
declare const __ACCESSLINT_SKIP_TAGS__: string[];

// Disable rules that don't apply to individual components in Storybook
configureRules({
  disabledRules: ["accesslint-045"],
});

function scopeViolations(violations: ReturnType<typeof runAudit>["violations"]) {
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

function enrichViolations(violations: ReturnType<typeof runAudit>["violations"]) {
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
  tags: string[];
}) => {
  const accesslintParam = parameters?.accesslint as
    | { disable?: boolean; test?: string }
    | undefined;

  if (accesslintParam?.disable === true || accesslintParam?.test === "off") return;
  if (viewMode !== "story") return;

  // Tags-based filtering: skip stories tagged with "no-a11y" or custom skip tags
  if (tags?.includes("no-a11y")) return;
  const skipTags: string[] =
    typeof __ACCESSLINT_SKIP_TAGS__ !== "undefined" ? __ACCESSLINT_SKIP_TAGS__ : [];
  if (skipTags.length > 0 && tags?.some((t) => skipTags.includes(t))) return;

  const result = runAudit(document);
  const scoped = scopeViolations(result.violations);
  const enriched = enrichViolations(scoped);

  const hasViolations = enriched.length > 0;
  const mode = accesslintParam?.test === "todo" ? "warning" : "failed";

  reporting.addReport({
    type: "accesslint",
    version: 1,
    result: {
      violations: enriched,
      ruleCount: result.ruleCount,
    },
    status: hasViolations ? mode : "passed",
  });
};
