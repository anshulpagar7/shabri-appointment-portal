import { useState } from "react";

import Sidebar from "../../components/Sidebar";
import Dashboard from "./StaffDashboard";
import Appointments from "./Appointments";

export default function StaffLayout() {
  const [active, setActive] = useState("Dashboard");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0F172A"
      }}
    >
      <Sidebar
        active={active}
        setActive={setActive}
      />

      <div
        style={{
          flex: 1
        }}
      >
        {active === "Dashboard" && <Dashboard />}

        {active === "Appointments" && (
          <Appointments />
        )}

        {active === "Schedule" && (
          <Placeholder
            title="Schedule Appointment"
          />
        )}

        {active === "Holidays" && (
          <Placeholder
            title="Holiday Management"
          />
        )}

        {active === "Events" && (
          <Placeholder
            title="Events Management"
          />
        )}

        {active === "Reports" && (
          <Placeholder title="Reports" />
        )}

        {active === "Settings" && (
          <Placeholder title="Settings" />
        )}
      </div>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div
      style={{
        color: "white",
        padding: "40px"
      }}
    >
      <h1>{title}</h1>
      <p>Coming Soon...</p>
    </div>
  );
}