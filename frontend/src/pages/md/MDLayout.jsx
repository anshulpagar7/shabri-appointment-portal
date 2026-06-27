import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MDDashboard from "./MDDashboard";

export default function MDLayout() {
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  function handleLogoutConfirm() {
    localStorage.removeItem("mdLoggedIn");
    setShowDialog(false);
    navigate("/md/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>

      {/* ── Logout Confirmation Dialog ── */}
      {showDialog && (
        <div style={dialogStyles.overlay}>
          <div style={dialogStyles.box}>
            <div style={{ fontSize: 40, marginBottom: 12, lineHeight: 1 }}>🚪</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#111827" }}>
              Logout
            </h3>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
              Are you sure you want to logout?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowDialog(false)} style={dialogStyles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleLogoutConfirm} style={dialogStyles.logoutBtn}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pass onLogout into MDDashboard so the button renders inside the header */}
      <MDDashboard onLogout={() => setShowDialog(true)} />
    </div>
  );
}

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