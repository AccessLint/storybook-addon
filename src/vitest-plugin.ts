/**
 * Vitest plugin that automatically registers AccessLint's afterEach annotation
 * so that running component tests produces per-story accessibility badges.
 *
 * Usage in vitest.config.ts (or the storybook vitest workspace):
 *
 *   import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
 *   import { accesslintTest } from "@accesslint/storybook-addon/vitest-plugin";
 *
 *   export default defineConfig({
 *     plugins: [storybookTest(), accesslintTest()],
 *   });
 */
export function accesslintTest(): { name: string; config: () => Record<string, unknown> } {
  // Allow Vite to serve the setup file even when this package is symlinked
  // outside the consuming project's root (common during local development).
  const distDir = new URL(".", import.meta.url).pathname;

  return {
    name: "@accesslint/storybook-addon",
    config() {
      return {
        server: {
          fs: {
            allow: [distDir],
          },
        },
        test: {
          setupFiles: ["@accesslint/storybook-addon/vitest-setup"],
        },
      };
    },
  };
}
