import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

function timeToMinutes(time) {
  if (!time) return 0;
  if (time.includes("AM") || time.includes("PM")) {
    const d = new Date(`1970-01-01 ${time}`);
    return d.getHours() * 60 + d.getMinutes();
  }
  const [hours, minutes] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

const EMPTY_FORM = {
  title: "",
  meeting_with: "",
  meeting_date: "",
  meeting_time: "",
  meeting_end_time: "",
  meet_link: "",
  notes: "",
  status: "Upcoming",
};

export default function ExecutiveMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState("All");

  // Conflict modal state
  const [conflictModal, setConflictModal] = useState(false);
  const [conflictAppointments, setConflictAppointments] = useState([]);
  const [pendingSave, setPendingSave] = useState(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  async function fetchMeetings() {
    const { data, error } = await supabase
      .from("executive_meetings")
      .select("*")
      .order("meeting_date", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }
    setMeetings(data);
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Meeting title is required";
    if (!form.meeting_with.trim()) e.meeting_with = "Attendee is required";
    if (!form.meeting_date) e.meeting_date = "Date is required";
    if (!form.meeting_time) e.meeting_time = "Start time is required";
    if (!form.meeting_end_time) e.meeting_end_time = "End time is required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    // Check for appointment conflicts
    const { data: appts, error: apptError } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", form.meeting_date);

    if (apptError) {
      console.log(apptError);
    }

    // Conflict: normalize both 12-hour (appointments) and 24-hour (meetings) times to minutes
    const conflicts = (appts || []).filter(a => {
      const appointmentMinutes = timeToMinutes(a.appointment_time);
      const meetingStart = timeToMinutes(form.meeting_time);
      const meetingEnd = timeToMinutes(form.meeting_end_time);
      return appointmentMinutes >= meetingStart && appointmentMinutes <= meetingEnd;
    });

    if (conflicts.length > 0) {
      setConflictAppointments(conflicts);
      setPendingSave({ ...form });
      setConflictModal(true);
      return;
    }

    await saveMeeting(form);
  };

  const saveMeeting = async (data) => {
    if (editId) {
      const { error } = await supabase
        .from("executive_meetings")
        .update(data)
        .eq("id", editId);
      if (error) { console.log(error); alert("Failed to update: " + error.message); return; }
    } else {
      const { error } = await supabase
        .from("executive_meetings")
        .insert([data]);
      if (error) { console.log(error); alert("Failed to save: " + error.message); return; }
    }
    closeForm();
    fetchMeetings();
  };

  const handleProceed = async () => {
    // Save the meeting first
    await saveMeeting(pendingSave);

    // Update conflicting appointments to Reschedule Required (DO NOT delete or cancel)
    const ids = conflictAppointments.map(a => a.id);
    const { error } = await supabase
      .from("appointments")
      .update({ status: "Reschedule Required" })
      .in("id", ids);

    if (error) console.log("Failed to update appointments:", error);

    setConflictModal(false);
    setConflictAppointments([]);
    setPendingSave(null);
    fetchMeetings();
  };

  const handleCancelConflict = () => {
    setConflictModal(false);
    setConflictAppointments([]);
    setPendingSave(null);
    // Meeting is NOT saved
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleEdit = (m) => {
    setForm({
      title: m.title || "",
      meeting_with: m.meeting_with || "",
      meeting_date: m.meeting_date || "",
      meeting_time: m.meeting_time || "",
      meeting_end_time: m.meeting_end_time || "",
      meet_link: m.meet_link || "",
      notes: m.notes || "",
      status: m.status || "Upcoming",
    });
    setEditId(m.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from("executive_meetings")
      .delete()
      .eq("id", id);
    if (error) { console.log(error); alert("Failed to delete: " + error.message); return; }
    fetchMeetings();
  };

  const markCompleted = async (id) => {
    const { error } = await supabase
      .from("executive_meetings")
      .update({ status: "Completed" })
      .eq("id", id);
    if (error) { console.log(error); alert("Failed to update: " + error.message); return; }
    fetchMeetings();
  };

  const filtered = filter === "All" ? meetings : meetings.filter(m => m.status === filter);

  const modeStyle = {
    "Google Meet": { bg: "#EFF6FF", color: "#2563EB", icon: "🎥" },
    Physical: { bg: "#ECFDF5", color: "#059669", icon: "🏢" },
  };
  const statusStyle = {
    Upcoming: { bg: "#FEF3C7", color: "#D97706" },
    Completed: { bg: "#ECFDF5", color: "#059669" },
    Cancelled: { bg: "#FEF2F2", color: "#DC2626" },
  };

  const getModeFromLink = (link) => link ? "Google Meet" : "Physical";

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>STAFF PORTAL</p>
          <h1 style={styles.title}>Executive Meetings</h1>
          <p style={styles.sub}>Manage meetings scheduled for the Managing Director.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setErrors({}); }} style={styles.newBtn}>
          + Schedule Meeting
        </button>
      </div>

      {/* Notice */}
      <div style={styles.noticeBanner}>
        <span style={styles.noticeIcon}>ℹ️</span>
        <div>
          <strong>Staff Responsibility:</strong> Staff schedules, edits and manages all executive meetings. The Managing Director views and joins meetings from their dashboard.
        </div>
      </div>

      {/* Stats — fixed: use m.meet_link (correct field name) */}
      <div style={styles.statsRow}>
        <StatCard label="Total Meetings" value={meetings.length} color="#2563EB" />
        <StatCard label="Upcoming" value={meetings.filter(m => m.status === "Upcoming").length} color="#F59E0B" />
        <StatCard label="Completed" value={meetings.filter(m => m.status === "Completed").length} color="#10B981" />
        <StatCard label="Google Meet" value={meetings.filter(m => m.meet_link).length} color="#6366F1" />
      </div>

      {/* Filter tabs */}
      <div style={styles.filterRow}>
        {["All", "Upcoming", "Completed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...styles.filterBtn, background: filter === f ? "#2563EB" : "#fff", color: filter === f ? "#fff" : "#64748B", borderColor: filter === f ? "#2563EB" : "#E2E8F0" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Meeting Cards */}
      <div style={styles.meetingsGrid}>
        {filtered.map(m => {
          const mode = getModeFromLink(m.meet_link);
          const ms = modeStyle[mode] || { bg: "#F1F5F9", color: "#64748B", icon: "📅" };
          const ss = statusStyle[m.status] || { bg: "#F1F5F9", color: "#64748B" };
          const dateParts = (m.meeting_date || "").split("-");
          const dateObj = dateParts.length === 3 ? new Date(m.meeting_date) : null;
          const day = dateObj ? dateObj.getDate() : "—";
          const month = dateObj ? dateObj.toLocaleString("default", { month: "short" }) : "";
          const year = dateObj ? dateObj.getFullYear() : "";

          return (
            <div key={m.id} style={{ ...styles.meetingCard, borderLeft: `4px solid ${m.status === "Completed" ? "#10B981" : "#2563EB"}` }}>
              <div style={styles.meetingCardTop}>
                <div style={styles.meetingCardLeft}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ ...styles.modeBadge, background: ms.bg, color: ms.color }}>
                      {ms.icon} {mode}
                    </span>
                    <span style={{ ...styles.statusBadge, background: ss.bg, color: ss.color }}>
                      {m.status}
                    </span>
                  </div>
                  <h2 style={styles.meetingTitle}>{m.title}</h2>
                  <p style={styles.meetingWith}>Meeting with: <strong>{m.meeting_with}</strong></p>
                </div>
                <div style={styles.dateBlock}>
                  <div style={styles.dateBox}>
                    <span style={styles.dateDay}>{day}</span>
                    <span style={styles.dateMonth}>{month}</span>
                    <span style={styles.dateYear}>{year}</span>
                  </div>
                  <p style={styles.timeText}>
                    {m.meeting_time}{m.meeting_end_time ? ` – ${m.meeting_end_time}` : ""}
                  </p>
                </div>
              </div>

              {m.notes && <p style={styles.notes}>{m.notes}</p>}

              {m.meet_link && (
                <div style={styles.linkBox}>
                  <span style={styles.linkIcon}>🔗</span>
                  <a href={m.meet_link} target="_blank" rel="noreferrer" style={styles.linkText}>{m.meet_link}</a>
                </div>
              )}

              <div style={styles.cardActions}>
                {m.meet_link && (
                  <a href={m.meet_link} target="_blank" rel="noreferrer" style={styles.joinBtn}>🎥 Join Meet</a>
                )}
                <button onClick={() => handleEdit(m)} style={styles.editBtn}>✏️ Edit</button>
                {m.status !== "Completed" && (
                  <button onClick={() => markCompleted(m.id)} style={styles.completeBtn}>✓ Mark Completed</button>
                )}
                <button onClick={() => handleDelete(m.id)} style={styles.deleteBtn}>🗑 Delete</button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={styles.emptyState}>
            <span style={{ fontSize: "40px" }}>📅</span>
            <p style={{ margin: "12px 0 4px", fontWeight: "700", color: "#111827" }}>No meetings found</p>
            <p style={{ margin: 0, color: "#64748B", fontSize: "14px" }}>Schedule a new executive meeting to get started.</p>
          </div>
        )}
      </div>

      {/* Schedule / Edit Modal */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editId ? "Edit Meeting" : "Schedule New Meeting"}</h2>
              <button onClick={closeForm} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <FormField label="Meeting Title" error={errors.title} required>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Head Office Review" style={{ ...styles.input, borderColor: errors.title ? "#FCA5A5" : "#E2E8F0" }} />
              </FormField>
              <FormField label="Meeting With" error={errors.meeting_with} required>
                <input name="meeting_with" value={form.meeting_with} onChange={handleChange} placeholder="e.g. Head Office, Regional Office" style={{ ...styles.input, borderColor: errors.meeting_with ? "#FCA5A5" : "#E2E8F0" }} />
              </FormField>
              <FormField label="Date" error={errors.meeting_date} required>
                <input type="date" name="meeting_date" value={form.meeting_date} onChange={handleChange} style={{ ...styles.input, borderColor: errors.meeting_date ? "#FCA5A5" : "#E2E8F0" }} />
              </FormField>
              <div style={styles.formRow}>
                <FormField label="Meeting Start Time" error={errors.meeting_time} required>
                  <input type="time" name="meeting_time" value={form.meeting_time} onChange={handleChange} style={{ ...styles.input, borderColor: errors.meeting_time ? "#FCA5A5" : "#E2E8F0" }} />
                </FormField>
                <FormField label="Meeting End Time" error={errors.meeting_end_time} required>
                  <input type="time" name="meeting_end_time" value={form.meeting_end_time} onChange={handleChange} style={{ ...styles.input, borderColor: errors.meeting_end_time ? "#FCA5A5" : "#E2E8F0" }} />
                </FormField>
              </div>
              <FormField label="Meeting Link">
                <input name="meet_link" value={form.meet_link} onChange={handleChange} placeholder="https://meet.google.com/..." style={styles.input} />
              </FormField>
              <FormField label="Notes">
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Meeting agenda or notes..." rows={3} style={{ ...styles.input, resize: "vertical" }} />
              </FormField>
              <FormField label="Status">
                <select name="status" value={form.status} onChange={handleChange} style={styles.input}>
                  <option>Upcoming</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </FormField>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeForm} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} style={styles.saveBtn}>{editId ? "Save Changes" : "Schedule Meeting"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Detection Modal */}
      {conflictModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "520px" }}>
            <div style={styles.modalHeader}>
              <h2 style={{ ...styles.modalTitle, color: "#D97706" }}>⚠️ Appointment Conflict Detected</h2>
              <button onClick={handleCancelConflict} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#374151" }}>
                This executive meeting overlaps with existing citizen appointments:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {conflictAppointments.map(a => (
                  <div key={a.id} style={styles.conflictRow}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={styles.conflictAvatar}>{(a.citizen_name || "?")[0]}</div>
                      <div>
                        <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "14px", color: "#111827" }}>{a.citizen_name}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>{a.purpose}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: "700", color: "#2563EB" }}>{a.appointment_time}</p>
                      <span style={styles.conflictStatusBadge}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={styles.conflictWarning}>
                <span>⚠️</span>
                <span>If you proceed, the above citizens will be marked as <strong>"Reschedule Required"</strong> and will need to rebook their appointments.</span>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={handleCancelConflict} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleProceed} style={{ ...styles.saveBtn, background: "linear-gradient(135deg,#D97706,#B45309)" }}>Proceed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", padding: "20px 24px", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}` }}>
      <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#94A3B8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "28px", fontWeight: "800", color }}>{value}</p>
    </div>
  );
}

function FormField({ label, error, required, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
      {error && <p style={{ margin: "4px 0 0", color: "#DC2626", fontSize: "12px" }}>{error}</p>}
    </div>
  );
}

const styles = {
  page: { padding: "36px 40px", background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap", gap: "16px" },
  eyebrow: { margin: "0 0 6px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#2563EB" },
  title: { margin: "0 0 4px", fontSize: "28px", fontWeight: "800", color: "#111827" },
  sub: { margin: 0, fontSize: "14px", color: "#64748B" },
  newBtn: { background: "linear-gradient(135deg,#2563EB,#1d4ed8)", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "12px", fontWeight: "700", fontSize: "14px", cursor: "pointer" },
  noticeBanner: { display: "flex", gap: "12px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "12px", padding: "14px 18px", marginBottom: "24px", fontSize: "13px", color: "#1d4ed8", alignItems: "flex-start" },
  noticeIcon: { fontSize: "16px", flexShrink: 0, marginTop: "1px" },
  statsRow: { display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" },
  filterRow: { display: "flex", gap: "8px", marginBottom: "20px" },
  filterBtn: { padding: "8px 18px", borderRadius: "20px", border: "1.5px solid", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  meetingsGrid: { display: "flex", flexDirection: "column", gap: "16px" },
  meetingCard: { background: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  meetingCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "16px" },
  meetingCardLeft: { flex: 1 },
  modeBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  statusBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  meetingTitle: { margin: "0 0 4px", fontSize: "18px", fontWeight: "700", color: "#111827" },
  meetingWith: { margin: 0, fontSize: "13px", color: "#64748B" },
  dateBlock: { textAlign: "center", flexShrink: 0 },
  dateBox: { display: "flex", flexDirection: "column", alignItems: "center", background: "#2563EB", borderRadius: "12px", padding: "10px 16px", marginBottom: "6px" },
  dateDay: { color: "#fff", fontSize: "24px", fontWeight: "900", lineHeight: 1 },
  dateMonth: { color: "rgba(255,255,255,0.8)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" },
  dateYear: { color: "rgba(255,255,255,0.6)", fontSize: "11px" },
  timeText: { margin: 0, fontWeight: "700", fontSize: "14px", color: "#374151" },
  notes: { margin: "0 0 12px", fontSize: "13px", color: "#64748B", background: "#F8FAFC", padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0" },
  linkBox: { display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" },
  linkIcon: { fontSize: "14px" },
  linkText: { color: "#2563EB", fontSize: "13px", wordBreak: "break-all" },
  cardActions: { display: "flex", gap: "10px", flexWrap: "wrap", borderTop: "1px solid #F1F5F9", paddingTop: "16px" },
  joinBtn: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#2563EB", color: "#fff", textDecoration: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700" },
  editBtn: { background: "#F8FAFC", color: "#374151", border: "1px solid #E2E8F0", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  completeBtn: { background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  deleteBtn: { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  emptyState: { textAlign: "center", padding: "60px 0" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modal: { background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "24px 28px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { margin: 0, fontSize: "20px", fontWeight: "700", color: "#111827" },
  modalClose: { background: "#F1F5F9", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "14px", color: "#64748B" },
  modalBody: { padding: "20px 28px", overflowY: "auto", flex: 1 },
  modalFooter: { padding: "16px 28px 24px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end", gap: "12px" },
  input: { width: "100%", padding: "11px 14px", border: "1.5px solid #E2E8F0", borderRadius: "10px", fontSize: "14px", background: "#F8FAFC", color: "#111827", outline: "none", boxSizing: "border-box" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  cancelBtn: { background: "#F1F5F9", color: "#374151", border: "none", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  saveBtn: { background: "linear-gradient(135deg,#2563EB,#1d4ed8)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" },
  conflictRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFF7ED", border: "1px solid #FDE68A", borderRadius: "10px", padding: "12px 16px" },
  conflictAvatar: { width: "36px", height: "36px", borderRadius: "8px", background: "linear-gradient(135deg,#D97706,#B45309)", color: "#fff", fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  conflictStatusBadge: { background: "#FEF3C7", color: "#D97706", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px" },
  conflictWarning: { display: "flex", gap: "10px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#92400E", alignItems: "flex-start" },
};