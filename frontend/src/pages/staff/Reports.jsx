import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Reports() {
  const [appointments, setAppointments] = useState([]);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    fetchAppointments();
    fetchMeetings();
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_time", { ascending: true });
    if (error) { console.log(error); return; }
    setAppointments(data ?? []);
  };

  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from("executive_meetings")
      .select("*");
    if (error) { console.log(error); return; }
    setMeetings(data ?? []);
  };

  // ── KPI calculations ──────────────────────────────────────────────────────
  const total        = appointments.length;
  const waiting      = appointments.filter(a => a.status === "Waiting").length;
  const completed    = appointments.filter(a => a.status === "Completed").length;
  const noShow       = appointments.filter(a => a.status === "No Show").length;
  const reschedule   = appointments.filter(a => a.status === "Reschedule Required").length;

  const kpis = [
    { label: "Appointments Today", value: total,      icon: "📋", color: "#2563EB", bg: "#EFF6FF", change: `${total} total`,       up: true  },
    { label: "Completed",          value: completed,  icon: "✅", color: "#10B981", bg: "#ECFDF5", change: total ? `${Math.round((completed/total)*100)}%` : "0%",   up: true  },
    { label: "Waiting",            value: waiting,    icon: "⏳", color: "#F59E0B", bg: "#FFFBEB", change: total ? `${Math.round((waiting/total)*100)}%` : "0%",     up: false },
    { label: "No Shows",           value: noShow,     icon: "❌", color: "#EF4444", bg: "#FEF2F2", change: total ? `${Math.round((noShow/total)*100)}%` : "0%",      up: false },
    { label: "Reschedule Required",value: reschedule, icon: "🔁", color: "#6366F1", bg: "#EEF2FF", change: total ? `${Math.round((reschedule/total)*100)}%` : "0%", up: false },
  ];

  // ── Pie chart segments ────────────────────────────────────────────────────
  const statusGroups = [
    { label: "Completed",           color: "#10B981", count: completed  },
    { label: "Waiting",             color: "#F59E0B", count: waiting    },
    { label: "No Show",             color: "#EF4444", count: noShow     },
    { label: "In Cabin",            color: "#2563EB", count: appointments.filter(a => a.status === "In Cabin").length },
    { label: "Reschedule Required", color: "#6366F1", count: reschedule },
  ].filter(s => s.count > 0);

  const pieSegments = statusGroups.map(s => ({
    ...s,
    pct: total ? Math.round((s.count / total) * 100) : 0,
  }));

  let cumulativePct = 0;
  const conicStops = pieSegments.length
    ? pieSegments.map(seg => {
        const start = cumulativePct;
        cumulativePct += seg.pct;
        return `${seg.color} ${start}% ${cumulativePct}%`;
      }).join(", ")
    : "#E2E8F0 0% 100%";

  // ── Monthly appointments ──────────────────────────────────────────────────
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyCounts = {};
  appointments.forEach(a => {
    const d = new Date(a.appointment_time ?? a.created_at);
    if (!isNaN(d)) {
      const key = monthNames[d.getMonth()];
      monthlyCounts[key] = (monthlyCounts[key] ?? 0) + 1;
    }
  });
  const monthlyData = monthNames
    .filter(m => monthlyCounts[m])
    .map(m => ({ month: m, value: monthlyCounts[m] }));
  const maxMonthly = Math.max(...(monthlyData.map(d => d.value)), 1);

  // ── Purpose distribution ──────────────────────────────────────────────────
  const purposeCounts = {};
  appointments.forEach(a => {
    if (a.purpose) purposeCounts[a.purpose] = (purposeCounts[a.purpose] ?? 0) + 1;
  });
  const purposeColors = ["#2563EB","#10B981","#6366F1","#F59E0B","#EF4444","#8B5CF6","#EC4899"];
  const purposes = Object.entries(purposeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], i) => ({
      label,
      value: total ? Math.round((count / total) * 100) : 0,
      color: purposeColors[i % purposeColors.length],
    }));

  // ── Officer performance (Leena Bansod only) ───────────────────────────────
  const leenaTotal     = appointments.filter(a => a.officer === "Leena Bansod").length;
  const leenaCompleted = appointments.filter(a => a.officer === "Leena Bansod" && a.status === "Completed").length;
  const officers = leenaTotal > 0
    ? [{ name: "Leena Bansod", total: leenaTotal, completed: leenaCompleted, color: "#2563EB" }]
    : [];

  // ── Executive meetings stats ──────────────────────────────────────────────
  const mScheduled  = meetings.length;
  const mCompleted  = meetings.filter(m => m.status === "Completed").length;
  const mCancelled  = meetings.filter(m => m.status === "Cancelled").length;
  const mOngoing    = meetings.filter(m => m.status === "Ongoing").length;
  const mRate       = mScheduled ? Math.round((mCompleted / mScheduled) * 100) : 0;

  // ── Export / Print ────────────────────────────────────────────────────────
  const handleExport = () => {
    const now = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });
    const purposeRows = purposes.map(p =>
      `<tr><td>${p.label}</td><td>${p.value}%</td></tr>`
    ).join("");
    const meetingRows = meetings.map(m =>
      `<tr><td>${m.title ?? "—"}</td><td>${m.meeting_with ?? "—"}</td><td>${m.meeting_time ?? "—"}</td><td>${m.status ?? "—"}</td></tr>`
    ).join("");

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>SHABRI Report – ${now}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #111; }
    .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 28px; }
    .header-text h1 { margin: 0; font-size: 20px; color: #1E3A8A; }
    .header-text p  { margin: 4px 0 0; font-size: 13px; color: #64748B; }
    .badge { background: #EFF6FF; color: #2563EB; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; margin-bottom: 8px; display: inline-block; }
    h2 { font-size: 15px; color: #1E3A8A; margin: 24px 0 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { background: #EFF6FF; color: #2563EB; font-size: 12px; text-align: left; padding: 8px 12px; }
    td { font-size: 13px; padding: 8px 12px; border-bottom: 1px solid #F1F5F9; }
    .kpi-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 12px; margin-bottom: 8px; }
    .kpi-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; text-align: center; }
    .kpi-box .num { font-size: 28px; font-weight: 900; color: #2563EB; }
    .kpi-box .lbl { font-size: 11px; color: #64748B; margin-top: 4px; }
    .footer { margin-top: 40px; font-size: 11px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-text">
      <div class="badge">GOVERNMENT OF MAHARASHTRA</div>
      <h1>Maharashtra State Cooperative Tribal Development Corporation Limited</h1>
      <p>SHABRI Smart Appointment Portal &nbsp;•&nbsp; Analytics Report</p>
    </div>
  </div>

  <p style="font-size:13px;color:#64748B;margin:0 0 20px;">Generated on: <strong>${now}</strong></p>

  <h2>Appointments Summary</h2>
  <div class="kpi-grid">
    <div class="kpi-box"><div class="num">${total}</div><div class="lbl">Total Today</div></div>
    <div class="kpi-box"><div class="num">${completed}</div><div class="lbl">Completed</div></div>
    <div class="kpi-box"><div class="num">${waiting}</div><div class="lbl">Waiting</div></div>
    <div class="kpi-box"><div class="num">${noShow}</div><div class="lbl">No Shows</div></div>
    <div class="kpi-box"><div class="num">${reschedule}</div><div class="lbl">Reschedule</div></div>
  </div>

  <h2>Completion Statistics</h2>
  <table>
    <thead><tr><th>Metric</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>Completion Rate</td><td>${total ? Math.round((completed/total)*100) : 0}%</td></tr>
      <tr><td>No-Show Rate</td><td>${total ? Math.round((noShow/total)*100) : 0}%</td></tr>
      <tr><td>Pending Rate</td><td>${total ? Math.round((waiting/total)*100) : 0}%</td></tr>
    </tbody>
  </table>

  <h2>Purpose Distribution</h2>
  <table>
    <thead><tr><th>Purpose</th><th>Share</th></tr></thead>
    <tbody>${purposeRows || "<tr><td colspan='2'>No data</td></tr>"}</tbody>
  </table>

  <h2>Executive Meetings</h2>
  <table>
    <thead><tr><th>Title</th><th>With</th><th>Time</th><th>Status</th></tr></thead>
    <tbody>${meetingRows || "<tr><td colspan='4'>No meetings found</td></tr>"}</tbody>
  </table>
  <p style="font-size:13px;color:#64748B;">Meeting Completion Rate: <strong>${mRate}%</strong> &nbsp;(${mCompleted} of ${mScheduled} completed)</p>

  <div class="footer">
    This is a system-generated report from SHABRI Smart Appointment Portal.&nbsp;
    © 2026 Maharashtra State Cooperative Tribal Development Corporation Limited
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  };

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
          <button onClick={handleExport} style={styles.exportBtn}>
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
              <div style={{ height: "100%", background: k.color, width: `${total ? (k.value / total) * 100 : 0}%`, borderRadius: "3px" }} />
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
                <p style={styles.pieHoleNum}>{total}</p>
                <p style={styles.pieHoleLabel}>Total</p>
              </div>
            </div>
          </div>
          {pieSegments.length > 0 ? (
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
          ) : (
            <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>No appointment data yet</p>
          )}
        </div>

        {/* Bar Chart */}
        <div style={{ ...styles.chartCard, flex: 2 }}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Monthly Appointments</h3>
            <span style={styles.chartBadge}>{new Date().getFullYear()}</span>
          </div>
          {monthlyData.length > 0 ? (
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
          ) : (
            <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "13px" }}>
              No monthly data available
            </div>
          )}
        </div>
      </div>

      {/* Purpose Distribution */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>Purpose Distribution</h3>
          <span style={styles.chartBadge}>All Time</span>
        </div>
        {purposes.length > 0 ? (
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
        ) : (
          <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "13px", padding: "20px 0" }}>No purpose data available</p>
        )}
      </div>

      {/* Officer Performance + Executive Meetings */}
      <div style={styles.bottomGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Officer Performance</h3>
            <span style={styles.chartBadge}>Today</span>
          </div>
          {officers.length > 0 ? officers.map(o => (
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
                  <div style={{ ...styles.progressFill, width: `${o.total ? (o.completed / o.total) * 100 : 0}%`, background: o.color }} />
                </div>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                  {o.total ? Math.round((o.completed / o.total) * 100) : 0}% completion rate
                </span>
              </div>
            </div>
          )) : (
            <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "13px", padding: "20px 0" }}>No officer data available</p>
          )}
        </div>

        {/* Executive Meetings Stats */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Executive Meetings</h3>
            <span style={styles.chartBadge}>{new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}</span>
          </div>
          <div style={styles.meetingStats}>
            <MeetingStat icon="📅" label="Scheduled" value={mScheduled} color="#2563EB" />
            <MeetingStat icon="✅" label="Completed"  value={mCompleted} color="#10B981" />
            <MeetingStat icon="❌" label="Cancelled"  value={mCancelled} color="#EF4444" />
            <MeetingStat icon="🔴" label="Ongoing"    value={mOngoing}   color="#F59E0B" />
          </div>
          <div style={styles.meetingRateWrap}>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#64748B" }}>Meeting Completion Rate</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, ...styles.progressTrack }}>
                <div style={{ ...styles.progressFill, width: `${mRate}%`, background: "#2563EB" }} />
              </div>
              <span style={{ fontWeight: "800", fontSize: "18px", color: "#2563EB" }}>{mRate}%</span>
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
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" },
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