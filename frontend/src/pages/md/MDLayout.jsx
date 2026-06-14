import { useState } from "react";

import MDDashboard from "./MDDashboard";
import ScheduleMeeting from "./ScheduleMeeting";

export default function MDLayout() {
  const [active, setActive] = useState("Dashboard");

  const renderPage = () => {
    switch (active) {
      case "Dashboard":
        return (
          <MDDashboard setActive={setActive} />
        );

      case "Schedule Meeting":
        return (
          <ScheduleMeeting setActive={setActive} />
        );

      default:
        return (
          <MDDashboard setActive={setActive} />
        );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F8FAFC",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "280px",
          background:
            "linear-gradient(180deg,#064E3B,#022C22)",
          color: "white",
          padding: "30px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "36px",
              marginBottom: "6px",
              color: "#6EE7B7",
            }}
          >
            MD Portal
          </h1>

          <p
            style={{
              color: "#D1FAE5",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            Managing Director
            <br />
            Dashboard
          </p>
        </div>

        {/* Menu */}
        <div
          style={{
            marginTop: "50px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <button
            onClick={() => setActive("Dashboard")}
            style={{
              ...menuButton,
              background:
                active === "Dashboard"
                  ? "#10B981"
                  : "transparent",
            }}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() =>
              setActive("Schedule Meeting")
            }
            style={{
              ...menuButton,
              background:
                active === "Schedule Meeting"
                  ? "#10B981"
                  : "transparent",
            }}
          >
            📅 Schedule Meeting
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            color: "#A7F3D0",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          Maharashtra State
          <br />
          Cooperative Tribal
          <br />
          Development Corporation Ltd.
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {renderPage()}
      </div>
    </div>
  );
}

const menuButton = {
  color: "white",
  border: "none",
  padding: "14px 18px",
  borderRadius: "14px",
  cursor: "pointer",
  textAlign: "left",
  fontSize: "15px",
  fontWeight: "600",
  transition: "0.3s",
};