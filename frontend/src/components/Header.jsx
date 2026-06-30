import tribalLogo from "../assets/tribal-logo.jpg";
import tdcLogo from "../assets/tdc-logo.jpeg";
import commissionerLogo from "../assets/Commissioner.jpeg";

export default function Header({ language, setLanguage }) {
  const getButtonStyle = (lang) => ({
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "0.2s",
    background: language === lang ? "#2563eb" : "#ffffff",
    color: language === lang ? "#ffffff" : "#111827",
  });

  return (
    <header
      style={{
        background: "#1e3a8a",
        color: "white",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
      }}
    >
      {/* Left Section */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

        {/* Tribal Logo */}
        <img
          src={tribalLogo}
          alt="Tribal Logo"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "white",
            padding: "4px",
            objectFit: "cover",
          }}
        />

        {/* TDC Logo */}
        <img
          src={tdcLogo}
          alt="TDC Logo"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "white",
            padding: "4px",
            objectFit: "cover",
          }}
        />

        {/* Commissioner / MD Logo */}
        <img
          src={commissionerLogo}
          alt="Commissioner Logo"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "white",
            padding: "4px",
            objectFit: "cover",
          }}
        />

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "40px",
            background: "rgba(255,255,255,0.3)",
            flexShrink: 0,
          }}
        />

        {/* Title */}
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700" }}>
            ADI SAMPARK
          </h2>
          <div style={{ fontSize: "13px", opacity: 0.9 }}>
            Smart Appointment Portal
          </div>
          <div style={{ fontSize: "11px", opacity: 0.8 }}>
            Adivasi Vikas Bhavan
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button style={getButtonStyle("en")} onClick={() => setLanguage("en")}>
          EN
        </button>
        <button style={getButtonStyle("mr")} onClick={() => setLanguage("mr")}>
          मराठी
        </button>
        <button style={getButtonStyle("hi")} onClick={() => setLanguage("hi")}>
          हिंदी
        </button>
      </div>
    </header>
  );
}