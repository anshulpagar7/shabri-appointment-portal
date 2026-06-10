export default function StaffDashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "30px"
      }}
    >
      <h1>Good Morning 👋</h1>

      <p
        style={{
          color: "#666",
          marginBottom: "30px"
        }}
      >
        Welcome to Shabri Staff Portal
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "20px"
        }}
      >
        <StatCard
          title="Appointments Today"
          value="48"
        />

        <StatCard
          title="Waiting"
          value="18"
        />

        <StatCard
          title="Completed"
          value="21"
        />

        <StatCard
          title="No Shows"
          value="3"
        />
      </div>

      <div
        style={{
          background: "white",
          marginTop: "30px",
          padding: "25px",
          borderRadius: "16px"
        }}
      >
        <h2>Current Queue Status</h2>

        <h1
          style={{
            color: "#2563eb"
          }}
        >
          Token #12
        </h1>

        <p>
          Currently meeting:
          <strong> Rahul Sharma</strong>
        </p>

        <p>
          Estimated waiting visitors:
          <strong> 18</strong>
        </p>
      </div>

      <div
        style={{
          marginTop: "30px"
        }}
      >
        <h2>Quick Actions</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: "20px",
            marginTop: "15px"
          }}
        >
          <ActionCard text="📋 View Appointments" />
          <ActionCard text="➕ Schedule Appointment" />
          <ActionCard text="🏖 Add Holiday" />
          <ActionCard text="📊 Reports" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "16px",
        boxShadow:
          "0 4px 10px rgba(0,0,0,0.08)"
      }}
    >
      <p
        style={{
          color: "#666"
        }}
      >
        {title}
      </p>

      <h1>{value}</h1>
    </div>
  );
}

function ActionCard({ text }) {
  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "16px",
        cursor: "pointer",
        boxShadow:
          "0 4px 10px rgba(0,0,0,0.08)"
      }}
    >
      <h3>{text}</h3>
    </div>
  );
}