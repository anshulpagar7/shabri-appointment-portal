import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import StaffDashboard from "./StaffDashboard";
import Appointments from "./Appointments";
import QueueManagement from "./QueueManagement";
import ScheduleAppointment from "./ScheduleAppointment";
import ExecutiveMeetings from "./ExecutiveMeetings";
import TourDiary from "./TourDiary";
import HolidayManagement from "./HolidayManagement";
import Events from "./Events";
import Reports from "./Reports";
import Notifications from "./Notifications";
import Settings from "./Settings";

export default function StaffLayout() {
  const [active, setActive] = useState("Dashboard");

  const renderPage = () => {
    switch (active) {
      case "Dashboard":          return <StaffDashboard />;
      case "Appointments":       return <Appointments />;
      case "Queue":              return <QueueManagement />;
      case "Schedule":           return <ScheduleAppointment />;
      case "Executive Meetings": return <ExecutiveMeetings />;
      case "TourDiary":          return <TourDiary />;
      case "Holidays":           return <HolidayManagement />;
      case "Events":             return <Events />;
      case "Reports":            return <Reports />;
      case "Notifications":      return <Notifications />;
      case "Settings":           return <Settings />;
      default:                   return <StaffDashboard />;
    }
  };

  return (
    <div style={styles.layout}>
      <Sidebar active={active} setActive={setActive} />
      <div style={styles.content}>
        {renderPage()}
      </div>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#F8FAFC",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    maxHeight: "100vh",
  },
};