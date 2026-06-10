import { useState } from "react";

export default function ScheduleAppointment() {
  const [appointment, setAppointment] = useState({
    name: "",
    mobile: "",
    purpose: "",
    officer: "",
    date: "",
    slot: "",
  });

  const [created, setCreated] = useState(false);

  const slots = [
    "09:00 AM",
    "09:10 AM",
    "09:20 AM",
    "09:30 AM",
    "09:40 AM",
    "09:50 AM",
    "10:00 AM",
    "10:10 AM",
    "10:20 AM",
    "10:30 AM",
    "10:40 AM",
    "10:50 AM",
    "11:00 AM",
    "11:10 AM",
    "11:20 AM",
    "11:30 AM",
  ];

  const handleChange = (e) => {
    setAppointment({
      ...appointment,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = () => {
    if (
      !appointment.name ||
      !appointment.mobile ||
      !appointment.officer ||
      !appointment.date ||
      !appointment.slot
    ) {
      alert("Please fill all required fields");
      return;
    }

    setCreated(true);
  };

  return (
    <div
      style={{
        background: "#F8FAFC",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1300px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              fontSize: "40px",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Schedule Appointment
          </h1>

          <p
            style={{
              color: "#64748B",
              fontSize: "16px",
            }}
          >
            Create appointments manually for walk-in visitors.
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "30px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              marginBottom: "25px",
            }}
          >
            Citizen Details
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(280px,1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label>Name</label>

              <input
                name="name"
                value={appointment.name}
                onChange={handleChange}
                placeholder="Enter citizen name"
                style={inputStyle}
              />
            </div>

            <div>
              <label>Mobile Number</label>

              <input
                name="mobile"
                value={appointment.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
                style={inputStyle}
              />
            </div>

            <div>
              <label>Purpose</label>

              <select
                name="purpose"
                value={appointment.purpose}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">
                  Select Purpose
                </option>

                <option>
                  Scholarship
                </option>

                <option>
                  Education
                </option>

                <option>
                  Employment
                </option>

                <option>
                  Certificate
                </option>

                <option>
                  Complaint
                </option>

                <option>
                  Other
                </option>
              </select>
            </div>

            <div>
              <label>Officer</label>

              <select
                name="officer"
                value={appointment.officer}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">
                  Select Officer
                </option>

                <option>
                  Leena Bansod Madam
                </option>

                <option>
                  Anshul Pagar
                </option>
              </select>
            </div>

            <div>
              <label>Date</label>

              <input
                type="date"
                name="date"
                value={appointment.date}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <h2
            style={{
              marginTop: "40px",
              marginBottom: "20px",
            }}
          >
            Select Time Slot
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(140px,1fr))",
              gap: "12px",
            }}
          >
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() =>
                  setAppointment({
                    ...appointment,
                    slot,
                  })
                }
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border:
                    appointment.slot === slot
                      ? "2px solid #2563EB"
                      : "1px solid #CBD5E1",

                  background:
                    appointment.slot === slot
                      ? "#DBEAFE"
                      : "white",

                  color:
                    appointment.slot === slot
                      ? "#2563EB"
                      : "#111827",

                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {slot}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreate}
            style={{
              marginTop: "35px",
              background: "#2563EB",
              color: "white",
              border: "none",
              padding: "15px 25px",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Create Appointment
          </button>
        </div>

        {created && (
          <div
            style={{
              marginTop: "25px",
              background: "#DCFCE7",
              borderRadius: "20px",
              padding: "25px",
              border: "1px solid #22C55E",
            }}
          >
            <h2
              style={{
                color: "#166534",
              }}
            >
              ✅ Appointment Created Successfully
            </h2>

            <p>
              Token Number:
              <strong> #25</strong>
            </p>

            <p>
              Citizen Notification Sent
            </p>

            <p>
              Appointment Added To Queue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "8px",
  borderRadius: "12px",
  border: "1px solid #CBD5E1",
  boxSizing: "border-box",
};