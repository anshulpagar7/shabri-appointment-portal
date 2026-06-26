import { useState, useEffect } from "react";
import Header from "../components/Header";
import { translations } from "../translations";
import { supabase } from "../lib/supabase";
import tdcLogo from "../assets/tdc-logo.jpeg";
import tribalLogo from "../assets/tribal-logo.jpg";

// ─── Constants ────────────────────────────────────────────────────────────────

const OFFICER = { name: "Leena Bansod", designation: "Managing Director" };

const TOTAL_STEPS = 6; // now 6 steps (duration added between purpose and date/slot)

const DURATION_OPTIONS = [5, 10, 15, 20, 25]; // minutes

// ─── Slot Engine ──────────────────────────────────────────────────────────────
//
// Office hours:
//   Morning   : 12:00 PM – 1:20 PM  (last slot starts 1:20, ends 1:25; lunch at 1:30)
//   Afternoon : 2:30 PM  – 4:50 PM  (last slot starts 4:50, ends 4:55; office closes 5:00)
//
// Pomodoro rhythm: 5 work slots (25 min) then a 5-min break (slot not shown).
//
// Resulting groups (each exactly 5 bookable slots):
//   A: 12:00 12:05 12:10 12:15 12:20  [break 12:25]
//   B: 12:30 12:35 12:40 12:45 12:50  [break 12:55]
//   C:  1:00  1:05  1:10  1:15  1:20  [lunch  1:30–2:30]
//   D:  2:30  2:35  2:40  2:45  2:50  [break  2:55]
//   E:  3:00  3:05  3:10  3:15  3:20  [break  3:25]
//   F:  3:30  3:35  3:40  3:45  3:50  [break  3:55]
//   G:  4:00  4:05  4:10  4:15  4:20  [break  4:25]
//   H:  4:30  4:35  4:40  4:45  4:50  [office closes 5:00]

const SLOT_GROUPS = [
  // label shown as section header, slots array
  { label: "Morning Session", section: "morning", slots: ["12:00 PM","12:05 PM","12:10 PM","12:15 PM","12:20 PM"] },
  { label: "Morning Session", section: "morning", slots: ["12:30 PM","12:35 PM","12:40 PM","12:45 PM","12:50 PM"] },
  { label: "Morning Session", section: "morning", slots: ["01:00 PM","01:05 PM","01:10 PM","01:15 PM","01:20 PM"] },
  { label: "Afternoon Session", section: "afternoon", slots: ["02:30 PM","02:35 PM","02:40 PM","02:45 PM","02:50 PM"] },
  { label: "Afternoon Session", section: "afternoon", slots: ["03:00 PM","03:05 PM","03:10 PM","03:15 PM","03:20 PM"] },
  { label: "Afternoon Session", section: "afternoon", slots: ["03:30 PM","03:35 PM","03:40 PM","03:45 PM","03:50 PM"] },
  { label: "Afternoon Session", section: "afternoon", slots: ["04:00 PM","04:05 PM","04:10 PM","04:15 PM","04:20 PM"] },
  { label: "Afternoon Session", section: "afternoon", slots: ["04:30 PM","04:35 PM","04:40 PM","04:45 PM","04:50 PM"] },
];

// Flat ordered list of all bookable slot strings
const ALL_SLOTS = SLOT_GROUPS.flatMap(g => g.slots);

// Convert a slot string like "12:05 PM" to minutes-since-midnight
function slotToMinutes(slotStr) {
  const d = new Date(`1970-01-01 ${slotStr}`);
  return d.getHours() * 60 + d.getMinutes();
}

// Given a starting slot and duration (minutes), return array of all slot strings it occupies.
// Returns null if the run is invalid (crosses a break or leaves valid slots).
function getOccupiedSlots(startSlot, durationMinutes) {
  const slotsNeeded = durationMinutes / 5;
  const startIdx = ALL_SLOTS.indexOf(startSlot);
  if (startIdx === -1) return null;

  const occupied = [];
  for (let i = 0; i < slotsNeeded; i++) {
    const slotIdx = startIdx + i;
    if (slotIdx >= ALL_SLOTS.length) return null; // ran off end
    occupied.push(ALL_SLOTS[slotIdx]);
  }

  // Validate: all occupied slots must be in the SAME group
  const groupForSlot = (slot) => SLOT_GROUPS.findIndex(g => g.slots.includes(slot));
  const firstGroup = groupForSlot(occupied[0]);
  if (firstGroup === -1) return null;
  for (const s of occupied) {
    if (groupForSlot(s) !== firstGroup) return null; // crosses a break
  }

  return occupied;
}

// Expand booked appointments (each has appointment_time + appointment_duration)
// into a Set of all occupied slot strings.
function buildOccupiedSet(bookedAppointments) {
  const occupied = new Set();
  for (const appt of bookedAppointments) {
    const dur = appt.appointment_duration ?? 5;
    const slots = getOccupiedSlots(appt.appointment_time, dur);
    if (slots) slots.forEach(s => occupied.add(s));
  }
  return occupied;
}

// ─── Feature 4: Time filtering helper ────────────────────────────────────────

function timeToMinutes(slotStr) {
  return slotToMinutes(slotStr);
}

// ─── Holiday: Office Closed Card ─────────────────────────────────────────────

function OfficeClosedCard({ reason, dateStr }) {
  const displayDate = dateStr
    ? new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "";
  return (
    <div style={{
      background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 14,
      padding: "20px 22px", marginBottom: 16, display: "flex", flexDirection: "column",
      alignItems: "center", textAlign: "center", gap: 6,
    }}>
      <span style={{ fontSize: 28 }}>🚫</span>
      <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#DC2626" }}>Office Closed</p>
      {reason && <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#991B1B" }}>{reason}</p>}
      {displayDate && <p style={{ margin: 0, fontSize: 13, color: "#B91C1C" }}>{displayDate}</p>}
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Please select another date.</p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, t }) {
  if (step === 0) return null;
  const current = step > TOTAL_STEPS ? TOTAL_STEPS : step;
  const pct = Math.round((current / TOTAL_STEPS) * 100);
  return (
    <div style={pb.wrapper}>
      <div style={pb.track}>
        <div style={{ ...pb.fill, width: `${pct}%` }} />
      </div>
      <p style={pb.label}>
        {step > TOTAL_STEPS ? t.complete : `${t.step} ${current} ${t.of} ${TOTAL_STEPS}`}
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
    fontSize: 12, color: "#6B7280", textAlign: "right", marginTop: 4,
    marginBottom: 0, fontWeight: 600, letterSpacing: "0.04em",
  },
};

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 20, padding: "32px 28px",
      boxShadow: "0 4px 24px rgba(37,99,235,0.07)", maxWidth: 640,
      margin: "20px auto 0", ...style,
    }}>
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
        width: "100%", padding: "16px", fontSize: 16, fontWeight: 700,
        border: "none", borderRadius: 12,
        background: disabled ? "#93C5FD" : "linear-gradient(135deg,#2563EB,#1E3A8A)",
        color: "#fff", cursor: disabled ? "not-allowed" : "pointer",
        marginTop: 16, letterSpacing: "0.02em",
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
    <div style={{
      display: "flex", alignItems: "center", gap: 14, background: "#EFF6FF",
      border: "1px solid #BFDBFE", borderRadius: 14, padding: "16px 20px", marginBottom: 24,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "linear-gradient(135deg,#2563EB,#1E3A8A)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 20, fontWeight: 700, flexShrink: 0,
      }}>LB</div>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#1E3A8A" }}>{OFFICER.name}</p>
        <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>{t.designationMD}</p>
      </div>
    </div>
  );
}

function DualLogoRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 18 }}>
      <img src={tribalLogo} alt="Tribal Logo" style={{
        width: 68, height: 68, borderRadius: "50%", objectFit: "cover",
        border: "2px solid rgba(255,255,255,0.4)", background: "#fff", flexShrink: 0,
      }} />
      <div style={{ width: 1, height: 44, background: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
      <img src={tdcLogo} alt="TDC Logo" style={{
        width: 68, height: 68, borderRadius: "50%", objectFit: "cover",
        border: "2px solid rgba(255,255,255,0.4)", background: "#fff", flexShrink: 0,
      }} />
    </div>
  );
}

function AnnouncementsSection({ announcements }) {
  if (!announcements || announcements.length === 0) return null;
  return (
    <div style={{
      background: "#fff", borderRadius: 20, padding: "22px", marginTop: 16,
      boxShadow: "0 4px 24px rgba(37,99,235,0.07)",
    }}>
      <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 13, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        📢 Latest Announcements
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {announcements.map((item, idx) => (
          <div key={item.id ?? idx} style={{
            background: "#F8FAFF", border: "1px solid #DBEAFE", borderRadius: 12,
            padding: "14px 16px", borderLeft: "4px solid #2563EB",
          }}>
            <p style={{ margin: 0, fontSize: 14, color: "#1E293B", lineHeight: 1.6, fontWeight: 500 }}>{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsSection({ events }) {
  if (!events || events.length === 0) return null;
  const categoryColors = {
    Camp:        { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D" },
    Scholarship: { bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" },
    Awareness:   { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
    default:     { bg: "#F5F3FF", border: "#DDD6FE", text: "#6D28D9" },
  };
  return (
    <div style={{
      background: "#fff", borderRadius: 20, padding: "22px", marginTop: 16,
      boxShadow: "0 4px 24px rgba(37,99,235,0.07)",
    }}>
      <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 13, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        🗓 Upcoming Events
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((event, idx) => {
          const colors = categoryColors[event.category] ?? categoryColors.default;
          const formattedDate = event.date
            ? new Date(event.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
            : "";
          return (
            <div key={event.id ?? idx} style={{
              background: colors.bg, border: `1px solid ${colors.border}`,
              borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827", lineHeight: 1.4, flex: 1 }}>
                  {event.title}
                </p>
                {event.category && (
                  <span style={{
                    background: colors.border, color: colors.text, fontSize: 11, fontWeight: 700,
                    padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap",
                    letterSpacing: "0.04em", flexShrink: 0,
                  }}>{event.category}</span>
                )}
              </div>
              {formattedDate && (
                <p style={{ margin: 0, fontSize: 12, color: "#6B7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <span>📅</span> {formattedDate}
                </p>
              )}
              {event.short_description && (
                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{event.short_description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CitizenBooking() {
  const [language, setLanguage] = useState("en");
  const [step, setStep] = useState(0);

  const [appointmentType, setAppointmentType] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [appointmentDuration, setAppointmentDuration] = useState(5); // NEW
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [arrivingFrom, setArrivingFrom] = useState("");
  const [notes, setNotes] = useState("");

  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [holidays, setHolidays] = useState([]);

  // Booked appointments with duration info
  const [bookedAppointments, setBookedAppointments] = useState([]);

  const [queuePosition, setQueuePosition] = useState(null);

  const [announcements, setAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  const [appointmentId] = useState("SHA-" + Math.floor(1000 + Math.random() * 9000));

  const t = translations[language];

  // ── Fetch holidays ────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchHolidays() {
      const { data, error } = await supabase
        .from("holidays")
        .select("id, holiday_name, holiday_date, holiday_type, category");
      if (!error && data) setHolidays(data);
    }
    fetchHolidays();
  }, []);

  // ── Fetch announcements & events on confirmation ──────────────────────────
  useEffect(() => {
    if (step !== 7) return; // step 7 is confirmation (0-indexed: 0 landing, 1-6 steps, 7 confirm)
    async function fetchPostBookingInfo() {
      const { data: announcementData, error: announcementError } = await supabase
        .from("announcements")
        .select("id, message, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      if (!announcementError && announcementData) setAnnouncements(announcementData);

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id, title, date, category, short_description")
        .eq("show_on_citizen", true)
        .eq("status", "Upcoming")
        .order("date", { ascending: true })
        .limit(3);
      if (!eventError && eventData) setUpcomingEvents(eventData);
    }
    fetchPostBookingInfo();
  }, [step]);

  // ── Holiday / Weekend helpers ─────────────────────────────────────────────

  function isWeekend(dateStr) {
    if (!dateStr) return false;
    const parts = dateStr.split("-");
    const d = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10));
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  function getOfficeStatus(dateStr) {
    if (!dateStr) return { closed: false, reason: null };
    const holiday = holidays.find(h => h.holiday_date === dateStr);
    if (holiday) return { closed: true, reason: holiday.holiday_name };
    if (isWeekend(dateStr)) {
      const parts = dateStr.split("-");
      const d = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10));
      return { closed: true, reason: d.getDay() === 0 ? "Sunday" : "Saturday" };
    }
    return { closed: false, reason: null };
  }

  // ── Today string (local) ──────────────────────────────────────────────────
  const today = new Date();
  const todayStr =
    today.getFullYear() + "-" +
    String(today.getMonth()+1).padStart(2,"0") + "-" +
    String(today.getDate()).padStart(2,"0");

  const effectiveDateStr =
    appointmentType === "today" ? todayStr :
    appointmentType === "future" ? selectedDate : "";

  const officeStatus = getOfficeStatus(effectiveDateStr);

  // ── Fetch booked appointments for the effective date ──────────────────────
  useEffect(() => {
    if (!effectiveDateStr) { setBookedAppointments([]); return; }
    async function fetchBooked() {
      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_time, appointment_duration")
        .eq("appointment_date", effectiveDateStr);
      if (!error && data) setBookedAppointments(data);
      else setBookedAppointments([]);
    }
    fetchBooked();
  }, [effectiveDateStr]);

  // ── Derived occupied slots set ────────────────────────────────────────────
  const occupiedSlots = buildOccupiedSet(bookedAppointments);

  // ── Today past-time filter ────────────────────────────────────────────────
  const isToday =
    appointmentType === "today" ||
    (appointmentType === "future" && selectedDate === todayStr);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // ── Compute validity of each slot for the chosen duration ────────────────
  // A slot is a valid START slot if:
  //   1. Not in past (if today)
  //   2. getOccupiedSlots returns non-null (doesn't cross a break/lunch/close)
  //   3. None of the occupied run is already booked in Supabase
  //
  // Note: slots near the END of a Pomodoro group will be invalid for longer
  // durations because the run would cross into the break gap.
  // e.g. 12:45 is invalid as a 15-min start because 12:45+12:50+12:55 crosses the break.
  // This is CORRECT — those slots are truly unavailable for that duration.
  // We track the reason separately so the UI can explain it clearly.

  function getSlotStatus(slotStr) {
    if (isToday && timeToMinutes(slotStr) <= currentMinutes) {
      return "past";
    }
    if (occupiedSlots.has(slotStr)) {
      return "booked";
    }
    const run = getOccupiedSlots(slotStr, appointmentDuration);
    if (!run) {
      // Crosses a break — not enough room in this group for chosen duration
      return "too-short";
    }
    for (const s of run) {
      if (occupiedSlots.has(s)) return "run-blocked"; // a slot in the run is booked
    }
    return "available";
  }

  function isSlotValidStart(slotStr) {
    return getSlotStatus(slotStr) === "available";
  }

  function isSlotPast(slotStr) {
    return isToday && timeToMinutes(slotStr) <= currentMinutes;
  }

  // Has any valid start slot at all?
  const hasAvailableSlots = ALL_SLOTS.some(s => isSlotValidStart(s));

  // The full run of slots that are auto-selected based on chosen start + duration
  const selectedRun = selectedSlot
    ? (getOccupiedSlots(selectedSlot, appointmentDuration) ?? [])
    : [];

  // ── Save appointment ──────────────────────────────────────────────────────
  const saveAppointment = async () => {
    const bookingDate =
      appointmentType === "today"
        ? todayStr
        : selectedDate;

    const { error } = await supabase
      .from("appointments")
      .insert({
        appointment_id: appointmentId,
        citizen_name: name,
        mobile: mobile,
        purpose: selectedPurpose,
        appointment_date: bookingDate,
        appointment_time: selectedSlot,
        appointment_duration: appointmentDuration,
        officer_name: OFFICER.name,
        location: arrivingFrom,
        status: "Waiting",
      });

    if (error) {
      console.log(error);
      alert("Failed to book appointment");
      return;
    }

    // Queue position
    const { data: dayAppointments } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("appointment_date", bookingDate);

    if (dayAppointments) {
      const sorted = dayAppointments
        .map(a => a.appointment_time)
        .sort((a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b));
      const pos = sorted.indexOf(selectedSlot) + 1;
      setQueuePosition(pos > 0 ? pos : dayAppointments.length);
    }

    setStep(7);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function handlePurposeContinue() {
    if (!selectedPurpose.trim()) return;
    setStep(3); // → duration
  }

  function handleDurationContinue() {
    // after duration: go to date (if future) or slot (if today)
    appointmentType === "future" ? setStep(4) : setStep(5);
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
    setAppointmentDuration(5);
    setSelectedDate("");
    setSelectedSlot("");
    setName("");
    setMobile("");
    setArrivingFrom("");
    setNotes("");
    setFeedbackText("");
    setFeedbackSubmitted(false);
    setBookedAppointments([]);
    setQueuePosition(null);
    setAnnouncements([]);
    setUpcomingEvents([]);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <Header language={language} setLanguage={setLanguage} />
      <ProgressBar step={step} t={t} />

      {/* ── STEP 0: Landing ── */}
      {step === 0 && (
        <div style={landing.outer}>
          <div style={landing.hero}>
            <DualLogoRow />
            <p style={landing.gov}>{t.government}</p>
            <h1 style={landing.org}>{t.welcome}</h1>
            <p style={landing.taglineStyle}>{t.tagline}</p>
            <button style={landing.cta} onClick={() => setStep(1)}>
              <span style={{ marginRight: 8 }}>📅</span>
              {t.bookAppointment}
            </button>
          </div>

          {/* Updated Office Timings */}
          <div style={landing.timingsCard}>
            <p style={landing.timingsHeading}>🕐 {t.officeTimings}</p>
            <div style={landing.timingsGrid}>
              <div style={landing.timingRow}>
                <span style={landing.timingDot("green")} />
                <span>12:00 PM – 1:30 PM</span>
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
                  borderRadius: 16, padding: "20px 22px", cursor: "pointer",
                  background: appointmentType === opt.key ? "#EFF6FF" : "#fff",
                  display: "flex", alignItems: "center", gap: 16, transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 28 }}>{opt.icon}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#111827" }}>{opt.label}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>{opt.desc}</p>
                </div>
                <span style={{
                  marginLeft: "auto", width: 22, height: 22, borderRadius: "50%",
                  border: `2px solid ${appointmentType === opt.key ? "#2563EB" : "#D1D5DB"}`,
                  background: appointmentType === opt.key ? "#2563EB" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
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
              width: "100%", padding: "14px 16px", borderRadius: 12,
              border: "1.5px solid #D1D5DB", fontSize: 15, color: "#111827",
              resize: "vertical", minHeight: 130, fontFamily: "inherit",
              outline: "none", boxSizing: "border-box", lineHeight: 1.6, transition: "border-color 0.15s",
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

      {/* ── STEP 3: Duration (NEW) ── */}
      {step === 3 && (
        <Card>
          <StepHeading>How much meeting time do you require?</StepHeading>
          <OfficerBadge t={t} />

          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280", fontWeight: 500, lineHeight: 1.6 }}>
            Select how long you need with the Managing Director. Each slot is 5 minutes.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
            {DURATION_OPTIONS.map((dur) => {
              const isSelected = appointmentDuration === dur;
              return (
                <button
                  key={dur}
                  onClick={() => { setAppointmentDuration(dur); setSelectedSlot(""); }}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 12,
                    border: `2px solid ${isSelected ? "#2563EB" : "#E5E7EB"}`,
                    background: isSelected ? "linear-gradient(135deg,#2563EB,#1E3A8A)" : "#F9FAFB",
                    color: isSelected ? "#fff" : "#374151",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: 15,
                    cursor: "pointer",
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.15s",
                    boxShadow: isSelected ? "0 4px 14px rgba(37,99,235,0.3)" : "none",
                  }}
                >
                  {dur} Minutes
                </button>
              );
            })}
          </div>

          <div style={{
            background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 12,
            padding: "14px 18px", marginTop: 16, display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>⏱</span>
            <p style={{ margin: 0, fontSize: 13, color: "#0369A1", fontWeight: 600 }}>
              You selected <strong>{appointmentDuration} minute{appointmentDuration > 5 ? "s" : ""}</strong>.
              {appointmentDuration > 5 && ` This will reserve ${appointmentDuration / 5} consecutive 5-minute slots.`}
            </p>
          </div>

          <PrimaryButton onClick={handleDurationContinue}>
            {t.continue}
          </PrimaryButton>
        </Card>
      )}

      {/* ── STEP 4: Date (Future only) ── */}
      {step === 4 && (
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
              width: "100%", padding: "13px 16px", borderRadius: 12,
              border: "1.5px solid #D1D5DB", fontSize: 16, color: "#111827",
              outline: "none", boxSizing: "border-box", fontFamily: "inherit",
            }}
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(""); }}
          />
          {selectedDate && officeStatus.closed && (
            <div style={{ marginTop: 16 }}>
              <OfficeClosedCard reason={officeStatus.reason} dateStr={effectiveDateStr} />
            </div>
          )}
          <PrimaryButton onClick={() => setStep(5)} disabled={!selectedDate || officeStatus.closed}>
            {t.continue}
          </PrimaryButton>
        </Card>
      )}

      {/* ── STEP 5: Time Slot ── */}
      {step === 5 && (
        <Card>
          <StepHeading>{t.selectSlot}</StepHeading>
          <OfficerBadge t={t} />

          {/* Duration reminder pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#EFF6FF", border: "1px solid #BFDBFE",
            borderRadius: 99, padding: "6px 14px", marginBottom: 20,
          }}>
            <span style={{ fontSize: 13 }}>⏱</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>
              {appointmentDuration} min appointment
            </span>
          </div>

          {officeStatus.closed ? (
            <OfficeClosedCard reason={officeStatus.reason} dateStr={effectiveDateStr} />
          ) : !hasAvailableSlots ? (
            <div style={{
              background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 12,
              padding: "16px 20px", marginBottom: 16, textAlign: "center",
              color: "#DC2626", fontWeight: 600, fontSize: 14,
            }}>
              ⚠️ No available slots for the selected duration today. Please try a shorter duration or a future date.
            </div>
          ) : (
            <>
              {/* Morning Section */}
              {(() => {
                const morningGroups = SLOT_GROUPS.filter(g => g.section === "morning");
                const morningSlots = morningGroups.flatMap(g => g.slots);
                const visibleMorning = morningSlots.filter(s => !isSlotPast(s));
                if (visibleMorning.length === 0) return null;
                return (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{
                      margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#6B7280",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>☀️ Morning Session — 12:00 PM to 1:30 PM</p>
                    {morningGroups.map((group, gi) => {
                      const visible = group.slots.filter(s => !isSlotPast(s));
                      if (visible.length === 0) return null;
                      return (
                        <div key={gi} style={{ marginBottom: 12 }}>
                          <SlotRow
                            slots={visible}
                            selectedSlot={selectedSlot}
                            setSelectedSlot={setSelectedSlot}
                            getSlotStatus={getSlotStatus}
                            selectedRun={selectedRun}
                            appointmentDuration={appointmentDuration}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Lunch Banner */}
              {(() => {
                const morningVisible = SLOT_GROUPS
                  .filter(g => g.section === "morning")
                  .flatMap(g => g.slots)
                  .some(s => !isSlotPast(s));
                const afternoonVisible = SLOT_GROUPS
                  .filter(g => g.section === "afternoon")
                  .flatMap(g => g.slots)
                  .some(s => !isSlotPast(s));
                if (!morningVisible || !afternoonVisible) return null;
                return (
                  <div style={{
                    background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 12,
                    padding: "12px 16px", textAlign: "center", marginBottom: 20,
                    color: "#92400E", fontWeight: 700, fontSize: 13,
                  }}>
                    🍽 Lunch Break — 1:30 PM to 2:30 PM
                  </div>
                );
              })()}

              {/* Afternoon Section */}
              {(() => {
                const afternoonGroups = SLOT_GROUPS.filter(g => g.section === "afternoon");
                const afternoonSlots = afternoonGroups.flatMap(g => g.slots);
                const visibleAfternoon = afternoonSlots.filter(s => !isSlotPast(s));
                if (visibleAfternoon.length === 0) return null;
                return (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{
                      margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#6B7280",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>🌤 Afternoon Session — 2:30 PM to 5:00 PM</p>
                    {afternoonGroups.map((group, gi) => {
                      const visible = group.slots.filter(s => !isSlotPast(s));
                      if (visible.length === 0) return null;
                      return (
                        <div key={gi} style={{ marginBottom: 12 }}>
                          <SlotRow
                            slots={visible}
                            selectedSlot={selectedSlot}
                            setSelectedSlot={setSelectedSlot}
                            getSlotStatus={getSlotStatus}
                            selectedRun={selectedRun}
                            appointmentDuration={appointmentDuration}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}

          <PrimaryButton
            onClick={() => setStep(6)}
            disabled={!selectedSlot || officeStatus.closed}
          >
            {t.continue}
          </PrimaryButton>
        </Card>
      )}

      {/* ── STEP 6: Personal Details ── */}
      {step === 6 && (
        <Card>
          <StepHeading>{t.details}</StepHeading>
          <OfficerBadge t={t} />

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t.fullName}</label>
            <input
              type="text"
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 12,
                border: "1.5px solid #D1D5DB", fontSize: 15, color: "#111827",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
              placeholder={t.fullNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t.mobile}</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 12,
                border: `1.5px solid ${mobile.length > 0 && mobile.length < 10 ? "#F87171" : "#D1D5DB"}`,
                fontSize: 15, color: "#111827", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
              placeholder={t.mobilePlaceholder}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g,"").slice(0,10))}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = mobile.length > 0 && mobile.length < 10 ? "#F87171" : "#D1D5DB")}
            />
            {mobile.length > 0 && mobile.length < 10 && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#DC2626", fontWeight: 500 }}>
                Please enter a valid 10-digit mobile number.
              </p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Arriving From</label>
            <input
              type="text"
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 12,
                border: "1.5px solid #D1D5DB", fontSize: 15, color: "#111827",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
              placeholder="Enter your city, village or area"
              value={arrivingFrom}
              onChange={(e) => setArrivingFrom(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
            />
          </div>

          <div style={{ marginBottom: 4 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {t.notes}{" "}
              <span style={{ fontWeight: 400, color: "#9CA3AF" }}>{t.notesOptional}</span>
            </label>
            <textarea
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 12,
                border: "1.5px solid #D1D5DB", fontSize: 15, color: "#111827",
                resize: "vertical", minHeight: 90, fontFamily: "inherit",
                outline: "none", boxSizing: "border-box",
              }}
              placeholder={t.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
            />
          </div>

          <PrimaryButton onClick={saveAppointment} disabled={!name.trim() || mobile.length !== 10}>
            {t.confirm}
          </PrimaryButton>
        </Card>
      )}

      {/* ── STEP 7: Confirmation ── */}
      {step === 7 && (
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
                <p style={conf.rowValue}>{OFFICER.name}
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#6B7280", fontWeight: 400 }}>{t.designationMD}</span>
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
                <p style={conf.rowValue}>{selectedSlot} — {appointmentDuration} minutes</p>
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
              <>
                <div style={conf.divider} />
                <div style={conf.row}>
                  <span style={conf.rowIcon}>📍</span>
                  <div>
                    <p style={conf.rowLabel}>Arriving From</p>
                    <p style={conf.rowValue}>{arrivingFrom}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <a
            href={`https://wa.me/?text=My appointment at MSTDCL is confirmed. Token: ${appointmentId}. Time: ${selectedSlot} (${appointmentDuration} min) on ${displayDate}.`}
            target="_blank"
            rel="noopener noreferrer"
            style={conf.whatsapp}
          >
            <span style={{ fontSize: 20 }}>💬</span> {t.whatsappBtn}
          </a>

          <AnnouncementsSection announcements={announcements} />
          <EventsSection events={upcomingEvents} />

          {/* Feedback */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "22px", marginTop: 16, boxShadow: "0 4px 24px rgba(37,99,235,0.07)" }}>
            <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 13, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              💬 Citizen Feedback
            </p>
            {feedbackSubmitted ? (
              <div style={{ background: "#ECFDF5", border: "1.5px solid #6EE7B7", borderRadius: 12, padding: "16px 20px", textAlign: "center", color: "#065F46", fontWeight: 700, fontSize: 15 }}>
                ✅ Feedback Submitted. Thank you.
              </div>
            ) : (
              <div>
                <textarea
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid #D1D5DB",
                    fontSize: 15, color: "#111827", resize: "vertical", minHeight: 90,
                    fontFamily: "inherit", outline: "none", boxSizing: "border-box", lineHeight: 1.6,
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
                    width: "100%", padding: "14px", marginTop: 12, borderRadius: 12, border: "none",
                    background: !feedbackText.trim() ? "#93C5FD" : "linear-gradient(135deg,#2563EB,#1E3A8A)",
                    color: "#fff", fontSize: 15, fontWeight: 700,
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
              width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid #D1D5DB",
              background: "#fff", color: "#374151", fontSize: 15, fontWeight: 600,
              cursor: "pointer", marginTop: 12,
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

// ─── SlotRow sub-component ────────────────────────────────────────────────────
//
// Status values from getSlotStatus():
//   "available"   → white, clickable
//   "past"        → very light grey, not clickable
//   "booked"      → pink/red tint, "Booked" label, not clickable
//   "too-short"   → very light grey (not enough room in group for duration), not clickable
//   "run-blocked" → light grey (a slot in its run is taken), not clickable
//
// selectedRun: array of slot strings currently auto-selected (start + consecutive)

function SlotRow({ slots, selectedSlot, setSelectedSlot, getSlotStatus, selectedRun, appointmentDuration }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
      {slots.map((slotStr, i) => {
        const status    = getSlotStatus(slotStr);
        const isStart   = selectedSlot === slotStr;
        const isInRun   = !isStart && selectedRun.includes(slotStr);
        const isClickable = status === "available";

        // ── Visual config per state ──────────────────────────────────────
        let bg, border, color, fontWeight, shadow, scale, opacity, sublabel;

        if (isStart) {
          // The tapped start slot — bold blue
          bg = "linear-gradient(135deg,#2563EB,#1E3A8A)";
          border = "#2563EB";
          color = "#fff";
          fontWeight = 700;
          shadow = "0 4px 12px rgba(37,99,235,0.35)";
          scale = "scale(1.06)";
          opacity = 1;
          sublabel = <span style={{ display:"block", fontSize:9, color:"rgba(255,255,255,0.85)", fontWeight:700, marginTop:2 }}>Start</span>;

        } else if (isInRun) {
          // Auto-selected consecutive slots — light blue
          bg = "#DBEAFE";
          border = "#93C5FD";
          color = "#1E3A8A";
          fontWeight = 700;
          shadow = "none";
          scale = "scale(1.03)";
          opacity = 1;
          sublabel = <span style={{ display:"block", fontSize:9, color:"#2563EB", fontWeight:700, marginTop:2 }}>✓</span>;

        } else if (status === "booked") {
          // Already booked by someone else — pink tint
          bg = "#FEE2E2";
          border = "#FECACA";
          color = "#9CA3AF";
          fontWeight = 500;
          shadow = "none";
          scale = "scale(1)";
          opacity = 1;
          sublabel = <span style={{ display:"block", fontSize:9, color:"#EF4444", fontWeight:700, marginTop:2 }}>Booked</span>;

        } else if (status === "too-short" || status === "run-blocked") {
          // Not enough consecutive room for chosen duration — subtle grey, no alarming label
          bg = "#F9FAFB";
          border = "#E5E7EB";
          color = "#C4C4C4";
          fontWeight = 400;
          shadow = "none";
          scale = "scale(1)";
          opacity = 0.6;
          sublabel = null;

        } else if (status === "past") {
          // Past time — very faint
          bg = "#F9FAFB";
          border = "#E5E7EB";
          color = "#D1D5DB";
          fontWeight = 400;
          shadow = "none";
          scale = "scale(1)";
          opacity = 0.45;
          sublabel = null;

        } else {
          // "available" and not in run — normal white
          bg = "#fff";
          border = "#E5E7EB";
          color = "#374151";
          fontWeight = 500;
          shadow = "none";
          scale = "scale(1)";
          opacity = 1;
          sublabel = null;
        }

        return (
          <button
            key={i}
            onClick={() => isClickable && setSelectedSlot(slotStr)}
            disabled={!isClickable}
            title={
              status === "past"        ? "This time has already passed" :
              status === "booked"      ? "Already booked" :
              status === "too-short"   ? `Need ${appointmentDuration} consecutive minutes — not enough room here` :
              status === "run-blocked" ? "A slot in this time range is already booked" :
              ""
            }
            style={{
              padding: "10px 4px",
              borderRadius: 10,
              border: `2px solid ${border}`,
              background: bg,
              color,
              fontWeight,
              fontSize: 12,
              cursor: isClickable ? "pointer" : "not-allowed",
              opacity,
              transform: scale,
              transition: "all 0.15s",
              boxShadow: shadow,
              minHeight: 52,
            }}
          >
            {slotStr.replace(" PM","").replace(" AM","")}
            {sublabel}
          </button>
        );
      })}
    </div>
  );
}

// ─── Landing Styles ───────────────────────────────────────────────────────────

const landing = {
  outer: { padding: "0 16px 40px" },
  hero: {
    background: "linear-gradient(145deg,#1E3A8A 0%,#2563EB 60%,#3B82F6 100%)",
    borderRadius: 24, padding: "48px 32px 52px", textAlign: "center",
    maxWidth: 640, margin: "20px auto 0", boxShadow: "0 8px 32px rgba(37,99,235,0.35)",
  },
  gov: { margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" },
  org: { margin: "0 0 12px", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.3 },
  taglineStyle: { margin: "0 0 32px", fontSize: 14, color: "rgba(255,255,255,0.75)", letterSpacing: "0.04em" },
  cta: {
    padding: "16px 36px", fontSize: 16, fontWeight: 700, border: "none", borderRadius: 12,
    background: "#fff", color: "#1E3A8A", cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)", letterSpacing: "0.02em",
  },
  timingsCard: {
    background: "#fff", borderRadius: 18, padding: "22px 24px",
    maxWidth: 640, margin: "16px auto 0", boxShadow: "0 4px 24px rgba(37,99,235,0.07)",
  },
  timingsHeading: { margin: "0 0 14px", fontWeight: 700, fontSize: 15, color: "#111827" },
  timingsGrid: { display: "flex", flexDirection: "column", gap: 10 },
  timingRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#374151", fontWeight: 500 },
  timingDot: (color) => ({
    width: 10, height: 10, borderRadius: "50%",
    background: color === "green" ? "#22C55E" : "#F59E0B",
    flexShrink: 0,
  }),
};

// ─── Confirmation Styles ──────────────────────────────────────────────────────

const conf = {
  banner: {
    background: "linear-gradient(135deg,#059669,#10B981)", borderRadius: 20,
    padding: "24px", display: "flex", alignItems: "center", gap: 16,
    boxShadow: "0 6px 20px rgba(16,185,129,0.35)",
  },
  checkCircle: {
    width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22, color: "#fff", fontWeight: 700, flexShrink: 0,
  },
  tokenCard: {
    textAlign: "center", background: "#EFF6FF", border: "2px dashed #BFDBFE",
    borderRadius: 16, padding: "22px 16px", marginTop: 16,
  },
  tokenLabel: { margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.12em", textTransform: "uppercase" },
  tokenValue: { margin: 0, fontSize: 36, fontWeight: 900, color: "#1E3A8A", letterSpacing: "0.08em" },
  detailsCard: {
    background: "#fff", borderRadius: 20, padding: "22px", marginTop: 16,
    boxShadow: "0 4px 24px rgba(37,99,235,0.07)",
  },
  sectionLabel: { margin: "0 0 16px", fontWeight: 700, fontSize: 13, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em" },
  row: { display: "flex", alignItems: "flex-start", gap: 12, padding: "4px 0" },
  rowIcon: { fontSize: 18, marginTop: 2, flexShrink: 0 },
  rowLabel: { margin: 0, fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" },
  rowValue: { margin: "2px 0 0", fontSize: 15, color: "#111827", fontWeight: 600 },
  divider: { height: 1, background: "#F3F4F6", margin: "12px 0" },
  whatsapp: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    marginTop: 16, padding: "16px",
    background: "linear-gradient(135deg,#16A34A,#22C55E)", color: "#fff",
    borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: "none",
    boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
  },
};