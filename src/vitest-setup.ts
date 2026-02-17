/**
 * Vitest setup file added by the accesslintTest() plugin.
 *
 * Merges the AccessLint preview annotations (afterEach, decorators) into
 * globalProjectAnnotations so that AccessLint runs during vitest story tests
 * and reports results as sidebar badges.
 *
 * This file runs AFTER the user's vitest.setup.js (which calls
 * setProjectAnnotations), so globalProjectAnnotations is already set.
 */
import { composeConfigs } from "storybook/preview-api";
import * as accesslintAnnotations from "./preview";

const g = globalThis as Record<string, unknown>;
const existing = g.globalProjectAnnotations;

g.globalProjectAnnotations = existing
  ? composeConfigs([existing, accesslintAnnotations])
  : composeConfigs([accesslintAnnotations]);
