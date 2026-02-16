import React, { useState } from "react";
import { addons, types, useAddonState, useChannel } from "storybook/internal/manager-api";
import type { Violation } from "@accesslint/core";
import { ADDON_ID, PANEL_ID, TEST_PROVIDER_ID, type AuditMeta } from "./constants";
import { Panel } from "./Panel";

const Title = () => {
  const [violations] = useAddonState<Violation[]>(ADDON_ID, []);
  const count = violations.length;
  return (
    <>
      AccessLint{count > 0 && <span style={{
        display: "inline-block",
        marginLeft: "8px",
        minWidth: "18px",
        padding: "0 5px",
        lineHeight: "18px",
        borderRadius: "9px",
        fontSize: "11px",
        fontWeight: "bold",
        textAlign: "center",
        background: "currentColor",
        color: "inherit",
      }}><span style={{ color: "#fff" }}>{count}</span></span>}
    </>
  );
};

const TestProviderWidget = () => {
  const [meta, setMeta] = useState<AuditMeta | null>(null);

  useChannel({
    [`${ADDON_ID}/meta`]: (data: AuditMeta) => {
      setMeta(data);
    },
  });

  const hasViolations = meta !== null && meta.violations > 0;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "4px 0",
      fontSize: "13px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: meta === null ? "#999" : hasViolations ? "#d32f2f" : "#2e7d32",
          }}
        />
        <span>Accessibility</span>
      </div>
      {meta !== null && hasViolations && (
        <span style={{
          display: "inline-block",
          minWidth: "18px",
          padding: "0 6px",
          lineHeight: "18px",
          borderRadius: "9px",
          fontSize: "11px",
          fontWeight: "bold",
          textAlign: "center",
          background: "#d32f2f",
          color: "#fff",
        }}>
          {meta.violations}
        </span>
      )}
    </div>
  );
};

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: Title,
    render: Panel,
  });

  addons.add(TEST_PROVIDER_ID, {
    type: types.experimental_TEST_PROVIDER,
    render: () => <TestProviderWidget />,
  });
});
