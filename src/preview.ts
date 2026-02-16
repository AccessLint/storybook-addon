import { addons } from "storybook/internal/preview-api";
import { runAudit, getRuleById, configureRules } from "@accesslint/core";
import { ADDON_ID } from "./constants";

// Disable rules that don't apply to individual components in Storybook
configureRules({
  disabledRules: ["accesslint-045"],
});

const decorator = (storyFn: () => unknown) => {
  const story = storyFn();

  // Run audit after the story renders, scoped to the story root
  setTimeout(() => {
    try {
      const start = performance.now();
      const results = runAudit(document);
      const duration = Math.round(performance.now() - start);
      const root = document.getElementById("storybook-root");
      const scoped = root
        ? results.violations.filter((v) => {
            // Strip iframe-piercing prefix (e.g. "#storybook-preview-iframe >>>iframe> ")
            const local = v.selector.replace(/^.*>>>\s*iframe>\s*/, "");
            try {
              const el = document.querySelector(local);
              return el && root.contains(el);
            } catch {
              return false;
            }
          })
        : results.violations;
      const enriched = scoped.map((v) => {
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
      const failedRuleIds = new Set(scoped.map((v) => v.ruleId));
      const channel = addons.getChannel();
      channel.emit(`${ADDON_ID}/results`, enriched);
      channel.emit(`${ADDON_ID}/meta`, {
        duration,
        ruleCount: results.ruleCount,
        failed: failedRuleIds.size,
        passed: results.ruleCount - failedRuleIds.size,
        violations: scoped.length,
      });
    } catch (err) {
      console.error("[AccessLint] decorator error:", err);
    }
  }, 0);

  return story;
};

export const decorators = [decorator];
