import React, { type FC } from "react";
import { useAddonState, useChannel } from "storybook/internal/manager-api";
import { AddonPanel } from "storybook/internal/components";
import type { Violation } from "@accesslint/core";
import { ADDON_ID } from "./constants";

interface PanelProps {
  active: boolean;
}

export const Panel: FC<PanelProps> = ({ active, ...rest }) => {
  const [violations, setViolations] = useAddonState<Violation[]>(
    ADDON_ID,
    [],
  );

  useChannel({
    [`${ADDON_ID}/results`]: (results: Violation[]) => {
      setViolations(results);
    },
  });

  if (!active) return null;

  return (
    <AddonPanel active={active} {...rest}>
      <div style={{ padding: "16px" }}>
        {violations.length === 0 ? (
          <p>No accessibility violations found.</p>
        ) : (
          <div>
            <p style={{ marginBottom: "12px" }}>
              <strong>{violations.length}</strong> violation
              {violations.length !== 1 ? "s" : ""} found
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {violations.map((v, i) => (
                <li
                  key={i}
                  style={{
                    padding: "8px 12px",
                    marginBottom: "8px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                  }}
                >
                  <strong>{v.ruleId}</strong>
                  <p style={{ margin: "4px 0" }}>{v.message}</p>
                  {v.selector && (
                    <code
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        background: "#f5f5f5",
                        padding: "2px 4px",
                        borderRadius: "2px",
                      }}
                    >
                      {v.selector}
                    </code>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AddonPanel>
  );
};
