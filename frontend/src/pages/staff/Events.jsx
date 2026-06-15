import { useState } from "react";

const INITIAL_EVENTS = [
  { id: 1, title: "Scholarship Camp", date: "2026-06-12", time: "10:00", description: "Guidance and application support for students seeking tribal scholarships.", category: "Education", status: "Upcoming" },
  { id: 2, title: "Tribal Welfare Drive", date: "2026-06-18", time: "09:00", description: "Awareness program for tribal welfare schemes and government benefits.", category: "Welfare", status: "Upcoming" },
  { id: 3, title: "Education Workshop", date: "2026-06-22", time: "11:00", description: "Career and education counselling session for tribal youth.", category: "Education", status: "Upcoming" },
  { id: 4, title: "Document Verification Camp", date: "2026-05-10", time: "10:00", description: "Verification of caste and income certificates for tribal citizens.", category: "Administration", status: "Completed" },
];

const CATEGORIES = ["Education", "Welfare", "Administration", "Health", "Sports", "Cultural", "Other"];
const CATEGORY_STYLES = {
  Education: { bg: "#EFF6FF", color: "#2563EB", icon: "🎓" },
  Welfare: { bg: "#ECFDF5", color: "#059669", icon: "🌿" },
  Administration: { bg: "#F5F3FF", color: "#7C3AED", icon: "🏛️" },
  Health: { bg: "#FEF2F2", color: "#DC2626", icon: "❤️" },
  Sports: { bg: "#FFF7ED", color: "#EA580C", icon: "⚽" },
  Cultural: { bg: "#FEF3C7", color: "#D97706", icon: "🎭" },
  Other: { bg: "#F1F5F9", color: "#64748B", icon: "📌" },
};

const EMPTY_FORM = { title: "", date: "", time: "", description: "", category: "Education", status: "Upcoming" };

export default function Events() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [filterStatus, setFilterStatus] = useState("All");
  const [announcement, setAnnouncement] = useState("Citizens can now apply for the 2026 Tribal Scholarship Program. Application deadline: 30 June 2026.");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Event name is required";
    if (!form.date) e.date = "Date is required";
    if (!form.description.trim()) e.description = "Description is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (editId) {
      setEvents(prev => prev.map(ev => ev.id === editId ? { ...form, id: editId } : ev));
    } else {
      setEvents(prev => [...prev, { ...form, id: Date.now() }]);
    }
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleEdit = ev => { setForm({ ...ev }); setEditId(ev.id); setShowForm(true); };
  const handleDelete = id => setEvents(prev => prev.filter(ev => ev.id !== id));

  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const filtered = filterStatus === "All" ? sorted : sorted.filter(ev => ev.status === filterStatus);
  const upcoming = events.filter(ev => ev.status === "Upcoming");

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>STAFF PORTAL</p>
          <h1 style={styles.title}>Events & Announcements</h1>
          <p style={styles.sub}>Create and manage events, camps, and public announcements.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setErrors({}); }} style={styles.addBtn}>
          + Create Event
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <StatCard label="Total Events" value={events.length} color="#2563EB" icon="📣" />
        <StatCard label="Upcoming" value={upcoming.length} color="#10B981" icon="⏭️" />
        <StatCard label="Completed" value={events.filter(e => e.status === "Completed").length} color="#6366F1" icon="✅" />
        <StatCard label="Categories" value={[...new Set(events.map(e => e.category))].length} color="#F59E0B" icon="🏷️" />
      </div>

      {/* Announcement Banner */}
      <div style={styles.announcementCard}>
        <div style={styles.annLeft}>
          <span style={styles.annIcon}>📢</span>
          <div>
            <p style={styles.annLabel}>LATEST ANNOUNCEMENT</p>
            <p style={styles.annText}>{announcement}</p>
          </div>
        </div>
        <button onClick={() => {
          const text = prompt("Update announcement:", announcement);
          if (text) setAnnouncement(text);
        }} style={styles.editAnnBtn}>Edit</button>
      </div>

      {/* Filter */}
      <div style={styles.filterRow}>
        {["All", "Upcoming", "Completed", "Cancelled"].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            style={{ ...styles.filterBtn, background: filterStatus === f ? "#2563EB" : "#fff", color: filterStatus === f ? "#fff" : "#64748B", borderColor: filterStatus === f ? "#2563EB" : "#E2E8F0" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Event Cards */}
      <div style={styles.eventsGrid}>
        {filtered.map(ev => {
          const catStyle = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.Other;
          const isPast = ev.status === "Completed";
          const dateObj = new Date(ev.date);
          return (
            <div key={ev.id} style={{ ...styles.eventCard, opacity: isPast ? 0.8 : 1 }}>
              <div style={styles.eventCardHeader}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ ...styles.catBadge, background: catStyle.bg, color: catStyle.color }}>
                    {catStyle.icon} {ev.category}
                  </span>
                  <span style={{ ...styles.statusBadge, ...(isPast ? styles.completedStyle : styles.upcomingStyle) }}>
                    {ev.status}
                  </span>
                </div>
                <div style={styles.eventDateBox}>
                  <span style={styles.eventDay}>{dateObj.getDate()}</span>
                  <span style={styles.eventMonth}>{dateObj.toLocaleDateString("en-IN", { month: "short" })}</span>
                </div>
              </div>

              <h3 style={styles.eventTitle}>{ev.title}</h3>
              <p style={styles.eventDesc}>{ev.description}</p>

              <div style={styles.eventMeta}>
                {ev.time && <span style={styles.eventMetaItem}>🕐 {ev.time}</span>}
                <span style={styles.eventMetaItem}>📅 {dateObj.toLocaleDateString("en-IN", { weekday: "long" })}</span>
              </div>

              <div style={styles.eventActions}>
                <button onClick={() => handleEdit(ev)} style={styles.editBtn}>✏️ Edit</button>
                <button onClick={() => handleDelete(ev.id)} style={styles.deleteBtn}>🗑 Delete</button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={styles.emptyState}>
            <span style={{ fontSize: "40px" }}>📣</span>
            <p style={{ margin: "12px 0 4px", fontWeight: "700", color: "#111827" }}>No events found</p>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>Create an event to get started.</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editId ? "Edit Event" : "Create New Event"}</h2>
              <button onClick={() => setShowForm(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <FieldWrap label="Event Name" error={errors.title} required>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Scholarship Camp"
                  style={{ ...styles.input, borderColor: errors.title ? "#FCA5A5" : "#E2E8F0" }} />
              </FieldWrap>
              <div style={styles.formRow}>
                <FieldWrap label="Date" error={errors.date} required>
                  <input type="date" name="date" value={form.date} onChange={handleChange}
                    style={{ ...styles.input, borderColor: errors.date ? "#FCA5A5" : "#E2E8F0" }} />
                </FieldWrap>
                <FieldWrap label="Time">
                  <input type="time" name="time" value={form.time} onChange={handleChange} style={styles.input} />
                </FieldWrap>
              </div>
              <FieldWrap label="Category">
                <select name="category" value={form.category} onChange={handleChange} style={styles.input}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </FieldWrap>
              <FieldWrap label="Description" error={errors.description} required>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Enter event details..." rows={4}
                  style={{ ...styles.input, resize: "vertical", borderColor: errors.description ? "#FCA5A5" : "#E2E8F0" }} />
              </FieldWrap>
              <FieldWrap label="Status">
                <select name="status" value={form.status} onChange={handleChange} style={styles.input}>
                  <option>Upcoming</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </FieldWrap>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} style={styles.saveBtn}>{editId ? "Save Changes" : "Create Event"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", padding: "20px 24px", flex: 1, minWidth: "130px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
      </div>
      <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#94A3B8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "26px", fontWeight: "800", color }}>{value}</p>
    </div>
  );
}

function FieldWrap({ label, error, required, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", marginBottom: "7px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
      {error && <p style={{ margin: "4px 0 0", color: "#DC2626", fontSize: "12px" }}>{error}</p>}
    </div>
  );
}

const styles = {
  page: { padding: "36px 40px", background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap", gap: "16px" },
  eyebrow: { margin: "0 0 6px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#2563EB" },
  title: { margin: "0 0 4px", fontSize: "28px", fontWeight: "800", color: "#111827" },
  sub: { margin: 0, fontSize: "14px", color: "#64748B" },
  addBtn: { background: "linear-gradient(135deg,#2563EB,#1d4ed8)", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "12px", fontWeight: "700", fontSize: "14px", cursor: "pointer" },
  statsRow: { display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" },
  announcementCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1E3A8A", borderRadius: "16px", padding: "20px 28px", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  annLeft: { display: "flex", gap: "16px", alignItems: "flex-start" },
  annIcon: { fontSize: "28px", flexShrink: 0 },
  annLabel: { margin: "0 0 4px", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", color: "rgba(255,255,255,0.6)" },
  annText: { margin: 0, color: "#fff", fontSize: "14px", lineHeight: "1.5" },
  editAnnBtn: { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600", flexShrink: 0 },
  filterRow: { display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" },
  filterBtn: { padding: "8px 18px", borderRadius: "20px", border: "1.5px solid", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  eventsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" },
  eventCard: { background: "#fff", borderRadius: "16px", padding: "22px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  eventCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" },
  catBadge: { fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px" },
  statusBadge: { fontSize: "11px", fontWeight: "700", padding: "3px 9px", borderRadius: "20px" },
  upcomingStyle: { background: "#ECFDF5", color: "#059669" },
  completedStyle: { background: "#F1F5F9", color: "#94A3B8" },
  eventDateBox: { display: "flex", flexDirection: "column", alignItems: "center", background: "#2563EB", borderRadius: "10px", padding: "6px 12px", flexShrink: 0 },
  eventDay: { color: "#fff", fontSize: "18px", fontWeight: "900", lineHeight: 1 },
  eventMonth: { color: "rgba(255,255,255,0.75)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" },
  eventTitle: { margin: "0 0 8px", fontSize: "16px", fontWeight: "700", color: "#111827" },
  eventDesc: { margin: "0 0 12px", fontSize: "13px", color: "#64748B", lineHeight: "1.5" },
  eventMeta: { display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  eventMetaItem: { fontSize: "12px", color: "#94A3B8", fontWeight: "500" },
  eventActions: { display: "flex", gap: "8px", borderTop: "1px solid #F1F5F9", paddingTop: "14px" },
  editBtn: { background: "#F8FAFC", color: "#374151", border: "1px solid #E2E8F0", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  deleteBtn: { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  emptyState: { gridColumn: "1/-1", textAlign: "center", padding: "60px 0" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modal: { background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "540px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "24px 28px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { margin: 0, fontSize: "20px", fontWeight: "700", color: "#111827" },
  closeBtn: { background: "#F1F5F9", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "14px", color: "#64748B" },
  modalBody: { padding: "24px 28px", overflowY: "auto", flex: 1 },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  input: { width: "100%", padding: "11px 14px", border: "1.5px solid #E2E8F0", borderRadius: "10px", fontSize: "14px", background: "#F8FAFC", color: "#111827", outline: "none", boxSizing: "border-box" },
  modalFooter: { padding: "16px 28px 24px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end", gap: "12px" },
  cancelBtn: { background: "#F1F5F9", color: "#374151", border: "none", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  saveBtn: { background: "linear-gradient(135deg,#2563EB,#1d4ed8)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" },
};