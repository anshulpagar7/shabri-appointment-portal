import { useState } from "react";
import tdcLogo    from "../../assets/tdc-logo.jpeg";
import tribalLogo from "../../assets/tribal-logo.jpg";

const NAV_ITEMS = [
  { key: "Dashboard",          label: "Dashboard",               icon: "📊" },
  { key: "Appointments",       label: "Appointments",            icon: "📅" },
  { key: "Schedule",           label: "Schedule Appointment",    icon: "➕" },
  { key: "Executive Meetings", label: "Executive Meetings",      icon: "🤝" },
  { key: "TourDiary",          label: "Tour Diary",              icon: "📖" },
  { key: "Holidays",           label: "Holiday Management",      icon: "🏖" },
  { key: "Events",             label: "Events",                  icon: "📢" },
  { key: "Reports",            label: "Reports",                 icon: "📈" },
  { key: "Notifications",      label: "Notification Templates",  icon: "🔔" },
];

export default function Sidebar({ active, setActive }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ ...styles.sidebar, width: collapsed ? "72px" : "270px" }}>

      {/* ── Header: Logos + Org name ── */}
      <div style={styles.header}>
        {!collapsed ? (
          <>
            {/* Dual logo row */}
            <div style={styles.logoRow}>
              <img
                src={tribalLogo}
                alt="Tribal Logo"
                style={styles.logoImg}
              />
              <div style={styles.logoDivider} />
              <img
                src={tdcLogo}
                alt="TDC Logo"
                style={styles.logoImg}
              />
            </div>

            {/* Org name */}
            <div style={styles.orgBlock}>
              <p style={styles.orgName}>
                Maharashtra State Cooperative Tribal Development Corporation Ltd.
              </p>
              <p style={styles.orgSub}>Shabri Smart Appointment Portal</p>
            </div>
          </>
        ) : (
          /* Collapsed: show single small TDC logo centered */
          <div style={{ display:"flex", justifyContent:"center", paddingTop:8, paddingBottom:4 }}>
            <img src={tdcLogo} alt="TDC" style={{ width:36, height:36, borderRadius:8, objectFit:"contain" }} />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ ...styles.collapseBtn, alignSelf: collapsed ? "center" : "flex-end" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* ── Navigation ── */}
      <nav style={styles.nav}>
        {!collapsed && <p style={styles.navSectionLabel}>NAVIGATION</p>}

        {NAV_ITEMS.map(item => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              title={collapsed ? item.label : ""}
              style={{
                ...styles.navItem,
                background:  isActive ? "linear-gradient(90deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))" : "transparent",
                borderLeft:  isActive ? "3px solid #2563EB" : "3px solid transparent",
                color:       isActive ? "#2563EB" : "#64748B",
                justifyContent: collapsed ? "center" : "flex-start",
                paddingLeft:    collapsed ? "0" : "20px",
              }}
            >
              <span style={{ ...styles.navIcon, fontSize: collapsed ? "20px" : "18px" }}>{item.icon}</span>
              {!collapsed && (
                <span style={{
                  ...styles.navLabel2,
                  color:      isActive ? "#2563EB" : "#374151",
                  fontWeight: isActive ? "700" : "500",
                }}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && <span style={styles.activeDot} />}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
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
    background:    "#fff",
    borderRight:   "1px solid #E2E8F0",
    display:       "flex",
    flexDirection: "column",
    minHeight:     "100vh",
    transition:    "width 0.25s ease",
    flexShrink:    0,
    position:      "sticky",
    top:           0,
    height:        "100vh",
    overflowY:     "auto",
    overflowX:     "hidden",
    boxShadow:     "2px 0 12px rgba(0,0,0,0.04)",
    fontFamily:    "'Segoe UI', system-ui, sans-serif",
  },

  // ── Header ──
  header: {
    padding:       "16px 14px 12px",
    display:       "flex",
    flexDirection: "column",
    gap:           "10px",
    // keeps total header height ≈ 110–120px
  },

  // Dual logo row
  logoRow: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            12,
  },
  logoImg: {
    width:      42,
    height:     42,
    objectFit:  "contain",
    borderRadius: 8,
    background: "#F8FAFC",
    border:     "1px solid #E2E8F0",
    flexShrink: 0,
  },
  logoDivider: {
    width:      1,
    height:     32,
    background: "#E2E8F0",
    flexShrink: 0,
  },

  // Org text
  orgBlock: {
    textAlign: "center",
    padding:   "0 4px",
  },
  orgName: {
    margin:        0,
    fontSize:      10.5,
    fontWeight:    700,
    color:         "#111827",
    lineHeight:    1.45,
    letterSpacing: "0.1px",
  },
  orgSub: {
    margin:        "4px 0 0",
    fontSize:      10,
    color:         "#2563EB",
    fontWeight:    600,
    letterSpacing: "0.6px",
    textTransform: "uppercase",
  },

  collapseBtn: {
    background:  "#F1F5F9",
    border:      "none",
    borderRadius: "8px",
    padding:     "6px 10px",
    cursor:      "pointer",
    fontSize:    "11px",
    color:       "#64748B",
    alignSelf:   "flex-end",
  },

  divider: { height: "1px", background: "#F1F5F9", margin: "0 16px 12px" },

  // ── Nav ──
  nav: {
    flex:          1,
    padding:       "0 8px",
    display:       "flex",
    flexDirection: "column",
    gap:           "2px",
  },
  navSectionLabel: {
    fontSize:      "10px",
    fontWeight:    "700",
    color:         "#94A3B8",
    letterSpacing: "1.5px",
    padding:       "0 12px",
    margin:        "0 0 8px",
  },
  navItem: {
    display:       "flex",
    alignItems:    "center",
    gap:           "12px",
    padding:       "11px 20px",
    borderRadius:  "10px",
    border:        "none",
    cursor:        "pointer",
    width:         "100%",
    textAlign:     "left",
    transition:    "all 0.15s ease",
    position:      "relative",
  },
  navIcon:   { flexShrink: 0, lineHeight: 1 },
  navLabel2: { fontSize: "13.5px", flex: 1 },
  activeDot: {
    width:        "6px",
    height:       "6px",
    borderRadius: "50%",
    background:   "#2563EB",
    marginLeft:   "auto",
  },

  // ── Footer ──
  sidebarFooter: {
    padding:    "16px",
    borderTop:  "1px solid #F1F5F9",
  },
  staffBadge: {
    display:      "flex",
    gap:          "10px",
    alignItems:   "center",
    background:   "#F8FAFC",
    borderRadius: "12px",
    padding:      "10px 12px",
  },
  staffAvatar: {
    width:         "34px",
    height:        "34px",
    borderRadius:  "10px",
    background:    "linear-gradient(135deg, #2563EB, #1E3A8A)",
    color:         "#fff",
    fontWeight:    "700",
    fontSize:      "14px",
    display:       "flex",
    alignItems:    "center",
    justifyContent:"center",
    flexShrink:    0,
  },
  staffName: { margin: 0, fontSize: "13px", fontWeight: "600", color: "#111827" },
  staffRole: { margin: "2px 0 0", fontSize: "11px", color: "#64748B" },
};