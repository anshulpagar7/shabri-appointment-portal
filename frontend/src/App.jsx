import { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import CitizenBooking from "./pages/CitizenBooking";

import StaffLogin from "./pages/staff/StaffLogin";
import StaffLayout from "./pages/staff/StaffLayout";

import MDLogin from "./pages/md/MDLogin";
import MDLayout from "./pages/md/MDLayout";

// ─── Protected Route Wrappers ─────────────────────────────────────────────────

function ProtectedStaff({ isLoggedIn, children }) {
  return isLoggedIn ? children : <Navigate to="/staff/login" replace />;
}

function ProtectedMD({ isLoggedIn, children }) {
  return isLoggedIn ? children : <Navigate to="/md/login" replace />;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [isMDLoggedIn, setIsMDLoggedIn]       = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Derive active page from current path for nav button highlighting
  const path = location.pathname;

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
        {/* Citizen */}
        <button
          onClick={() => navigate("/")}
          style={{
            ...navButton,
            background: path === "/" ? "#2563EB" : "#F1F5F9",
            color:      path === "/" ? "white"    : "#0F172A",
          }}
        >
          Citizen Portal
        </button>

        {/* Staff Login */}
        <button
          onClick={() => navigate("/staff/login")}
          style={{
            ...navButton,
            background: path.startsWith("/staff") ? "#2563EB" : "#F1F5F9",
            color:      path.startsWith("/staff") ? "white"    : "#0F172A",
          }}
        >
          Staff Login
        </button>

        {/* MD Login */}
        <button
          onClick={() => navigate("/md/login")}
          style={{
            ...navButton,
            background: path.startsWith("/md") ? "#10B981" : "#F1F5F9",
            color:      path.startsWith("/md") ? "white"    : "#0F172A",
          }}
        >
          MD Login
        </button>
      </div>

      {/* Routes */}
      <Routes>
        {/* Citizen Portal */}
        <Route path="/" element={<CitizenBooking />} />

        {/* Staff Login */}
        <Route
          path="/staff/login"
          element={
            <StaffLogin
              onLogin={() => {
                setIsStaffLoggedIn(true);
                navigate("/staff");
              }}
            />
          }
        />

        {/* Staff Portal — protected */}
        <Route
          path="/staff"
          element={
            <ProtectedStaff isLoggedIn={isStaffLoggedIn}>
              <StaffLayout />
            </ProtectedStaff>
          }
        />

        {/* MD Login */}
        <Route
          path="/md/login"
          element={
            <MDLogin
              onLogin={() => {
                setIsMDLoggedIn(true);
                navigate("/md");
              }}
            />
          }
        />

        {/* MD Dashboard — protected */}
        <Route
          path="/md"
          element={
            <ProtectedMD isLoggedIn={isMDLoggedIn}>
              <MDLayout />
            </ProtectedMD>
          }
        />

        {/* Catch-all — redirect unknown routes to citizen portal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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