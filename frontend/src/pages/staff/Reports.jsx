export default function Reports() {
  const kpis = [
    { label: "Appointments Today", value: "48", icon: "📋", color: "#2563EB", bg: "#EFF6FF", change: "+12%", up: true },
    { label: "Completed", value: "21", icon: "✅", color: "#10B981", bg: "#ECFDF5", change: "44%", up: true },
    { label: "Waiting", value: "18", icon: "⏳", color: "#F59E0B", bg: "#FFFBEB", change: "37.5%", up: false },
    { label: "No Shows", value: "3", icon: "❌", color: "#EF4444", bg: "#FEF2F2", change: "6.25%", up: false },
  ];

  const monthlyData = [
    { month: "Jan", value: 60, meetings: 4 },
    { month: "Feb", value: 75, meetings: 6 },
    { month: "Mar", value: 70, meetings: 5 },
    { month: "Apr", value: 85, meetings: 7 },
    { month: "May", value: 95, meetings: 8 },
    { month: "Jun", value: 100, meetings: 5 },
  ];

  const purposes = [
    { label: "Scholarship", value: 85, color: "#2563EB" },
    { label: "Education", value: 72, color: "#10B981" },
    { label: "Employment", value: 55, color: "#6366F1" },
    { label: "Certificate", value: 40, color: "#F59E0B" },
    { label: "Complaint", value: 22, color: "#EF4444" },
  ];

  const officers = [
    { name: "Leena Bansod", total: 30, completed: 14, color: "#2563EB" },
    { name: "Anshul Pagar", total: 18, completed: 7, color: "#10B981" },
  ];

  const maxMonthly = Math.max(...monthlyData.map(d => d.value));

  const pieSegments = [
    { label: "Completed", pct: 44, color: "#10B981" },
    { label: "Waiting", pct: 37, color: "#F59E0B" },
    { label: "No Show", pct: 6, color: "#EF4444" },
    { label: "Approved", pct: 13, color: "#2563EB" },
  ];

  // Build conic gradient
  let cumulativePct = 0;
  const conicStops = pieSegments.map(seg => {
    const start = cumulativePct;
    cumulativePct += seg.pct;
    return `${seg.color} ${start}% ${cumulativePct}%`;
  }).join(", ");

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>ANALYTICS</p>
          <h1 style={styles.title}>Reports & Analytics</h1>
          <p style={styles.sub}>Appointment insights and performance statistics for today.</p>
        </div>
        <div style={styles.headerActions}>
          <select style={styles.periodSelect}>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Custom Range</option>
          </select>
          <button onClick={() => alert("Report exported successfully!")} style={styles.exportBtn}>
            ⬇ Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        {kpis.map(k => (
          <div key={k.label} style={styles.kpiCard}>
            <div style={styles.kpiTop}>
              <div>
                <p style={styles.kpiLabel}>{k.label}</p>
                <h2 style={{ ...styles.kpiValue, color: k.color }}>{k.value}</h2>
              </div>
              <div style={{ ...styles.kpiIcon, background: k.bg }}>
                <span style={{ fontSize: "22px" }}>{k.icon}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" }}>
              <span style={{ fontSize: "12px", color: k.up ? "#10B981" : "#EF4444", fontWeight: "700" }}>
                {k.up ? "↑" : "↓"} {k.change}
              </span>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>of today's total</span>
            </div>
            <div style={{ height: "3px", background: k.bg, borderRadius: "3px", marginTop: "12px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: k.color, width: `${(parseInt(k.value) / 48) * 100}%`, borderRadius: "3px" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        {/* Pie Chart */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Appointment Status</h3>
            <span style={styles.chartBadge}>Today</span>
          </div>
          <div style={styles.pieWrap}>
            <div style={{ ...styles.pie, background: `conic-gradient(${conicStops})` }}>
              <div style={styles.pieHole}>
                <p style={styles.pieHoleNum}>48</p>
                <p style={styles.pieHoleLabel}>Total</p>
              </div>
            </div>
          </div>
          <div style={styles.legendGrid}>
            {pieSegments.map(s => (
              <div key={s.label} style={styles.legendItem}>
                <div style={{ ...styles.legendDot, background: s.color }} />
                <div>
                  <p style={styles.legendLabel}>{s.label}</p>
                  <p style={styles.legendPct}>{s.pct}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div style={{ ...styles.chartCard, flex: 2 }}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Monthly Appointments</h3>
            <span style={styles.chartBadge}>2026</span>
          </div>
          <div style={styles.barChart}>
            {monthlyData.map(d => (
              <div key={d.month} style={styles.barGroup}>
                <div style={styles.barLabels}>
                  <span style={styles.barValue}>{d.value}</span>
                </div>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, height: `${(d.value / maxMonthly) * 100}%` }} />
                </div>
                <span style={styles.barMonth}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Purpose Analytics */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>Purpose Distribution</h3>
          <span style={styles.chartBadge}>All Time</span>
        </div>
        <div style={styles.purposeGrid}>
          {purposes.map(p => (
            <div key={p.label} style={styles.purposeRow}>
              <div style={styles.purposeLabel}>
                <span style={{ fontWeight: "600", color: "#374151", fontSize: "14px" }}>{p.label}</span>
                <span style={{ fontWeight: "700", color: p.color, fontSize: "14px" }}>{p.value}%</span>
              </div>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${p.value}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Officer Performance */}
      <div style={styles.bottomGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Officer Performance</h3>
            <span style={styles.chartBadge}>Today</span>
          </div>
          {officers.map(o => (
            <div key={o.name} style={styles.officerRow}>
              <div style={{ ...styles.officerAvatar, background: o.color }}>
                {o.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "600", fontSize: "14px", color: "#111827" }}>{o.name}</span>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>{o.completed}/{o.total} completed</span>
                </div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: `${(o.completed / o.total) * 100}%`, background: o.color }} />
                </div>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>{Math.round((o.completed / o.total) * 100)}% completion rate</span>
              </div>
            </div>
          ))}
        </div>

        {/* Executive Meetings Stats */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Executive Meetings</h3>
            <span style={styles.chartBadge}>June 2026</span>
          </div>
          <div style={styles.meetingStats}>
            <MeetingStat icon="📅" label="Scheduled" value="5" color="#2563EB" />
            <MeetingStat icon="✅" label="Completed" value="3" color="#10B981" />
            <MeetingStat icon="🎥" label="Google Meet" value="4" color="#6366F1" />
            <MeetingStat icon="🏢" label="Physical" value="1" color="#F59E0B" />
          </div>
          <div style={styles.meetingRateWrap}>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#64748B" }}>Meeting Completion Rate</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, ...styles.progressTrack }}>
                <div style={{ ...styles.progressFill, width: "60%", background: "#2563EB" }} />
              </div>
              <span style={{ fontWeight: "800", fontSize: "18px", color: "#2563EB" }}>60%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingStat({ icon, label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
      <span style={{ fontSize: "20px" }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "600" }}>{label}</p>
        <p style={{ margin: 0, fontSize: "20px", fontWeight: "800", color }}>{value}</p>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "36px 40px", background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "16px" },
  eyebrow: { margin: "0 0 6px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#2563EB" },
  title: { margin: "0 0 4px", fontSize: "28px", fontWeight: "800", color: "#111827" },
  sub: { margin: 0, fontSize: "14px", color: "#64748B" },
  headerActions: { display: "flex", gap: "12px", alignItems: "center" },
  periodSelect: { padding: "10px 16px", border: "1.5px solid #E2E8F0", borderRadius: "10px", fontSize: "13px", background: "#fff", color: "#374151", cursor: "pointer", outline: "none" },
  exportBtn: { background: "linear-gradient(135deg,#2563EB,#1d4ed8)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", fontSize: "14px", cursor: "pointer" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" },
  kpiCard: { background: "#fff", borderRadius: "16px", padding: "22px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  kpiTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  kpiLabel: { margin: "0 0 6px", fontSize: "12px", color: "#64748B", fontWeight: "500" },
  kpiValue: { margin: 0, fontSize: "34px", fontWeight: "800", lineHeight: 1 },
  kpiIcon: { width: "46px", height: "46px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  chartsRow: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", marginBottom: "20px" },
  chartCard: { background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", marginBottom: "20px" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  chartTitle: { margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" },
  chartBadge: { background: "#F1F5F9", color: "#64748B", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  pieWrap: { display: "flex", justifyContent: "center", marginBottom: "20px" },
  pie: { width: "180px", height: "180px", borderRadius: "50%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  pieHole: { width: "100px", height: "100px", borderRadius: "50%", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  pieHoleNum: { margin: 0, fontSize: "22px", fontWeight: "900", color: "#111827" },
  pieHoleLabel: { margin: 0, fontSize: "10px", color: "#94A3B8", fontWeight: "600" },
  legendGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  legendItem: { display: "flex", gap: "10px", alignItems: "center" },
  legendDot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, marginTop: "2px" },
  legendLabel: { margin: "0 0 2px", fontSize: "12px", color: "#374151", fontWeight: "500" },
  legendPct: { margin: 0, fontSize: "13px", fontWeight: "700", color: "#111827" },
  barChart: { display: "flex", gap: "12px", alignItems: "flex-end", height: "180px", padding: "0 8px" },
  barGroup: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" },
  barLabels: { display: "flex", flexDirection: "column", alignItems: "center" },
  barValue: { fontSize: "12px", fontWeight: "700", color: "#374151" },
  barTrack: { flex: 1, width: "100%", background: "#F1F5F9", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", background: "linear-gradient(180deg,#2563EB,#1d4ed8)", borderRadius: "6px 6px 0 0", transition: "height 0.5s ease" },
  barMonth: { fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" },
  purposeGrid: { display: "flex", flexDirection: "column", gap: "16px" },
  purposeRow: {},
  purposeLabel: { display: "flex", justifyContent: "space-between", marginBottom: "6px" },
  progressTrack: { height: "8px", background: "#F1F5F9", borderRadius: "8px", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "8px", transition: "width 0.5s ease" },
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  officerRow: { display: "flex", gap: "14px", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #F8FAFC" },
  officerAvatar: { width: "40px", height: "40px", borderRadius: "10px", color: "#fff", fontWeight: "800", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  meetingStats: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" },
  meetingRateWrap: { borderTop: "1px solid #F1F5F9", paddingTop: "16px" },
};