export default function Sidebar({
  active,
  setActive
}) {
  const menuItems = [
    "Dashboard",
    "Appointments",
    "Schedule",
    "Holidays",
    "Events",
    "Reports",
    "Settings"
  ];

  return (
    <div
      style={{
        width: "260px",
        background: "#111827",
        color: "white",
        minHeight: "100vh",
        padding: "24px"
      }}
    >
      <h1
        style={{
          color: "#3B82F6"
        }}
      >
        SHABRI
      </h1>

      <p
        style={{
          color: "#94A3B8"
        }}
      >
        Smart Appointment Portal
      </p>

      <div
        style={{
          marginTop: "40px"
        }}
      >
        {menuItems.map((item) => (
          <div
            key={item}
            onClick={() =>
              setActive(item)
            }
            style={{
              padding: "14px",
              marginBottom: "10px",
              borderRadius: "10px",
              cursor: "pointer",
              background:
                active === item
                  ? "#3B82F6"
                  : "transparent"
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}