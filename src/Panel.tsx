import React, { useState, useEffect, useMemo, useRef, useCallback, type FC } from "react";
import { useAddonState, useChannel } from "storybook/internal/manager-api";
import { useTheme } from "storybook/internal/theming";
import { AddonPanel } from "storybook/internal/components";
import { ADDON_ID, type AuditMeta } from "./constants";

interface EnrichedViolation {
  ruleId: string;
  selector: string;
  html: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  message: string;
  context?: string;
  description?: string;
  wcag?: string[];
  level?: "A" | "AA" | "AAA";
  guidance?: string;
}

const IMPACT_COLOR: Record<string, string> = {
  critical: "#d32f2f",
  serious: "#d32f2f",
  moderate: "#c43e00",
  minor: "#999999",
};

const IMPACT_ICON: Record<string, string> = {
  critical: "\u2716",
  serious: "\u2716",
  moderate: "\u26A0",
  minor: "\u00B7",
};

const IMPACT_ORDER: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

const LEVEL_COLOR: Record<string, string> = {
  A: "#2e7d32",
  AA: "#1565c0",
  AAA: "#6a1b9a",
};

const HIGHLIGHT_ID = `${ADDON_ID}/highlight`;

interface PanelProps {
  active: boolean;
}

export const Panel: FC<PanelProps> = ({ active, ...rest }) => {
  const theme = useTheme();
  const isDark = theme.base === "dark";

  const colors = useMemo(() => ({
    text: theme.textColor || (isDark ? "#e0e0e0" : "#424242"),
    textMuted: theme.textMutedColor || (isDark ? "#999" : "#616161"),
    bg: theme.appContentBg || (isDark ? "#1a1a1a" : "#fff"),
    bgDetails: isDark ? "#2a2a2a" : "#f5f5f5",
    bgSelected: isDark ? "#1a3a5c" : "#e3f2fd",
    border: theme.appBorderColor || (isDark ? "#444" : "#f0f0f0"),
    codeBg: isDark ? "#333" : "#fff",
    codeBorder: isDark ? "#555" : "#e0e0e0",
    tagBg: isDark ? "#444" : "#e0e0e0",
    tagText: isDark ? "#ccc" : "#616161",
    ruleId: isDark ? "#64b5f6" : "#1565c0",
  }), [isDark, theme]);

  const [violations, setViolations] = useAddonState<EnrichedViolation[]>(
    ADDON_ID,
    [],
  );
  const [meta, setMeta] = useState<AuditMeta | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const emit = useChannel({
    [`${ADDON_ID}/results`]: (results: EnrichedViolation[]) => {
      setViolations(results);
      setExpandedIndex(null);
    },
    [`${ADDON_ID}/meta`]: (data: AuditMeta) => {
      setMeta(data);
    },
  });

  const sorted = [...violations].sort(
    (a, b) => (IMPACT_ORDER[a.impact] ?? 4) - (IMPACT_ORDER[b.impact] ?? 4),
  );

  const expanded = expandedIndex !== null ? sorted[expandedIndex] : null;

  useEffect(() => {
    if (expanded?.selector) {
      const local = expanded.selector.replace(/^.*>>>\s*iframe>\s*/, "");
      emit("storybook/highlight/add", {
        id: HIGHLIGHT_ID,
        selectors: [local],
        styles: {
          outline: `2px solid ${IMPACT_COLOR[expanded.impact] || "#1565c0"}`,
          outlineOffset: "2px",
        },
      });
    } else {
      emit("storybook/highlight/remove", { id: HIGHLIGHT_ID });
    }
  }, [expandedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let next: number | null = null;
    switch (e.key) {
      case "ArrowDown":
        next = Math.min(index + 1, sorted.length - 1);
        break;
      case "ArrowUp":
        next = Math.max(index - 1, 0);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = sorted.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    buttonRefs.current[next]?.focus();
  }, [sorted.length]);

  if (!active) return null;

  return (
    <AddonPanel active={active} {...rest}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "system-ui, sans-serif" }}>
        {meta && (
          <div style={{
            display: "flex",
            gap: "12px",
            padding: "8px 12px",
            fontSize: "11px",
            color: colors.textMuted,
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}>
            <span>{meta.ruleCount} rules</span>
            <span style={{ color: "#2e7d32" }}>{meta.passed} passed</span>
            <span style={{ color: meta.failed > 0 ? "#d32f2f" : colors.textMuted }}>{meta.failed} failed</span>
            <span>{meta.duration}ms</span>
          </div>
        )}
        {violations.length === 0 ? (
          <p style={{ padding: "12px", margin: 0, fontSize: "13px", color: colors.textMuted }}>
            No accessibility violations found.
          </p>
        ) : (
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            <ul
              style={{ listStyle: "none", padding: 0, margin: 0 }}
              aria-label="Accessibility violations"
            >
              {sorted.map((v, i) => {
                const isOpen = expandedIndex === i;
                return (
                  <li key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <button
                      ref={(el) => { buttonRefs.current[i] = el; }}
                      type="button"
                      onClick={() => setExpandedIndex(isOpen ? null : i)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      aria-expanded={isOpen}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: isOpen ? colors.bgSelected : "transparent",
                        border: "none",
                        font: "inherit",
                        fontSize: "12px",
                        textAlign: "left",
                        cursor: "pointer",
                        color: colors.text,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          aria-hidden="true"
                          style={{
                            color: IMPACT_COLOR[v.impact],
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          {IMPACT_ICON[v.impact]}
                        </span>
                        <span style={{ color: IMPACT_COLOR[v.impact], fontSize: "11px" }}>
                          {v.impact}
                        </span>
                        <code style={{ fontSize: "11px", color: colors.ruleId }}>
                          {v.ruleId}
                        </code>
                      </div>
                      <div style={{ marginTop: "2px", color: colors.text, fontSize: "12px" }}>
                        {v.message}
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "4px 12px 12px", background: colors.bgDetails }}>
                        {v.description && (
                          <p style={{ margin: "4px 0 8px", fontSize: "12px", color: colors.text }}>
                            {v.description}
                          </p>
                        )}
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                          {v.level && (
                            <span style={{
                              display: "inline-block",
                              padding: "0 5px",
                              fontSize: "10px",
                              fontWeight: 600,
                              borderRadius: "3px",
                              color: "#fff",
                              background: LEVEL_COLOR[v.level] || "#666",
                              lineHeight: "18px",
                            }}>
                              WCAG {v.level}
                            </span>
                          )}
                          {v.wcag?.map((ref) => (
                            <span
                              key={ref}
                              style={{
                                display: "inline-block",
                                padding: "0 5px",
                                fontSize: "10px",
                                fontWeight: 500,
                                borderRadius: "3px",
                                color: colors.tagText,
                                background: colors.tagBg,
                                lineHeight: "18px",
                              }}
                            >
                              {ref}
                            </span>
                          ))}
                        </div>
                        {v.guidance && (
                          <div style={{ marginBottom: "8px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 500, color: colors.textMuted, marginBottom: "4px" }}>
                              How to fix
                            </div>
                            <p style={{ margin: 0, fontSize: "12px", color: colors.text, whiteSpace: "pre-wrap" }}>
                              {v.guidance}
                            </p>
                          </div>
                        )}
                        {v.html && (
                          <div style={{ marginBottom: "8px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 500, color: colors.textMuted, marginBottom: "4px" }}>
                              Element
                            </div>
                            <pre
                              style={{
                                margin: 0,
                                padding: "6px 8px",
                                fontSize: "11px",
                                color: colors.text,
                                background: colors.codeBg,
                                border: `1px solid ${colors.codeBorder}`,
                                borderRadius: "4px",
                                overflow: "auto",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-all",
                              }}
                            >
                              {v.html}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </AddonPanel>
  );
};
