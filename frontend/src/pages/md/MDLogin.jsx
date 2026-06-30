import { useState } from "react";
import { supabase } from "../../lib/supabase";
import tribalLogo from "../../assets/tribal-logo.jpg";

export default function MDLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Please enter your credentials.");
      return;
    }
    setLoading(true);

    const { data, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username.trim())
      .eq("password", password.trim())
      .single();

    setLoading(false);

    if (dbError || !data) {
      setError("Invalid username or password. Please try again.");
      return;
    }

    if (data.role !== "md") {
      setError("Unauthorized access.");
      return;
    }

    if (onLogin) onLogin();
  };

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoBlock}>
            <div style={styles.logoCircle}>
              <img src={tribalLogo} alt="ADI SAMPARK Logo" style={styles.logoImg} />
            </div>
          </div>
          <h1 style={styles.brandName}>ADI SAMPARK</h1>
          <p style={styles.brandTagline}>Smart Appointment Portal</p>
          <h2 style={styles.orgName}>
            Maharashtra State Cooperative<br />
            Tribal Development Corporation Ltd.
          </h2>
          <p style={styles.orgSub}>Appointment Management System</p>
          <div style={styles.divider} />
          <div style={styles.infoList}>
            <InfoRow icon="🏢" label="Managing Director Portal" desc="Monitor appointments, executive meetings and office activity" />
            <InfoRow icon="🕐" label="Office Hours" desc="11:00 AM – 1:30 PM  &  2:30 PM – 5:00 PM" />
            <InfoRow icon="🔒" label="Secure Access" desc="Authorized personnel only" />
          </div>
        </div>
        <div style={styles.leftFooter}>
          Government of Maharashtra &nbsp;•&nbsp; Official System
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.rightPanel}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <div style={styles.loginBadge}>MD LOGIN</div>
            <h2 style={styles.loginTitle}>Welcome Madam</h2>
            <p style={styles.loginSub}>Sign in to access the Managing Director dashboard</p>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>👤</span>
              <input
                value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                placeholder="Enter your username"
                style={styles.input}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          <div style={{ ...styles.fieldGroup, marginTop: "20px" }}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>🔑</span>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                style={styles.input}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ ...styles.loginBtn, opacity: loading ? 0.8 : 1 }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </div>

        <p style={styles.rightFooter}>
          © 2026 Maharashtra State Cooperative Tribal Development Corporation Limited
        </p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, desc }) {
  return (
    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "20px" }}>
      <span style={{ fontSize: "22px", marginTop: "2px" }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontWeight: "700", color: "#fff", fontSize: "14px" }}>{label}</p>
        <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>{desc}</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  leftPanel: {
    width: "420px",
    background: "linear-gradient(160deg, #1E3A8A 0%, #2563EB 60%, #1d4ed8 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "50px 40px 30px",
    flexShrink: 0,
  },
  leftContent: {},
  logoBlock: { marginBottom: "30px" },
  logoCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  brandName: {
    color: "#fff",
    fontSize: "32px",
    fontWeight: "900",
    lineHeight: "1.1",
    margin: "0 0 6px",
    letterSpacing: "0.5px",
  },
  brandTagline: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "13px",
    fontWeight: "600",
    margin: "0 0 22px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  orgName: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    lineHeight: "1.4",
    margin: "0 0 8px",
  },
  orgSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "13px",
    margin: "0 0 30px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },
  divider: { height: "1px", background: "rgba(255,255,255,0.2)", margin: "0 0 28px" },
  infoList: {},
  leftFooter: {
    color: "rgba(255,255,255,0.45)",
    fontSize: "12px",
    letterSpacing: "0.5px",
  },
  rightPanel: {
    flex: 1,
    background: "#F8FAFC",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  loginCard: {
    background: "#fff",
    borderRadius: "24px",
    padding: "44px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  },
  loginHeader: { marginBottom: "32px" },
  loginBadge: {
    display: "inline-block",
    background: "#EFF6FF",
    color: "#2563EB",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "2px",
    padding: "5px 12px",
    borderRadius: "20px",
    marginBottom: "14px",
  },
  loginTitle: { margin: "0 0 6px", fontSize: "26px", color: "#111827", fontWeight: "700" },
  loginSub: { margin: 0, color: "#64748B", fontSize: "14px" },
  fieldGroup: {},
  label: { display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#374151" },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    border: "1.5px solid #E2E8F0",
    borderRadius: "12px",
    background: "#F8FAFC",
    overflow: "hidden",
    transition: "border-color 0.2s",
  },
  inputIcon: { padding: "0 14px", fontSize: "16px" },
  input: {
    flex: 1,
    padding: "13px 14px 13px 0",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
  },
  errorBox: {
    marginTop: "16px",
    background: "#FEF2F2",
    color: "#DC2626",
    border: "1px solid #FECACA",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "13px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  loginBtn: {
    marginTop: "24px",
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    letterSpacing: "0.5px",
  },
  rightFooter: { marginTop: "32px", fontSize: "12px", color: "#CBD5E1", textAlign: "center" },
};