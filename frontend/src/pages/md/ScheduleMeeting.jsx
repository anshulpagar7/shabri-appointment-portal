import { useState } from "react";

export default function ScheduleMeeting() {
  const [title, setTitle] = useState("");
  const [meetingWith, setMeetingWith] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState("Google Meet");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [created, setCreated] = useState(false);

  const handleSubmit = () => {
    setCreated(true);
  };

  return (
    <div
      style={{
        background: "#F8FAFC",
        minHeight: "100vh",
        padding: "35px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            color: "#0F172A",
            marginBottom: "10px",
          }}
        >
          Schedule New Meeting 📅
        </h1>

        <p
          style={{
            color: "#64748B",
            marginBottom: "30px",
          }}
        >
          Create and manage executive meetings.
        </p>

        <div style={card}>
          <div style={field}>
            <label>Meeting Title</label>

            <input
              style={input}
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Head Office Review"
            />
          </div>

          <div style={field}>
            <label>Meeting With</label>

            <input
              style={input}
              value={meetingWith}
              onChange={(e) =>
                setMeetingWith(e.target.value)
              }
              placeholder="Head Office"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "20px",
            }}
          >
            <div style={field}>
              <label>Date</label>

              <input
                type="date"
                style={input}
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
              />
            </div>

            <div style={field}>
              <label>Time</label>

              <input
                type="time"
                style={input}
                value={time}
                onChange={(e) =>
                  setTime(e.target.value)
                }
              />
            </div>
          </div>

          <div style={field}>
            <label>Meeting Mode</label>

            <select
              style={input}
              value={mode}
              onChange={(e) =>
                setMode(e.target.value)
              }
            >
              <option>
                Google Meet
              </option>

              <option>
                Physical Meeting
              </option>
            </select>
          </div>

          {mode === "Google Meet" && (
            <div style={field}>
              <label>
                Google Meet Link
              </label>

              <input
                style={input}
                value={link}
                onChange={(e) =>
                  setLink(e.target.value)
                }
                placeholder="https://meet.google.com/..."
              />
            </div>
          )}

          <div style={field}>
            <label>Notes</label>

            <textarea
              style={{
                ...input,
                minHeight: "120px",
              }}
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Additional notes..."
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <button
              style={saveBtn}
              onClick={handleSubmit}
            >
              Save Meeting
            </button>

            <button
              style={cancelBtn}
            >
              Cancel
            </button>
          </div>
        </div>

        {created && (
          <div
            style={{
              ...card,
              marginTop: "25px",
              borderLeft:
                "6px solid #10B981",
            }}
          >
            <h2
              style={{
                color: "#10B981",
              }}
            >
              ✅ Meeting Scheduled
            </h2>

            <p>
              <strong>Title:</strong>{" "}
              {title}
            </p>

            <p>
              <strong>Meeting With:</strong>{" "}
              {meetingWith}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {date}
            </p>

            <p>
              <strong>Time:</strong>{" "}
              {time}
            </p>

            <p>
              <strong>Mode:</strong>{" "}
              {mode}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const card = {
  background: "white",
  borderRadius: "24px",
  padding: "30px",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.08)",
};

const field = {
  display: "flex",
  flexDirection: "column",
  marginBottom: "20px",
};

const input = {
  padding: "14px",
  marginTop: "8px",
  borderRadius: "12px",
  border: "1px solid #CBD5E1",
  fontSize: "15px",
};

const saveBtn = {
  background:
    "linear-gradient(135deg,#10B981,#059669)",
  color: "white",
  border: "none",
  padding: "14px 22px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "600",
};

const cancelBtn = {
  background:
    "linear-gradient(135deg,#EF4444,#DC2626)",
  color: "white",
  border: "none",
  padding: "14px 22px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "600",
};