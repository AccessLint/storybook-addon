export const ADDON_ID = "accesslint/a11y";
export const PANEL_ID = `${ADDON_ID}/panel`;
export const TEST_PROVIDER_ID = `${ADDON_ID}/test-provider`;
export const PARAM_KEY = "a11y";

export interface AuditMeta {
  duration: number;
  ruleCount: number;
  passed: number;
  failed: number;
  violations: number;
}
