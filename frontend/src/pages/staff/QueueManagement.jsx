import { useState } from "react";

const INITIAL_QUEUE = [
  { token: "SHA-1002", name: "Priya Patil", purpose: "Education Support", mobile: "9876543211", officer: "Leena Bansod" },
  { token: "SHA-1003", name: "Amit Kumar", purpose: "Certificate Verification", mobile: "9876543212", officer: "Anshul Pagar" },
  { token: "SHA-1004", name: "Sneha More", purpose: "Scholarship Query", mobile: "9876543213", officer: "Leena Bansod" },
  { token: "SHA-1005", name: "Vikram Singh", purpose: "Employment Help", mobile: "9876543214", officer: "Anshul Pagar" },
  { token: "SHA-1006", name: "Anjali More", purpose: "Document Submission", mobile: "9876543215", officer: "Leena Bansod" },
];

export default function QueueManagement() {
  const [current, setCurrent] = useState({ token: "SHA-1001", name: "Rahul Sharma", purpose: "Scholarship Query", officer: "Leena Bansod", status: "meeting" });
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [completed, setCompleted] = useState(0);
  const [noShows, setNoShows] = useState(0);

  const callNext = (action = "complete") => {
    if (action === "complete") setCompleted(c => c + 1);
    if (action === "noshow") setNoShows(n => n + 1);
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent({ ...next, status: "arrived" });
      setQueue(rest);
    } else {
      setCurrent(null);
    }
  };

  const statusConfig = {
    arrived: { label: "Arrived", bg: "#ECFDF5", color: "#059669" },
    meeting: { label: "In Meeting", bg: "#EFF6FF", color: "#2563EB" },
    waiting: { label: "Waiting", bg: "#FEF3C7", color: "#D97706" },
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
        <StatMini icon="🔢" label="Current Token" value={current?.token || "—"} color="#2563EB" />
        <StatMini icon="⏳" label="Waiting" value={queue.length.toString()} color="#F59E0B" />
        <StatMini icon="✅" label="Completed" value={completed.toString()} color="#10B981" />
        <StatMini icon="❌" label="No Shows" value={noShows.toString()} color="#EF4444" />
        <StatMini icon="⏱️" label="Est. Wait" value={`${queue.length * 10} min`} color="#6366F1" />
      </div>

      <div style={styles.mainGrid}>
        {/* Currently Serving */}
        <div style={styles.servingCard}>
          <div style={styles.servingHeader}>
            <p style={styles.cardEyebrow}>NOW SERVING</p>
            {current && (
              <span style={{ ...styles.statusPill, background: statusConfig[current.status]?.bg, color: statusConfig[current.status]?.color }}>
                {statusConfig[current.status]?.label}
              </span>
            )}
          </div>

          {current ? (
            <>
              <div style={styles.tokenDisplay}>
                <div style={styles.tokenCircle}>
                  <span style={styles.tokenNum}>{current.token.split("-")[1]}</span>
                  <span style={styles.tokenPrefix}>#{current.token.split("-")[0]}</span>
                </div>
                <div style={styles.currentDetails}>
                  <h2 style={styles.currentName}>{current.name}</h2>
                  <p style={styles.currentPurpose}>{current.purpose}</p>
                  <p style={styles.currentOfficer}>Officer: {current.officer}</p>
                </div>
              </div>

              <div style={styles.actionRow}>
                <button onClick={() => setCurrent({ ...current, status: "arrived" })} style={styles.btnGreen}>
                  <span>✅</span> Mark Arrived
                </button>
                <button onClick={() => setCurrent({ ...current, status: "meeting" })} style={styles.btnBlue}>
                  <span>▶</span> Start Meeting
                </button>
                <button onClick={() => callNext("noshow")} style={styles.btnRed}>
                  <span>✕</span> No Show
                </button>
                <button onClick={() => callNext("complete")} style={styles.btnTeal}>
                  <span>✓</span> Complete
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyServing}>
              <span style={{ fontSize: "40px" }}>🎉</span>
              <p style={{ margin: "12px 0 4px", fontWeight: "700", color: "#111827" }}>Queue is Empty</p>
              <p style={{ margin: 0, color: "#64748B", fontSize: "14px" }}>All appointments completed for today</p>
            </div>
          )}
        </div>

        {/* Next Visitor */}
        <div style={styles.nextCard}>
          <p style={styles.cardEyebrow}>NEXT IN QUEUE</p>
          {queue.length > 0 ? (
            <div style={styles.nextVisitor}>
              <div style={styles.nextAvatar}>{queue[0].name[0]}</div>
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
              <div key={v.token} style={styles.miniQueueItem}>
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

      {/* Full Queue Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <p style={styles.cardEyebrow}>WAITING QUEUE</p>
          <span style={styles.countBadge}>{queue.length} visitors</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["#", "Token", "Citizen", "Purpose", "Officer", "Status"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>
                    Queue is empty
                  </td>
                </tr>
              ) : queue.map((v, i) => (
                <tr key={v.token} style={styles.tr}>
                  <td style={styles.td}><span style={styles.posNum}>{i + 1}</span></td>
                  <td style={styles.td}><span style={styles.tokenTag}>{v.token}</span></td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={styles.smAvatar}>{v.name[0]}</div>
                      <span style={{ fontWeight: "600", color: "#111827" }}>{v.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{v.purpose}</td>
                  <td style={styles.td}><span style={{ color: "#64748B", fontSize: "13px" }}>{v.officer}</span></td>
                  <td style={styles.td}>
                    <span style={styles.waitingBadge}>Waiting</span>
                  </td>
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
  btnGreen: { display: "flex", alignItems: "center", gap: "6px", background: "#ECFDF5", color: "#059669", border: "1.5px solid #A7F3D0", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px" },
  btnBlue: { display: "flex", alignItems: "center", gap: "6px", background: "#EFF6FF", color: "#2563EB", border: "1.5px solid #BFDBFE", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px" },
  btnRed: { display: "flex", alignItems: "center", gap: "6px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px" },
  btnTeal: { display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#0F766E,#0D9488)", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px" },
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
  tableCard: { background: "#fff", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden" },
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