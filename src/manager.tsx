import React, { useState } from "react";
import { addons, types, useAddonState, useChannel, useStorybookApi } from "storybook/internal/manager-api";
import { ActionList, Form } from "storybook/internal/components";
import { styled } from "storybook/internal/theming";
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

const StyledActionList = styled(ActionList)({
  padding: 0,
});

type StatusType = "positive" | "warning" | "negative" | "unknown";

const StatusDot = styled.div<{ status: StatusType }>(
  {
    width: 6,
    height: 6,
    margin: 4,
    borderRadius: "50%",
    background: "var(--status-color)",
  },
  ({ status, theme }) =>
    status === "positive" && {
      "--status-color": theme.color.positive,
    },
  ({ status, theme }) =>
    status === "warning" && {
      "--status-color": theme.color.gold,
    },
  ({ status, theme }) =>
    status === "negative" && {
      "--status-color": theme.color.negative,
    },
  ({ status, theme }) =>
    status === "unknown" && {
      "--status-color": theme.textMutedColor,
    },
);

const TestProviderWidget = () => {
  const [meta, setMeta] = useState<AuditMeta | null>(null);
  const api = useStorybookApi();

  useChannel({
    [`${ADDON_ID}/meta`]: (data: AuditMeta) => {
      setMeta(data);
    },
  });

  const hasViolations = meta !== null && meta.violations > 0;
  const status: StatusType =
    meta === null ? "unknown" : hasViolations ? "negative" : "positive";

  const openPanel = () => {
    api.setSelectedPanel(PANEL_ID);
    api.togglePanel(true);
  };

  return (
    <StyledActionList>
      <ActionList.Item>
        <ActionList.Action as="label" readOnly>
          <ActionList.Icon>
            <Form.Checkbox name="AccessLint" checked disabled />
          </ActionList.Icon>
          <ActionList.Text>AccessLint</ActionList.Text>
        </ActionList.Action>
        <ActionList.Button
          ariaLabel={
            meta === null
              ? "AccessLint: not run yet"
              : hasViolations
                ? `AccessLint: ${meta.violations} violation${meta.violations === 1 ? "" : "s"}`
                : "AccessLint: no violations"
          }
          disabled={meta === null}
          onClick={openPanel}
        >
          {hasViolations ? meta.violations : null}
          <StatusDot status={status} />
        </ActionList.Button>
      </ActionList.Item>
    </StyledActionList>
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
