import { useState, useEffect, useRef, useCallback } from "react";
import tribalLogo from "../../assets/tribal-logo.jpg";
import { supabase } from "../../lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const POMODORO_BREAKS = [
  { time: "12:25 PM", label: "Pomodoro Break" },
  { time: "12:55 PM", label: "Pomodoro Break" },
  { time: "02:55 PM", label: "Pomodoro Break" },
  { time: "03:25 PM", label: "Pomodoro Break" },
  { time: "03:55 PM", label: "Pomodoro Break" },
  { time: "04:25 PM", label: "Pomodoro Break" },
  { time: "04:55 PM", label: "Pomodoro Break" },
];

const LUNCH_BREAK = { time: "01:30 PM", endTime: "02:30 PM", label: "Lunch Break" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayLocalDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const dd   = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDynamicGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return "Good Morning, Madam 🌿";
  if (hour >= 12 && hour < 17) return "Good Afternoon, Madam ☀️";
  if (hour >= 17 && hour < 21) return "Good Evening, Madam 🌆";
  return "Good Night, Madam 🌙";
}

function getMeetingTimeLabel(timeStr) {
  if (!timeStr) return "";
  const [hourStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  if (hour >= 5  && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

function isMeetLinkValid(link) {
  return link && link.trim() !== "" && link.trim().toLowerCase() !== "no";
}

function sortByTime(arr, key) {
  return [...arr].sort((a, b) => (a[key] ?? "").localeCompare(b[key] ?? ""));
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const s = timeStr.trim();
  if (s.includes("AM") || s.includes("PM")) {
    const d = new Date(`1970-01-01 ${s}`);
    return d.getHours() * 60 + d.getMinutes();
  }
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
}

function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function formatDateRange(start, end) {
  const fmt = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (!end || end === start) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

// ─── Popup Component ──────────────────────────────────────────────────────────

function Popup({ data, onComplete, onClose }) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(t); onClose(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onClose]);

  const isBreak = data.type === "break";

  return (
    <div style={popupStyles.overlay}>
      <div style={{ ...popupStyles.box, borderTop: `5px solid ${isBreak ? "#F59E0B" : "#2563EB"}` }}>
        <div style={popupStyles.progressTrack}>
          <div style={{ ...popupStyles.progressFill, width: `${(seconds / 30) * 100}%`, background: isBreak ? "#F59E0B" : "#2563EB" }} />
        </div>

        <div style={{ padding: "24px 28px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: isBreak ? "#D97706" : "#2563EB", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {isBreak ? "☕ Break Time" : "⏰ Appointment Time Completed"}
              </p>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>
                {isBreak ? "Time for a short break!" : data.citizen_name}
              </h2>
            </div>
            <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 700, background: "#F3F4F6", borderRadius: 99, padding: "4px 10px" }}>
              {seconds}s
            </span>
          </div>

          {isBreak ? (
            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 18px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
                You've completed the previous session. Please take a short 5-minute break.
              </p>
              {data.nextTime && (
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#78350F" }}>
                  🕐 Next appointment begins at: <strong>{data.nextTime}</strong>
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <InfoRow icon="📋" label="Purpose" value={data.purpose} />
              <InfoRow icon="🕐" label="Scheduled Time" value={`${data.appointment_time}${data.appointment_end_time ? ` – ${data.appointment_end_time}` : ""}`} />
              <InfoRow icon="🎫" label="Appointment ID" value={data.appointment_id} />
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {!isBreak && (
              <button onClick={onComplete} style={popupStyles.completeBtn}>
                ✅ Meeting Completed
              </button>
            )}
            <button onClick={onClose} style={popupStyles.closeBtn}>
              ❌ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F8FAFC", borderRadius: 10, padding: "10px 14px" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, minWidth: 110 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{value || "—"}</span>
    </div>
  );
}

const popupStyles = {
  overlay: { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  box:     { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", overflow: "hidden" },
  progressTrack: { height: 4, background: "#F3F4F6", width: "100%" },
  progressFill:  { height: "100%", transition: "width 1s linear", borderRadius: 2 },
  completeBtn: { flex: 1, padding: "12px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" },
  closeBtn:    { padding: "12px 16px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};

// ─── Timeline Section ─────────────────────────────────────────────────────────

function TodayTimeline({ appointments, meetings }) {
  const now = nowMinutes();
  const events = [];

  appointments.forEach(a => {
    events.push({ type: "appointment", time: a.appointment_time, endTime: a.appointment_end_time, minutes: parseTimeToMinutes(a.appointment_time), label: a.citizen_name, sub: a.purpose, status: a.status, duration: a.appointment_duration, id: a.appointment_id });
  });

  meetings.forEach(m => {
    events.push({ type: "meeting", time: m.meeting_time, endTime: m.meeting_end_time, minutes: parseTimeToMinutes(m.meeting_time), label: m.title, sub: `with ${m.meeting_with}`, status: m.status });
  });

  if (appointments.length > 0) {
    POMODORO_BREAKS.forEach(b => {
      events.push({ type: "break", time: b.time, minutes: parseTimeToMinutes(b.time), label: "Pomodoro Break", sub: "5-minute rest" });
    });
    events.push({ type: "lunch", time: LUNCH_BREAK.time, endTime: LUNCH_BREAK.endTime, minutes: parseTimeToMinutes(LUNCH_BREAK.time), label: "Lunch Break", sub: "1:30 PM – 2:30 PM" });
  }

  events.sort((a, b) => a.minutes - b.minutes);

  if (events.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No events scheduled today</p>
      </div>
    );
  }

  const typeConfig = {
    appointment: { dot: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "👤" },
    meeting:     { dot: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: "🤝" },
    break:       { dot: "#F59E0B", bg: "#FEF3C7", border: "#FDE68A", icon: "☕" },
    lunch:       { dot: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", icon: "🍽" },
  };

  const statusColor = { "Completed": "#059669", "In Cabin": "#2563EB", "Waiting": "#D97706", "Cancelled": "#DC2626" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {events.map((ev, idx) => {
        const cfg = typeConfig[ev.type] || typeConfig.appointment;
        const isPast = ev.minutes < now;
        const isCurrent = ev.type === "appointment" && ev.status === "In Cabin";
        const isLast = idx === events.length - 1;

        return (
          <div key={idx} style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
            <div style={{ width: 80, flexShrink: 0, paddingTop: 18, textAlign: "right", paddingRight: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isPast ? "#9CA3AF" : "#374151", whiteSpace: "nowrap" }}>
                {ev.time?.replace(" PM","").replace(" AM","") || ""}
              </span>
            </div>
            <div style={{ width: 24, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>
              <div style={{ width: isCurrent ? 14 : 10, height: isCurrent ? 14 : 10, borderRadius: "50%", background: isPast ? "#D1D5DB" : cfg.dot, border: isCurrent ? `3px solid ${cfg.dot}` : "none", boxShadow: isCurrent ? `0 0 0 4px ${cfg.bg}` : "none", flexShrink: 0, zIndex: 1 }} />
              {!isLast && <div style={{ width: 2, flex: 1, background: "#E5E7EB", minHeight: 32, marginTop: 4 }} />}
            </div>
            <div style={{ flex: 1, margin: "10px 0 10px 10px", background: isPast && ev.type === "appointment" && ev.status === "Completed" ? "#F0FDF4" : cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: "12px 16px", opacity: isPast && ev.type === "break" ? 0.5 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isPast ? "#6B7280" : "#111827" }}>{ev.label}</p>
                    {ev.sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B7280" }}>{ev.sub}</p>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  {ev.endTime && <span style={{ fontSize: 10, color: "#6B7280", whiteSpace: "nowrap" }}>→ {ev.endTime?.replace(" PM","").replace(" AM","")}</span>}
                  {ev.duration && <span style={{ fontSize: 10, fontWeight: 700, color: cfg.dot, background: "#fff", padding: "2px 8px", borderRadius: 99, border: `1px solid ${cfg.border}` }}>{ev.duration} min</span>}
                  {ev.status && <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[ev.status] || "#6B7280" }}>{ev.status}</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tour Status Banner ───────────────────────────────────────────────────────

function TourStatusBanner({ tour }) {
  if (tour) {
    return (
      <div style={{ background: "linear-gradient(135deg,#FEF3C7,#FFFBEB)", border: "1.5px solid #FDE68A", borderRadius: 16, padding: "16px 24px", marginBottom: 22, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 16px rgba(245,158,11,0.15)" }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>✈️</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "#D97706", letterSpacing: "0.1em", textTransform: "uppercase" }}>Currently on Tour</p>
          <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#111827" }}>Madam is currently on Tour — {tour.destination}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#78350F" }}>{tour.purpose} &nbsp;·&nbsp; {formatDateRange(tour.start_date, tour.end_date)}</p>
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: "#ECFDF5", border: "1.5px solid #A7F3D0", borderRadius: 16, padding: "12px 24px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981", flexShrink: 0, display: "inline-block" }} />
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#065F46" }}>🟢 Madam is in Office</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MDDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [meetings, setMeetings]         = useState([]);
  const [tourDiary, setTourDiary]       = useState([]);
  const [popup, setPopup]               = useState(null);
  const [greeting, setGreeting]         = useState(getDynamicGreeting());

  const shownPopupsRef = useRef(new Set());
  const today = getTodayLocalDate();

  const fetchAll = useCallback(async () => {
    const [apptRes, meetRes, tourRes] = await Promise.all([
      supabase.from("appointments").select("*").eq("appointment_date", today).order("appointment_time", { ascending: true }),
      supabase.from("executive_meetings").select("*").eq("meeting_date", today),
      supabase.from("tour_diary").select("*"),
    ]);
    if (!apptRes.error) setAppointments(apptRes.data ?? []);
    if (!meetRes.error) setMeetings(sortByTime(meetRes.data ?? [], "meeting_time"));
    if (!tourRes.error) setTourDiary(tourRes.data ?? []);
  }, [today]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    const t = setInterval(() => setGreeting(getDynamicGreeting()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function checkPopups() {
      const now = nowMinutes();

      const inCabin = appointments.find(a => a.status === "In Cabin");
      if (inCabin && inCabin.appointment_end_time) {
        const endMin = parseTimeToMinutes(inCabin.appointment_end_time);
        const key = `appt-${inCabin.appointment_id}`;
        if (now >= endMin && !shownPopupsRef.current.has(key)) {
          shownPopupsRef.current.add(key);
          setPopup({ type: "appointment", ...inCabin });
          return;
        }
      }

      for (const brk of POMODORO_BREAKS) {
        const breakMin = parseTimeToMinutes(brk.time);
        const key = `break-${brk.time}`;
        if (now >= breakMin && now <= breakMin + 5 && !shownPopupsRef.current.has(key)) {
          const nextAppt = appointments
            .filter(a => parseTimeToMinutes(a.appointment_time) > breakMin)
            .sort((a, b) => parseTimeToMinutes(a.appointment_time) - parseTimeToMinutes(b.appointment_time))[0];
          shownPopupsRef.current.add(key);
          setPopup({ type: "break", label: brk.label, nextTime: nextAppt?.appointment_time || null });
          return;
        }
      }
    }

    checkPopups();
    const t = setInterval(checkPopups, 30000);
    return () => clearInterval(t);
  }, [appointments]);

  const handleMarkCompleted = async () => {
    if (!popup || popup.type !== "appointment") return;
    const { error } = await supabase.from("appointments").update({ status: "Completed" }).eq("id", popup.id);
    if (error) console.log(error);
    setPopup(null);
    fetchAll();
  };

  const currentCitizen  = appointments.find(a => a.status === "In Cabin") || null;
  const waitingCitizens = sortByTime(appointments.filter(a => a.status === "Waiting"), "appointment_time");
  const nextCitizen     = waitingCitizens[0] || null;
  const completedCount  = appointments.filter(a => a.status === "Completed").length;
  const totalCount      = appointments.length;
  const progressPct     = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const activeTour = tourDiary.find(t => {
    if (!t.start_date) return false;
    const end = t.end_date || t.start_date;
    return today >= t.start_date && today <= end && t.status !== "Cancelled";
  }) || null;

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4FF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {popup && <Popup data={popup} onComplete={handleMarkCompleted} onClose={() => setPopup(null)} />}

      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37,99,235,0.5); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 12px rgba(37,99,235,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-card:hover { transform: translateY(-4px) scale(1.02); }
        .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .meeting-card:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(37,99,235,0.15) !important; }
        .meeting-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .join-btn:hover { filter: brightness(1.1); transform: scale(1.03); }
        .join-btn { transition: filter 0.15s, transform 0.15s; }
        .citizen-row:hover { background: #EFF6FF !important; }
        .citizen-row { transition: background 0.15s; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)", padding: "0 36px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 24px rgba(37,99,235,0.3)", position: "sticky", top: 0, zIndex: 100, minHeight: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            <img src={tribalLogo} alt="Logo" style={{ width: 48, height: 48, objectFit: "contain" }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Government of Maharashtra</p>
            <h2 style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>Maharashtra State Cooperative Tribal Development Corporation Limited</h2>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", borderRadius: 99, padding: "8px 16px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", animation: "pulse-ring 1.8s ease infinite", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>Live Dashboard</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 16px" }}>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "32px 36px 48px", animation: "fadeSlideUp 0.4s ease" }}>

        {/* TOUR STATUS */}
        <TourStatusBanner tour={activeTour} />

        {/* WELCOME BANNER */}
        <div style={{ background: "linear-gradient(120deg, #1E3A8A 0%, #2563EB 50%, #7C3AED 100%)", borderRadius: 24, padding: "36px 40px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 32px rgba(37,99,235,0.35)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: 120, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -60, right: -20, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ position: "relative" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Executive Monitoring Dashboard</p>
            <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{greeting}</h1>
            <p style={{ margin: "10px 0 0", fontSize: 15, color: "rgba(255,255,255,0.75)" }}>
              You have <strong style={{ color: "#fff" }}>{totalCount} citizens</strong> scheduled and <strong style={{ color: "#fff" }}>{meetings.length} executive meetings</strong> today.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, position: "relative" }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>👩‍💼</div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Leena Bansod</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Managing Director</span>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 28 }}>
          <StatCard title="Today's Citizens" value={totalCount}             icon="👥" gradient="linear-gradient(135deg,#3B82F6,#2563EB)" shadow="rgba(37,99,235,0.35)" />
          <StatCard title="Waiting"          value={waitingCitizens.length} icon="⏳" gradient="linear-gradient(135deg,#F59E0B,#D97706)" shadow="rgba(217,119,6,0.35)" />
          <StatCard title="Meetings"         value={meetings.length}        icon="📋" gradient="linear-gradient(135deg,#10B981,#059669)" shadow="rgba(5,150,105,0.35)" />
          <StatCard title="Completed"        value={completedCount}         icon="✅" gradient="linear-gradient(135deg,#8B5CF6,#7C3AED)" shadow="rgba(124,58,237,0.35)" />
        </div>

        {/* CURRENT + NEXT CITIZEN */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 }}>

          {/* Currently Meeting */}
          <div style={{ background: "#fff", borderRadius: 22, padding: 28, boxShadow: "0 8px 32px rgba(37,99,235,0.12)", border: "2px solid #DBEAFE", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #2563EB, #7C3AED)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3B82F6", animation: "pulse-ring 1.8s ease infinite", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.1em", textTransform: "uppercase" }}>Currently Meeting</span>
            </div>
            {currentCitizen ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#DBEAFE,#EFF6FF)", border: "2px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#2563EB" }}>
                    {currentCitizen.citizen_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>{currentCitizen.citizen_name}</h2>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>{currentCitizen.purpose}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", padding: "4px 10px", borderRadius: 99, border: "1px solid #BFDBFE" }}>🕐 {currentCitizen.appointment_time}</span>
                  {currentCitizen.appointment_end_time && <span style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", background: "#F5F3FF", padding: "4px 10px", borderRadius: 99, border: "1px solid #DDD6FE" }}>→ {currentCitizen.appointment_end_time}</span>}
                  {currentCitizen.appointment_duration && <span style={{ fontSize: 12, fontWeight: 600, color: "#059669", background: "#ECFDF5", padding: "4px 10px", borderRadius: 99, border: "1px solid #A7F3D0" }}>⏱ {currentCitizen.appointment_duration} min</span>}
                </div>
                <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#1E3A8A", fontWeight: 600 }}>Token</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#2563EB", letterSpacing: "0.04em" }}>{currentCitizen.appointment_id}</span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🪑</div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Cabin Available</h2>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6B7280" }}>No citizen in cabin currently</p>
              </div>
            )}
          </div>

          {/* Next Citizen */}
          <div style={{ background: "#fff", borderRadius: 22, padding: 28, boxShadow: "0 8px 32px rgba(16,185,129,0.1)", border: "2px solid #D1FAE5", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #10B981, #059669)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.1em", textTransform: "uppercase" }}>⏭ Next Citizen</span>
            </div>
            {nextCitizen ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#D1FAE5,#ECFDF5)", border: "2px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#059669" }}>
                    {nextCitizen.citizen_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>{nextCitizen.citizen_name}</h2>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>{nextCitizen.purpose}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#059669", background: "#ECFDF5", padding: "4px 10px", borderRadius: 99, border: "1px solid #A7F3D0" }}>🕐 {nextCitizen.appointment_time}</span>
                  {nextCitizen.appointment_end_time && <span style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", background: "#F5F3FF", padding: "4px 10px", borderRadius: 99, border: "1px solid #DDD6FE" }}>→ {nextCitizen.appointment_end_time}</span>}
                  {nextCitizen.appointment_duration && <span style={{ fontSize: 12, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", padding: "4px 10px", borderRadius: 99, border: "1px solid #BFDBFE" }}>⏱ {nextCitizen.appointment_duration} min</span>}
                </div>
                <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#065F46", fontWeight: 600 }}>Token</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#10B981", letterSpacing: "0.04em" }}>{nextCitizen.appointment_id}</span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>No One Waiting</h2>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6B7280" }}>Queue is clear right now</p>
              </div>
            )}
          </div>
        </div>

        {/* EXECUTIVE MEETINGS */}
        <div style={{ background: "#fff", borderRadius: 22, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.06)", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Scheduled</p>
              <h2 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>Executive Meetings</h2>
            </div>
            <span style={{ background: "#EFF6FF", color: "#2563EB", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 99, border: "1px solid #BFDBFE" }}>{meetings.length} Today</span>
          </div>
          {meetings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No executive meetings today</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
              {meetings.map((meeting, index) => {
                const linkValid = isMeetLinkValid(meeting.meet_link);
                return (
                  <div key={meeting.id ?? index} className="meeting-card" style={{ background: "linear-gradient(135deg,#F8FAFF,#F0F4FF)", padding: "22px 24px", borderRadius: 18, border: "1px solid #DBEAFE", boxShadow: "0 4px 16px rgba(37,99,235,0.07)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>{getMeetingTimeLabel(meeting.meeting_time)}</p>
                        <h3 style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 800, color: "#111827" }}>{meeting.title}</h3>
                      </div>
                      <span style={{ background: "#fff", color: "#2563EB", fontSize: 13, fontWeight: 700, padding: "5px 12px", borderRadius: 99, border: "1px solid #BFDBFE", flexShrink: 0, marginLeft: 10 }}>{meeting.meeting_time}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>🏛️</span><span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{meeting.meeting_with}</span></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>🎥</span><span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{meeting.mode ?? "Google Meet"}</span></div>
                      {meeting.status && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>📌</span><span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{meeting.status}</span></div>}
                    </div>
                    {linkValid ? (
                      <a href={meeting.meet_link} target="_blank" rel="noopener noreferrer" className="join-btn" style={{ display: "block", background: "linear-gradient(135deg,#10B981,#059669)", color: "white", border: "none", padding: "11px 22px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: "0.03em", boxShadow: "0 4px 12px rgba(16,185,129,0.35)", width: "100%", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>🔗 Join Meeting</a>
                    ) : (
                      <button disabled style={{ background: "#E5E7EB", color: "#9CA3AF", border: "none", padding: "11px 22px", borderRadius: 12, cursor: "not-allowed", fontSize: 13, fontWeight: 700, width: "100%", opacity: 0.7 }}>🚫 No Meeting Link</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TODAY'S TIMELINE */}
        <div style={{ background: "#fff", borderRadius: 22, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.06)", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Chronological</p>
              <h2 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>Today's Timeline</h2>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[{ color: "#2563EB", label: "Citizen" }, { color: "#7C3AED", label: "Meeting" }, { color: "#F59E0B", label: "Break" }, { color: "#10B981", label: "Lunch" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                  <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <TodayTimeline appointments={appointments} meetings={meetings} />
        </div>

        {/* FOCUS + QUEUE */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>

          <div style={{ background: "#fff", borderRadius: 22, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Overview</p>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 800, color: "#111827" }}>Today's Focus</h2>
            <FocusItem title="Citizens Waiting"  value={waitingCitizens.length} color="#F59E0B" bg="#FEF3C7" />
            <FocusItem title="Meetings Today"     value={meetings.length}        color="#2563EB" bg="#DBEAFE" />
            <FocusItem title="Completed Citizens" value={completedCount}         color="#10B981" bg="#D1FAE5" />
            {activeTour && <FocusItem title="On Tour" value="✈️" color="#D97706" bg="#FEF3C7" />}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Daily Progress</span>
                <span style={{ fontSize: 12, color: "#2563EB", fontWeight: 700 }}>{progressPct}%</span>
              </div>
              <div style={{ height: 8, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#2563EB,#7C3AED)", borderRadius: 99 }} />
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>{completedCount} of {totalCount} citizens completed</p>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 22, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Queue</p>
                <h2 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>Upcoming Citizens</h2>
              </div>
              <span style={{ background: "#FEF3C7", color: "#D97706", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 99, border: "1px solid #FDE68A" }}>{waitingCitizens.length} in queue</span>
            </div>
            {appointments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No appointments scheduled today.</p>
              </div>
            ) : waitingCitizens.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No waiting citizens</p>
                <p style={{ margin: "4px 0 0", fontSize: 12 }}>Queue is clear</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    <th style={{ ...th, borderRadius: "10px 0 0 10px", paddingLeft: 14 }}>Token</th>
                    <th style={th}>Citizen</th>
                    <th style={th}>Purpose</th>
                    <th style={th}>Time</th>
                    <th style={{ ...th, borderRadius: "0 10px 10px 0", paddingRight: 14 }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {waitingCitizens.map((citizen, index) => (
                    <tr key={citizen.appointment_id ?? index} className="citizen-row" style={{ borderRadius: 10, cursor: "default" }}>
                      <td style={{ ...td, paddingLeft: 14 }}>
                        <span style={{ background: "#EFF6FF", color: "#2563EB", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99, border: "1px solid #BFDBFE", whiteSpace: "nowrap" }}>{citizen.appointment_id}</span>
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${(index * 80 + 200)},70%,90%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: `hsl(${(index * 80 + 200)},60%,40%)`, flexShrink: 0 }}>
                            {citizen.citizen_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{citizen.citizen_name}</span>
                        </div>
                      </td>
                      <td style={td}><span style={{ background: "#F3F4F6", color: "#374151", fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 8 }}>{citizen.purpose}</span></td>
                      <td style={td}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#6B7280" }}>
                          🕐 {citizen.appointment_time}{citizen.appointment_end_time ? ` → ${citizen.appointment_end_time}` : ""}
                        </span>
                      </td>
                      <td style={{ ...td, paddingRight: 14 }}>
                        {citizen.appointment_duration
                          ? <span style={{ background: "#ECFDF5", color: "#059669", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99, border: "1px solid #A7F3D0" }}>{citizen.appointment_duration} min</span>
                          : <span style={{ color: "#9CA3AF" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, gradient, shadow }) {
  return (
    <div className="stat-card" style={{ background: gradient, color: "white", borderRadius: 22, padding: "28px 24px", boxShadow: `0 8px 24px ${shadow}`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", letterSpacing: "0.03em" }}>{title}</p>
        <span style={{ fontSize: 22, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 8px", lineHeight: 1 }}>{icon}</span>
      </div>
      <h1 style={{ margin: 0, fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</h1>
    </div>
  );
}

function FocusItem({ title, value, color, bg }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{title}</span>
      <span style={{ background: bg, color, fontWeight: 800, fontSize: 15, padding: "4px 14px", borderRadius: 99, minWidth: 36, textAlign: "center" }}>{value}</span>
    </div>
  );
}

const th = { textAlign: "left", padding: "10px 12px", color: "#6B7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" };
const td = { padding: "14px 12px", borderBottom: "1px solid #F3F4F6", fontSize: 14, color: "#374151" };