import { useState } from "react";

export default function Events() {
  const [event, setEvent] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
  });

  const [created, setCreated] = useState(false);

  const handleChange = (e) => {
    setEvent({
      ...event,
      [e.target.name]: e.target.value,
    });
  };

  const createEvent = () => {
    if (
      !event.title ||
      !event.date ||
      !event.description
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
          maxWidth: "1200px",
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
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Events & Announcements
          </h1>

          <p
            style={{
              color: "#64748B",
            }}
          >
            Create events, camps and public announcements.
          </p>
        </div>

        {/* Create Event Card */}

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "30px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2>Create Event</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(280px,1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div>
              <label>
                Event Name
              </label>

              <input
                name="title"
                value={event.title}
                onChange={handleChange}
                placeholder="Scholarship Camp"
                style={inputStyle}
              />
            </div>

            <div>
              <label>Date</label>

              <input
                type="date"
                name="date"
                value={event.date}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Time</label>

              <input
                type="time"
                name="time"
                value={event.time}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <label>
              Description
            </label>

            <textarea
              name="description"
              value={event.description}
              onChange={handleChange}
              placeholder="Enter event details..."
              rows="5"
              style={inputStyle}
            />
          </div>

          <button
            onClick={createEvent}
            style={{
              marginTop: "25px",
              background: "#2563EB",
              color: "white",
              border: "none",
              padding: "15px 25px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Create Event
          </button>
        </div>

        {/* Success Card */}

        {created && (
          <div
            style={{
              marginTop: "25px",
              background: "#DCFCE7",
              borderRadius: "20px",
              padding: "25px",
              border:
                "1px solid #22C55E",
            }}
          >
            <h2>
              ✅ Event Created
            </h2>

            <p>
              <strong>Name:</strong>{" "}
              {event.title}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {event.date}
            </p>

            <p>
              <strong>Time:</strong>{" "}
              {event.time}
            </p>
          </div>
        )}

        {/* Upcoming Events */}

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "30px",
            marginTop: "30px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            Upcoming Events
          </h2>

          <div
            style={{
              display: "grid",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <EventCard
              title="Scholarship Camp"
              date="12 June 2026"
              description="Guidance and application support for students."
            />

            <EventCard
              title="Tribal Welfare Drive"
              date="18 June 2026"
              description="Awareness program for welfare schemes."
            />

            <EventCard
              title="Education Workshop"
              date="22 June 2026"
              description="Career and education counselling session."
            />
          </div>
        </div>

        {/* Announcement Section */}

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "30px",
            marginTop: "30px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            Latest Announcement
          </h2>

          <div
            style={{
              marginTop: "20px",
              background: "#EFF6FF",
              padding: "20px",
              borderRadius: "12px",
              border:
                "1px solid #BFDBFE",
            }}
          >
            <h3>
              Scholarship Applications Open
            </h3>

            <p>
              Citizens can now apply
              for the 2026 Tribal
              Scholarship Program.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({
  title,
  date,
  description,
}) {
  return (
    <div
      style={{
        background: "#F8FAFC",
        padding: "18px",
        borderRadius: "14px",
        border:
          "1px solid #E2E8F0",
      }}
    >
      <h3
        style={{
          marginBottom: "8px",
        }}
      >
        📅 {title}
      </h3>

      <p
        style={{
          color: "#2563EB",
          fontWeight: "600",
        }}
      >
        {date}
      </p>

      <p
        style={{
          color: "#64748B",
        }}
      >
        {description}
      </p>
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