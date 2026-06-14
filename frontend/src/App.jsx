import { useState } from "react";

import CitizenBooking from "./pages/CitizenBooking";
import StaffLogin from "./pages/staff/StaffLogin";
import StaffLayout from "./pages/staff/StaffLayout";
import MDLayout from "./pages/md/MDLayout";

export default function App() {
  const [page, setPage] = useState("citizen");

  return (
    <div>
      {/* Top Navigation */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "15px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => setPage("citizen")}
          style={{
            ...navButton,
            background: page === "citizen" ? "#2563EB" : "#F1F5F9",
            color: page === "citizen" ? "white" : "#0F172A",
          }}
        >
          Citizen Portal
        </button>

        <button
          onClick={() => setPage("staffLogin")}
          style={{
            ...navButton,
            background: page === "staffLogin" ? "#2563EB" : "#F1F5F9",
            color: page === "staffLogin" ? "white" : "#0F172A",
          }}
        >
          Staff Login
        </button>

        <button
          onClick={() => setPage("staff")}
          style={{
            ...navButton,
            background: page === "staff" ? "#2563EB" : "#F1F5F9",
            color: page === "staff" ? "white" : "#0F172A",
          }}
        >
          Staff Portal
        </button>

        <button
          onClick={() => setPage("md")}
          style={{
            ...navButton,
            background: page === "md" ? "#10B981" : "#F1F5F9",
            color: page === "md" ? "white" : "#0F172A",
          }}
        >
          MD Portal
        </button>
      </div>

      {/* Pages */}
      {page === "citizen" && <CitizenBooking />}

      {page === "staffLogin" && <StaffLogin />}

      {page === "staff" && <StaffLayout />}

      {page === "md" && <MDLayout />}
    </div>
  );
}

const navButton = {
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  transition: "0.3s",
};