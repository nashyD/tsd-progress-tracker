import { useEffect, useMemo, useRef, useState } from "react";
import { TASKS, WEEKS, MILESTONES, OWNERS, LAUNCH_DATE } from "./data.js";
import { supabase, TRACKER_ID } from "./supabase.js";

// ─── Design Tokens ───────────────────────────────────────────
const C = {
  bg: "#0a0a0f",
  bgAlt: "#0e0e16",
  glass: "rgba(255,255,255,0.05)",
  glassBorder: "rgba(255,255,255,0.08)",
  glassBorderStrong: "rgba(255,255,255,0.14)",
  text: "#f0f0f5",
  textMuted: "rgba(255,255,255,0.62)",
  textDim: "rgba(255,255,255,0.38)",
  accent: "#7c5cfc",
  accentLight: "#a78bfa",
  cyan: "#06d6a0",
  pink: "#f472b6",
  gold: "#fbbf24",
  success: "#06d6a0",
  gradientHero: "linear-gradient(135deg, #7c5cfc 0%, #a78bfa 40%, #06d6a0 100%)",
  gradientCard: "linear-gradient(135deg, rgba(124,92,252,0.12), rgba(6,214,160,0.06))",
};

// ─── Persistence (Supabase + realtime) ──────────────────────
// Single shared row `tsd-launch` in the `progress` table. Every
// check-off writes to Supabase; all connected clients receive the
// update via postgres_changes subscription and re-render instantly.
function useProgress() {
  const [state, setState] = useState({ tasks: {}, milestones: {} });
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const stateRef = useRef(state);
  stateRef.current = state;

  // Initial load + realtime subscription
  useEffect(() => {
    let mounted = true;

    supabase
      .from("progress")
      .select("tasks, milestones")
      .eq("id", TRACKER_ID)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("Supabase load failed:", error);
          setStatus("error");
          return;
        }
        setState({ tasks: data.tasks || {}, milestones: data.milestones || {} });
        setStatus("ready");
      });

    const channel = supabase
      .channel("progress-sync")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "progress", filter: `id=eq.${TRACKER_ID}` },
        (payload) => {
          if (!mounted) return;
          const row = payload.new;
          setState({ tasks: row.tasks || {}, milestones: row.milestones || {} });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Optimistic write helper
  const push = async (next) => {
    setState(next);
    const { error } = await supabase
      .from("progress")
      .update({
        tasks: next.tasks,
        milestones: next.milestones,
        updated_at: new Date().toISOString(),
      })
      .eq("id", TRACKER_ID);
    if (error) {
      console.error("Supabase save failed:", error);
      setStatus("error");
    }
  };

  const toggleTask = (id) => {
    const cur = stateRef.current;
    push({ ...cur, tasks: { ...cur.tasks, [id]: !cur.tasks[id] } });
  };
  const toggleMilestone = (id) => {
    const cur = stateRef.current;
    push({ ...cur, milestones: { ...cur.milestones, [id]: !cur.milestones[id] } });
  };
  const reset = () => push({ tasks: {}, milestones: {} });

  return { state, toggleTask, toggleMilestone, reset, status };
}

// ─── Helpers ─────────────────────────────────────────────────
function daysUntil(iso) {
  const now = new Date();
  const target = new Date(iso + "T00:00:00");
  const ms = target - new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function pct(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

// ─── Reusable UI ─────────────────────────────────────────────
function GridBg() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse 80% 60% at 50% 30%, transparent 0%, ${C.bg} 100%)`,
      }} />
      <div style={{
        position: "absolute", width: "600px", height: "600px", borderRadius: "50%",
        filter: "blur(140px)", opacity: 0.25,
        background: `radial-gradient(circle, ${C.accent}, transparent)`,
        top: "-10%", right: "-5%", animation: "orbFloat1 14s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: "500px", height: "500px", borderRadius: "50%",
        filter: "blur(120px)", opacity: 0.18,
        background: `radial-gradient(circle, ${C.cyan}, transparent)`,
        bottom: "-15%", left: "-8%", animation: "orbFloat2 18s ease-in-out infinite 3s",
      }} />
    </div>
  );
}

function SyncBadge({ status }) {
  const config = {
    loading: { dot: C.gold, label: "Syncing…", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)" },
    ready:   { dot: C.cyan, label: "Live",     bg: "rgba(6,214,160,0.1)",  border: "rgba(6,214,160,0.3)" },
    error:   { dot: C.pink, label: "Offline",  bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.3)" },
  }[status] || { dot: C.textDim, label: "—", bg: "rgba(255,255,255,0.04)", border: C.glassBorder };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "8px",
      padding: "8px 14px", borderRadius: "999px",
      background: config.bg, border: `1px solid ${config.border}`,
      fontSize: "11px", fontWeight: 700, color: config.dot,
      textTransform: "uppercase", letterSpacing: "0.8px",
    }}>
      <span style={{
        width: "8px", height: "8px", borderRadius: "50%",
        background: config.dot,
        boxShadow: status === "ready" ? `0 0 8px ${config.dot}` : "none",
        animation: status === "loading" ? "pulse 1.4s ease-in-out infinite" : "none",
      }} />
      {config.label}
    </div>
  );
}

function ProgressBar({ value, color = C.accent, height = 8 }) {
  return (
    <div style={{
      width: "100%", height, borderRadius: height / 2,
      background: "rgba(255,255,255,0.06)", overflow: "hidden",
    }}>
      <div style={{
        width: `${value}%`, height: "100%",
        background: `linear-gradient(90deg, ${color}, ${C.accentLight})`,
        boxShadow: `0 0 12px ${color}66`,
        transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }} />
    </div>
  );
}

function StatCard({ label, value, sub, accent = C.accent, children }) {
  return (
    <div style={{
      background: C.glass,
      border: `1px solid ${C.glassBorder}`,
      borderRadius: "20px",
      padding: "24px 28px",
      backdropFilter: "blur(12px)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }} />
      <div style={{
        fontSize: "11px", fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "10px",
      }}>{label}</div>
      <div style={{
        fontSize: "44px", fontWeight: 800, color: C.text, lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}>{value}</div>
      {sub && <div style={{ fontSize: "13px", color: C.textDim, marginTop: "8px" }}>{sub}</div>}
      {children}
    </div>
  );
}

function TaskRow({ task, done, onToggle }) {
  const owner = OWNERS[task.owner];
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: "14px",
      padding: "14px 16px", borderRadius: "12px",
      background: done ? "rgba(6,214,160,0.06)" : "transparent",
      border: `1px solid ${done ? "rgba(6,214,160,0.2)" : "rgba(255,255,255,0.05)"}`,
      cursor: "pointer", transition: "all 0.2s ease",
      marginBottom: "8px",
    }}
      onMouseEnter={(e) => {
        if (!done) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
      }}
      onMouseLeave={(e) => {
        if (!done) e.currentTarget.style.background = "transparent";
      }}
    >
      <div style={{
        flexShrink: 0, width: "22px", height: "22px", borderRadius: "7px",
        border: `2px solid ${done ? C.success : "rgba(255,255,255,0.25)"}`,
        background: done ? C.success : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: "2px",
        transition: "all 0.2s ease",
      }}>
        {done && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <input type="checkbox" checked={done} onChange={() => onToggle(task.id)} style={{ display: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "15px", fontWeight: 600, color: C.text,
          textDecoration: done ? "line-through" : "none",
          opacity: done ? 0.55 : 1,
        }}>{task.title}</div>
        <div style={{ fontSize: "13px", color: C.textMuted, marginTop: "3px", lineHeight: 1.45 }}>{task.desc}</div>
      </div>
      <div style={{
        flexShrink: 0, fontSize: "11px", fontWeight: 700,
        padding: "5px 10px", borderRadius: "999px",
        background: `${owner.color}18`,
        color: owner.color,
        border: `1px solid ${owner.color}30`,
        textTransform: "uppercase", letterSpacing: "0.5px",
        whiteSpace: "nowrap",
      }}>{task.owner}</div>
    </label>
  );
}

// ─── Views ───────────────────────────────────────────────────
function OverviewView({ state, stats, daysLeft }) {
  return (
    <div className="fade-up">
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px", marginBottom: "40px",
      }}>
        <StatCard
          label="Days to Launch"
          value={daysLeft > 0 ? daysLeft : daysLeft === 0 ? "🚀" : "LIVE"}
          sub={daysLeft > 0 ? `until ${new Date(LAUNCH_DATE + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" })}` : "Launch day!"}
          accent={C.gold}
        />
        <StatCard
          label="Tasks Complete"
          value={`${stats.tasksDone}/${stats.tasksTotal}`}
          sub={`${stats.taskPct}% done`}
          accent={C.accent}
        >
          <div style={{ marginTop: "14px" }}>
            <ProgressBar value={stats.taskPct} />
          </div>
        </StatCard>
        <StatCard
          label="Milestones Hit"
          value={`${stats.msDone}/${stats.msTotal}`}
          sub={`${stats.msPct}% of checkpoints`}
          accent={C.cyan}
        >
          <div style={{ marginTop: "14px" }}>
            <ProgressBar value={stats.msPct} color={C.cyan} />
          </div>
        </StatCard>
        <StatCard
          label="Founders"
          value="3"
          sub="Nash · Bishop · Grant"
          accent={C.pink}
        />
      </div>

      <div style={{
        background: C.glass, border: `1px solid ${C.glassBorder}`,
        borderRadius: "24px", padding: "32px", marginBottom: "24px",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          fontSize: "12px", fontWeight: 800, color: C.accentLight,
          textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "6px",
        }}>◆ Sprint Schedule</div>
        <h2 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 28px", letterSpacing: "-0.5px" }}>
          Progress by Week
        </h2>
        <div style={{ display: "grid", gap: "22px" }}>
          {WEEKS.map((w) => {
            const wTasks = TASKS.filter((t) => t.week === w.id);
            const wDone = wTasks.filter((t) => state.tasks[t.id]).length;
            const wPct = pct(wDone, wTasks.length);
            return (
              <div key={w.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: C.accentLight }}>{w.label}</span>
                    <span style={{ color: C.textDim, margin: "0 10px" }}>·</span>
                    <span style={{ fontSize: "15px", fontWeight: 600, color: C.text }}>{w.theme}</span>
                    <span style={{ color: C.textDim, margin: "0 10px" }}>·</span>
                    <span style={{ fontSize: "13px", color: C.textMuted }}>{w.dates}</span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>
                    {wDone}/{wTasks.length} <span style={{ color: C.textDim, fontWeight: 500 }}>· {wPct}%</span>
                  </div>
                </div>
                <ProgressBar value={wPct} height={10} />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        background: C.glass, border: `1px solid ${C.glassBorder}`,
        borderRadius: "24px", padding: "32px",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          fontSize: "12px", fontWeight: 800, color: C.cyan,
          textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "6px",
        }}>◆ Responsibility Split</div>
        <h2 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 24px", letterSpacing: "-0.5px" }}>
          Workload by Founder
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
          {Object.entries(OWNERS).map(([key, owner]) => {
            const oTasks = TASKS.filter((t) => t.owner === key);
            if (!oTasks.length) return null;
            const oDone = oTasks.filter((t) => state.tasks[t.id]).length;
            const oPct = pct(oDone, oTasks.length);
            return (
              <div key={key} style={{
                padding: "20px", borderRadius: "16px",
                background: `${owner.color}10`,
                border: `1px solid ${owner.color}28`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: owner.color }}>{owner.name}</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>
                    {oDone}/{oTasks.length}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "12px" }}>{owner.role}</div>
                <ProgressBar value={oPct} color={owner.color} height={6} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeeksView({ state, toggleTask }) {
  const [expanded, setExpanded] = useState(() => {
    // Auto-expand the first week that isn't fully complete
    for (const w of WEEKS) {
      const wTasks = TASKS.filter((t) => t.week === w.id);
      const wDone = wTasks.filter((t) => state.tasks[t.id]).length;
      if (wDone < wTasks.length) return w.id;
    }
    return 1;
  });

  return (
    <div className="fade-up" style={{ display: "grid", gap: "20px" }}>
      {WEEKS.map((w) => {
        const wTasks = TASKS.filter((t) => t.week === w.id);
        const wDone = wTasks.filter((t) => state.tasks[t.id]).length;
        const wPct = pct(wDone, wTasks.length);
        const isOpen = expanded === w.id;
        return (
          <div key={w.id} style={{
            background: C.glass, border: `1px solid ${isOpen ? C.glassBorderStrong : C.glassBorder}`,
            borderRadius: "22px", padding: "28px", backdropFilter: "blur(12px)",
            transition: "border-color 0.3s ease",
          }}>
            <button
              onClick={() => setExpanded(isOpen ? null : w.id)}
              style={{
                width: "100%", textAlign: "left", padding: 0, display: "block",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "14px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "11px", fontWeight: 800, color: C.accentLight,
                    textTransform: "uppercase", letterSpacing: "1.4px", marginBottom: "6px",
                  }}>
                    {w.label} · {w.dates}
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>
                    {w.theme}
                  </div>
                  <div style={{ fontSize: "13px", color: C.textMuted, marginTop: "8px", lineHeight: 1.5 }}>
                    {w.note}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                    {wDone}<span style={{ color: C.textDim, fontWeight: 500 }}>/{wTasks.length}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "4px" }}>{wPct}% complete</div>
                </div>
              </div>
              <ProgressBar value={wPct} height={8} />
            </button>
            {isOpen && (
              <div style={{ marginTop: "24px" }}>
                {wTasks.map((t) => (
                  <TaskRow key={t.id} task={t} done={!!state.tasks[t.id]} onToggle={toggleTask} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MilestonesView({ state, toggleMilestone }) {
  return (
    <div className="fade-up" style={{
      background: C.glass, border: `1px solid ${C.glassBorder}`,
      borderRadius: "24px", padding: "40px", backdropFilter: "blur(12px)",
    }}>
      <div style={{
        fontSize: "12px", fontWeight: 800, color: C.cyan,
        textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "6px",
      }}>◆ Critical Checkpoints</div>
      <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
        Launch Milestones
      </h2>
      <p style={{ fontSize: "14px", color: C.textMuted, margin: "0 0 36px" }}>
        Click any milestone to mark it as hit. These are the dates that define whether the launch stays on track.
      </p>

      <div style={{ position: "relative", paddingLeft: "32px" }}>
        <div style={{
          position: "absolute", left: "13px", top: "10px", bottom: "10px", width: "2px",
          background: `linear-gradient(to bottom, ${C.accent}, ${C.cyan})`,
          opacity: 0.35,
        }} />
        {MILESTONES.map((m) => {
          const hit = !!state.milestones[m.id];
          return (
            <button
              key={m.id}
              onClick={() => toggleMilestone(m.id)}
              style={{
                display: "flex", alignItems: "center", gap: "18px",
                width: "100%", padding: "14px 18px",
                background: hit ? "rgba(6,214,160,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${hit ? "rgba(6,214,160,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "14px", marginBottom: "12px",
                textAlign: "left", transition: "all 0.25s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div style={{
                position: "absolute", left: "-32px", width: "28px", height: "28px",
                borderRadius: "50%",
                background: hit ? C.success : C.bgAlt,
                border: `3px solid ${hit ? C.success : C.accent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: hit ? `0 0 16px ${C.success}66` : `0 0 10px ${C.accent}44`,
                transition: "all 0.3s ease",
              }}>
                {hit && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div style={{
                flexShrink: 0, fontSize: "13px", fontWeight: 800, color: hit ? C.success : C.accentLight,
                textTransform: "uppercase", letterSpacing: "1px", minWidth: "60px",
              }}>{m.date}</div>
              <div style={{
                fontSize: "15px", fontWeight: 600, color: C.text,
                textDecoration: hit ? "line-through" : "none",
                opacity: hit ? 0.6 : 1,
              }}>{m.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OwnersView({ state, toggleTask }) {
  const [filter, setFilter] = useState("Nash");
  const owner = OWNERS[filter];
  const ownerTasks = TASKS.filter((t) => t.owner === filter);
  const done = ownerTasks.filter((t) => state.tasks[t.id]).length;
  const progress = pct(done, ownerTasks.length);

  return (
    <div className="fade-up">
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "14px", marginBottom: "28px",
      }}>
        {Object.entries(OWNERS).map(([key, o]) => {
          const total = TASKS.filter((t) => t.owner === key).length;
          if (!total) return null;
          const d = TASKS.filter((t) => t.owner === key && state.tasks[t.id]).length;
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "18px 20px", borderRadius: "16px",
                background: active ? `${o.color}1a` : C.glass,
                border: `1px solid ${active ? o.color : C.glassBorder}`,
                textAlign: "left",
                transition: "all 0.25s ease",
                backdropFilter: "blur(12px)",
                boxShadow: active ? `0 8px 30px ${o.color}22` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                {o.photo && (
                  <img
                    src={o.photo}
                    alt={o.name}
                    style={{
                      width: "42px", height: "42px", borderRadius: "50%",
                      objectFit: "cover", flexShrink: 0,
                      border: `2px solid ${active ? o.color : "rgba(255,255,255,0.15)"}`,
                      boxShadow: active ? `0 0 14px ${o.color}55` : "none",
                      transition: "all 0.25s ease",
                    }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: active ? o.color : C.text }}>
                    {o.name}
                  </div>
                  <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {o.role}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ color: C.textMuted }}>{d}/{total} tasks</span>
                <span style={{ color: active ? o.color : C.textMuted, fontWeight: 700 }}>{pct(d, total)}%</span>
              </div>
              <div style={{ marginTop: "10px" }}>
                <ProgressBar value={pct(d, total)} color={o.color} height={5} />
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        background: C.glass, border: `1px solid ${C.glassBorder}`,
        borderRadius: "22px", padding: "32px", backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            {owner.photo && (
              <img
                src={owner.photo}
                alt={owner.name}
                style={{
                  width: "72px", height: "72px", borderRadius: "50%",
                  objectFit: "cover", flexShrink: 0,
                  border: `3px solid ${owner.color}`,
                  boxShadow: `0 0 22px ${owner.color}55`,
                }}
              />
            )}
            <div>
              <div style={{
                fontSize: "11px", fontWeight: 800, color: owner.color,
                textTransform: "uppercase", letterSpacing: "1.4px", marginBottom: "6px",
              }}>◆ {owner.role}</div>
              <h2 style={{ fontSize: "28px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
                {owner.name}'s Tasks
              </h2>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "32px", fontWeight: 800, color: C.text, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {done}<span style={{ color: C.textDim, fontWeight: 500 }}>/{ownerTasks.length}</span>
            </div>
            <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "4px" }}>{progress}% complete</div>
          </div>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <ProgressBar value={progress} color={owner.color} height={8} />
        </div>
        <div>
          {WEEKS.map((w) => {
            const wTasks = ownerTasks.filter((t) => t.week === w.id);
            if (!wTasks.length) return null;
            return (
              <div key={w.id} style={{ marginBottom: "18px" }}>
                <div style={{
                  fontSize: "11px", fontWeight: 800, color: C.textMuted,
                  textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "10px",
                }}>
                  {w.label} · {w.dates} · {w.theme}
                </div>
                {wTasks.map((t) => (
                  <TaskRow key={t.id} task={t} done={!!state.tasks[t.id]} onToggle={toggleTask} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function App() {
  const { state, toggleTask, toggleMilestone, reset, status } = useProgress();
  const [tab, setTab] = useState("overview");

  const stats = useMemo(() => {
    const tasksTotal = TASKS.length;
    const tasksDone = TASKS.filter((t) => state.tasks[t.id]).length;
    const msTotal = MILESTONES.length;
    const msDone = MILESTONES.filter((m) => state.milestones[m.id]).length;
    return {
      tasksTotal, tasksDone, taskPct: pct(tasksDone, tasksTotal),
      msTotal, msDone, msPct: pct(msDone, msTotal),
    };
  }, [state]);

  const daysLeft = daysUntil(LAUNCH_DATE);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "weeks", label: "Weeks" },
    { id: "milestones", label: "Milestones" },
    { id: "owners", label: "Owners" },
  ];

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <GridBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", padding: "40px 32px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{
                fontSize: "12px", fontWeight: 800, color: C.accentLight,
                textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px",
              }}>
                ◆ TSD Incorporated · Internal Tracker
              </div>
              <h1 style={{
                fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 900,
                margin: 0, letterSpacing: "-1.5px", lineHeight: 1.05,
              }}>
                Launch <span style={{
                  background: C.gradientHero,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Preparation</span>
              </h1>
              <p style={{
                fontSize: "15px", color: C.textMuted, margin: "12px 0 0",
                maxWidth: "520px", lineHeight: 1.5,
              }}>
                Apr 6 – Apr 30, 2026 · 4 sprint weeks, 32 tasks, 8 milestones · Charlotte Metro Area
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <SyncBadge status={status} />
            <button
              onClick={() => {
                if (confirm("Reset all progress for everyone? This clears every checked task and milestone across all 3 founders' views.")) reset();
              }}
              style={{
                padding: "10px 18px", borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.glassBorder}`,
                color: C.textMuted, fontSize: "12px", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(244,114,182,0.12)";
                e.currentTarget.style.color = C.pink;
                e.currentTarget.style.borderColor = "rgba(244,114,182,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = C.textMuted;
                e.currentTarget.style.borderColor = C.glassBorder;
              }}
            >
              Reset Progress
            </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "4px", marginBottom: "32px",
          padding: "6px", borderRadius: "14px",
          background: C.glass, border: `1px solid ${C.glassBorder}`,
          backdropFilter: "blur(12px)", width: "fit-content",
          flexWrap: "wrap",
        }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 22px", borderRadius: "10px",
                fontSize: "14px", fontWeight: 700,
                background: tab === t.id ? C.accent : "transparent",
                color: tab === t.id ? "#fff" : C.textMuted,
                boxShadow: tab === t.id ? `0 4px 18px ${C.accent}55` : "none",
                transition: "all 0.2s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview" && <OverviewView state={state} stats={stats} daysLeft={daysLeft} />}
        {tab === "weeks" && <WeeksView state={state} toggleTask={toggleTask} />}
        {tab === "milestones" && <MilestonesView state={state} toggleMilestone={toggleMilestone} />}
        {tab === "owners" && <OwnersView state={state} toggleTask={toggleTask} />}

        {/* Footer */}
        <div style={{
          marginTop: "60px", paddingTop: "24px",
          borderTop: `1px solid ${C.glassBorder}`,
          fontSize: "12px", color: C.textDim, textAlign: "center",
        }}>
          Launch hard. Learn fast. Build something real. · Live-synced across all 3 founders via Supabase.
        </div>
      </div>
    </div>
  );
}
