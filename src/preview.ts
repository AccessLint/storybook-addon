import { addons } from "storybook/internal/preview-api";
import { runAudit } from "@accesslint/core";
import { ADDON_ID } from "./constants";

const decorator = (storyFn: () => unknown) => {
  const story = storyFn();

  // Run audit after the story renders
  setTimeout(async () => {
    const results = runAudit(document);
    const channel = addons.getChannel();
    channel.emit(`${ADDON_ID}/results`, results.violations);
  }, 0);

  return story;
};

export const decorators = [decorator];
