import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const STATUS_CONFIG = {
  Waiting:   { bg: "#FEF3C7", color: "#D97706", dot: "#F59E0B" },
  "In Cabin": { bg: "#DBEAFE", color: "#2563EB", dot: "#2563EB" },
  Completed: { bg: "#ECFDF5", color: "#059669", dot: "#10B981" },
  "No Show": { bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [cabinCitizen, setCabinCitizen] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterOfficer, setFilterOfficer] = useState("All");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_time", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }

    setAppointments(data);

    const cabin = data.find(a => a.status === "In Cabin");
    setCabinCitizen(cabin || null);
  };

  const updateStatus = async (appointment, newStatus) => {
    if (newStatus === "In Cabin" && cabinCitizen) {
      alert("Complete current citizen first");
      return;
    }

    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointment.id);

    if (error) {
      console.log(error);
      return;
    }

    fetchAppointments();
  };

  const filtered = appointments.filter(a => {
    const matchSearch =
      a.citizen_name.toLowerCase().includes(search.toLowerCase()) ||
      a.appointment_id.toLowerCase().includes(search.toLowerCase()) ||
      a.mobile.includes(search);
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    const matchOfficer = filterOfficer === "All" || a.officer_name === filterOfficer;
    return matchSearch && matchStatus && matchOfficer;
  });

  const counts = { All: appointments.length };
  appointments.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>STAFF PORTAL</p>
          <h1 style={styles.title}>Appointments</h1>
          <p style={styles.sub}>Manage citizen appointments and queue status.</p>
        </div>
        <button style={styles.primaryBtn}>+ New Appointment</button>
      </div>

      {/* Status Tabs */}
      <div style={styles.tabRow}>
        {["All", "Waiting", "In Cabin", "Completed", "No Show"].map(s => (
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

      {/* Filters & Search */}
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
          <option>Anshul Pagar</option>
        </select>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableTop}>
          <span style={styles.tableCount}>{filtered.length} appointments</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Token ID", "Citizen", "Mobile", "Officer", "Purpose", "Time", "Status", "Actions"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.emptyCell}>
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
                    <td style={styles.td}>
                      <span style={styles.tokenId}>{a.appointment_id}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.citizenCell}>
                        <div style={styles.avatar}>{a.citizen_name[0]}</div>
                        <span style={styles.citizenName}>{a.citizen_name}</span>
                      </div>
                    </td>
                    <td style={styles.td}><span style={styles.mono}>{a.mobile}</span></td>
                    <td style={styles.td}><span style={styles.officerText}>{a.officer_name}</span></td>
                    <td style={styles.td}>
                      <span style={styles.purposeTag}>{a.purpose}</span>
                    </td>
                    <td style={styles.td}><span style={styles.mono}>{a.appointment_time}</span></td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.color }}>
                        <span style={{ ...styles.statusDot, background: sc.dot }} />
                        {a.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        {a.status === "Waiting" && (
                          <button
                            onClick={() => updateStatus(a, "In Cabin")}
                            style={styles.actionBtnBlue}
                            title="Approve"
                          >Approve</button>
                        )}
                        {a.status === "In Cabin" && (
                          <>
                            <button
                              onClick={() => updateStatus(a, "Completed")}
                              style={styles.actionBtnGreen}
                              title="Complete"
                            >Complete</button>
                            <button
                              onClick={() => updateStatus(a, "No Show")}
                              style={styles.actionBtnRed}
                              title="No Show"
                            >No Show</button>
                          </>
                        )}
                        {a.status === "Completed" && "✅"}
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

const styles = {
  page: { padding: "36px 40px", background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "16px" },
  eyebrow: { margin: "0 0 6px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#2563EB" },
  title: { margin: "0 0 6px", fontSize: "28px", fontWeight: "800", color: "#111827" },
  sub: { margin: 0, fontSize: "14px", color: "#64748B" },
  primaryBtn: { background: "linear-gradient(135deg,#2563EB,#1d4ed8)", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "12px", fontWeight: "700", fontSize: "14px", cursor: "pointer" },
  tabRow: { display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" },
  tab: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "20px", border: "1.5px solid", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" },
  tabCount: { fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "700" },
  filterRow: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchWrap: { flex: 1, minWidth: "260px", display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "0 14px" },
  searchIcon: { fontSize: "15px", marginRight: "8px", flexShrink: 0 },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "14px", padding: "12px 0", background: "transparent", color: "#111827" },
  clearBtn: { background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: "14px", padding: "4px" },
  select: { padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: "12px", fontSize: "14px", background: "#fff", color: "#374151", cursor: "pointer", outline: "none" },
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
  statusBadge: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" },
  statusDot: { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0 },
  actionBtns: { display: "flex", gap: "6px", flexWrap: "wrap" },
  actionBtnBlue: { background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  actionBtnGreen: { background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  actionBtnRed: { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  emptyCell: { padding: "48px", textAlign: "center" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center" },
};