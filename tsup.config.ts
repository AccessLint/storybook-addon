import { defineConfig } from "tsup";
import pkg from "./package.json" with { type: "json" };

const { managerEntries = [], previewEntries = [], nodeEntries = [] } =
  pkg.bundler || {};

const external = ["storybook", "react", "react-dom"];

export default defineConfig((options) => {
  const configs = [];

  if (managerEntries.length) {
    configs.push({
      entry: managerEntries,
      outDir: "dist",
      format: ["esm" as const],
      target: "esnext" as const,
      platform: "browser" as const,
      external,
      treeshake: true,
      ...options,
    });
  }

  if (previewEntries.length) {
    configs.push({
      entry: previewEntries,
      outDir: "dist",
      format: ["esm" as const, "cjs" as const],
      target: "esnext" as const,
      platform: "browser" as const,
      external,
      dts: true,
      treeshake: true,
      ...options,
    });
  }

  if (nodeEntries.length) {
    configs.push({
      entry: nodeEntries,
      outDir: "dist",
      format: ["esm" as const, "cjs" as const],
      target: "node20" as const,
      platform: "node" as const,
      external,
      dts: true,
      treeshake: true,
      ...options,
    });
  }

  return configs;
});
