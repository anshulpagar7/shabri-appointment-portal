import React from "react";

// FIXED: Moved styles to the top to prevent "Cannot access before initialization" runtime error
const card = {
  background: "white",
  borderRadius: "24px",
  padding: "25px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const th = {
  textAlign: "left",
  paddingBottom: "15px",
  color: "#475569",
};

const td = {
  padding: "14px 0",
  borderBottom: "1px solid #E2E8F0",
};

const greenBtn = {
  background: "#10B981",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  cursor: "pointer",
};

const blueBtn = {
  background: "#2563EB",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  cursor: "pointer",
};

export default function MDDashboard({ setActive }) {
  const upcomingCitizens = [
    {
      token: "SHA-1002",
      name: "Priya Patil",
      purpose: "Education Support",
      time: "11:10 AM",
    },
    {
      token: "SHA-1003",
      name: "Amit Kumar",
      purpose: "Certificate Verification",
      time: "11:20 AM",
    },
    {
      token: "SHA-1004",
      name: "Sneha More",
      purpose: "Scholarship Query",
      time: "11:30 AM",
    },
  ];

  const meetings = [
    {
      title: "Head Office Review",
      time: "2:00 PM",
      mode: "Google Meet",
    },
    {
      title: "Regional Officer Discussion",
      time: "4:00 PM",
      mode: "Google Meet",
    },
  ];

  return (
    <div
      style={{
        background: "#F8FAFC",
        minHeight: "100vh",
        padding: "35px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "42px",
            color: "#0F172A",
            marginBottom: "8px",
          }}
        >
          Good Morning, Madam 🌿
        </h1>
        <p style={{ color: "#64748B", fontSize: "18px" }}>
          Managing Director Dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <StatCard
          title="Today's Citizens"
          value="18"
          gradient="linear-gradient(135deg,#3B82F6,#2563EB)"
        />
        <StatCard
          title="Waiting"
          value="4"
          gradient="linear-gradient(135deg,#F59E0B,#D97706)"
        />
        <StatCard
          title="Meetings"
          value="3"
          gradient="linear-gradient(135deg,#10B981,#059669)"
        />
        <StatCard
          title="Completed"
          value="12"
          gradient="linear-gradient(135deg,#8B5CF6,#7C3AED)"
        />
      </div>

      {/* Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "25px",
          marginBottom: "25px",
        }}
      >
        {/* Current Citizen */}
        <div style={card}>
          <div
            style={{
              color: "#2563EB",
              fontWeight: "700",
              marginBottom: "15px",
            }}
          >
            CURRENT CITIZEN
          </div>
          <h2 style={{ fontSize: "32px", marginBottom: "10px" }}>
            Rahul Sharma
          </h2>
          <div
            style={{
              fontSize: "54px",
              fontWeight: "700",
              color: "#2563EB",
            }}
          >
            #1001
          </div>
          <p>
            <strong>Purpose:</strong> Scholarship Query
          </p>
          <p>
            <strong>Time:</strong> 11:00 AM
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button style={greenBtn}>Start Meeting</button>
            <button style={blueBtn}>Complete</button>
          </div>
        </div>

        {/* Meetings */}
        <div style={card}>
          <h2 style={{ marginBottom: "20px" }}>Today's Meetings</h2>
          {meetings.map((meeting, index) => (
            <div
              key={index}
              style={{
                background: "#F1F5F9",
                padding: "16px",
                borderRadius: "14px",
                marginBottom: "15px",
              }}
            >
              <h3>{meeting.title}</h3>
              <p>{meeting.time}</p>
              <p>{meeting.mode}</p>
              <button
                style={{
                  marginTop: "10px",
                  background: "#10B981",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                Join Meeting
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Citizens */}
      <div style={card}>
        <h2 style={{ marginBottom: "20px" }}>Upcoming Citizens</h2>
        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Token</th>
              <th style={th}>Citizen</th>
              <th style={th}>Purpose</th>
              <th style={th}>Time</th>
            </tr>
          </thead>
          <tbody>
            {upcomingCitizens.map((citizen, index) => (
              <tr key={index}>
                <td style={td}>{citizen.token}</td>
                <td style={td}>{citizen.name}</td>
                <td style={td}>{citizen.purpose}</td>
                <td style={td}>{citizen.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setActive("Schedule Meeting")}
        style={{
          position: "fixed",
          right: "35px",
          bottom: "35px",
          background: "linear-gradient(135deg,#10B981,#059669)",
          color: "white",
          border: "none",
          padding: "18px 28px",
          borderRadius: "999px",
          fontWeight: "600",
          fontSize: "16px",
          cursor: "pointer",
          boxShadow: "0 12px 25px rgba(16,185,129,0.35)",
        }}
      >
        + Schedule Meeting
      </button>
    </div>
  );
}

function StatCard({ title, value, gradient }) {
  return (
    <div
      style={{
        background: gradient,
        color: "white",
        padding: "25px",
        borderRadius: "22px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      }}
    >
      {title}
      <h1 style={{ fontSize: "42px", marginTop: "10px" }}>{value}</h1>
    </div>
  );
}