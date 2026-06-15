import { useState } from "react";

const NAV_ITEMS = [
  { key: "Dashboard", label: "Dashboard", icon: "⊞" },
  { key: "Appointments", label: "Appointments", icon: "📋" },
  { key: "Schedule", label: "Schedule Appointment", icon: "➕" },
  { key: "Executive Meetings", label: "Executive Meetings", icon: "🤝" },
  { key: "Holidays", label: "Holiday Management", icon: "📅" },
  { key: "Events", label: "Events", icon: "📣" },
  { key: "Reports", label: "Reports", icon: "📊" },
  { key: "Notifications", label: "Notification Templates", icon: "🔔" },
  { key: "Settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar({ active, setActive }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ ...styles.sidebar, width: collapsed ? "72px" : "270px" }}>
      {/* Header */}
      <div style={styles.header}>
        {!collapsed && (
          <div style={styles.brand}>
            <div style={styles.logoBox}>
              <span style={styles.logoLetters}>MS</span>
            </div>
            <div style={styles.brandText}>
              <p style={styles.brandOrg}>Maharashtra State Cooperative Tribal Dev. Corp. Ltd.</p>
              <p style={styles.brandSub}>Appointment Management</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ ...styles.logoBox, margin: "0 auto" }}>
            <span style={styles.logoLetters}>MS</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={styles.collapseBtn}>
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Nav */}
      <nav style={styles.nav}>
        {!collapsed && <p style={styles.navLabel}>NAVIGATION</p>}
        {NAV_ITEMS.map(item => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              style={{
                ...styles.navItem,
                background: isActive
                  ? "linear-gradient(90deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))"
                  : "transparent",
                borderLeft: isActive ? "3px solid #2563EB" : "3px solid transparent",
                color: isActive ? "#2563EB" : "#64748B",
                justifyContent: collapsed ? "center" : "flex-start",
                paddingLeft: collapsed ? "0" : "20px",
              }}
              title={collapsed ? item.label : ""}
            >
              <span style={{ ...styles.navIcon, fontSize: collapsed ? "20px" : "18px" }}>{item.icon}</span>
              {!collapsed && (
                <span style={{ ...styles.navLabel2, color: isActive ? "#2563EB" : "#374151", fontWeight: isActive ? "700" : "500" }}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && <span style={styles.activeDot} />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={styles.sidebarFooter}>
          <div style={styles.staffBadge}>
            <div style={styles.staffAvatar}>S</div>
            <div>
              <p style={styles.staffName}>Staff Member</p>
              <p style={styles.staffRole}>Admin Portal</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  sidebar: {
    background: "#fff",
    borderRight: "1px solid #E2E8F0",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    transition: "width 0.25s ease",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    padding: "24px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  brand: { display: "flex", gap: "12px", alignItems: "flex-start" },
  logoBox: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #2563EB, #1E3A8A)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoLetters: { color: "#fff", fontWeight: "800", fontSize: "14px", letterSpacing: "0.5px" },
  brandText: { flex: 1 },
  brandOrg: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: "1.4",
  },
  brandSub: {
    margin: "4px 0 0",
    fontSize: "10px",
    color: "#2563EB",
    fontWeight: "600",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },
  collapseBtn: {
    alignSelf: "flex-end",
    background: "#F1F5F9",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "11px",
    color: "#64748B",
  },
  divider: { height: "1px", background: "#F1F5F9", margin: "0 16px 12px" },
  nav: { flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: "2px" },
  navLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: "1.5px",
    padding: "0 12px",
    margin: "0 0 8px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 20px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    transition: "all 0.15s ease",
    position: "relative",
  },
  navIcon: { flexShrink: 0, lineHeight: 1 },
  navLabel2: { fontSize: "13.5px", flex: 1 },
  activeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#2563EB",
    marginLeft: "auto",
  },
  sidebarFooter: {
    padding: "16px",
    borderTop: "1px solid #F1F5F9",
  },
  staffBadge: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    background: "#F8FAFC",
    borderRadius: "12px",
    padding: "10px 12px",
  },
  staffAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #2563EB, #1E3A8A)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  staffName: { margin: 0, fontSize: "13px", fontWeight: "600", color: "#111827" },
  staffRole: { margin: "2px 0 0", fontSize: "11px", color: "#64748B" },
};