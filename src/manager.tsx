import React from "react";
import { addons, types, useChannel, useStorybookApi } from "storybook/internal/manager-api";
import { ActionList, Form } from "storybook/internal/components";
import { styled } from "storybook/internal/theming";
import { STORY_FINISHED } from "storybook/internal/core-events";
import { ADDON_ID, PARAM_KEY } from "./constants";
import { Panel } from "./Panel";

const PANEL_ID = `${ADDON_ID}/panel`;
const TEST_PROVIDER_ID = `${ADDON_ID}/test-provider`;

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

type StatusType = "positive" | "negative" | "unknown";

const StyledActionList = styled(ActionList)({
  padding: 0,
});

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
    status === "negative" && {
      "--status-color": theme.color.negative,
    },
  ({ status, theme }) =>
    status === "unknown" && {
      "--status-color": theme.textMutedColor,
    },
);

const TestProviderWidget = () => {
  const [violationCount, setViolationCount] = React.useState<number | null>(null);
  const api = useStorybookApi();

  useChannel({
    [STORY_FINISHED]: ({ reporters }: { reporters: Array<{ type: string; result: Record<string, unknown> }> }) => {
      const report = reporters.find((r) => r.type === "accesslint");
      if (!report) return;
      const violations = (report.result as { violations?: unknown[] } | undefined)?.violations;
      setViolationCount(violations?.length ?? 0);
    },
  });

  const hasViolations = violationCount !== null && violationCount > 0;
  const status: StatusType =
    violationCount === null ? "unknown" : hasViolations ? "negative" : "positive";

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
            violationCount === null
              ? "AccessLint: not run yet"
              : hasViolations
                ? `AccessLint: ${violationCount} violation${violationCount === 1 ? "" : "s"}`
                : "AccessLint: no violations"
          }
          disabled={violationCount === null}
          onClick={openPanel}
        >
          {hasViolations ? violationCount : null}
          <StatusDot status={status} />
        </ActionList.Button>
      </ActionList.Item>
    </StyledActionList>
  );
};

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    title: Title,
    type: types.PANEL,
    render: Panel,
    paramKey: PARAM_KEY,
  });

  addons.add(TEST_PROVIDER_ID, {
    type: types.experimental_TEST_PROVIDER,
    render: () => <TestProviderWidget />,
  });
});
