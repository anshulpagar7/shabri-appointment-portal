import { useState } from "react";

import CitizenBooking from "./pages/CitizenBooking";

import StaffLogin from "./pages/staff/StaffLogin";
import StaffLayout from "./pages/staff/StaffLayout";

function App() {
  const [page, setPage] = useState("citizen");

  return (
    <div>
      <div
        style={{
          padding: "10px",
          display: "flex",
          gap: "10px",
          background: "#e5e7eb"
        }}
      >
        <button
          onClick={() => setPage("citizen")}
        >
          Citizen Portal
        </button>

        <button
          onClick={() => setPage("staff-login")}
        >
          Staff Login
        </button>

        <button
          onClick={() =>
            setPage("staff-dashboard")
          }
        >
          Staff Portal
        </button>
      </div>

      {page === "citizen" && (
        <CitizenBooking />
      )}

      {page === "staff-login" && (
        <StaffLogin />
      )}

      {page === "staff-dashboard" && (
        <StaffLayout />
      )}
    </div>
  );
}

export default App;