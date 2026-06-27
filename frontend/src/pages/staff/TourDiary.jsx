import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useRealtime } from "../../hooks/useRealtime";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function thisMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysBetween(start, end) {
  if (!start) return 0;
  const a = new Date(start + "T00:00:00");
  const b = new Date((end || start) + "T00:00:00");
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 1; // inclusive
}

// Auto-compute status from dates
function computeStatus(start_date, end_date, savedStatus) {
  if (savedStatus === "Cancelled") return "Cancelled";
  if (!start_date) return savedStatus || "Upcoming";
  const today = todayStr();
  const end   = end_date || start_date;
  if (today < start_date)  return "Upcoming";
  if (today >= start_date && today <= end) return "Ongoing";
  return "Completed";
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Upcoming:  { bg: "#FEF3C7", color: "#D97706", dot: "#F59E0B", border: "#FDE68A" },
  Completed: { bg: "#ECFDF5", color: "#059669", dot: "#10B981", border: "#A7F3D0" },
  Cancelled: { bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444", border: "#FECACA" },
  Ongoing:   { bg: "#DBEAFE", color: "#2563EB", dot: "#3B82F6", border: "#BFDBFE" },
};

const STATUS_OPTIONS = ["Upcoming", "Ongoing", "Completed", "Cancelled"];

const EMPTY_FORM = {
  destination: "",
  purpose:     "",
  start_date:  "",
  end_date:    "",
  remarks:     "",
  status:      "Upcoming",
};

// ─── Print (full diary) ───────────────────────────────────────────────────────

function printTourDiary(tours, filterLabel) {
  const rows = tours.map(t => {
    const days = daysBetween(t.start_date, t.end_date);
    const durStr = t.end_date && t.end_date !== t.start_date
      ? `${formatDate(t.start_date)} → ${formatDate(t.end_date)} (${days} day${days > 1 ? "s" : ""})`
      : `${formatDate(t.start_date)} (1 day)`;
    const computedStatus = computeStatus(t.start_date, t.end_date, t.status);
    return `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-weight:700;color:#1E3A8A;">${t.destination || "—"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;">${t.purpose || "—"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;white-space:nowrap;">${durStr}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;">${computedStatus}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#64748B;">${t.remarks || "—"}</td>
    </tr>`;
  }).join("");

  const html = `
    <html>
      <head>
        <title>Tour Diary — Managing Director</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          .gov-header { text-align: center; border-bottom: 3px solid #6B1A1A; padding-bottom: 18px; margin-bottom: 24px; }
          .gov-org { font-size: 18px; font-weight: 900; color: #6B1A1A; margin-bottom: 4px; letter-spacing: 0.3px; }
          .gov-system { font-size: 13px; font-weight: 700; color: #111; margin-bottom: 3px; }
          .gov-sub { font-size: 11px; color: #64748B; }
          .report-heading { margin-bottom: 20px; }
          .report-heading h2 { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 4px; }
          .report-heading p { font-size: 13px; color: #64748B; }
          .meta { display: flex; gap: 24px; margin-bottom: 20px; padding: 14px 18px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; }
          .meta-item { font-size: 12px; color: #64748B; }
          .meta-item strong { display: block; font-size: 14px; color: #111827; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
          thead tr { background: #6B1A1A; }
          th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.8px; text-transform: uppercase; }
          tr:nth-child(even) td { background: #F8FAFC; }
          .footer { font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 14px; text-align: center; }
          @page { margin: 18mm; }
        </style>
      </head>
      <body>
        <div class="gov-header">
          <div class="gov-org">Maharashtra State Co-operative Tribal Development Corporation Ltd.</div>
          <div class="gov-system">Shabri Smart Appointment Management System</div>
          <div class="gov-sub">Official Tour Diary — Managing Director</div>
        </div>

        <div class="report-heading">
          <h2>📖 Official Tour Diary</h2>
          <p>Travel record of the Managing Director — Leena Bansod</p>
        </div>

        <div class="meta">
          <div class="meta-item"><strong>${tours.length}</strong> Total Tours</div>
          <div class="meta-item"><strong>${filterLabel || "All Tours"}</strong> Filter Applied</div>
          <div class="meta-item"><strong>${new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })}</strong> Report Generated</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Destination</th>
              <th>Purpose</th>
              <th>Tour Duration</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="footer">
          Maharashtra State Co-operative Tribal Development Corporation Ltd. &nbsp;·&nbsp;
          Shabri Smart Appointment Management System &nbsp;·&nbsp;
          Printed on ${new Date().toLocaleString("en-IN")}
        </div>
      </body>
    </html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}

function printSingleTour(t) {
  printTourDiary([t], t.destination);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TourDiary() {
  const [tours, setTours]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [editId, setEditId]               = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [errors, setErrors]               = useState({});
  const [saving, setSaving]               = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filters
  const [search, setSearch]               = useState("");
  const [filterYear, setFilterYear]       = useState("All");
  const [filterMonth, setFilterMonth]     = useState("All");
  const [filterStatus, setFilterStatus]   = useState("All");
  const [filterDest, setFilterDest]       = useState("All");

  useEffect(() => { fetchTours(); }, []);

  // ── Realtime: tour diary updates instantly across devices ──────────────────
  useRealtime({ tour_diary: fetchTours });

  async function fetchTours() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tour_diary")
      .select("*")
      .order("start_date", { ascending: false });
    if (error) { console.error("[TourDiary] fetch error:", error); }
    else setTours(data || []);
    setLoading(false);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalTours = tours.length;
    const thisMonth  = tours.filter(t => t.start_date?.startsWith(thisMonthStr())).length;
    const cities     = new Set(tours.map(t => (t.destination || "").trim().toLowerCase()).filter(Boolean)).size;
    const daysOnTour = tours.reduce((acc, t) => acc + daysBetween(t.start_date, t.end_date || t.start_date), 0);
    return { totalTours, thisMonth, cities, daysOnTour };
  }, [tours]);

  // ── Filter options ─────────────────────────────────────────────────────────

  const years = useMemo(() => {
    const s = new Set(tours.map(t => t.start_date?.slice(0,4)).filter(Boolean));
    return ["All", ...Array.from(s).sort().reverse()];
  }, [tours]);

  const destinations = useMemo(() => {
    const s = new Set(tours.map(t => t.destination?.trim()).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [tours]);

  const MONTHS = ["All","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // ── Filtered tours ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return tours.filter(t => {
      const q          = search.toLowerCase();
      const matchSearch = !q ||
        (t.destination || "").toLowerCase().includes(q) ||
        (t.purpose     || "").toLowerCase().includes(q);
      const matchYear   = filterYear   === "All" || (t.start_date || "").startsWith(filterYear);
      const monthIdx    = MONTHS.indexOf(filterMonth);
      const matchMonth  = filterMonth  === "All" || (t.start_date || "").slice(5,7) === String(monthIdx).padStart(2,"0");
      const computedSt  = computeStatus(t.start_date, t.end_date, t.status);
      const matchStatus = filterStatus === "All" || computedSt === filterStatus;
      const matchDest   = filterDest   === "All" || t.destination === filterDest;
      return matchSearch && matchYear && matchMonth && matchStatus && matchDest;
    });
  }, [tours, search, filterYear, filterMonth, filterStatus, filterDest]);

  // ── Form handlers ──────────────────────────────────────────────────────────

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  function validate() {
    const e = {};
    if (!form.destination.trim()) e.destination = "Destination is required";
    if (!form.purpose.trim())     e.purpose     = "Purpose is required";
    if (!form.start_date)         e.start_date  = "Start date is required";
    if (!form.end_date)           e.end_date    = "End date is required";
    if (form.end_date && form.start_date && form.end_date < form.start_date)
      e.end_date = "End date cannot be before start date";
    return e;
  }

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);

    // Auto-compute status from dates (unless cancelled)
    const autoStatus = computeStatus(form.start_date, form.end_date, form.status);

    const payload = {
      destination: form.destination.trim(),
      purpose:     form.purpose.trim(),
      start_date:  form.start_date,
      end_date:    form.end_date,
      remarks:     form.remarks.trim()     || null,
      status:      form.status === "Cancelled" ? "Cancelled" : autoStatus,
      // deliberately NOT saving start_time / end_time
    };

    if (editId) {
      const { error } = await supabase.from("tour_diary").update(payload).eq("id", editId);
      if (error) { console.error(error); alert("Failed to update: " + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("tour_diary").insert([payload]);
      if (error) { console.error(error); alert("Failed to save: " + error.message); setSaving(false); return; }
    }

    setSaving(false);
    closeForm();
    fetchTours();
  };

  const handleEdit = (t) => {
    setForm({
      destination: t.destination || "",
      purpose:     t.purpose     || "",
      start_date:  t.start_date  || "",
      end_date:    t.end_date    || "",
      remarks:     t.remarks     || "",
      status:      t.status      || "Upcoming",
    });
    setEditId(t.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("tour_diary").delete().eq("id", id);
    if (error) { console.error(error); alert("Failed to delete: " + error.message); return; }
    setDeleteConfirm(null);
    fetchTours();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  // ── Active filter label for print ─────────────────────────────────────────
  const activeFilterLabel = [
    filterYear   !== "All" ? filterYear   : null,
    filterMonth  !== "All" ? filterMonth  : null,
    filterStatus !== "All" ? filterStatus : null,
    filterDest   !== "All" ? filterDest   : null,
    search                 ? `"${search}"` : null,
  ].filter(Boolean).join(", ") || "All Tours";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ── Page Header ── */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>STAFF PORTAL</p>
          <h1 style={styles.title}>📖 Tour Diary</h1>
          <p style={styles.sub}>Official travel record of the Managing Director — Leena Bansod</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => printTourDiary(filtered, activeFilterLabel)} style={styles.printBtn}>
            🖨 Print Diary
          </button>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setErrors({}); }}
            style={styles.newBtn}
          >
            + Add Tour
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={styles.statsRow}>
        <StatCard label="Total Tours"      value={stats.totalTours} icon="🗺️"  color="#2563EB" />
        <StatCard label="Tours This Month" value={stats.thisMonth}  icon="📅"  color="#F59E0B" />
        <StatCard label="Cities Visited"   value={stats.cities}     icon="🏙️" color="#10B981" />
        <StatCard label="Days on Tour"     value={stats.daysOnTour} icon="⏳"  color="#8B5CF6" />
      </div>

      {/* ── Filters & Search ── */}
      <div style={styles.filtersBar}>
        <div style={styles.searchWrap}>
          <span style={{ fontSize:15, marginRight:8 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search destination or purpose…"
            style={styles.searchInput}
          />
          {search && <button onClick={() => setSearch("")} style={styles.clearBtn}>✕</button>}
        </div>
        <select value={filterYear}   onChange={e => setFilterYear(e.target.value)}   style={styles.select}>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={filterMonth}  onChange={e => setFilterMonth(e.target.value)}  style={styles.select}>
          {MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.select}>
          <option value="All">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterDest}   onChange={e => setFilterDest(e.target.value)}   style={styles.select}>
          {destinations.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* ── Timeline ── */}
      {loading ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize:36 }}>⏳</span>
          <p style={{ marginTop:12, color:"#64748B", fontWeight:600 }}>Loading tour records…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize:48 }}>✈️</span>
          <p style={{ margin:"14px 0 4px", fontWeight:700, fontSize:18, color:"#111827" }}>No tours found</p>
          <p style={{ margin:0, color:"#64748B", fontSize:14 }}>
            {tours.length === 0
              ? `No tour records yet. Click "+ Add Tour" to get started.`
              : "No tours match your current filters."}
          </p>
        </div>
      ) : (
        <div style={styles.timeline}>
          {filtered.map((t, idx) => {
            const computedStatus = computeStatus(t.start_date, t.end_date, t.status);
            const sc      = STATUS_CONFIG[computedStatus] || STATUS_CONFIG["Upcoming"];
            const isLast  = idx === filtered.length - 1;
            const days    = daysBetween(t.start_date, t.end_date || t.start_date);
            const durStr  = t.end_date && t.end_date !== t.start_date
              ? `${formatDate(t.start_date)} → ${formatDate(t.end_date)}`
              : formatDate(t.start_date);

            // Active/Completed badge emoji
            const statusEmoji = computedStatus === "Ongoing"   ? "🟠" :
                                 computedStatus === "Upcoming"  ? "🔵" :
                                 computedStatus === "Completed" ? "⚪" : "🔴";

            return (
              <div key={t.id} style={styles.timelineItem}>
                {/* ── Left: date column ── */}
                <div style={styles.timelineLeft}>
                  <div style={styles.timelineDateBox}>
                    <span style={styles.timelineDay}>
                      {t.start_date ? new Date(t.start_date+"T00:00:00").getDate() : "—"}
                    </span>
                    <span style={styles.timelineMon}>
                      {t.start_date ? new Date(t.start_date+"T00:00:00").toLocaleString("default",{month:"short"}) : ""}
                    </span>
                    <span style={styles.timelineYear}>
                      {t.start_date ? new Date(t.start_date+"T00:00:00").getFullYear() : ""}
                    </span>
                  </div>
                  <span style={styles.nightsBadge}>{days}d</span>
                </div>

                {/* ── Centre: connector ── */}
                <div style={styles.timelineConnector}>
                  <div style={{ ...styles.timelineDot, background: sc.dot, border:`3px solid ${sc.border}` }} />
                  {!isLast && <div style={styles.timelineLine} />}
                </div>

                {/* ── Right: card ── */}
                <div style={styles.timelineCard}>
                  <div style={styles.cardTop}>
                    <div style={{ flex:1 }}>
                      {/* Status badge + emoji */}
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                        <span style={{ ...styles.statusBadge, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>
                          <span style={{ ...styles.statusDot, background:sc.dot }} />
                          {statusEmoji} {computedStatus}
                        </span>
                      </div>
                      <h3 style={styles.destination}>📍 {t.destination}</h3>
                      <p style={styles.purpose}>{t.purpose}</p>
                    </div>

                    {/* Action buttons */}
                    <div style={styles.cardActions}>
                      <button onClick={() => handleEdit(t)} style={styles.actionBtn} title="Edit">✏️</button>
                      <button onClick={() => printSingleTour(t)} style={styles.actionBtn} title="Print">🖨</button>
                      <button
                        onClick={() => setDeleteConfirm(t.id)}
                        style={{ ...styles.actionBtn, color:"#DC2626" }}
                        title="Delete"
                      >🗑</button>
                    </div>
                  </div>

                  {/* Tour duration row (replaces start_time / end_time) */}
                  <div style={styles.metaRow}>
                    <MetaChip icon="📅" text={durStr} />
                    <MetaChip icon="⏳" text={`${days} day${days > 1 ? "s" : ""}`} />
                  </div>

                  {/* Remarks */}
                  {t.remarks && (
                    <div style={styles.remarksBox}>
                      <span style={{ fontSize:13, marginRight:6 }}>📝</span>
                      <span style={{ fontSize:13, color:"#64748B", fontStyle:"italic" }}>{t.remarks}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Result count ── */}
      {!loading && filtered.length > 0 && (
        <p style={{ textAlign:"center", fontSize:12, color:"#94A3B8", fontWeight:600, marginTop:8 }}>
          Showing {filtered.length} of {tours.length} tour records
        </p>
      )}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editId ? "✏️ Edit Tour" : "✈️ Add New Tour"}</h2>
              <button onClick={closeForm} style={styles.modalClose}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGrid}>

                {/* Destination */}
                <FormField label="Destination" required error={errors.destination} span={2}>
                  <input
                    name="destination" value={form.destination} onChange={handleChange}
                    placeholder="e.g. Nagpur, Pune, Mumbai"
                    style={{ ...styles.input, borderColor: errors.destination ? "#FCA5A5" : "#E2E8F0" }}
                  />
                </FormField>

                {/* Purpose */}
                <FormField label="Purpose of Visit" required error={errors.purpose} span={2}>
                  <textarea
                    name="purpose" value={form.purpose} onChange={handleChange}
                    placeholder="e.g. Review of tribal development schemes, field inspection"
                    rows={2}
                    style={{ ...styles.input, resize:"vertical", borderColor: errors.purpose ? "#FCA5A5" : "#E2E8F0" }}
                  />
                </FormField>

                {/* Start Date */}
                <FormField label="Start Date" required error={errors.start_date}>
                  <input
                    type="date" name="start_date" value={form.start_date} onChange={handleChange}
                    style={{ ...styles.input, borderColor: errors.start_date ? "#FCA5A5" : "#E2E8F0" }}
                  />
                </FormField>

                {/* End Date */}
                <FormField label="End Date" required error={errors.end_date}>
                  <input
                    type="date" name="end_date" value={form.end_date}
                    min={form.start_date || undefined}
                    onChange={handleChange}
                    style={{ ...styles.input, borderColor: errors.end_date ? "#FCA5A5" : "#E2E8F0" }}
                  />
                </FormField>

                {/* Full-day info note */}
                <div style={{ gridColumn:"1 / -1" }}>
                  <div style={{
                    background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:10,
                    padding:"11px 16px", display:"flex", alignItems:"center", gap:10,
                  }}>
                    <span style={{ fontSize:18 }}>ℹ️</span>
                    <p style={{ margin:0, fontSize:13, color:"#0369A1", fontWeight:500, lineHeight:1.5 }}>
                      Tours are treated as <strong>full-day events</strong>. Citizen appointments will be
                      blocked for every day between the start and end date (inclusive).
                    </p>
                  </div>
                </div>

                {/* Duration preview */}
                {form.start_date && form.end_date && form.end_date >= form.start_date && (
                  <div style={{ gridColumn:"1 / -1" }}>
                    <div style={{
                      background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:10,
                      padding:"11px 16px", display:"flex", alignItems:"center", gap:10,
                    }}>
                      <span style={{ fontSize:18 }}>📅</span>
                      <p style={{ margin:0, fontSize:13, color:"#065F46", fontWeight:600 }}>
                        Tour duration: <strong>{daysBetween(form.start_date, form.end_date)} day{daysBetween(form.start_date, form.end_date) > 1 ? "s" : ""}</strong>
                        {" "}({formatDate(form.start_date)} → {formatDate(form.end_date)})
                      </p>
                    </div>
                  </div>
                )}

                {/* Status */}
                <FormField label="Status" required error={errors.status} span={2}>
                  <select name="status" value={form.status} onChange={handleChange}
                    style={{ ...styles.input, borderColor: errors.status ? "#FCA5A5" : "#E2E8F0" }}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <p style={{ margin:"6px 0 0", fontSize:12, color:"#94A3B8", fontWeight:500 }}>
                    Status is auto-computed from dates. Set to "Cancelled" to unblock citizen bookings.
                  </p>
                </FormField>

                {/* Remarks */}
                <FormField label="Remarks" span={2}>
                  <textarea
                    name="remarks" value={form.remarks} onChange={handleChange}
                    placeholder="Additional notes or observations…"
                    rows={3}
                    style={{ ...styles.input, resize:"vertical" }}
                  />
                </FormField>

              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeForm} style={styles.cancelBtn}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Tour Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth:440 }}>
            <div style={styles.modalHeader}>
              <h2 style={{ ...styles.modalTitle, color:"#DC2626" }}>🗑 Delete Tour Record</h2>
              <button onClick={() => setDeleteConfirm(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={{ padding:"24px 28px" }}>
              <p style={{ margin:0, fontSize:14, color:"#374151", lineHeight:1.6 }}>
                Are you sure you want to permanently delete this tour record?
                Citizens will be able to book appointments for those dates again.
                This action cannot be undone.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setDeleteConfirm(null)} style={styles.cancelBtn}>Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{ ...styles.saveBtn, background:"linear-gradient(135deg,#DC2626,#B91C1C)" }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background:"#fff", borderRadius:14, padding:"20px 24px", flex:1,
      boxShadow:"0 1px 3px rgba(0,0,0,0.06)", borderTop:`4px solid ${color}`,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <p style={{ margin:0, fontSize:12, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</p>
        <span style={{ fontSize:20 }}>{icon}</span>
      </div>
      <p style={{ margin:0, fontSize:32, fontWeight:900, color }}>{value}</p>
    </div>
  );
}

function FormField({ label, required, error, children, span = 1 }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : undefined, marginBottom:4 }}>
      <label style={{ display:"block", marginBottom:7, fontSize:13, fontWeight:600, color:"#374151" }}>
        {label} {required && <span style={{ color:"#EF4444" }}>*</span>}
      </label>
      {children}
      {error && <p style={{ margin:"5px 0 0", color:"#DC2626", fontSize:12 }}>{error}</p>}
    </div>
  );
}

function MetaChip({ icon, text }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:"#F8FAFC", border:"1px solid #E2E8F0",
      borderRadius:8, padding:"4px 10px", fontSize:12, color:"#374151", fontWeight:600,
    }}>
      <span>{icon}</span> {text}
    </span>
  );
}

// ─── Styles (unchanged from original) ─────────────────────────────────────────

const styles = {
  page:          { padding:"36px 40px", background:"#F8FAFC", minHeight:"100vh", fontFamily:"'Segoe UI', system-ui, sans-serif" },
  pageHeader:    { display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28, flexWrap:"wrap", gap:16 },
  eyebrow:       { margin:"0 0 6px", fontSize:11, fontWeight:700, letterSpacing:"2px", color:"#2563EB" },
  title:         { margin:"0 0 4px", fontSize:28, fontWeight:800, color:"#111827" },
  sub:           { margin:0, fontSize:14, color:"#64748B" },
  newBtn:        { background:"linear-gradient(135deg,#2563EB,#1d4ed8)", color:"#fff", border:"none", padding:"12px 20px", borderRadius:12, fontWeight:700, fontSize:14, cursor:"pointer" },
  printBtn:      { background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"12px 18px", fontSize:14, fontWeight:600, color:"#374151", cursor:"pointer" },
  statsRow:      { display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" },
  filtersBar:    { display:"flex", gap:10, marginBottom:28, flexWrap:"wrap", alignItems:"center" },
  searchWrap:    { flex:1, minWidth:220, display:"flex", alignItems:"center", background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"0 14px" },
  searchInput:   { flex:1, border:"none", outline:"none", fontSize:14, padding:"11px 0", background:"transparent", color:"#111827" },
  clearBtn:      { background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:14, padding:"4px" },
  select:        { padding:"11px 14px", border:"1.5px solid #E2E8F0", borderRadius:12, fontSize:13, background:"#fff", color:"#374151", cursor:"pointer", outline:"none", fontWeight:600 },
  timeline:      { display:"flex", flexDirection:"column", gap:0, marginBottom:16 },
  timelineItem:  { display:"flex", gap:0, alignItems:"flex-start" },
  timelineLeft:  { width:80, flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:20, gap:6 },
  timelineDateBox: { background:"#1E3A8A", borderRadius:10, padding:"8px 10px", display:"flex", flexDirection:"column", alignItems:"center", minWidth:56, textAlign:"center" },
  timelineDay:   { color:"#fff", fontSize:22, fontWeight:900, lineHeight:1 },
  timelineMon:   { color:"rgba(255,255,255,0.8)", fontSize:11, fontWeight:700, textTransform:"uppercase", lineHeight:1.4 },
  timelineYear:  { color:"rgba(255,255,255,0.55)", fontSize:10, lineHeight:1.3 },
  nightsBadge:   { background:"#EFF6FF", color:"#2563EB", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, border:"1px solid #BFDBFE" },
  timelineConnector: { width:40, flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:22 },
  timelineDot:   { width:16, height:16, borderRadius:"50%", flexShrink:0, zIndex:1 },
  timelineLine:  { width:2, flex:1, background:"#E2E8F0", minHeight:40, marginTop:4 },
  timelineCard:  { flex:1, background:"#fff", borderRadius:16, padding:"20px 24px", marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", marginLeft:0 },
  cardTop:       { display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 },
  destination:   { margin:"0 0 4px", fontSize:18, fontWeight:800, color:"#111827" },
  purpose:       { margin:0, fontSize:13, color:"#64748B", lineHeight:1.5 },
  cardActions:   { display:"flex", gap:6, flexShrink:0 },
  actionBtn:     { background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:15 },
  metaRow:       { display:"flex", flexWrap:"wrap", gap:8, marginTop:12 },
  remarksBox:    { marginTop:12, display:"flex", alignItems:"flex-start", gap:4, background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"10px 14px" },
  statusBadge:   { display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 },
  statusDot:     { width:6, height:6, borderRadius:"50%", flexShrink:0 },
  emptyState:    { textAlign:"center", padding:"80px 0" },
  modalOverlay:  { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 },
  modal:         { background:"#fff", borderRadius:20, width:"100%", maxWidth:600, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column" },
  modalHeader:   { padding:"24px 28px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" },
  modalTitle:    { margin:0, fontSize:20, fontWeight:700, color:"#111827" },
  modalClose:    { background:"#F1F5F9", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:14, color:"#64748B" },
  modalBody:     { padding:"20px 28px", overflowY:"auto", flex:1 },
  modalFooter:   { padding:"16px 28px 24px", borderTop:"1px solid #F1F5F9", display:"flex", justifyContent:"flex-end", gap:12 },
  formGrid:      { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
  input:         { width:"100%", padding:"11px 14px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, background:"#F8FAFC", color:"#111827", outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  cancelBtn:     { background:"#F1F5F9", color:"#374151", border:"none", padding:"12px 20px", borderRadius:10, cursor:"pointer", fontWeight:600, fontSize:14 },
  saveBtn:       { background:"linear-gradient(135deg,#2563EB,#1d4ed8)", color:"#fff", border:"none", padding:"12px 24px", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:14 },
};