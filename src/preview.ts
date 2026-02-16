import { addons } from "storybook/internal/preview-api";
import { runAudit, getRuleById } from "@accesslint/core";
import { ADDON_ID } from "./constants";

const decorator = (storyFn: () => unknown) => {
  const story = storyFn();

  // Run audit after the story renders, scoped to the story root
  setTimeout(async () => {
    const results = runAudit(document);
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
    const channel = addons.getChannel();
    channel.emit(`${ADDON_ID}/results`, enriched);
  }, 0);

  return story;
};

export const decorators = [decorator];
