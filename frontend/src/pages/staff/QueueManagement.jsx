import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function QueueManagement() {
  const [queue, setQueue] = useState([]);
  const [insideCabin, setInsideCabin] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [noShows, setNoShows] = useState([]);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_time", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }

    const waiting = data.filter(a => a.queue_status === "Waiting");
    const cabin = data.find(a => a.queue_status === "In Cabin");
    const completedList = data.filter(a => a.queue_status === "Completed");
    const noShowList = data.filter(a => a.queue_status === "No Show");

    setQueue(waiting);
    setInsideCabin(cabin || null);
    setCompleted(completedList);
    setNoShows(noShowList);
  };

  const approveCitizen = async (citizen) => {
    if (insideCabin) return;

    await supabase
      .from("appointments")
      .update({ queue_status: "In Cabin" })
      .eq("id", citizen.id);

    fetchQueue();
  };

  const completeCitizen = async () => {
    if (!insideCabin) return;

    await supabase
      .from("appointments")
      .update({
        queue_status: "Completed",
        status: "Completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", insideCabin.id);

    fetchQueue();
  };

  const noShowCitizen = async () => {
    if (!insideCabin) return;

    await supabase
      .from("appointments")
      .update({ queue_status: "No Show", status: "No Show" })
      .eq("id", insideCabin.id);

    fetchQueue();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>OPERATIONS</p>
          <h1 style={styles.title}>Queue Management</h1>
          <p style={styles.sub}>Manage live visitor flow and appointment queue.</p>
        </div>
        <div style={styles.liveTag}>
          <span style={styles.liveDot} />
          <span>Live Queue</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <StatMini icon="🔵" label="In Cabin" value={insideCabin ? insideCabin.token : "—"} color="#2563EB" />
        <StatMini icon="🟡" label="Waiting" value={queue.length.toString()} color="#F59E0B" />
        <StatMini icon="✅" label="Completed" value={completed.length.toString()} color="#10B981" />
        <StatMini icon="❌" label="No Shows" value={noShows.length.toString()} color="#EF4444" />
        <StatMini icon="⏱️" label="Est. Wait" value={`${queue.length * 10} min`} color="#6366F1" />
      </div>

      <div style={styles.mainGrid}>
        {/* Inside Cabin */}
        <div style={styles.servingCard}>
          <div style={styles.servingHeader}>
            <p style={styles.cardEyebrow}>🔵 INSIDE CABIN</p>
            {insideCabin && (
              <span style={{ ...styles.statusPill, background: "#EFF6FF", color: "#2563EB" }}>
                In Progress
              </span>
            )}
          </div>

          {insideCabin ? (
            <>
              <div style={styles.tokenDisplay}>
                <div style={styles.tokenCircle}>
                  <span style={styles.tokenNum}>{insideCabin.token?.split("-")[1]}</span>
                  <span style={styles.tokenPrefix}>#{insideCabin.token?.split("-")[0]}</span>
                </div>
                <div style={styles.currentDetails}>
                  <h2 style={styles.currentName}>{insideCabin.name}</h2>
                  <p style={styles.currentPurpose}>{insideCabin.purpose}</p>
                  <p style={styles.currentOfficer}>Officer: {insideCabin.officer}</p>
                </div>
              </div>

              <div style={styles.actionRow}>
                <button onClick={completeCitizen} style={styles.btnTeal}>
                  <span>✓</span> Complete
                </button>
                <button onClick={noShowCitizen} style={styles.btnRed}>
                  <span>✕</span> No Show
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyServing}>
              <span style={{ fontSize: "40px" }}>🪑</span>
              <p style={{ margin: "12px 0 4px", fontWeight: "700", color: "#111827" }}>Cabin is available</p>
              <p style={{ margin: 0, color: "#64748B", fontSize: "14px" }}>Approve a citizen from the waiting queue to begin</p>
            </div>
          )}
        </div>

        {/* Next Visitor */}
        <div style={styles.nextCard}>
          <p style={styles.cardEyebrow}>🟡 NEXT IN QUEUE</p>
          {queue.length > 0 ? (
            <div style={styles.nextVisitor}>
              <div style={styles.nextAvatar}>{queue[0].name?.[0]}</div>
              <div>
                <p style={styles.nextName}>{queue[0].name}</p>
                <p style={styles.nextPurpose}>{queue[0].purpose}</p>
                <p style={styles.nextToken}>{queue[0].token}</p>
              </div>
            </div>
          ) : (
            <p style={{ color: "#94A3B8", fontSize: "14px", marginTop: "16px" }}>No more visitors</p>
          )}

          <div style={styles.queueMiniList}>
            <p style={{ ...styles.cardEyebrow, marginBottom: "10px" }}>UPCOMING</p>
            {queue.slice(1, 4).map((v, i) => (
              <div key={v.id} style={styles.miniQueueItem}>
                <span style={styles.miniQueueNum}>{i + 2}</span>
                <span style={styles.miniQueueName}>{v.name}</span>
                <span style={styles.miniQueueToken}>{v.token}</span>
              </div>
            ))}
            {queue.length > 4 && (
              <p style={{ color: "#94A3B8", fontSize: "12px", marginTop: "8px", textAlign: "center" }}>
                +{queue.length - 4} more in queue
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Approve notice */}
      {insideCabin && (
        <div style={styles.noticeBar}>
          <span>⚠️</span> Please complete the current citizen before approving another citizen.
        </div>
      )}

      {/* Full Queue Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <p style={styles.cardEyebrow}>🟡 WAITING QUEUE</p>
          <span style={styles.countBadge}>{queue.length} visitors</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["#", "Token", "Citizen", "Purpose", "Officer", "Status", "Action"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>
                    🎉 No waiting citizens
                  </td>
                </tr>
              ) : queue.map((v, i) => (
                <tr key={v.id} style={styles.tr}>
                  <td style={styles.td}><span style={styles.posNum}>{i + 1}</span></td>
                  <td style={styles.td}><span style={styles.tokenTag}>{v.token}</span></td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={styles.smAvatar}>{v.name?.[0]}</div>
                      <span style={{ fontWeight: "600", color: "#111827" }}>{v.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{v.purpose}</td>
                  <td style={styles.td}><span style={{ color: "#64748B", fontSize: "13px" }}>{v.officer}</span></td>
                  <td style={styles.td}>
                    <span style={styles.waitingBadge}>🟡 Waiting</span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => approveCitizen(v)}
                      disabled={!!insideCabin}
                      style={{
                        ...styles.btnApprove,
                        opacity: insideCabin ? 0.4 : 1,
                        cursor: insideCabin ? "not-allowed" : "pointer",
                      }}
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Today */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <p style={styles.cardEyebrow}>✅ COMPLETED TODAY</p>
          <span style={styles.countBadge}>{completed.length} done</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Citizen", "Purpose", "Completed Time"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completed.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>
                    No completed appointments yet
                  </td>
                </tr>
              ) : completed.map(v => (
                <tr key={v.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={styles.smAvatar}>{v.name?.[0]}</div>
                      <span style={{ fontWeight: "600", color: "#111827" }}>{v.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{v.purpose}</td>
                  <td style={styles.td}>
                    <span style={{ color: "#059669", fontWeight: "700", fontSize: "13px" }}>
                      {formatTime(v.completed_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Show */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <p style={styles.cardEyebrow}>🔴 NO SHOW</p>
          <span style={styles.countBadge}>{noShows.length} missed</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Citizen", "Purpose", "Token"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {noShows.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>
                    No no-shows recorded
                  </td>
                </tr>
              ) : noShows.map(v => (
                <tr key={v.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={styles.smAvatar}>{v.name?.[0]}</div>
                      <span style={{ fontWeight: "600", color: "#111827" }}>{v.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{v.purpose}</td>
                  <td style={styles.td}><span style={styles.tokenTag}>{v.token}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatMini({ icon, label, value, color }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", padding: "18px 20px", flex: 1, minWidth: "140px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
      </div>
      <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#94A3B8", fontWeight: "600", letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "24px", fontWeight: "800", color }}>{value}</p>
    </div>
  );
}

const styles = {
  page: { padding: "36px 40px", background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  eyebrow: { margin: "0 0 6px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#2563EB" },
  title: { margin: "0 0 4px", fontSize: "28px", fontWeight: "800", color: "#111827" },
  sub: { margin: 0, fontSize: "14px", color: "#64748B" },
  liveTag: { display: "flex", alignItems: "center", gap: "8px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "20px", padding: "8px 16px", fontSize: "13px", fontWeight: "700", color: "#059669" },
  liveDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", display: "inline-block" },
  statsRow: { display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" },
  mainGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "24px" },
  servingCard: { background: "#fff", borderRadius: "16px", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  servingHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  cardEyebrow: { margin: 0, fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "#94A3B8" },
  statusPill: { padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  tokenDisplay: { display: "flex", gap: "28px", alignItems: "center", marginBottom: "28px" },
  tokenCircle: {
    width: "110px", height: "110px", borderRadius: "50%",
    background: "linear-gradient(135deg, #2563EB, #1E3A8A)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    flexShrink: 0, boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
  },
  tokenNum: { color: "#fff", fontSize: "32px", fontWeight: "900", lineHeight: 1 },
  tokenPrefix: { color: "rgba(255,255,255,0.65)", fontSize: "11px", fontWeight: "600" },
  currentDetails: {},
  currentName: { margin: "0 0 6px", fontSize: "22px", fontWeight: "800", color: "#111827" },
  currentPurpose: { margin: "0 0 6px", fontSize: "14px", color: "#64748B" },
  currentOfficer: { margin: 0, fontSize: "13px", color: "#2563EB", fontWeight: "600" },
  actionRow: { display: "flex", gap: "12px", flexWrap: "wrap" },
  btnRed: { display: "flex", alignItems: "center", gap: "6px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px" },
  btnTeal: { display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#0F766E,#0D9488)", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px" },
  btnApprove: { display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#2563EB,#1E3A8A)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "12px" },
  emptyServing: { textAlign: "center", padding: "40px 0" },
  nextCard: { background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  nextVisitor: { display: "flex", gap: "14px", alignItems: "center", padding: "16px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", margin: "14px 0 20px" },
  nextAvatar: { width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg,#2563EB,#1E3A8A)", color: "#fff", fontWeight: "700", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  nextName: { margin: "0 0 3px", fontWeight: "700", fontSize: "16px", color: "#111827" },
  nextPurpose: { margin: "0 0 3px", fontSize: "13px", color: "#64748B" },
  nextToken: { margin: 0, fontSize: "12px", color: "#2563EB", fontWeight: "700", fontFamily: "monospace" },
  queueMiniList: { borderTop: "1px solid #F1F5F9", paddingTop: "16px" },
  miniQueueItem: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" },
  miniQueueNum: { width: "22px", height: "22px", borderRadius: "50%", background: "#F1F5F9", color: "#64748B", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  miniQueueName: { flex: 1, fontSize: "13px", fontWeight: "600", color: "#374151" },
  miniQueueToken: { fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" },
  noticeBar: { display: "flex", alignItems: "center", gap: "10px", background: "#FFFBEB", border: "1px solid #FDE68A", color: "#B45309", borderRadius: "12px", padding: "12px 18px", fontSize: "13px", fontWeight: "600", marginBottom: "24px" },
  tableCard: { background: "#fff", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: "24px" },
  tableHeader: { padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" },
  countBadge: { background: "#F1F5F9", color: "#64748B", fontSize: "12px", fontWeight: "700", padding: "4px 12px", borderRadius: "20px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.8px", textTransform: "uppercase", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" },
  tr: { borderBottom: "1px solid #F8FAFC" },
  td: { padding: "14px 20px", fontSize: "14px", color: "#374151" },
  posNum: { width: "24px", height: "24px", borderRadius: "50%", background: "#F1F5F9", color: "#64748B", fontSize: "12px", fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  tokenTag: { fontFamily: "monospace", fontWeight: "700", fontSize: "13px", color: "#2563EB", background: "#EFF6FF", padding: "3px 8px", borderRadius: "6px" },
  smAvatar: { width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#2563EB,#1E3A8A)", color: "#fff", fontWeight: "700", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  waitingBadge: { background: "#FEF3C7", color: "#D97706", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
};