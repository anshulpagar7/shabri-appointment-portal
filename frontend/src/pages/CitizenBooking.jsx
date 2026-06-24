import { useState, useEffect } from "react";
import Header from "../components/Header";
import { translations } from "../translations";
import { supabase } from "../lib/supabase";
import tdcLogo from "../assets/tdc-logo.jpeg";
import tribalLogo from "../assets/tribal-logo.jpg";

// ─── Constants ────────────────────────────────────────────────────────────────

const OFFICER = { name: "Leena Bansod", designation: "Managing Director" };

const TIME_SLOTS = [
  { time: "11:00 AM", group: "morning" },
  { time: "11:10 AM", group: "morning" },
  { time: "11:20 AM", group: "morning" },
  { time: "11:30 AM", group: "morning" },
  { time: "11:40 AM", group: "morning" },
  { time: "11:50 AM", group: "morning" },
  { time: "12:00 PM", group: "morning" },
  { time: "12:10 PM", group: "morning" },
  { time: "12:20 PM", group: "morning" },
  { time: "12:30 PM", group: "morning" },
  { time: "12:40 PM", group: "morning" },
  { time: "12:50 PM", group: "morning" },
  { time: "01:00 PM", group: "morning" },
  { time: "01:10 PM", group: "morning" },
  { time: "01:20 PM", group: "morning" },
  { time: "LUNCH", group: "break", disabled: true },
  { time: "02:30 PM", group: "afternoon" },
  { time: "02:40 PM", group: "afternoon" },
  { time: "02:50 PM", group: "afternoon" },
  { time: "03:00 PM", group: "afternoon" },
  { time: "03:10 PM", group: "afternoon" },
  { time: "03:20 PM", group: "afternoon" },
  { time: "03:30 PM", group: "afternoon" },
  { time: "03:40 PM", group: "afternoon" },
  { time: "03:50 PM", group: "afternoon" },
  { time: "04:00 PM", group: "afternoon" },
  { time: "04:10 PM", group: "afternoon" },
  { time: "04:20 PM", group: "afternoon" },
  { time: "04:30 PM", group: "afternoon" },
  { time: "04:40 PM", group: "afternoon" },
  { time: "04:50 PM", group: "afternoon" },
];

const TOTAL_STEPS = 5;

// ─── Feature 4: Time filtering helper ─────────────────────────────────────────

function timeToMinutes(time) {
  const d = new Date(`1970-01-01 ${time}`);
  return d.getHours() * 60 + d.getMinutes();
}

// ─── Holiday: Office Closed Card ──────────────────────────────────────────────

function OfficeClosedCard({ reason, dateStr }) {
  const displayDate = dateStr
    ? new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div
      style={{
        background: "#FEF2F2",
        border: "1.5px solid #FECACA",
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 28 }}>🚫</span>
      <p
        style={{
          margin: 0,
          fontWeight: 800,
          fontSize: 16,
          color: "#DC2626",
        }}
      >
        Office Closed
      </p>
      {reason && (
        <p
          style={{
            margin: 0,
            fontWeight: 600,
            fontSize: 15,
            color: "#991B1B",
          }}
        >
          {reason}
        </p>
      )}
      {displayDate && (
        <p style={{ margin: 0, fontSize: 13, color: "#B91C1C" }}>
          {displayDate}
        </p>
      )}
      <p
        style={{
          margin: "4px 0 0",
          fontSize: 13,
          color: "#6B7280",
          fontWeight: 500,
        }}
      >
        Please select another date.
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, t }) {
  if (step === 0) return null;
  const current = step > 5 ? TOTAL_STEPS : step;
  const pct = Math.round((current / TOTAL_STEPS) * 100);
  return (
    <div style={pb.wrapper}>
      <div style={pb.track}>
        <div style={{ ...pb.fill, width: `${pct}%` }} />
      </div>
      <p style={pb.label}>
        {step > 5 ? t.complete : `${t.step} ${current} ${t.of} ${TOTAL_STEPS}`}
      </p>
    </div>
  );
}

const pb = {
  wrapper: { padding: "16px 20px 0", maxWidth: 640, margin: "0 auto" },
  track: { height: 6, background: "#DBEAFE", borderRadius: 99, overflow: "hidden" },
  fill: {
    height: "100%",
    background: "linear-gradient(90deg,#2563EB,#1E3A8A)",
    borderRadius: 99,
    transition: "width 0.4s ease",
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 0,
    fontWeight: 600,
    letterSpacing: "0.04em",
  },
};

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: "32px 28px",
        boxShadow: "0 4px 24px rgba(37,99,235,0.07)",
        maxWidth: 640,
        margin: "20px auto 0",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StepHeading({ children }) {
  return (
    <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 20, marginTop: 0 }}>
      {children}
    </h2>
  );
}

function PrimaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "16px",
        fontSize: 16,
        fontWeight: 700,
        border: "none",
        borderRadius: 12,
        background: disabled ? "#93C5FD" : "linear-gradient(135deg,#2563EB,#1E3A8A)",
        color: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        marginTop: 16,
        letterSpacing: "0.02em",
        boxShadow: disabled ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
        transition: "transform 0.1s",
      }}
    >
      {children}
    </button>
  );
}

function OfficerBadge({ t }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#2563EB,#1E3A8A)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 20,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        LB
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#1E3A8A" }}>
          {OFFICER.name}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
          {t.designationMD}
        </p>
      </div>
    </div>
  );
}

// ─── Hero Dual Logo Row (tribal + tdc, both real images) ──────────────────────

function DualLogoRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        marginBottom: 18,
      }}
    >
      {/* Tribal logo */}
      <img
        src={tribalLogo}
        alt="Tribal Logo"
        style={{
          width: 68,
          height: 68,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid rgba(255,255,255,0.4)",
          background: "#fff",
          flexShrink: 0,
        }}
      />

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 44,
          background: "rgba(255,255,255,0.3)",
          flexShrink: 0,
        }}
      />

      {/* TDC logo */}
      <img
        src={tdcLogo}
        alt="TDC Logo"
        style={{
          width: 68,
          height: 68,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid rgba(255,255,255,0.4)",
          background: "#fff",
          flexShrink: 0,
        }}
      />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CitizenBooking() {
  const [language, setLanguage] = useState("en");
  const [step, setStep] = useState(0);

  const [appointmentType, setAppointmentType] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [arrivingFrom, setArrivingFrom] = useState("");
  const [notes, setNotes] = useState("");

  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // ── Holiday state ──────────────────────────────────────────────────────────
  const [holidays, setHolidays] = useState([]);

  // ── Booked slots state (Feature 1 & 2) ────────────────────────────────────
  const [bookedSlots, setBookedSlots] = useState([]);

  // ── Dynamic queue position (Feature 4) ────────────────────────────────────
  const [queuePosition, setQueuePosition] = useState(null);

  const [appointmentId] = useState("SHA-" + Math.floor(1000 + Math.random() * 9000));

  const t = translations[language];

  // ── Fetch holidays on mount ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchHolidays() {
      const { data, error } = await supabase
        .from("holidays")
        .select("id, holiday_name, holiday_date, holiday_type, category");
      if (!error && data) {
        setHolidays(data);
      }
    }
    fetchHolidays();
  }, []);

  // ── Holiday / Weekend helpers ──────────────────────────────────────────────

  /**
   * Returns the matching holiday record for a given date string (YYYY-MM-DD),
   * or null if the date is not a holiday.
   */
  function getHolidayForDate(dateStr) {
    if (!dateStr) return null;
    return holidays.find((h) => h.holiday_date === dateStr) || null;
  }

  /**
   * Returns true if the given date string (YYYY-MM-DD) falls on a Saturday or Sunday.
   */
  function isWeekend(dateStr) {
    if (!dateStr) return false;
    // Use UTC parsing to avoid timezone shifting the day
    const parts = dateStr.split("-");
    const d = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    const day = d.getDay(); // 0 = Sun, 6 = Sat
    return day === 0 || day === 6;
  }

  /**
   * Determines if the office is closed for the effective booking date.
   * Returns { closed: boolean, reason: string|null }
   * Order: holiday check → weekend check.
   */
  function getOfficeStatus(dateStr) {
    if (!dateStr) return { closed: false, reason: null };

    // 1. Holiday check
    const holiday = getHolidayForDate(dateStr);
    if (holiday) {
      return { closed: true, reason: holiday.holiday_name };
    }

    // 2. Weekend check
    if (isWeekend(dateStr)) {
      const parts = dateStr.split("-");
      const d = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
      const dayName = d.getDay() === 0 ? "Sunday" : "Saturday";
      return { closed: true, reason: dayName };
    }

    return { closed: false, reason: null };
  }

  // ── Derive effective booking date ──────────────────────────────────────────
  const todayStr = new Date().toISOString().split("T")[0];

  const effectiveDateStr =
    appointmentType === "today"
      ? todayStr
      : appointmentType === "future"
      ? selectedDate
      : "";

  const officeStatus = getOfficeStatus(effectiveDateStr);

  // ── Fetch booked slots whenever effective date changes (Feature 1 & 2) ────
  useEffect(() => {
    if (!effectiveDateStr) {
      setBookedSlots([]);
      return;
    }
    async function fetchBookedSlots() {
      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("appointment_date", effectiveDateStr);
      if (!error && data) {
        setBookedSlots(data.map((a) => a.appointment_time));
      } else {
        setBookedSlots([]);
      }
    }
    fetchBookedSlots();
  }, [effectiveDateStr]);

  // ── Existing logic (untouched) ─────────────────────────────────────────────

  const saveAppointment = async () => {
    const bookingDate =
      appointmentType === "today"
        ? new Date().toISOString().split("T")[0]
        : selectedDate;

    // Feature 3: insert location field
    const { error } = await supabase
      .from("appointments")
      .insert({
        appointment_id: appointmentId,
        citizen_name: name,
        mobile: mobile,
        purpose: selectedPurpose,
        appointment_date: bookingDate,
        appointment_time: selectedSlot,
        officer_name: OFFICER.name,
        location: arrivingFrom,
        status: "Waiting",
      });

    if (error) {
      console.log(error);
      alert("Failed to book appointment");
      return;
    }

    // Feature 4: calculate dynamic queue position for this date
    const { data: dayAppointments } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("appointment_date", bookingDate);

    if (dayAppointments) {
      // Sort all booked slots by time using the master TIME_SLOTS order
      const orderedTimes = TIME_SLOTS
        .filter((s) => !s.disabled)
        .map((s) => s.time);
      const sortedBooked = dayAppointments
        .map((a) => a.appointment_time)
        .sort((a, b) => orderedTimes.indexOf(a) - orderedTimes.indexOf(b));
      const pos = sortedBooked.indexOf(selectedSlot) + 1;
      setQueuePosition(pos > 0 ? pos : dayAppointments.length);
    }

    setStep(6);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const isToday =
    appointmentType === "today" ||
    (appointmentType === "future" && selectedDate === todayStr);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const visibleSlots = TIME_SLOTS.filter((s) => {
    if (s.disabled) return true;
    // 3. Past time filtering (existing)
    if (isToday) {
      return timeToMinutes(s.time) > currentMinutes;
    }
    return true;
  });

  // A slot is truly available only if it is visible AND not already booked
  const hasAvailableSlots = visibleSlots.some(
    (s) => !s.disabled && !bookedSlots.includes(s.time)
  );

  function handlePurposeContinue() {
    if (!selectedPurpose.trim()) return;
    appointmentType === "future" ? setStep(3) : setStep(4);
  }

  const displayDate =
    appointmentType === "today"
      ? new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
      : selectedDate
      ? new Date(selectedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
      : "";

  function resetAll() {
    setStep(0);
    setAppointmentType("");
    setSelectedPurpose("");
    setSelectedDate("");
    setSelectedSlot("");
    setName("");
    setMobile("");
    setArrivingFrom("");
    setNotes("");
    setFeedbackText("");
    setFeedbackSubmitted(false);
    setBookedSlots([]);
    setQueuePosition(null);
  }


  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <Header language={language} setLanguage={setLanguage} />

      <ProgressBar step={step} t={t} />

      {/* ── STEP 0: Landing ── */}
      {step === 0 && (
        <div style={landing.outer}>
          <div style={landing.hero}>
            {/* Both real logos in hero */}
            <DualLogoRow />

            <p style={landing.gov}>{t.government}</p>
            <h1 style={landing.org}>{t.welcome}</h1>
            <p style={landing.taglineStyle}>{t.tagline}</p>
            <button style={landing.cta} onClick={() => setStep(1)}>
              <span style={{ marginRight: 8 }}>📅</span>
              {t.bookAppointment}
            </button>
          </div>

          {/* Office Timings */}
          <div style={landing.timingsCard}>
            <p style={landing.timingsHeading}>🕐 {t.officeTimings}</p>
            <div style={landing.timingsGrid}>
              <div style={landing.timingRow}>
                <span style={landing.timingDot("green")} />
                <span>11:00 AM – 1:30 PM</span>
              </div>
              <div style={landing.timingRow}>
                <span style={landing.timingDot("amber")} />
                <span style={{ color: "#92400E" }}>{t.lunchBreak} 1:30 PM – 2:30 PM</span>
              </div>
              <div style={landing.timingRow}>
                <span style={landing.timingDot("green")} />
                <span>2:30 PM – 5:00 PM</span>
              </div>
            </div>
          </div>

          {/* Officer card */}
          <Card style={{ maxWidth: 640 }}>
            <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 13, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {t.appointmentsWith}
            </p>
            <OfficerBadge t={t} />
          </Card>
        </div>
      )}

      {/* ── STEP 1: Appointment Type ── */}
      {step === 1 && (
        <Card>
          <StepHeading>{t.chooseType}</StepHeading>
          <OfficerBadge t={t} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { key: "today", icon: "🏢", label: t.todayLabel, desc: t.todayDesc },
              { key: "future", icon: "📅", label: t.futureLabel, desc: t.futureDesc },
            ].map((opt) => (
              <div
                key={opt.key}
                onClick={() => { setAppointmentType(opt.key); setStep(2); }}
                style={{
                  border: `2px solid ${appointmentType === opt.key ? "#2563EB" : "#E5E7EB"}`,
                  borderRadius: 16,
                  padding: "20px 22px",
                  cursor: "pointer",
                  background: appointmentType === opt.key ? "#EFF6FF" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 28 }}>{opt.icon}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#111827" }}>{opt.label}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>{opt.desc}</p>
                </div>
                <span
                  style={{
                    marginLeft: "auto",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: `2px solid ${appointmentType === opt.key ? "#2563EB" : "#D1D5DB"}`,
                    background: appointmentType === opt.key ? "#2563EB" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {appointmentType === opt.key && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── STEP 2: Purpose ── */}
      {step === 2 && (
        <Card>
          <StepHeading>{t.purpose}</StepHeading>
          <OfficerBadge t={t} />
          <textarea
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1.5px solid #D1D5DB",
              fontSize: 15,
              color: "#111827",
              resize: "vertical",
              minHeight: 130,
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
              lineHeight: 1.6,
              transition: "border-color 0.15s",
            }}
            placeholder={t.purposePlaceholder}
            value={selectedPurpose}
            onChange={(e) => setSelectedPurpose(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
            onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
          />
          <PrimaryButton onClick={handlePurposeContinue} disabled={!selectedPurpose.trim()}>
            {t.continue}
          </PrimaryButton>
        </Card>
      )}

      {/* ── STEP 3: Date (Future only) ── */}
      {step === 3 && (
        <Card>
          <StepHeading>{t.selectDate}</StepHeading>
          <OfficerBadge t={t} />
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            {t.chooseDateLabel}
          </label>
          <input
            type="date"
            min={todayStr}
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              border: "1.5px solid #D1D5DB",
              fontSize: 16,
              color: "#111827",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              // Clear any previously selected slot when date changes
              setSelectedSlot("");
            }}
          />

          {/* ── Holiday / Weekend closed message for Step 3 ── */}
          {selectedDate && officeStatus.closed && (
            <div style={{ marginTop: 16 }}>
              <OfficeClosedCard
                reason={officeStatus.reason}
                dateStr={effectiveDateStr}
              />
            </div>
          )}

          <PrimaryButton
            onClick={() => setStep(4)}
            disabled={!selectedDate || officeStatus.closed}
          >
            {t.continue}
          </PrimaryButton>
        </Card>
      )}

      {/* ── STEP 4: Time Slot ── */}
      {step === 4 && (
        <Card>
          <StepHeading>{t.selectSlot}</StepHeading>
          <OfficerBadge t={t} />

          {/* ── Holiday / Weekend closed message for Step 4 ── */}
          {officeStatus.closed ? (
            <OfficeClosedCard
              reason={officeStatus.reason}
              dateStr={effectiveDateStr}
            />
          ) : (
            <>
              {!hasAvailableSlots && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1.5px solid #FECACA",
                    borderRadius: 12,
                    padding: "16px 20px",
                    marginBottom: 16,
                    textAlign: "center",
                    color: "#DC2626",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  ⚠️ No more slots available for today. Please book for a future date.
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {visibleSlots.map((s, i) => {
                  if (s.disabled) {
                    const hasAfternoonSlots = visibleSlots.some((vs) => !vs.disabled && vs.group === "afternoon");
                    const hasMorningSlots = visibleSlots.some((vs) => !vs.disabled && vs.group === "morning");
                    if (!hasMorningSlots || !hasAfternoonSlots) return null;
                    return (
                      <div
                        key={i}
                        style={{
                          gridColumn: "1 / -1",
                          background: "#FEF3C7",
                          color: "#92400E",
                          borderRadius: 10,
                          padding: "10px",
                          textAlign: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                        }}
                      >
                        🍽 {t.lunchBreak}
                      </div>
                    );
                  }
                  const isSelected = selectedSlot === s.time;
                  // Feature 1 & 2: check if slot is already booked
                  const isBooked = bookedSlots.includes(s.time);
                  return (
                    <button
                      key={i}
                      onClick={() => !isBooked && setSelectedSlot(s.time)}
                      disabled={isBooked}
                      style={{
                        padding: "12px 4px",
                        borderRadius: 10,
                        border: `2px solid ${
                          isBooked
                            ? "#E5E7EB"
                            : isSelected
                            ? "#2563EB"
                            : "#E5E7EB"
                        }`,
                        background: isBooked
                          ? "#F3F4F6"
                          : isSelected
                          ? "linear-gradient(135deg,#2563EB,#1E3A8A)"
                          : "#F9FAFB",
                        color: isBooked
                          ? "#9CA3AF"
                          : isSelected
                          ? "#fff"
                          : "#374151",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: 13,
                        cursor: isBooked ? "not-allowed" : "pointer",
                        opacity: isBooked ? 0.5 : 1,
                        transform: isSelected ? "scale(1.04)" : "scale(1)",
                        transition: "all 0.15s",
                        boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
                      }}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <PrimaryButton
            onClick={() => setStep(5)}
            disabled={!selectedSlot || !hasAvailableSlots || officeStatus.closed}
          >
            {t.continue}
          </PrimaryButton>
        </Card>
      )}

      {/* ── STEP 5: Personal Details ── */}
      {step === 5 && (
        <Card>
          <StepHeading>{t.details}</StepHeading>
          <OfficerBadge t={t} />

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {t.fullName}
            </label>
            <input
              type="text"
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: "1.5px solid #D1D5DB",
                fontSize: 15,
                color: "#111827",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              placeholder={t.fullNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
            />
          </div>

          {/* Mobile */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {t.mobile}
            </label>
            <input
              type="tel"
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: "1.5px solid #D1D5DB",
                fontSize: 15,
                color: "#111827",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              placeholder={t.mobilePlaceholder}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
            />
          </div>

          {/* Arriving From */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Arriving From
            </label>
            <input
              type="text"
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: "1.5px solid #D1D5DB",
                fontSize: 15,
                color: "#111827",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              placeholder="Enter your city, village or area"
              value={arrivingFrom}
              onChange={(e) => setArrivingFrom(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 4 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {t.notes}{" "}
              <span style={{ fontWeight: 400, color: "#9CA3AF" }}>{t.notesOptional}</span>
            </label>
            <textarea
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: "1.5px solid #D1D5DB",
                fontSize: 15,
                color: "#111827",
                resize: "vertical",
                minHeight: 90,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder={t.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
            />
          </div>

          <PrimaryButton onClick={saveAppointment} disabled={!name.trim() || !mobile.trim()}>
            {t.confirm}
          </PrimaryButton>
        </Card>
      )}

      {/* ── STEP 6: Confirmation ── */}
      {step === 6 && (
        <div style={{ maxWidth: 640, margin: "20px auto 40px", padding: "0 16px" }}>
          <div style={conf.banner}>
            <div style={conf.checkCircle}>✓</div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: "#fff" }}>{t.confirmed}</p>
              <p style={{ margin: 0, fontSize: 13, color: "#BFDBFE", marginTop: 2 }}>{t.arriveEarly}</p>
            </div>
          </div>

          <div style={conf.tokenCard}>
            <p style={conf.tokenLabel}>{t.tokenNumber}</p>
            <p style={conf.tokenValue}>{appointmentId}</p>
          </div>

          <div style={conf.detailsCard}>
            <p style={conf.sectionLabel}>{t.appointmentDetails}</p>

            <div style={conf.row}>
              <span style={conf.rowIcon}>👩‍💼</span>
              <div>
                <p style={conf.rowLabel}>{t.meetingWith}</p>
                <p style={conf.rowValue}>
                  {OFFICER.name}
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#6B7280", fontWeight: 400 }}>
                    {t.designationMD}
                  </span>
                </p>
              </div>
            </div>

            <div style={conf.divider} />

            <div style={conf.row}>
              <span style={conf.rowIcon}>📋</span>
              <div>
                <p style={conf.rowLabel}>{t.purposeOfVisit}</p>
                <p style={conf.rowValue}>{selectedPurpose}</p>
              </div>
            </div>

            <div style={conf.divider} />

            <div style={conf.row}>
              <span style={conf.rowIcon}>📅</span>
              <div>
                <p style={conf.rowLabel}>{t.date}</p>
                <p style={conf.rowValue}>{displayDate}</p>
              </div>
            </div>

            <div style={conf.divider} />

            <div style={conf.row}>
              <span style={conf.rowIcon}>🕐</span>
              <div>
                <p style={conf.rowLabel}>{t.time}</p>
                <p style={conf.rowValue}>{selectedSlot}</p>
              </div>
            </div>

            <div style={conf.divider} />

            <div style={conf.row}>
              <span style={conf.rowIcon}>🔢</span>
              <div>
                <p style={conf.rowLabel}>{t.queue}</p>
                <p style={conf.rowValue}>#{queuePosition ?? "—"}</p>
              </div>
            </div>

            <div style={conf.divider} />

            <div style={conf.row}>
              <span style={conf.rowIcon}>👤</span>
              <div>
                <p style={conf.rowLabel}>{t.registeredName}</p>
                <p style={conf.rowValue}>{name}</p>
              </div>
            </div>

            <div style={conf.divider} />

            <div style={conf.row}>
              <span style={conf.rowIcon}>📱</span>
              <div>
                <p style={conf.rowLabel}>{t.mobile}</p>
                <p style={conf.rowValue}>{mobile}</p>
              </div>
            </div>

            {arrivingFrom.trim() && (
              <div>
                <div style={conf.divider} />
                <div style={conf.row}>
                  <span style={conf.rowIcon}>📍</span>
                  <div>
                    <p style={conf.rowLabel}>Arriving From</p>
                    <p style={conf.rowValue}>{arrivingFrom}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <a
            href={`https://wa.me/?text=My appointment at MSTDCL is confirmed. Token: ${appointmentId}. Time: ${selectedSlot} on ${displayDate}.`}
            target="_blank"
            rel="noopener noreferrer"
            style={conf.whatsapp}
          >
            <span style={{ fontSize: 20 }}>💬</span> {t.whatsappBtn}
          </a>

          {/* Feedback Section */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "22px",
              marginTop: 16,
              boxShadow: "0 4px 24px rgba(37,99,235,0.07)",
            }}
          >
            <p
              style={{
                margin: "0 0 14px",
                fontWeight: 700,
                fontSize: 13,
                color: "#2563EB",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              💬 Citizen Feedback
            </p>

            {feedbackSubmitted ? (
              <div
                style={{
                  background: "#ECFDF5",
                  border: "1.5px solid #6EE7B7",
                  borderRadius: 12,
                  padding: "16px 20px",
                  textAlign: "center",
                  color: "#065F46",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                ✅ Feedback Submitted. Thank you.
              </div>
            ) : (
              <div>
                <textarea
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    borderRadius: 12,
                    border: "1.5px solid #D1D5DB",
                    fontSize: 15,
                    color: "#111827",
                    resize: "vertical",
                    minHeight: 90,
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    lineHeight: 1.6,
                  }}
                  placeholder="Share your experience or suggestions"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                  onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
                />
                <button
                  onClick={() => { if (feedbackText.trim()) setFeedbackSubmitted(true); }}
                  disabled={!feedbackText.trim()}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginTop: 12,
                    borderRadius: 12,
                    border: "none",
                    background: !feedbackText.trim() ? "#93C5FD" : "linear-gradient(135deg,#2563EB,#1E3A8A)",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: !feedbackText.trim() ? "not-allowed" : "pointer",
                    boxShadow: !feedbackText.trim() ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
                    letterSpacing: "0.02em",
                  }}
                >
                  Submit Feedback
                </button>
              </div>
            )}
          </div>

          <button
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "1.5px solid #D1D5DB",
              background: "#fff",
              color: "#374151",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 12,
            }}
            onClick={resetAll}
          >
            {t.bookAnother}
          </button>
        </div>
      )}

      <div style={{ height: 40 }} />

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        @media (max-width: 480px) {
          h1 { font-size: 18px !important; }
          h2 { font-size: 17px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Landing Styles ────────────────────────────────────────────────────────────

const landing = {
  outer: { padding: "0 16px 40px" },
  hero: {
    background: "linear-gradient(145deg,#1E3A8A 0%,#2563EB 60%,#3B82F6 100%)",
    borderRadius: 24,
    padding: "48px 32px 52px",
    textAlign: "center",
    maxWidth: 640,
    margin: "20px auto 0",
    boxShadow: "0 8px 32px rgba(37,99,235,0.35)",
  },
  gov: { margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" },
  org: { margin: "0 0 12px", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.3 },
  taglineStyle: { margin: "0 0 32px", fontSize: 14, color: "rgba(255,255,255,0.75)", letterSpacing: "0.04em" },
  cta: {
    padding: "16px 36px",
    fontSize: 16,
    fontWeight: 700,
    border: "none",
    borderRadius: 12,
    background: "#fff",
    color: "#1E3A8A",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
    letterSpacing: "0.02em",
  },
  timingsCard: {
    background: "#fff",
    borderRadius: 18,
    padding: "22px 24px",
    maxWidth: 640,
    margin: "16px auto 0",
    boxShadow: "0 4px 24px rgba(37,99,235,0.07)",
  },
  timingsHeading: { margin: "0 0 14px", fontWeight: 700, fontSize: 15, color: "#111827" },
  timingsGrid: { display: "flex", flexDirection: "column", gap: 10 },
  timingRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#374151", fontWeight: 500 },
  timingDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color === "green" ? "#22C55E" : "#F59E0B",
    flexShrink: 0,
  }),
};

// ─── Confirmation Styles ───────────────────────────────────────────────────────

const conf = {
  banner: {
    background: "linear-gradient(135deg,#059669,#10B981)",
    borderRadius: 20,
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 6px 20px rgba(16,185,129,0.35)",
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    color: "#fff",
    fontWeight: 700,
    flexShrink: 0,
  },
  tokenCard: {
    textAlign: "center",
    background: "#EFF6FF",
    border: "2px dashed #BFDBFE",
    borderRadius: 16,
    padding: "22px 16px",
    marginTop: 16,
  },
  tokenLabel: { margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.12em", textTransform: "uppercase" },
  tokenValue: { margin: 0, fontSize: 36, fontWeight: 900, color: "#1E3A8A", letterSpacing: "0.08em" },
  detailsCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "22px",
    marginTop: 16,
    boxShadow: "0 4px 24px rgba(37,99,235,0.07)",
  },
  sectionLabel: { margin: "0 0 16px", fontWeight: 700, fontSize: 13, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em" },
  row: { display: "flex", alignItems: "flex-start", gap: 12, padding: "4px 0" },
  rowIcon: { fontSize: 18, marginTop: 2, flexShrink: 0 },
  rowLabel: { margin: 0, fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" },
  rowValue: { margin: "2px 0 0", fontSize: 15, color: "#111827", fontWeight: 600 },
  divider: { height: 1, background: "#F3F4F6", margin: "12px 0" },
  whatsapp: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
    padding: "16px",
    background: "linear-gradient(135deg,#16A34A,#22C55E)",
    color: "#fff",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
  },
};