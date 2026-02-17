/**
 * Custom Vitest matcher for accessibility assertions.
 *
 * Registered automatically by the accesslintTest() vitest plugin.
 * Can also be imported for side-effect registration in play functions:
 *
 *   import "@accesslint/storybook-addon/matchers";
 *   await expect(canvasElement).toBeAccessible();
 */
import { runAudit, getRuleById } from "@accesslint/core";
import type { AuditResult, Violation } from "@accesslint/core";

export interface AccessibleMatcherOptions {
  disabledRules?: string[];
}

function scopeViolationsToElement(
  violations: AuditResult["violations"],
  root: Element,
): Violation[] {
  return violations.filter((v) => {
    try {
      const el = root.ownerDocument.querySelector(v.selector);
      return el && root.contains(el);
    } catch {
      return false;
    }
  });
}

function formatViolation(v: Violation): string {
  const rule = getRuleById(v.ruleId);
  const wcag = rule?.wcag?.length ? ` (${rule.wcag.join(", ")})` : "";
  const level = rule?.level ? ` [${rule.level}]` : "";
  return `  ${v.ruleId}${level}${wcag}: ${v.message}\n    ${v.selector}`;
}

export const toBeAccessible = function (
  this: { isNot: boolean },
  received: Element,
  options?: AccessibleMatcherOptions,
) {
  if (!(received instanceof Element)) {
    return {
      pass: false,
      message: () =>
        "toBeAccessible() expects an Element (e.g. canvasElement), " +
        `but received ${typeof received}`,
    };
  }

  const result = runAudit(received.ownerDocument);
  let scoped = scopeViolationsToElement(result.violations, received);

  // Filter out disabled rules without mutating global configuration
  if (options?.disabledRules?.length) {
    const disabled = new Set(options.disabledRules);
    scoped = scoped.filter((v) => !disabled.has(v.ruleId));
  }

  const pass = scoped.length === 0;

  return {
    pass,
    message: () => {
      if (pass) {
        return "Expected element to have accessibility violations, but none were found";
      }
      const summary = scoped.map(formatViolation).join("\n\n");
      return (
        `Expected element to have no accessibility violations, ` +
        `but found ${scoped.length}:\n\n${summary}`
      );
    },
  };
};

export const accesslintMatchers = { toBeAccessible };

// Auto-register when imported for side effects (play functions, standalone tests)
if (typeof globalThis !== "undefined") {
  const g = globalThis as Record<string, unknown>;
  const expectFn = g.expect as
    | { extend?: (matchers: Record<string, unknown>) => void }
    | undefined;
  if (expectFn?.extend) {
    expectFn.extend(accesslintMatchers);
  }
}
