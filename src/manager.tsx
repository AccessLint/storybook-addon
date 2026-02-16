import React from "react";
import { addons, types, useAddonState } from "storybook/internal/manager-api";
import type { Violation } from "@accesslint/core";
import { ADDON_ID, PANEL_ID } from "./constants";
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

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: Title,
    render: Panel,
  });
});
