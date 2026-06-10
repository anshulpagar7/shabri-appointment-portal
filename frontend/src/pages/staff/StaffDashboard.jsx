export default function Dashboard() {
  return (
    <div
      style={{
        padding: "30px",
        color: "white",
        background: "#0F172A",
        minHeight: "100vh"
      }}
    >
      <h1
        style={{
          marginBottom: "8px"
        }}
      >
        Dashboard
      </h1>

      <p
        style={{
          color: "#94A3B8",
          marginBottom: "30px"
        }}
      >
        Smart Appointment Management
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
          color="#3B82F6"
        />

        <StatCard
          title="Waiting"
          value="18"
          color="#F59E0B"
        />

        <StatCard
          title="Completed"
          value="21"
          color="#22C55E"
        />

        <StatCard
          title="No Shows"
          value="3"
          color="#EF4444"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "2fr 1fr",
          gap: "20px",
          marginTop: "25px"
        }}
      >
        <div style={card}>
          <h2>Current Queue</h2>

          <h1
            style={{
              color: "#3B82F6"
            }}
          >
            Token #12
          </h1>

          <p>
            Currently Serving:
            <strong>
              {" "}Rahul Sharma
            </strong>
          </p>

          <p>
            Waiting Visitors:
            <strong>
              {" "}18
            </strong>
          </p>
        </div>

        <div style={card}>
          <h2>Upcoming Events</h2>

          <p>
            Scholarship Camp
          </p>

          <p>
            Tribal Welfare Drive
          </p>

          <p>
            Education Workshop
          </p>
        </div>
      </div>

      <div
        style={{
          ...card,
          marginTop: "25px"
        }}
      >
        <h2>
          Today's Appointments
        </h2>

        <table
          style={{
            width: "100%",
            marginTop: "20px"
          }}
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Rahul Sharma</td>
              <td>09:00 AM</td>
              <td>Approved</td>
            </tr>

            <tr>
              <td>Priya Patil</td>
              <td>09:10 AM</td>
              <td>Waiting</td>
            </tr>

            <tr>
              <td>Amit Kumar</td>
              <td>09:20 AM</td>
              <td>Completed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color
}) {
  return (
    <div
      style={{
        background: "#1E293B",
        padding: "24px",
        borderRadius: "16px",
        borderLeft:
          `5px solid ${color}`
      }}
    >
      <p
        style={{
          color: "#94A3B8"
        }}
      >
        {title}
      </p>

      <h1>{value}</h1>
    </div>
  );
}

const card = {
  background: "#1E293B",
  padding: "24px",
  borderRadius: "16px"
};