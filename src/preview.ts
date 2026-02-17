import { runAudit, getRuleById, configureRules } from "@accesslint/core";

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
}: {
  reporting: { addReport: (report: Record<string, unknown>) => void };
  parameters: Record<string, unknown>;
  viewMode: string;
}) => {
  const accesslintParam = parameters?.accesslint as
    | { disable?: boolean; test?: string }
    | undefined;

  if (accesslintParam?.disable === true || accesslintParam?.test === "off") return;
  if (viewMode !== "story") return;

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
