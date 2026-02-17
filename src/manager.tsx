import React from "react";
import { addons, types, useChannel } from "storybook/internal/manager-api";
import { STORY_FINISHED } from "storybook/internal/core-events";
import { ADDON_ID, PARAM_KEY } from "./constants";
import { Panel } from "./Panel";

const PANEL_ID = `${ADDON_ID}/panel`;

const Title = () => {
  const [count, setCount] = React.useState(0);

  useChannel({
    [STORY_FINISHED]: ({ reporters }: { reporters: Array<{ type: string; result: Record<string, unknown> }> }) => {
      const report = reporters.find((r) => r.type === "accesslint");
      const violations = (report?.result as { violations?: unknown[] } | undefined)?.violations;
      setCount(violations?.length ?? 0);
    },
  });

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
    title: Title,
    type: types.PANEL,
    render: Panel,
    paramKey: PARAM_KEY,
  });
});
