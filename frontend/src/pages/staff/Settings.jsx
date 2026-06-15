import { useState } from "react";

export default function Settings() {
  const [timings, setTimings] = useState({
    morningStart: "11:00",
    morningEnd: "13:30",
    eveningStart: "14:30",
    eveningEnd: "17:00",
  });

  const [notifications, setNotifications] = useState({
    whatsapp: true,
    sms: true,
    email: false,
    reminderHours: "24",
  });

  const [system, setSystem] = useState({
    slotDuration: "10",
    maxPerSlot: "1",
    autoConfirm: true,
    queueAlerts: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>ADMINISTRATION</p>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.sub}>Configure office preferences and system settings.</p>
        </div>
        <button onClick={handleSave} style={styles.saveBtn}>
          {saved ? "✅ Saved!" : "💾 Save Changes"}
        </button>
      </div>

      {saved && (
        <div style={styles.savedBanner}>
          ✅ Settings saved successfully!
        </div>
      )}

      <div style={styles.settingsGrid}>
        {/* Left Column */}
        <div style={styles.settingsCol}>
          {/* Office Info */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🏢</span>
              <h2 style={styles.sectionTitle}>Organization Info</h2>
            </div>
            <div style={styles.infoCard}>
              <InfoRow label="Organization" value="Maharashtra State Cooperative Tribal Development Corporation Limited" />
              <InfoRow label="Managing Director" value="Leena Bansod" />
              <InfoRow label="System" value="Shabri Appointment Management System" />
              <InfoRow label="Version" value="v2.0.0" />
            </div>
          </div>

          {/* Office Timings */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🕐</span>
              <h2 style={styles.sectionTitle}>Office Timings</h2>
            </div>
            <div style={styles.timingsCard}>
              <div style={styles.sessionBlock}>
                <div style={styles.sessionLabel}>
                  <span style={styles.sessionDot("#10B981")} />
                  Morning Session
                </div>
                <div style={styles.timeRange}>
                  <div style={styles.timeField}>
                    <label style={styles.timeLabel}>Start</label>
                    <input type="time" value={timings.morningStart}
                      onChange={e => setTimings({ ...timings, morningStart: e.target.value })}
                      style={styles.timeInput} />
                  </div>
                  <span style={styles.timeSep}>to</span>
                  <div style={styles.timeField}>
                    <label style={styles.timeLabel}>End</label>
                    <input type="time" value={timings.morningEnd}
                      onChange={e => setTimings({ ...timings, morningEnd: e.target.value })}
                      style={styles.timeInput} />
                  </div>
                </div>
              </div>

              <div style={styles.lunchDivider}>
                <span style={styles.lunchTag}>🍽 Lunch Break: {timings.morningEnd} – {timings.eveningStart}</span>
              </div>

              <div style={styles.sessionBlock}>
                <div style={styles.sessionLabel}>
                  <span style={styles.sessionDot("#2563EB")} />
                  Evening Session
                </div>
                <div style={styles.timeRange}>
                  <div style={styles.timeField}>
                    <label style={styles.timeLabel}>Start</label>
                    <input type="time" value={timings.eveningStart}
                      onChange={e => setTimings({ ...timings, eveningStart: e.target.value })}
                      style={styles.timeInput} />
                  </div>
                  <span style={styles.timeSep}>to</span>
                  <div style={styles.timeField}>
                    <label style={styles.timeLabel}>End</label>
                    <input type="time" value={timings.eveningEnd}
                      onChange={e => setTimings({ ...timings, eveningEnd: e.target.value })}
                      style={styles.timeInput} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.settingsCol}>
          {/* Notification Settings */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🔔</span>
              <h2 style={styles.sectionTitle}>Notification Preferences</h2>
            </div>
            <div style={styles.card}>
              <ToggleRow
                label="WhatsApp Notifications"
                desc="Send appointment updates via WhatsApp"
                icon="💬"
                enabled={notifications.whatsapp}
                onToggle={() => setNotifications({ ...notifications, whatsapp: !notifications.whatsapp })}
              />
              <ToggleRow
                label="SMS Notifications"
                desc="Send SMS for appointment confirmations"
                icon="📱"
                enabled={notifications.sms}
                onToggle={() => setNotifications({ ...notifications, sms: !notifications.sms })}
              />
              <ToggleRow
                label="Email Notifications"
                desc="Send email for meeting notifications"
                icon="📧"
                enabled={notifications.email}
                onToggle={() => setNotifications({ ...notifications, email: !notifications.email })}
              />
              <div style={styles.selectRow}>
                <div>
                  <p style={styles.selectLabel}>Reminder Timing</p>
                  <p style={styles.selectDesc}>Send reminders before appointment</p>
                </div>
                <select
                  value={notifications.reminderHours}
                  onChange={e => setNotifications({ ...notifications, reminderHours: e.target.value })}
                  style={styles.select}
                >
                  <option value="1">1 hour before</option>
                  <option value="2">2 hours before</option>
                  <option value="24">24 hours before</option>
                  <option value="48">48 hours before</option>
                </select>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>⚙️</span>
              <h2 style={styles.sectionTitle}>System Settings</h2>
            </div>
            <div style={styles.card}>
              <div style={styles.selectRow}>
                <div>
                  <p style={styles.selectLabel}>Slot Duration</p>
                  <p style={styles.selectDesc}>Minutes per appointment slot</p>
                </div>
                <select value={system.slotDuration}
                  onChange={e => setSystem({ ...system, slotDuration: e.target.value })}
                  style={styles.select}>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                </select>
              </div>
              <div style={styles.divider} />
              <div style={styles.selectRow}>
                <div>
                  <p style={styles.selectLabel}>Max Per Slot</p>
                  <p style={styles.selectDesc}>Max appointments per time slot</p>
                </div>
                <select value={system.maxPerSlot}
                  onChange={e => setSystem({ ...system, maxPerSlot: e.target.value })}
                  style={styles.select}>
                  <option value="1">1 person</option>
                  <option value="2">2 persons</option>
                  <option value="3">3 persons</option>
                </select>
              </div>
              <div style={styles.divider} />
              <ToggleRow
                label="Auto-Confirm Appointments"
                desc="Automatically confirm new appointments"
                icon="✅"
                enabled={system.autoConfirm}
                onToggle={() => setSystem({ ...system, autoConfirm: !system.autoConfirm })}
              />
              <ToggleRow
                label="Queue Alert Notifications"
                desc="Notify citizen when their turn is near"
                icon="🔢"
                enabled={system.queueAlerts}
                onToggle={() => setSystem({ ...system, queueAlerts: !system.queueAlerts })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={styles.dangerSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionIcon}>⚠️</span>
          <h2 style={{ ...styles.sectionTitle, color: "#DC2626" }}>Danger Zone</h2>
        </div>
        <div style={styles.dangerCard}>
          <div style={styles.dangerRow}>
            <div>
              <p style={styles.dangerLabel}>Clear Today's Queue</p>
              <p style={styles.dangerDesc}>Remove all pending appointments from today's queue</p>
            </div>
            <button onClick={() => alert("Queue cleared")} style={styles.dangerBtn}>Clear Queue</button>
          </div>
          <div style={styles.divider} />
          <div style={styles.dangerRow}>
            <div>
              <p style={styles.dangerLabel}>Reset All Settings</p>
              <p style={styles.dangerDesc}>Restore all settings to their default values</p>
            </div>
            <button onClick={() => alert("Settings reset")} style={styles.dangerBtn}>Reset Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: "16px", padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
      <span style={{ color: "#94A3B8", fontSize: "13px", flex: "0 0 140px", fontWeight: "500" }}>{label}</span>
      <span style={{ color: "#111827", fontSize: "13px", fontWeight: "600", flex: 1 }}>{value}</span>
    </div>
  );
}

function ToggleRow({ label, desc, icon, enabled, onToggle }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <div>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#111827" }}>{label}</p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94A3B8" }}>{desc}</p>
        </div>
      </div>
      <button onClick={onToggle} style={{ ...toggleStyle, background: enabled ? "#2563EB" : "#E2E8F0" }}>
        <div style={{ ...toggleThumb, transform: enabled ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}

const toggleStyle = {
  width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
  position: "relative", transition: "background 0.2s", flexShrink: 0,
};
const toggleThumb = {
  width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
  position: "absolute", top: "3px", left: "3px", transition: "transform 0.2s",
  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
};

const styles = {
  page: { padding: "36px 40px", background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap", gap: "16px" },
  eyebrow: { margin: "0 0 6px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#2563EB" },
  title: { margin: "0 0 4px", fontSize: "28px", fontWeight: "800", color: "#111827" },
  sub: { margin: 0, fontSize: "14px", color: "#64748B" },
  saveBtn: { background: "linear-gradient(135deg,#2563EB,#1d4ed8)", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "12px", fontWeight: "700", fontSize: "14px", cursor: "pointer" },
  savedBanner: { background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", borderRadius: "10px", padding: "12px 20px", marginBottom: "20px", fontWeight: "600", fontSize: "14px" },
  settingsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" },
  settingsCol: { display: "flex", flexDirection: "column", gap: "20px" },
  section: {},
  sectionHeader: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" },
  sectionIcon: { fontSize: "20px" },
  sectionTitle: { margin: 0, fontSize: "17px", fontWeight: "700", color: "#111827" },
  card: { background: "#fff", borderRadius: "14px", padding: "6px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  infoCard: { background: "#fff", borderRadius: "14px", padding: "4px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  timingsCard: { background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  sessionBlock: { marginBottom: "8px" },
  sessionLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "12px" },
  sessionDot: (color) => ({ width: "10px", height: "10px", borderRadius: "50%", background: color, display: "inline-block" }),
  timeRange: { display: "flex", gap: "12px", alignItems: "flex-end" },
  timeField: { flex: 1 },
  timeLabel: { display: "block", fontSize: "11px", fontWeight: "600", color: "#94A3B8", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" },
  timeInput: { width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: "10px", fontSize: "14px", background: "#F8FAFC", color: "#111827", outline: "none", boxSizing: "border-box" },
  timeSep: { color: "#94A3B8", fontWeight: "600", fontSize: "13px", paddingBottom: "10px", flexShrink: 0 },
  lunchDivider: { textAlign: "center", padding: "14px 0", margin: "8px 0" },
  lunchTag: { background: "#FEF3C7", color: "#D97706", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  divider: { height: "1px", background: "#F8FAFC", margin: "4px 0" },
  selectRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" },
  selectLabel: { margin: "0 0 2px", fontSize: "14px", fontWeight: "600", color: "#111827" },
  selectDesc: { margin: 0, fontSize: "12px", color: "#94A3B8" },
  select: { padding: "9px 14px", border: "1.5px solid #E2E8F0", borderRadius: "10px", fontSize: "13px", background: "#F8FAFC", color: "#374151", cursor: "pointer", outline: "none" },
  dangerSection: { marginTop: "4px" },
  dangerCard: { background: "#fff", borderRadius: "14px", padding: "6px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #FEE2E2" },
  dangerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" },
  dangerLabel: { margin: "0 0 3px", fontSize: "14px", fontWeight: "600", color: "#111827" },
  dangerDesc: { margin: 0, fontSize: "12px", color: "#94A3B8" },
  dangerBtn: { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "9px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600", flexShrink: 0 },
};