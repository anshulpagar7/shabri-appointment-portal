import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Waiting:               { bg: "#FEF3C7", color: "#D97706", dot: "#F59E0B" },
  "In Cabin":            { bg: "#DBEAFE", color: "#2563EB", dot: "#2563EB" },
  Completed:             { bg: "#ECFDF5", color: "#059669", dot: "#10B981" },
  "No Show":             { bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
  "Reschedule Required": { bg: "#FEF3FF", color: "#9333EA", dot: "#A855F7" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Display "HH:MM AM – HH:MM AM" or just "HH:MM AM" if no end time. */
function formatTimeRange(startTime, endTime) {
  if (!startTime) return "—";
  if (!endTime) return startTime;
  return `${startTime} – ${endTime}`;
}

/** Display duration as "5 min", "10 min", etc. */
function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return "—";
  return `${minutes} min`;
}

// ─── CSV / Excel Export ───────────────────────────────────────────────────────

function exportCSV(appointments) {
  const headers = [
    "Token ID",
    "Citizen Name",
    "Mobile",
    "Officer",
    "Purpose",
    "Appointment Time",
    "Appointment End Time",
    "Appointment Duration",
    "Status",
  ];

  const rows = appointments.map(a => [
    a.appointment_id ?? "",
    a.citizen_name ?? "",
    a.mobile ?? "",
    a.officer_name ?? "",
    a.purpose ?? "",
    a.appointment_time ?? "",
    a.appointment_end_time ?? "",
    a.appointment_duration ? `${a.appointment_duration} min` : "",
    a.status ?? "",
  ]);

  const csvContent =
    [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appointments_${toDateString(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Print ────────────────────────────────────────────────────────────────────

function printAppointments(appointments, dateStr) {
  const rows = appointments
    .map(
      (a) => `
      <tr>
        <td>${a.appointment_id ?? "—"}</td>
        <td>${a.citizen_name ?? "—"}</td>
        <td>${a.mobile ?? "—"}</td>
        <td>${a.officer_name ?? "—"}</td>
        <td>${a.purpose ?? "—"}</td>
        <td>${formatTimeRange(a.appointment_time, a.appointment_end_time)}</td>
        <td>${a.appointment_duration ? `${a.appointment_duration} Minutes` : "—"}</td>
        <td>${a.status ?? "—"}</td>
      </tr>`
    )
    .join("");

  const html = `
    <html>
      <head>
        <title>Appointments – ${dateStr}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h2 { margin-bottom: 4px; }
          p.sub { margin: 0 0 20px; color: #555; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #1E3A8A; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; }
          td { padding: 9px 12px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
          tr:nth-child(even) td { background: #F8FAFC; }
        </style>
      </head>
      <body>
        <h2>SHABRI Appointment Report</h2>
        <p class="sub">Date: ${dateStr} &nbsp;·&nbsp; Total: ${appointments.length} appointments</p>
        <table>
          <thead>
            <tr>
              <th>Token ID</th>
              <th>Citizen</th>
              <th>Mobile</th>
              <th>Officer</th>
              <th>Purpose</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [cabinCitizen, setCabinCitizen] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterOfficer, setFilterOfficer] = useState("All");
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, appointment_duration, appointment_end_time")
      .eq("appointment_date", selectedDate)
      .order("appointment_time", { ascending: true });

    if (error) { console.log(error); return; }

    setAppointments(data);
    const cabin = data.find(a => a.status === "In Cabin");
    setCabinCitizen(cabin || null);
  };

  const updateStatus = async (appointment, newStatus) => {
    if (newStatus === "In Cabin" && cabinCitizen && cabinCitizen.id !== appointment.id) {
      alert("Please complete current citizen first.");
      return;
    }
    if (!appointment?.id) {
      console.log("updateStatus: missing primary key 'id'", appointment);
      return;
    }
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointment.id);

    if (error) { console.log("updateStatus error:", error); alert("Failed to update status: " + error.message); return; }
    fetchAppointments();
  };

  const prevDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setSelectedDate(toDateString(d));
  };

  const nextDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    setSelectedDate(toDateString(d));
  };

  const filtered = appointments.filter(a => {
    const matchSearch =
      (a.citizen_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.appointment_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.mobile || "").includes(search);
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    const matchOfficer = filterOfficer === "All" || a.officer_name === filterOfficer;
    return matchSearch && matchStatus && matchOfficer;
  });

  const counts = { All: appointments.length };
  appointments.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={styles.page}>

      {/* ── Header ── */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>STAFF PORTAL</p>
          <h1 style={styles.title}>Appointments</h1>
          <p style={styles.sub}>Manage citizen appointments and queue status.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Export / Print buttons */}
          <button
            onClick={() => exportCSV(filtered)}
            style={styles.exportBtn}
            title="Export to CSV"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={() => printAppointments(filtered, formatDisplayDate(selectedDate))}
            style={styles.printBtn}
            title="Print Report"
          >
            🖨 Print
          </button>

          {/* Date Navigator */}
          <div style={styles.dateNav}>
            <button onClick={prevDay} style={styles.dateNavBtn}>◀</button>
            <div style={styles.dateNavCenter}>
              <span style={styles.dateNavIcon}>📅</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={styles.dateInput}
              />
            </div>
            <button onClick={nextDay} style={styles.dateNavBtn}>▶</button>
          </div>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div style={styles.tabRow}>
        {["All", "Waiting", "In Cabin", "Completed", "No Show", "Reschedule Required"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              ...styles.tab,
              background: filterStatus === s ? "#2563EB" : "#fff",
              color: filterStatus === s ? "#fff" : "#64748B",
              borderColor: filterStatus === s ? "#2563EB" : "#E2E8F0",
            }}
          >
            {s}
            <span style={{
              ...styles.tabCount,
              background: filterStatus === s ? "rgba(255,255,255,0.25)" : "#F1F5F9",
              color: filterStatus === s ? "#fff" : "#64748B",
            }}>
              {counts[s] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filters & Search ── */}
      <div style={styles.filterRow}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, or mobile..."
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch("")} style={styles.clearBtn}>✕</button>
          )}
        </div>
        <select
          value={filterOfficer}
          onChange={e => setFilterOfficer(e.target.value)}
          style={styles.select}
        >
          <option value="All">All Officers</option>
          <option>Leena Bansod</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div style={styles.tableCard}>
        <div style={styles.tableTop}>
          <span style={styles.tableCount}>{filtered.length} appointments</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Token ID", "Citizen", "Mobile", "Officer", "Purpose", "Time", "Duration", "Status", "Actions"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={styles.emptyCell}>
                    <div style={styles.emptyState}>
                      <span style={{ fontSize: "32px" }}>🔍</span>
                      <p style={{ margin: "8px 0 0", color: "#64748B", fontWeight: "500" }}>No appointments match your filters</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((a) => {
                const sc = STATUS_CONFIG[a.status] || { bg: "#F1F5F9", color: "#64748B", dot: "#94A3B8" };
                return (
                  <tr key={a.id} style={styles.tr}>

                    {/* Token ID */}
                    <td style={styles.td}>
                      <span style={styles.tokenId}>{a.appointment_id}</span>
                    </td>

                    {/* Citizen */}
                    <td style={styles.td}>
                      <div style={styles.citizenCell}>
                        <div style={styles.avatar}>{(a.citizen_name || "?")[0]}</div>
                        <span style={styles.citizenName}>{a.citizen_name}</span>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td style={styles.td}>
                      <span style={styles.mono}>{a.mobile}</span>
                    </td>

                    {/* Officer */}
                    <td style={styles.td}>
                      <span style={styles.officerText}>{a.officer_name}</span>
                    </td>

                    {/* Purpose */}
                    <td style={styles.td}>
                      <span style={styles.purposeTag}>{a.purpose}</span>
                    </td>

                    {/* Time — shows "12:00 PM – 12:20 PM" or fallback to single time */}
                    <td style={styles.td}>
                      <span style={styles.timeRange}>
                        {formatTimeRange(a.appointment_time, a.appointment_end_time)}
                      </span>
                    </td>

                    {/* Duration — "15 min" */}
                    <td style={styles.td}>
                      <span style={styles.durationBadge}>
                        {formatDuration(a.appointment_duration)}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.color }}>
                        <span style={{ ...styles.statusDot, background: sc.dot }} />
                        {a.status}
                      </span>
                    </td>

                    {/* Actions — unchanged workflow */}
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        {a.status === "Waiting" && (
                          <button
                            onClick={() => updateStatus(a, "In Cabin")}
                            style={{
                              ...styles.actionBtnBlue,
                              opacity: cabinCitizen ? 0.4 : 1,
                              cursor: cabinCitizen ? "not-allowed" : "pointer",
                            }}
                            disabled={!!cabinCitizen}
                            title={cabinCitizen ? "Please complete current citizen first." : "Approve"}
                          >Approve</button>
                        )}
                        {a.status === "In Cabin" && (
                          <>
                            <button onClick={() => updateStatus(a, "Completed")} style={styles.actionBtnGreen} title="Complete">Complete</button>
                            <button onClick={() => updateStatus(a, "No Show")} style={styles.actionBtnRed} title="No Show">No Show</button>
                          </>
                        )}
                        {a.status === "Completed" && (
                          <span style={{ color: "#10B981", fontSize: "16px" }} title="Completed">✅</span>
                        )}
                        {a.status === "No Show" && (
                          <span style={{ color: "#EF4444", fontSize: "16px" }} title="No Show">🔴</span>
                        )}
                        {a.status === "Reschedule Required" && (
                          <span style={{ color: "#9333EA", fontSize: "16px" }} title="Reschedule Required">🔄</span>
                        )}
                      </div>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: { padding: "36px 40px", background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "16px" },
  eyebrow: { margin: "0 0 6px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#2563EB" },
  title: { margin: "0 0 6px", fontSize: "28px", fontWeight: "800", color: "#111827" },
  sub: { margin: 0, fontSize: "14px", color: "#64748B" },
  // Export / Print
  exportBtn: { background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "9px 16px", fontSize: "13px", fontWeight: "600", color: "#374151", cursor: "pointer" },
  printBtn:  { background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "9px 16px", fontSize: "13px", fontWeight: "600", color: "#374151", cursor: "pointer" },
  // Date Navigator
  dateNav: { display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: "14px", padding: "8px 12px" },
  dateNavBtn: { background: "#F1F5F9", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "13px", color: "#374151", fontWeight: "700" },
  dateNavCenter: { display: "flex", alignItems: "center", gap: "8px" },
  dateNavIcon: { fontSize: "16px" },
  dateInput: { border: "none", outline: "none", fontSize: "14px", fontWeight: "700", color: "#111827", background: "transparent", cursor: "pointer" },
  // Tabs
  tabRow: { display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" },
  tab: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "20px", border: "1.5px solid", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" },
  tabCount: { fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "700" },
  // Filters
  filterRow: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchWrap: { flex: 1, minWidth: "260px", display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "0 14px" },
  searchIcon: { fontSize: "15px", marginRight: "8px", flexShrink: 0 },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "14px", padding: "12px 0", background: "transparent", color: "#111827" },
  clearBtn: { background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: "14px", padding: "4px" },
  select: { padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: "12px", fontSize: "14px", background: "#fff", color: "#374151", cursor: "pointer", outline: "none" },
  // Table
  tableCard: { background: "#fff", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden" },
  tableTop: { padding: "16px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end" },
  tableCount: { fontSize: "12px", color: "#94A3B8", fontWeight: "600" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.8px", textTransform: "uppercase", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" },
  tr: { borderBottom: "1px solid #F8FAFC", transition: "background 0.1s" },
  td: { padding: "14px 20px", fontSize: "14px", color: "#374151", verticalAlign: "middle" },
  tokenId: { fontFamily: "monospace", fontWeight: "700", fontSize: "13px", color: "#2563EB", background: "#EFF6FF", padding: "3px 8px", borderRadius: "6px" },
  citizenCell: { display: "flex", gap: "10px", alignItems: "center" },
  avatar: { width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg,#2563EB,#1E3A8A)", color: "#fff", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  citizenName: { fontWeight: "600", color: "#111827", fontSize: "14px" },
  mono: { fontFamily: "monospace", fontSize: "13px", color: "#64748B" },
  officerText: { fontSize: "13px", color: "#64748B" },
  purposeTag: { background: "#F1F5F9", color: "#374151", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "6px" },
  // NEW: time range and duration
  timeRange: { fontFamily: "monospace", fontSize: "12px", color: "#374151", fontWeight: "600", whiteSpace: "nowrap" },
  durationBadge: { background: "#F0F9FF", color: "#0369A1", fontSize: "12px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", border: "1px solid #BAE6FD", whiteSpace: "nowrap" },
  // Status
  statusBadge: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" },
  statusDot: { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0 },
  // Actions
  actionBtns: { display: "flex", gap: "6px", flexWrap: "wrap" },
  actionBtnBlue:  { background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  actionBtnGreen: { background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  actionBtnRed:   { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  emptyCell: { padding: "48px", textAlign: "center" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center" },
};