import { useState } from "react";
import { useNavigate } from "react-router-dom";
import tdcLogo    from "../assets/tdc-logo.jpeg";
import tribalLogo from "../assets/tribal-logo.jpg";

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
  const [collapsed, setCollapsed]       = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();

  function handleLogoutConfirm() {
    sessionStorage.removeItem("staffLoggedIn");
    setShowLogoutDialog(false);
    navigate("/staff/login");
  }

  return (
    <>
      {/* ── Logout Confirmation Dialog ── */}
      {showLogoutDialog && (
        <div style={dialogStyles.overlay}>
          <div style={dialogStyles.box}>
            <div style={dialogStyles.iconWrap}>🚪</div>
            <h3 style={dialogStyles.title}>Logout</h3>
            <p style={dialogStyles.message}>Are you sure you want to logout?</p>
            <div style={dialogStyles.btnRow}>
              <button
                onClick={() => setShowLogoutDialog(false)}
                style={dialogStyles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                style={dialogStyles.logoutBtn}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ ...styles.sidebar, width: collapsed ? "72px" : "270px" }}>

        {/* ── Header: Logos + Org name ── */}
        <div style={styles.header}>
          {!collapsed ? (
            <>
              {/* Dual logo row */}
              <div style={styles.logoRow}>
                <img src={tribalLogo} alt="Tribal Logo" style={styles.logoImg} />
                <div style={styles.logoDivider} />
                <img src={tdcLogo} alt="TDC Logo" style={styles.logoImg} />
              </div>

              {/* Org name */}
              <div style={styles.orgBlock}>
                <p style={styles.orgName}>
                  Maharashtra State Cooperative Tribal Development Corporation Ltd.
                </p>
                <p style={styles.orgSub}>ADI SAMPARK — Smart Appointment Portal</p>
              </div>
            </>
          ) : (
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
                  background:     isActive ? "linear-gradient(90deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))" : "transparent",
                  borderLeft:     isActive ? "3px solid #2563EB" : "3px solid transparent",
                  color:          isActive ? "#2563EB" : "#64748B",
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

        {/* ── Logout ── */}
        <div style={{ padding: collapsed ? "12px 8px" : "0 16px 20px", marginTop: collapsed ? 8 : 0 }}>
          {!collapsed && <div style={styles.logoutDivider} />}
          <LogoutButton
            collapsed={collapsed}
            onClick={() => setShowLogoutDialog(true)}
          />
        </div>

      </div>
    </>
  );
}

// Separate component so hover state is isolated
function LogoutButton({ collapsed, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? "Logout" : ""}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            "12px",
        width:          "100%",
        padding:        collapsed ? "11px 0" : "11px 20px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius:   "10px",
        border:         "none",
        cursor:         "pointer",
        background:     hovered ? "rgba(220,38,38,0.08)" : "transparent",
        borderLeft:     hovered ? "3px solid #DC2626" : "3px solid transparent",
        color:          hovered ? "#DC2626" : "#94A3B8",
        transition:     "all 0.15s ease",
      }}
    >
      <span style={{ fontSize: collapsed ? "20px" : "18px", flexShrink: 0, lineHeight: 1 }}>🚪</span>
      {!collapsed && (
        <span style={{ fontSize: "13.5px", fontWeight: hovered ? "600" : "500" }}>
          Logout
        </span>
      )}
    </button>
  );
}

// ── Dialog styles ─────────────────────────────────────────────────────────────
const dialogStyles = {
  overlay: {
    position:       "fixed",
    inset:          0,
    zIndex:         9999,
    background:     "rgba(0,0,0,0.35)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    padding:        20,
  },
  box: {
    background:   "#fff",
    borderRadius: 20,
    padding:      "36px 32px 28px",
    width:        "100%",
    maxWidth:     380,
    boxShadow:    "0 24px 64px rgba(0,0,0,0.18)",
    textAlign:    "center",
  },
  iconWrap: {
    fontSize:     40,
    marginBottom: 12,
    lineHeight:   1,
  },
  title: {
    margin:     "0 0 8px",
    fontSize:   20,
    fontWeight: 800,
    color:      "#111827",
  },
  message: {
    margin:     "0 0 28px",
    fontSize:   14,
    color:      "#6B7280",
    lineHeight: 1.6,
  },
  btnRow: {
    display: "flex",
    gap:     12,
  },
  cancelBtn: {
    flex:         1,
    padding:      "12px 0",
    borderRadius: 12,
    border:       "1.5px solid #E5E7EB",
    background:   "#fff",
    color:        "#374151",
    fontSize:     14,
    fontWeight:   600,
    cursor:       "pointer",
  },
  logoutBtn: {
    flex:         1,
    padding:      "12px 0",
    borderRadius: 12,
    border:       "none",
    background:   "linear-gradient(135deg,#DC2626,#B91C1C)",
    color:        "#fff",
    fontSize:     14,
    fontWeight:   700,
    cursor:       "pointer",
    boxShadow:    "0 4px 12px rgba(220,38,38,0.3)",
  },
};

// ── Sidebar styles (unchanged) ────────────────────────────────────────────────
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
  header: {
    padding:       "16px 14px 12px",
    display:       "flex",
    flexDirection: "column",
    gap:           "10px",
  },
  logoRow: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            12,
  },
  logoImg: {
    width:        42,
    height:       42,
    objectFit:    "contain",
    borderRadius: 8,
    background:   "#F8FAFC",
    border:       "1px solid #E2E8F0",
    flexShrink:   0,
  },
  logoDivider: {
    width:      1,
    height:     32,
    background: "#E2E8F0",
    flexShrink: 0,
  },
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
    background:   "#F1F5F9",
    border:       "none",
    borderRadius: "8px",
    padding:      "6px 10px",
    cursor:       "pointer",
    fontSize:     "11px",
    color:        "#64748B",
    alignSelf:    "flex-end",
  },
  divider:         { height: "1px", background: "#F1F5F9", margin: "0 16px 12px" },
  logoutDivider:   { height: "1px", background: "#F1F5F9", margin: "0 0 14px" },
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
    display:      "flex",
    alignItems:   "center",
    gap:          "12px",
    padding:      "11px 20px",
    borderRadius: "10px",
    border:       "none",
    cursor:       "pointer",
    width:        "100%",
    textAlign:    "left",
    transition:   "all 0.15s ease",
    position:     "relative",
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
  sidebarFooter: {
    padding:   "16px",
    borderTop: "1px solid #F1F5F9",
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
    width:          "34px",
    height:         "34px",
    borderRadius:   "10px",
    background:     "linear-gradient(135deg, #2563EB, #1E3A8A)",
    color:          "#fff",
    fontWeight:     "700",
    fontSize:       "14px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  staffName: { margin: 0, fontSize: "13px", fontWeight: "600", color: "#111827" },
  staffRole: { margin: "2px 0 0", fontSize: "11px", color: "#64748B" },
};