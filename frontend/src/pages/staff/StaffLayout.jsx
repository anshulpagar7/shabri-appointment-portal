import { useState } from "react";

import Sidebar from "../../components/Sidebar";

import StaffDashboard from "./StaffDashboard";
import Appointments from "./Appointments";
import QueueManagement from "./QueueManagement";
import ScheduleAppointment from "./ScheduleAppointment";
import HolidayManagement from "./HolidayManagement";
import Events from "./Events";
import Reports from "./Reports";
import Notifications from "./Notifications";
import ExecutiveMeetings from "./ExecutiveMeetings";

export default function StaffLayout() {
  const [active, setActive] = useState("Dashboard");

  const renderPage = () => {
    switch (active) {
      case "Dashboard":
        return <StaffDashboard />;

      case "Appointments":
        return <Appointments />;

      case "Queue":
        return <QueueManagement />;

      case "Schedule":
        return <ScheduleAppointment />;

      case "Holidays":
        return <HolidayManagement />;

      case "Events":
        return <Events />;

      case "Executive Meetings":
        return <ExecutiveMeetings />;

      case "Reports":
        return <Reports />;

      case "Notifications":
        return <Notifications />;

      case "Settings":
        return (
          <div style={{ padding: "40px" }}>
            <h1>Settings</h1>

            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "30px",
                marginTop: "20px",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.08)",
              }}
            >
              <h2>Office Timings</h2>

              <p>Morning Session: 11:00 AM - 1:30 PM</p>

              <p>Lunch Break: 1:30 PM - 2:30 PM</p>

              <p>Evening Session: 2:30 PM - 5:00 PM</p>

              <hr style={{ margin: "20px 0" }} />

              <h2>Notification Settings</h2>

              <p>WhatsApp Notifications: Enabled</p>

              <p>SMS Notifications: Enabled</p>

              <button
                style={{
                  background: "#2563EB",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  marginTop: "15px",
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        );

      default:
        return <StaffDashboard />;
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
      <Sidebar
        active={active}
        setActive={setActive}
      />

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