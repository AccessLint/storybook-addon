import React from "react";
import {
  addons,
  types,
  useChannel,
  useStorybookApi,
  experimental_getStatusStore,
  experimental_getTestProviderStore,
  experimental_useTestProviderStore,
} from "storybook/internal/manager-api";
import { ActionList, Form } from "storybook/internal/components";
import { styled } from "storybook/internal/theming";
import { STORY_FINISHED } from "storybook/internal/core-events";
import { ADDON_ID, PARAM_KEY, STATUS_TYPE_ID } from "./constants";
import { Panel } from "./Panel";

const PANEL_ID = `${ADDON_ID}/panel`;
const TEST_PROVIDER_ID = `${ADDON_ID}/test-provider`;

// --- Status Store: per-story sidebar dots ---
const statusStore = experimental_getStatusStore(STATUS_TYPE_ID);
const testProviderStore = experimental_getTestProviderStore(TEST_PROVIDER_ID);

// Clear sidebar dots when the global "Clear All" button is pressed
testProviderStore.onClearAll(() => {
  statusStore.unset();
});

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

interface ViolationReport {
  violations?: Array<{ ruleId: string; message: string }>;
}

const TestProviderWidget = () => {
  const [violationCount, setViolationCount] = React.useState<number | null>(null);
  const api = useStorybookApi();

  const providerState = experimental_useTestProviderStore(
    (state) => state[TEST_PROVIDER_ID]
  );

  React.useEffect(() => {
    // Open the AccessLint panel when a sidebar status dot is clicked
    const unsub = statusStore.onSelect(() => {
      api.setSelectedPanel(PANEL_ID);
      api.togglePanel(true);
    });
    return unsub;
  }, [api]);

  useChannel({
    [STORY_FINISHED]: ({ storyId, reporters }: {
      storyId: string;
      reporters: Array<{ type: string; status: string; result: Record<string, unknown> }>;
    }) => {
      const report = reporters.find((r) => r.type === "accesslint");
      if (!report) return;

      const violations = (report.result as ViolationReport)?.violations ?? [];
      setViolationCount(violations.length);

      // Update the status store for per-story sidebar dots
      const hasViolations = violations.length > 0;
      const isWarning = report.status === "warning";

      statusStore.set([{
        value: hasViolations
          ? isWarning ? "status-value:warning" : "status-value:error"
          : "status-value:success",
        typeId: STATUS_TYPE_ID,
        storyId,
        title: "AccessLint",
        description: hasViolations
          ? `${violations.length} violation${violations.length === 1 ? "" : "s"}`
          : "No violations",
        sidebarContextMenu: true,
      }]);

      // Mark the test provider as succeeded after processing
      if (providerState === "test-provider-state:running") {
        testProviderStore.setState("test-provider-state:succeeded");
      }
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

// --- Sidebar context menu ---
const SidebarContextMenu = ({ context }: { context: { id: string; type: string } }) => {
  const api = useStorybookApi();

  if (context.type !== "story") return null;

  return (
    <ActionList.Item
      onClick={() => {
        api.selectStory(context.id);
        api.setSelectedPanel(PANEL_ID);
        api.togglePanel(true);
      }}
    >
      <ActionList.Text>View AccessLint results</ActionList.Text>
    </ActionList.Item>
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
    sidebarContextMenu: ({ context }) => <SidebarContextMenu context={context} />,
  });
});
