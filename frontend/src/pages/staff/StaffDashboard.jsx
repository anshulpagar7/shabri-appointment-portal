import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useRealtime } from "../../hooks/useRealtime";

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good Morning", icon: "👋" };
  if (hour >= 12 && hour < 17) return { text: "Good Afternoon", icon: "☀️" };
  return { text: "Good Evening", icon: "🌙" };
}

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const fetchAppointments = useCallback(async () => {
    const today = todayStr();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", today)
      .order("appointment_time", { ascending: true });
    if (error) { console.log(error); return; }
    setAppointments(data);
  }, []);

  const fetchMeetings = useCallback(async () => {
    const today = todayStr();
    const { data, error } = await supabase
      .from("executive_meetings")
      .select("*")
      .eq("meeting_date", today)
      .order("meeting_time", { ascending: true });
    if (error) { console.log(error); return; }
    setMeetings(data);
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchMeetings();
  }, [fetchAppointments, fetchMeetings]);

  // ── Realtime subscriptions ────────────────────────────────────────────────
  useRealtime({ appointments: fetchAppointments, executive_meetings: fetchMeetings });

  const greeting = getGreeting();

  const stats = [
    { label: "Appointments Today",   value: appointments.length,                                               icon: "📋", color: "#2563EB", bg: "#EFF6FF",  trend: "Live data" },
    { label: "Waiting",              value: appointments.filter(a => a.status === "Waiting").length,           icon: "⏳", color: "#F59E0B", bg: "#FFFBEB",  trend: "Live data" },
    { label: "Completed",            value: appointments.filter(a => a.status === "Completed").length,         icon: "✅", color: "#10B981", bg: "#ECFDF5",  trend: "Live data" },
    { label: "No Shows",             value: appointments.filter(a => a.status === "No Show").length,           icon: "❌", color: "#EF4444", bg: "#FEF2F2",  trend: "Live data" },
    { label: "Reschedule Required",  value: appointments.filter(a => a.status === "Reschedule Required").length, icon: "🔁", color: "#7C3AED", bg: "#F5F3FF", trend: "Live data" },
  ];

  const nowServing   = appointments.find(a => a.status === "In Cabin");
  const upNext       = appointments.find(a => a.status === "Waiting");
  const waitingCount = appointments.filter(a => a.status === "Waiting").length;

  const statusColor = {
    Approved: { bg: "#EFF6FF", color: "#2563EB" },
    Waiting:  { bg: "#FFFBEB", color: "#D97706" },
    Completed: { bg: "#ECFDF5", color: "#059669" },
    Pending:  { bg: "#F5F3FF", color: "#7C3AED" },
    "No Show": { bg: "#FEF2F2", color: "#DC2626" },
    "In Cabin": { bg: "#DBEAFE", color: "#1D4ED8" },
    "Reschedule Required": { bg: "#F5F3FF", color: "#7C3AED" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.pageEyebrow}>STAFF OPERATIONS CENTER</p>
          <h1 style={styles.pageTitle}>{greeting.text} {greeting.icon}</h1>
          <p style={styles.pageSub}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} &nbsp;•&nbsp; Shabri Staff Portal
          </p>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.headerBadge}>
            <span style={styles.pulseDot} />
            <span style={{ fontSize: "13px", color: "#059669", fontWeight: "600" }}>Live</span>
          </div>
          <div style={styles.timeBadge}>🕐 11:00 AM – 5:00 PM</div>
        </div>
      </div>

      <div style={styles.statsGrid}>
        {stats.map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={styles.statTop}>
              <div>
                <p style={styles.statLabel}>{s.label}</p>
                <h2 style={{ ...styles.statValue, color: s.color }}>{s.value}</h2>
              </div>
              <div style={{ ...styles.statIconBox, background: s.bg }}>
                <span style={{ fontSize: "22px" }}>{s.icon}</span>
              </div>
            </div>
            <div style={{ ...styles.statBar, background: s.bg }}>
              <div style={{ ...styles.statBarFill, background: s.color, width: `${(parseInt(s.value) / (appointments.length || 1)) * 100}%` }} />
            </div>
            <p style={styles.statTrend}>{s.trend}</p>
          </div>
        ))}
      </div>

      <div style={styles.midGrid}>
        <div style={styles.queueCard}>
          <div style={styles.cardHeader}>
            <p style={styles.cardEyebrow}>🔢 CURRENT QUEUE</p>
          </div>
          <div style={styles.queueDisplay}>
            <div style={styles.tokenBig}>
              <p style={styles.tokenLabel}>NOW SERVING</p>
              <div style={styles.tokenNumber}>{nowServing ? (nowServing.appointment_id || "—") : "—"}</div>
              <p style={styles.tokenName}>{nowServing ? nowServing.citizen_name : "No one in cabin"}</p>
              <p style={styles.tokenPurpose}>{nowServing ? nowServing.purpose : ""}</p>
            </div>
            <div style={styles.queueStats}>
              <div style={styles.queueStat}>
                <span style={styles.queueStatNum}>{waitingCount}</span>
                <span style={styles.queueStatLabel}>Waiting</span>
              </div>
              <div style={styles.queueStatDivider} />
              <div style={styles.queueStat}>
                <span style={styles.queueStatNum}>~10</span>
                <span style={styles.queueStatLabel}>Min/Visitor</span>
              </div>
              <div style={styles.queueStatDivider} />
              <div style={styles.queueStat}>
                <span style={styles.queueStatNum}>{Math.round((waitingCount * 10) / 60 * 10) / 10}h</span>
                <span style={styles.queueStatLabel}>Est. Wait</span>
              </div>
            </div>
          </div>
          <div style={styles.nextCard}>
            <p style={styles.nextLabel}>UP NEXT</p>
            <p style={styles.nextName}>
              {upNext ? (
                <>{upNext.citizen_name} &nbsp;<span style={{ color: "#94A3B8", fontWeight: "400" }}>• {upNext.appointment_id}</span></>
              ) : (
                <span style={{ color: "#94A3B8", fontWeight: "400" }}>No one waiting</span>
              )}
            </p>
          </div>
        </div>

        <div style={styles.card}>
          <p style={styles.cardEyebrow}>🤝 EXECUTIVE MEETINGS</p>
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {meetings.length === 0 && (
              <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>No meetings scheduled today.</p>
            )}
            {meetings.map((m) => {
              const dateObj = m.meeting_date ? new Date(m.meeting_date) : null;
              const day   = dateObj ? dateObj.getDate() : "—";
              const month = dateObj ? dateObj.toLocaleString("default", { month: "short" }) : "";
              const mode  = m.meet_link ? "Google Meet" : "Physical";
              return (
                <div key={m.id} style={styles.meetingItem}>
                  <div style={styles.meetingDateBox}>
                    <span style={styles.meetingDay}>{day}</span>
                    <span style={styles.meetingMonth}>{month}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.meetingTitle}>{m.title}</p>
                    <p style={styles.meetingMeta}>
                      {m.meeting_time}{m.meeting_end_time ? ` – ${m.meeting_end_time}` : ""} &nbsp;•&nbsp; {mode}
                    </p>
                  </div>
                  <span style={styles.meetingModeBadge}>{mode === "Google Meet" ? "🎥" : "🏢"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: "24px" }}>
        <div style={styles.tableHeader}>
          <p style={styles.cardEyebrow}>📋 TODAY'S APPOINTMENTS</p>
          <div style={styles.tableHeaderRight}>
            <span style={styles.tableCount}>{appointments.length} total</span>
          </div>
        </div>
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {["Citizen", "Purpose", "Officer", "Time", "Status"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((a, i) => {
                const sc = statusColor[a.status] || { bg: "#F1F5F9", color: "#64748B" };
                return (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.citizenCell}>
                        <div style={styles.avatar}>{a.citizen_name?.[0]}</div>
                        <span style={styles.citizenName}>{a.citizen_name}</span>
                      </div>
                    </td>
                    <td style={styles.td}><span style={styles.purposeTag}>{a.purpose}</span></td>
                    <td style={styles.td}><span style={styles.officerText}>{a.officer_name}</span></td>
                    <td style={styles.td}><span style={styles.timeText}>{a.appointment_time}</span></td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.color }}>{a.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "36px 40px", background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px", flexWrap: "wrap", gap: "16px" },
  pageEyebrow: { margin: "0 0 6px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#2563EB" },
  pageTitle: { margin: "0 0 6px", fontSize: "32px", fontWeight: "800", color: "#111827" },
  pageSub: { margin: 0, fontSize: "14px", color: "#64748B" },
  headerActions: { display: "flex", gap: "12px", alignItems: "center" },
  headerBadge: { display: "flex", alignItems: "center", gap: "8px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "20px", padding: "8px 14px" },
  pulseDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", display: "inline-block" },
  timeBadge: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "8px 14px", fontSize: "13px", color: "#374151", fontWeight: "500" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "24px" },
  statCard: { background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  statTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  statLabel: { margin: "0 0 6px", fontSize: "13px", color: "#64748B", fontWeight: "500" },
  statValue: { margin: 0, fontSize: "36px", fontWeight: "800", lineHeight: 1 },
  statIconBox: { width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  statBar: { height: "4px", borderRadius: "4px", overflow: "hidden", marginBottom: "10px" },
  statBarFill: { height: "100%", borderRadius: "4px", transition: "width 0.5s ease" },
  statTrend: { margin: 0, fontSize: "12px", color: "#94A3B8" },
  midGrid: { display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: "20px" },
  queueCard: { background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  card: { background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  cardHeader: { marginBottom: "4px" },
  cardEyebrow: { margin: 0, fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "#94A3B8" },
  queueDisplay: { display: "flex", gap: "24px", alignItems: "center", margin: "20px 0 16px" },
  tokenBig: { flex: 1, textAlign: "center" },
  tokenLabel: { margin: "0 0 4px", fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px", color: "#94A3B8" },
  tokenNumber: { fontSize: "56px", fontWeight: "900", color: "#2563EB", lineHeight: 1, margin: "4px 0" },
  tokenName: { margin: "4px 0 2px", fontWeight: "700", fontSize: "15px", color: "#111827" },
  tokenPurpose: { margin: 0, fontSize: "12px", color: "#64748B" },
  queueStats: { display: "flex", flexDirection: "column", gap: "12px" },
  queueStat: { display: "flex", flexDirection: "column", alignItems: "center" },
  queueStatNum: { fontSize: "22px", fontWeight: "800", color: "#111827" },
  queueStatLabel: { fontSize: "10px", color: "#94A3B8", fontWeight: "600", letterSpacing: "0.5px" },
  queueStatDivider: { height: "1px", width: "40px", background: "#F1F5F9" },
  nextCard: { background: "#F8FAFC", borderRadius: "10px", padding: "12px 16px", border: "1px solid #E2E8F0" },
  nextLabel: { margin: "0 0 4px", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", color: "#94A3B8" },
  nextName: { margin: 0, fontSize: "14px", fontWeight: "700", color: "#111827" },
  meetingItem: { display: "flex", gap: "12px", alignItems: "center", padding: "12px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" },
  meetingDateBox: { display: "flex", flexDirection: "column", alignItems: "center", background: "#2563EB", borderRadius: "8px", padding: "6px 10px", minWidth: "40px" },
  meetingDay: { color: "#fff", fontSize: "16px", fontWeight: "800", lineHeight: 1 },
  meetingMonth: { color: "rgba(255,255,255,0.75)", fontSize: "10px", fontWeight: "600", letterSpacing: "0.5px" },
  meetingTitle: { margin: "0 0 3px", fontSize: "13px", fontWeight: "600", color: "#111827" },
  meetingMeta: { margin: 0, fontSize: "11px", color: "#64748B" },
  meetingModeBadge: { fontSize: "18px" },
  tableHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tableHeaderRight: {},
  tableCount: { background: "#F1F5F9", color: "#64748B", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#F8FAFC" },
  th: { padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.8px", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" },
  tr: { borderBottom: "1px solid #F1F5F9" },
  td: { padding: "14px 16px", fontSize: "14px", color: "#374151" },
  citizenCell: { display: "flex", gap: "10px", alignItems: "center" },
  avatar: { width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #2563EB, #1E3A8A)", color: "#fff", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  citizenName: { fontWeight: "600", color: "#111827" },
  purposeTag: { background: "#EFF6FF", color: "#2563EB", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "6px" },
  officerText: { color: "#64748B", fontSize: "13px" },
  timeText: { fontWeight: "600", fontFamily: "monospace", fontSize: "13px" },
  statusBadge: { padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
};