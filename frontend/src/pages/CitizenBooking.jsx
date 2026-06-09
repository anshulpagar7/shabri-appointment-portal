import { useState } from "react";
import Header from "../components/Header";
import { translations } from "../translations";

export default function CitizenBooking() {
  const [language, setLanguage] = useState("en");
  const [step, setStep] = useState(0);

  const [appointmentType, setAppointmentType] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [notes, setNotes] = useState("");

  const t = translations[language];

  const officers = [
    { name: "Leena Bansod Madam", role: "Chief Executive Officer" },
    { name: "Anshul Pagar", role: "Officer" }
  ];

  const purposes = [
    "Scholarship",
    "Education",
    "Employment",
    "Certificate",
    "Complaint",
    "Other"
  ];

  const timeSlots = [
    "09:00 AM","09:10 AM","09:20 AM","09:30 AM",
    "09:40 AM","09:50 AM","10:00 AM","10:10 AM",
    "10:20 AM","10:30 AM","10:40 AM","10:50 AM"
  ];

  const appointmentId = "SHA-" + Math.floor(1000 + Math.random() * 9000);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Header language={language} setLanguage={setLanguage} />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>

        {step === 0 && (
          <div style={styles.card}>
            <h1>{t.welcome}</h1>
            <h3 style={{ color: "#666" }}>Government of Maharashtra</h3>
            <p>{t.subtitle}</p>

            <button style={styles.primaryButton} onClick={() => setStep(1)}>
              {t.bookAppointment}
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={styles.card}>
            <h2>{t.chooseType}</h2>

            <button
              style={styles.primaryButton}
              onClick={() => {
                setAppointmentType("today");
                setStep(2);
              }}
            >
              🏢 {t.today}
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => {
                setAppointmentType("future");
                setStep(2);
              }}
            >
              📅 {t.future}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={styles.card}>
            <h2>{t.meet}</h2>

            {officers.map((officer) => (
              <div
                key={officer.name}
                style={styles.officerCard}
                onClick={() => {
                  setSelectedOfficer(officer.name);
                  setStep(3);
                }}
              >
                <h3>{officer.name}</h3>
                <p>{officer.role}</p>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={styles.card}>
            <h2>{t.purpose}</h2>

            <div style={styles.grid}>
              {purposes.map((purpose) => (
                <button
                  key={purpose}
                  style={styles.gridButton}
                  onClick={() => {
                    setSelectedPurpose(purpose);
                    if (appointmentType === "future") {
                      setStep(4);
                    } else {
                      setStep(5);
                    }
                  }}
                >
                  {purpose}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={styles.card}>
            <h2>Select Date</h2>

            <input
              type="date"
              style={styles.input}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <button
              style={styles.primaryButton}
              onClick={() => setStep(5)}
            >
              Continue
            </button>
          </div>
        )}

        {step === 5 && (
          <div style={styles.card}>
            <h2>Select Time Slot</h2>

            <div style={styles.grid}>
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  style={styles.gridButton}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setStep(6);
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div style={styles.card}>
            <h2>{t.details}</h2>

            <input
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />

            <textarea
              style={styles.input}
              placeholder="Additional Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <button
              style={styles.primaryButton}
              onClick={() => setStep(7)}
            >
              {t.confirm}
            </button>
          </div>
        )}

        {step === 7 && (
          <div style={styles.card}>
            <h2>✅ {t.confirmed}</h2>

            <p><strong>ID:</strong> {appointmentId}</p>
            <p><strong>Officer:</strong> {selectedOfficer}</p>
            <p><strong>Purpose:</strong> {selectedPurpose}</p>
            {selectedDate && <p><strong>Date:</strong> {selectedDate}</p>}
            <p><strong>Time:</strong> {selectedSlot}</p>
            <p><strong>{t.queue}:</strong> #12</p>
            <p><strong>{t.wait}:</strong> 120 mins</p>

            <button style={styles.primaryButton}>
              {t.calendar}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    marginTop: "15px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)"
  },
  primaryButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    marginTop: "10px"
  },
  secondaryButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "2px solid #2563eb",
    background: "white",
    color: "#2563eb",
    cursor: "pointer",
    marginTop: "10px"
  },
  officerCard: {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "12px",
    cursor: "pointer"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: "10px"
  },
  gridButton: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer"
  },
  input: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "1px solid #ddd"
  }
};