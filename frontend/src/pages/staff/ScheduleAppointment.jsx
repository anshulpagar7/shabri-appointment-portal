import { useState } from "react";

const SLOTS = [
  "09:00 AM", "09:10 AM", "09:20 AM", "09:30 AM",
  "09:40 AM", "09:50 AM", "10:00 AM", "10:10 AM",
  "10:20 AM", "10:30 AM", "10:40 AM", "10:50 AM",
  "11:00 AM", "11:10 AM", "11:20 AM", "11:30 AM",
  "02:30 PM", "02:40 PM", "02:50 PM", "03:00 PM",
  "03:10 PM", "03:20 PM", "03:30 PM", "03:40 PM",
];

const BUSY_SLOTS = ["09:10 AM", "09:30 AM", "10:00 AM", "11:00 AM"];

export default function ScheduleAppointment() {
  const [form, setForm] = useState({ name: "", mobile: "", purpose: "", officer: "", date: "", slot: "" });
  const [created, setCreated] = useState(false);
  const [token] = useState(Math.floor(Math.random() * 900) + 100);
  const [errors, setErrors] = useState({});

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.mobile.trim() || !/^\d{10}$/.test(form.mobile)) e.mobile = "Enter a valid 10-digit mobile number";
    if (!form.purpose) e.purpose = "Please select a purpose";
    if (!form.officer) e.officer = "Please select an officer";
    if (!form.date) e.date = "Please select a date";
    if (!form.slot) e.slot = "Please select a time slot";
    return e;
  };

  const handleCreate = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setCreated(true);
  };

  const handleReset = () => {
    setForm({ name: "", mobile: "", purpose: "", officer: "", date: "", slot: "" });
    setCreated(false);
    setErrors({});
  };

  if (created) {
    return (
      <div style={styles.page}>
        <div style={styles.successPage}>
          <div style={styles.successIcon}>✅</div>
          <h1 style={styles.successTitle}>Appointment Confirmed!</h1>
          <p style={styles.successSub}>The appointment has been created and added to the queue.</p>

          <div style={styles.summaryCard}>
            <div style={styles.tokenBadge}>
              <p style={styles.tokenLabel}>APPOINTMENT TOKEN</p>
              <p style={styles.tokenNum}>SHA-{token}</p>
            </div>
            <div style={styles.summaryGrid}>
              <SummaryRow icon="👤" label="Citizen" value={form.name} />
              <SummaryRow icon="📱" label="Mobile" value={form.mobile} />
              <SummaryRow icon="📋" label="Purpose" value={form.purpose} />
              <SummaryRow icon="🏛️" label="Officer" value={form.officer} />
              <SummaryRow icon="📅" label="Date" value={form.date} />
              <SummaryRow icon="🕐" label="Time" value={form.slot} />
            </div>
          </div>

          <div style={styles.successActions}>
            <div style={styles.notifRow}>
              <span style={styles.notifItem}>✅ Citizen notified via WhatsApp</span>
              <span style={styles.notifItem}>✅ Added to live queue</span>
              <span style={styles.notifItem}>✅ Token generated</span>
            </div>
            <button onClick={handleReset} style={styles.newBtn}>+ Schedule Another Appointment</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>STAFF PORTAL</p>
          <h1 style={styles.title}>Schedule Appointment</h1>
          <p style={styles.sub}>Create appointments manually for walk-in visitors.</p>
        </div>
      </div>

      <div style={styles.formLayout}>
        {/* Main Form */}
        <div style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionNum}>1</div>
            <h2 style={styles.sectionTitle}>Citizen Details</h2>
          </div>

          <div style={styles.fieldsGrid}>
            <Field label="Full Name" required error={errors.name}>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter citizen's full name"
                style={{ ...styles.input, borderColor: errors.name ? "#FCA5A5" : "#E2E8F0" }}
              />
            </Field>
            <Field label="Mobile Number" required error={errors.mobile}>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                style={{ ...styles.input, borderColor: errors.mobile ? "#FCA5A5" : "#E2E8F0" }}
              />
            </Field>
            <Field label="Purpose of Visit" required error={errors.purpose}>
              <select name="purpose" value={form.purpose} onChange={handleChange}
                style={{ ...styles.input, borderColor: errors.purpose ? "#FCA5A5" : "#E2E8F0" }}>
                <option value="">Select purpose</option>
                {["Scholarship", "Education", "Employment", "Certificate", "Complaint", "Other"].map(p => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Assign Officer" required error={errors.officer}>
              <select name="officer" value={form.officer} onChange={handleChange}
                style={{ ...styles.input, borderColor: errors.officer ? "#FCA5A5" : "#E2E8F0" }}>
                <option value="">Select officer</option>
                <option>Leena Bansod</option>
                <option>Anshul Pagar</option>
              </select>
            </Field>
            <Field label="Appointment Date" required error={errors.date}>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                style={{ ...styles.input, borderColor: errors.date ? "#FCA5A5" : "#E2E8F0" }}
              />
            </Field>
          </div>

          {/* Time Slot */}
          <div style={styles.slotSection}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionNum}>2</div>
              <h2 style={styles.sectionTitle}>Select Time Slot</h2>
            </div>
            {errors.slot && <p style={styles.errorText}>{errors.slot}</p>}
            <div style={styles.slotLegend}>
              <span style={styles.legendDot("white","#E2E8F0")} /> Available &nbsp;&nbsp;
              <span style={styles.legendDot("#EFF6FF","#2563EB")} /> Selected &nbsp;&nbsp;
              <span style={styles.legendDot("#FEF2F2","#EF4444")} /> Occupied
            </div>
            <div style={styles.slotGrid}>
              {SLOTS.map(slot => {
                const isBusy = BUSY_SLOTS.includes(slot);
                const isSelected = form.slot === slot;
                return (
                  <button
                    key={slot}
                    disabled={isBusy}
                    onClick={() => { setForm({ ...form, slot }); setErrors({ ...errors, slot: "" }); }}
                    style={{
                      ...styles.slotBtn,
                      background: isBusy ? "#FEF2F2" : isSelected ? "#2563EB" : "#fff",
                      color: isBusy ? "#DC2626" : isSelected ? "#fff" : "#374151",
                      border: `1.5px solid ${isBusy ? "#FECACA" : isSelected ? "#2563EB" : "#E2E8F0"}`,
                      cursor: isBusy ? "not-allowed" : "pointer",
                      opacity: isBusy ? 0.7 : 1,
                    }}
                  >
                    {slot}
                    {isBusy && <span style={styles.busyDot} />}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={handleCreate} style={styles.submitBtn}>
            Create Appointment →
          </button>
        </div>

        {/* Preview Panel */}
        <div style={styles.previewPanel}>
          <div style={styles.previewCard}>
            <p style={styles.previewEyebrow}>APPOINTMENT PREVIEW</p>
            <div style={styles.previewContent}>
              {form.name ? (
                <>
                  <div style={styles.previewAvatar}>{form.name[0]}</div>
                  <p style={styles.previewName}>{form.name}</p>
                </>
              ) : (
                <div style={styles.previewPlaceholder}>
                  <span style={{ fontSize: "32px" }}>👤</span>
                  <p style={{ color: "#CBD5E1", margin: "8px 0 0", fontSize: "13px" }}>Fill in the form</p>
                </div>
              )}
              <div style={styles.previewDetails}>
                <PreviewRow label="Mobile" value={form.mobile || "—"} />
                <PreviewRow label="Purpose" value={form.purpose || "—"} />
                <PreviewRow label="Officer" value={form.officer || "—"} />
                <PreviewRow label="Date" value={form.date || "—"} />
                <PreviewRow label="Time" value={form.slot || "—"} />
              </div>
            </div>
          </div>

          <div style={styles.infoCard}>
            <p style={styles.infoTitle}>📌 Office Hours</p>
            <p style={styles.infoItem}>Morning: 11:00 AM – 1:30 PM</p>
            <p style={styles.infoItem}>Lunch: 1:30 PM – 2:30 PM</p>
            <p style={styles.infoItem}>Evening: 2:30 PM – 5:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: "4px" }}>
      <label style={{ display: "block", marginBottom: "7px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
      {error && <p style={{ margin: "5px 0 0", color: "#DC2626", fontSize: "12px" }}>{error}</p>}
    </div>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
      <span style={{ fontSize: "16px", width: "24px" }}>{icon}</span>
      <span style={{ color: "#64748B", fontSize: "14px", flex: "0 0 80px" }}>{label}</span>
      <span style={{ fontWeight: "700", color: "#111827", fontSize: "14px" }}>{value}</span>
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
      <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#111827", fontWeight: "600", textAlign: "right", maxWidth: "130px" }}>{value}</span>
    </div>
  );
}

const styles = {
  page: { padding: "36px 40px", background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  pageHeader: { marginBottom: "28px" },
  eyebrow: { margin: "0 0 6px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#2563EB" },
  title: { margin: "0 0 4px", fontSize: "28px", fontWeight: "800", color: "#111827" },
  sub: { margin: 0, fontSize: "14px", color: "#64748B" },
  formLayout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px" },
  formCard: { background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  sectionHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" },
  sectionNum: { width: "28px", height: "28px", borderRadius: "50%", background: "#2563EB", color: "#fff", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sectionTitle: { margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827" },
  fieldsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "36px" },
  input: { width: "100%", padding: "12px 14px", border: "1.5px solid #E2E8F0", borderRadius: "10px", fontSize: "14px", background: "#F8FAFC", color: "#111827", outline: "none", boxSizing: "border-box", marginTop: "2px" },
  slotSection: { borderTop: "1px solid #F1F5F9", paddingTop: "28px" },
  slotLegend: { display: "flex", alignItems: "center", marginBottom: "16px", fontSize: "12px", color: "#64748B" },
  legendDot: (bg, border) => ({ display: "inline-block", width: "14px", height: "14px", borderRadius: "4px", background: bg, border: `1.5px solid ${border}`, marginRight: "5px", verticalAlign: "middle" }),
  slotGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "10px", marginBottom: "32px" },
  slotBtn: { padding: "12px 8px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", position: "relative", transition: "all 0.15s" },
  busyDot: { display: "block", width: "6px", height: "6px", borderRadius: "50%", background: "#EF4444", position: "absolute", top: "6px", right: "6px" },
  errorText: { color: "#DC2626", fontSize: "12px", margin: "0 0 12px" },
  submitBtn: { background: "linear-gradient(135deg,#2563EB,#1d4ed8)", color: "#fff", border: "none", padding: "14px 28px", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.3px" },
  previewPanel: { display: "flex", flexDirection: "column", gap: "16px" },
  previewCard: { background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  previewEyebrow: { margin: "0 0 16px", fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px", color: "#94A3B8" },
  previewContent: {},
  previewAvatar: { width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg,#2563EB,#1E3A8A)", color: "#fff", fontWeight: "800", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" },
  previewName: { margin: "0 0 16px", textAlign: "center", fontWeight: "700", fontSize: "16px", color: "#111827" },
  previewPlaceholder: { textAlign: "center", padding: "24px 0" },
  previewDetails: { borderTop: "1px solid #F1F5F9", paddingTop: "14px" },
  infoCard: { background: "#EFF6FF", borderRadius: "14px", padding: "20px", border: "1px solid #BFDBFE" },
  infoTitle: { margin: "0 0 12px", fontWeight: "700", fontSize: "14px", color: "#1E3A8A" },
  infoItem: { margin: "0 0 6px", fontSize: "13px", color: "#1d4ed8" },
  successPage: { maxWidth: "640px", margin: "0 auto", textAlign: "center", paddingTop: "20px" },
  successIcon: { fontSize: "56px", marginBottom: "16px" },
  successTitle: { margin: "0 0 8px", fontSize: "28px", fontWeight: "800", color: "#111827" },
  successSub: { margin: "0 0 32px", fontSize: "15px", color: "#64748B" },
  summaryCard: { background: "#fff", borderRadius: "16px", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", textAlign: "left", marginBottom: "24px" },
  tokenBadge: { textAlign: "center", padding: "20px", background: "linear-gradient(135deg,#2563EB,#1E3A8A)", borderRadius: "12px", marginBottom: "24px" },
  tokenLabel: { margin: "0 0 6px", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", color: "rgba(255,255,255,0.7)" },
  tokenNum: { margin: 0, fontSize: "28px", fontWeight: "900", color: "#fff" },
  summaryGrid: {},
  successActions: {},
  notifRow: { display: "flex", gap: "16px", justifyContent: "center", marginBottom: "24px", flexWrap: "wrap" },
  notifItem: { background: "#ECFDF5", color: "#059669", padding: "8px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" },
  newBtn: { background: "linear-gradient(135deg,#2563EB,#1d4ed8)", color: "#fff", border: "none", padding: "14px 24px", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
};