import { useState, useEffect, useRef, useCallback } from "react";
import tribalLogo from "../../assets/tribal-logo.jpg";
import { supabase } from "../../lib/supabase";
import { useRealtime } from "../../hooks/useRealtime";

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

  const isBreak   = data.type === "break";
  const isMeeting = data.type === "meeting";

  const accentColor = isBreak ? "#F59E0B" : isMeeting ? "#7C3AED" : "#2563EB";
  const typeLabel   = isBreak ? "☕ Break Time"
    : isMeeting ? "📅 Executive Meeting Starting Soon"
    : "⏰ Appointment Time Completed";
  const typeTitle   = isBreak ? "Time for a short break!"
    : isMeeting ? (data.title || "Executive Meeting")
    : (data.citizen_name || "");

  return (
    <div style={popupStyles.overlay}>
      <div style={{ ...popupStyles.box, borderTop: `5px solid ${accentColor}` }}>
        <div style={popupStyles.progressTrack}>
          <div style={{ ...popupStyles.progressFill, width: `${(seconds / 30) * 100}%`, background: accentColor }} />
        </div>
        <div style={{ padding: "24px 28px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: accentColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {typeLabel}
              </p>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>{typeTitle}</h2>
            </div>
            <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 700, background: "#F3F4F6", borderRadius: 99, padding: "4px 10px", flexShrink: 0, marginLeft: 12 }}>
              {seconds}s
            </span>
          </div>

          {isMeeting && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
              <div style={{ background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", border: "1px solid #DDD6FE", borderRadius: 12, padding: "16px 18px", marginBottom: 4 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <InfoRow icon="🏛️" label="Meeting With"  value={data.meeting_with || "—"} />
                  <InfoRow icon="🕐" label="Scheduled At"  value={data.meeting_time || "—"} />
                  {data.meeting_end_time && <InfoRow icon="⏱" label="Ends At" value={data.meeting_end_time} />}
                  {data.notes && <InfoRow icon="📝" label="Notes" value={data.notes} />}
                </div>
              </div>
              {isMeetLinkValid(data.meet_link) ? (
                <a
                  href={data.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    background: "linear-gradient(135deg,#059669,#10B981)",
                    color: "#fff", textDecoration: "none",
                    padding: "14px 20px", borderRadius: 12,
                    fontSize: 15, fontWeight: 800, letterSpacing: "0.02em",
                    boxShadow: "0 6px 20px rgba(16,185,129,0.4)",
                    animation: "pulse-join 1.5s ease infinite",
                  }}
                >
                  <span style={{ fontSize: 20 }}>🔗</span> Join Meeting Now
                </a>
              ) : (
                <div style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 18px", textAlign: "center", color: "#9CA3AF", fontSize: 13, fontWeight: 600 }}>
                  🚫 No meeting link available
                </div>
              )}
            </div>
          )}

          {isBreak && (
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
          )}

          {!isBreak && !isMeeting && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <InfoRow icon="📋" label="Purpose"        value={data.purpose} />
              <InfoRow icon="🕐" label="Scheduled Time" value={`${data.appointment_time}${data.appointment_end_time ? ` – ${data.appointment_end_time}` : ""}`} />
              <InfoRow icon="🎫" label="Appointment ID"  value={data.appointment_id} />
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {!isBreak && !isMeeting && (
              <button onClick={onComplete} style={popupStyles.completeBtn}>
                ✅ Meeting Completed
              </button>
            )}
            <button onClick={onClose} style={{ ...popupStyles.closeBtn, flex: isBreak || isMeeting ? 1 : undefined }}>
              ❌ {isMeeting ? "Dismiss" : "Close"}
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
  overlay:      { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  box:          { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", overflow: "hidden" },
  progressTrack:{ height: 4, background: "#F3F4F6", width: "100%" },
  progressFill: { height: "100%", transition: "width 1s linear", borderRadius: 2 },
  completeBtn:  { flex: 1, padding: "12px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" },
  closeBtn:     { padding: "12px 16px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};

// ─── Timeline Section ─────────────────────────────────────────────────────────

function TodayTimeline({ appointments, meetings, isToday = true }) {
  const now = isToday ? nowMinutes() : -1;
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
    return null; // handled by parent empty state
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

// ─── Tour Diary Print ─────────────────────────────────────────────────────────

function printTourDiaryMD(tours) {
  const statusColor = { Upcoming: "#D97706", Completed: "#059669", Ongoing: "#2563EB", Cancelled: "#DC2626" };

  const cards = tours.map(t => {
    const sc = statusColor[t.status] || "#64748B";
    const startFmt = t.start_date ? new Date(t.start_date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—";
    const endFmt   = t.end_date   ? new Date(t.end_date   + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "";
    const dateStr  = endFmt && endFmt !== startFmt ? `${startFmt} – ${endFmt}` : startFmt;
    const days     = t.start_date ? (() => { const a = new Date(t.start_date+"T00:00:00"); const b = new Date((t.end_date||t.start_date)+"T00:00:00"); return Math.max(1, Math.round((b-a)/(86400000))+1); })() : 1;

    return `
      <div class="tour-card">
        <div class="card-header">
          <div>
            <div class="destination">📍 ${t.destination || "—"}</div>
            <div class="purpose">${t.purpose || "—"}</div>
          </div>
          <div class="status-badge" style="color:${sc};border-color:${sc}20;background:${sc}12">${t.status || "—"}</div>
        </div>
        <div class="card-meta">
          <div class="meta-item"><span class="meta-icon">📅</span>${dateStr}</div>
          <div class="meta-item"><span class="meta-icon">⏳</span>${days} day${days > 1 ? "s" : ""}</div>
          ${t.mode_of_travel ? `<div class="meta-item"><span class="meta-icon">🚗</span>${t.mode_of_travel}</div>` : ""}
        </div>
        ${t.remarks ? `<div class="remarks">📝 ${t.remarks}</div>` : ""}
      </div>`;
  }).join("");

  const totalDays = tours.reduce((acc, t) => {
    if (!t.start_date) return acc;
    const a = new Date(t.start_date+"T00:00:00");
    const b = new Date((t.end_date||t.start_date)+"T00:00:00");
    return acc + Math.max(1, Math.round((b-a)/86400000)+1);
  }, 0);
  const cities = new Set(tours.map(t => (t.destination||"").trim().toLowerCase()).filter(Boolean)).size;

  const html = `
    <html><head>
      <title>Tour Diary — Leena Bansod, MD</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 28px; color: #111; background: #fff; font-size: 12px; }
        .gov-header {
          text-align: center;
          padding-bottom: 16px;
          margin-bottom: 20px;
          border-bottom: 3px solid #6B1A1A;
        }
        .gov-org {
          font-size: 17px;
          font-weight: 900;
          color: #6B1A1A;
          margin-bottom: 4px;
          letter-spacing: 0.3px;
        }
        .gov-system { font-size: 13px; font-weight: 700; color: #111; margin-bottom: 3px; }
        .gov-sub { font-size: 11px; color: #64748B; }
        .report-title { font-size: 20px; font-weight: 900; color: #111; margin: 0 0 4px; }
        .report-sub { font-size: 12px; color: #64748B; margin-bottom: 20px; }
        .stats-row { display: flex; gap: 14px; margin-bottom: 22px; }
        .stat-box { flex: 1; border: 1.5px solid #E5E7EB; border-top: 3px solid #6B1A1A; border-radius: 10px; padding: 14px 18px; }
        .stat-box .num { font-size: 28px; font-weight: 900; color: #6B1A1A; }
        .stat-box .lbl { font-size: 10px; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .tour-card { border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 16px 20px; page-break-inside: avoid; }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .destination { font-size: 14px; font-weight: 800; color: #111; margin-bottom: 3px; }
        .purpose { font-size: 11px; color: #64748B; }
        .status-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 99px; border: 1px solid; white-space: nowrap; flex-shrink: 0; margin-left: 10px; }
        .card-meta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
        .meta-item { font-size: 11px; color: #374151; display: flex; align-items: center; gap: 4px; }
        .meta-icon { font-size: 12px; }
        .remarks { font-size: 11px; color: #6B7280; font-style: italic; background: #F8FAFC; padding: 7px 11px; border-radius: 8px; margin-top: 8px; }
        .footer { font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 10px; text-align: center; margin-top: 24px; }
        @page { margin: 18mm; }
      </style>
    </head>
    <body>
      <div class="gov-header">
        <div class="gov-org">Maharashtra State Co-operative Tribal Development Corporation Ltd.</div>
        <div class="gov-system">Shabri Smart Appointment Management System</div>
        <div class="gov-sub">Official Tour Diary — Managing Director</div>
      </div>

      <div class="report-title">✈️ Tour Diary</div>
      <div class="report-sub">
        Travel record of Leena Bansod, Managing Director &nbsp;·&nbsp;
        Printed: ${new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })}
      </div>

      <div class="stats-row">
        <div class="stat-box"><div class="num">${tours.length}</div><div class="lbl">Total Tours</div></div>
        <div class="stat-box"><div class="num">${cities}</div><div class="lbl">Cities Visited</div></div>
        <div class="stat-box"><div class="num">${totalDays}</div><div class="lbl">Days on Tour</div></div>
        <div class="stat-box"><div class="num">${tours.filter(t=>t.status==="Completed").length}</div><div class="lbl">Completed</div></div>
      </div>

      <div class="grid">${cards}</div>

      <div class="footer">
        Shabri Smart Appointment Management System &nbsp;·&nbsp;
        Maharashtra State Co-operative Tribal Development Corporation Ltd. &nbsp;·&nbsp;
        Printed on ${new Date().toLocaleString("en-IN")}
      </div>
    </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}

// ─── Tour Diary Section ───────────────────────────────────────────────────────

function TourDiarySection({ tourDiary }) {
  const today = getTodayLocalDate();

  const activeTour = tourDiary.find(t => {
    if (!t.start_date) return false;
    const end = t.end_date || t.start_date;
    return today >= t.start_date && today <= end && t.status !== "Cancelled";
  }) || null;

  const upcoming  = tourDiary.filter(t => t.start_date > today && t.status === "Upcoming")
                             .sort((a,b) => a.start_date.localeCompare(b.start_date))
                             .slice(0, 3);
  const recent    = tourDiary.filter(t => (t.end_date || t.start_date) < today)
                             .sort((a,b) => b.start_date.localeCompare(a.start_date))
                             .slice(0, 3);

  const statusCfg = {
    Upcoming:  { bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" },
    Completed: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    Ongoing:   { bg: "#DBEAFE", color: "#2563EB", border: "#BFDBFE" },
    Cancelled: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  };

  function daysBetween(start, end) {
    if (!start) return 1;
    const a = new Date(start+"T00:00:00");
    const b = new Date((end||start)+"T00:00:00");
    return Math.max(1, Math.round((b-a)/86400000)+1);
  }

  function fmtDate(d) {
    if (!d) return "";
    return new Date(d+"T00:00:00").toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  }

  function TourCard({ t, highlight }) {
    const sc = statusCfg[t.status] || { bg:"#F1F5F9", color:"#64748B", border:"#E2E8F0" };
    const days = daysBetween(t.start_date, t.end_date);
    const dateLabel = t.end_date && t.end_date !== t.start_date
      ? `${fmtDate(t.start_date)} – ${fmtDate(t.end_date)}`
      : fmtDate(t.start_date);

    return (
      <div style={{
        background: highlight ? "linear-gradient(135deg,#FFFBEB,#FEF3C7)" : "#fff",
        border: `1.5px solid ${highlight ? "#FDE68A" : "#E5E7EB"}`,
        borderRadius: 16, padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 10,
        position: "relative", overflow: "hidden",
        boxShadow: highlight ? "0 6px 24px rgba(245,158,11,0.18)" : "0 2px 8px rgba(0,0,0,0.05)",
      }}>
        {highlight && (
          <div style={{ position:"absolute", top:14, right:14 }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#D97706", color:"#fff", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:99, letterSpacing:"0.06em" }}>
              ✈️ ACTIVE
            </span>
          </div>
        )}
        <div>
          <p style={{ margin:"0 0 2px", fontSize:15, fontWeight:800, color:"#111827" }}>📍 {t.destination}</p>
          <p style={{ margin:0, fontSize:12, color:"#6B7280", lineHeight:1.5 }}>{t.purpose}</p>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          <span style={{ fontSize:11, fontWeight:600, color:"#374151", background:"#F8FAFC", border:"1px solid #E5E7EB", borderRadius:8, padding:"3px 9px" }}>📅 {dateLabel}</span>
          <span style={{ fontSize:11, fontWeight:600, color:"#374151", background:"#F8FAFC", border:"1px solid #E5E7EB", borderRadius:8, padding:"3px 9px" }}>⏳ {days} day{days > 1 ? "s" : ""}</span>
          {t.mode_of_travel && (
            <span style={{ fontSize:11, fontWeight:600, color:"#374151", background:"#F8FAFC", border:"1px solid #E5E7EB", borderRadius:8, padding:"3px 9px" }}>{t.mode_of_travel}</span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:99 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:sc.color, display:"inline-block" }} />
            {t.status}
          </span>
          {t.remarks && (
            <span style={{ fontSize:11, color:"#9CA3AF", fontStyle:"italic", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={t.remarks}>
              📝 {t.remarks}
            </span>
          )}
        </div>
      </div>
    );
  }

  const totalTours  = tourDiary.length;
  const totalDays   = tourDiary.reduce((acc,t) => acc + daysBetween(t.start_date, t.end_date), 0);
  const cities      = new Set(tourDiary.map(t=>(t.destination||"").trim().toLowerCase()).filter(Boolean)).size;
  const completed   = tourDiary.filter(t=>t.status==="Completed").length;

  return (
    <div style={{ background:"#fff", borderRadius:22, padding:28, boxShadow:"0 8px 32px rgba(0,0,0,0.06)", marginBottom:28 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
        <div>
          <p style={{ margin:0, fontSize:11, fontWeight:700, color:"#6B7280", letterSpacing:"0.08em", textTransform:"uppercase" }}>Personal Record</p>
          <h2 style={{ margin:"2px 0 0", fontSize:20, fontWeight:800, color:"#111827" }}>✈️ Tour Diary</h2>
        </div>
        <button
          onClick={() => printTourDiaryMD(tourDiary)}
          style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#6B1A1A,#9B2226)", color:"#fff", border:"none", padding:"10px 18px", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 12px rgba(107,26,26,0.3)" }}
        >
          🖨 Print Tour Diary
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total Tours",    value:totalTours,  color:"#6B1A1A", icon:"🗺️" },
          { label:"Cities Visited", value:cities,       color:"#2563EB", icon:"🏙️" },
          { label:"Days on Tour",   value:totalDays,    color:"#D97706", icon:"📆" },
          { label:"Completed",      value:completed,    color:"#059669", icon:"✅" },
        ].map(s => (
          <div key={s.label} style={{ background:"#F8FAFC", borderRadius:14, padding:"14px 16px", border:`2px solid ${s.color}20`, borderTop:`3px solid ${s.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
              <span style={{ fontSize:18 }}>{s.icon}</span>
            </div>
            <p style={{ margin:0, fontSize:26, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</p>
            <p style={{ margin:"4px 0 0", fontSize:11, color:"#6B7280", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {activeTour && (
        <div style={{ marginBottom:20 }}>
          <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700, color:"#D97706", letterSpacing:"0.08em", textTransform:"uppercase" }}>🔴 Currently Active</p>
          <TourCard t={activeTour} highlight={true} />
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div>
          <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700, color:"#2563EB", letterSpacing:"0.08em", textTransform:"uppercase" }}>🔜 Upcoming Tours</p>
          {upcoming.length === 0 ? (
            <div style={{ background:"#F8FAFC", border:"1.5px dashed #E5E7EB", borderRadius:14, padding:"24px", textAlign:"center", color:"#9CA3AF" }}>
              <p style={{ margin:0, fontSize:13, fontWeight:600 }}>No upcoming tours</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {upcoming.map((t,i) => <TourCard key={i} t={t} highlight={false} />)}
            </div>
          )}
        </div>
        <div>
          <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700, color:"#059669", letterSpacing:"0.08em", textTransform:"uppercase" }}>🔙 Recent Tours</p>
          {recent.length === 0 ? (
            <div style={{ background:"#F8FAFC", border:"1.5px dashed #E5E7EB", borderRadius:14, padding:"24px", textAlign:"center", color:"#9CA3AF" }}>
              <p style={{ margin:0, fontSize:13, fontWeight:600 }}>No recent tours</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {recent.map((t,i) => <TourCard key={i} t={t} highlight={false} />)}
            </div>
          )}
        </div>
      </div>

      {tourDiary.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#9CA3AF" }}>
          <div style={{ fontSize:44, marginBottom:12 }}>✈️</div>
          <p style={{ margin:0, fontSize:15, fontWeight:700, color:"#374151" }}>No tour records yet</p>
          <p style={{ margin:"6px 0 0", fontSize:13 }}>Tours added in the Tour Diary module will appear here.</p>
        </div>
      )}
    </div>
  );
}

// ─── Live Status Badge ────────────────────────────────────────────────────────

function LiveStatusBadge({ currentCitizen, meetings }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = nowMinutes();
  const ongoingMeeting = meetings.find(m => {
    if (!m.meeting_time) return false;
    const start = parseTimeToMinutes(m.meeting_time);
    const end   = m.meeting_end_time ? parseTimeToMinutes(m.meeting_end_time) : start + 30;
    return now >= start && now <= end;
  }) || null;

  if (currentCitizen) {
    let timeRemaining = "—";
    if (currentCitizen.appointment_end_time) {
      const endMin  = parseTimeToMinutes(currentCitizen.appointment_end_time);
      const diffSec = (endMin - now) * 60 - (new Date().getSeconds());
      if (diffSec > 0) {
        const m = Math.floor(diffSec / 60);
        const s = diffSec % 60;
        timeRemaining = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
      } else {
        timeRemaining = "00:00";
      }
    }

    return (
      <div style={liveStyles.badge}>
        <div style={liveStyles.header}>
          <span style={{ ...liveStyles.dot, background: "#4ADE80", animation: "pulse-ring 1.8s ease infinite" }} />
          <span style={liveStyles.headerLabel}>Meeting in Progress</span>
        </div>
        <div style={liveStyles.divider} />
        <div style={liveStyles.row}>
          <span style={liveStyles.rowLabel}>Current Citizen</span>
          <span style={liveStyles.rowValue}>{currentCitizen.citizen_name}</span>
        </div>
        {currentCitizen.appointment_end_time && (
          <div style={liveStyles.row}>
            <span style={liveStyles.rowLabel}>Time Remaining</span>
            <span style={{ ...liveStyles.rowValue, fontFamily: "monospace", fontSize: 16, color: timeRemaining === "00:00" ? "#EF4444" : "#4ADE80", letterSpacing: "0.08em" }}>
              {timeRemaining}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (ongoingMeeting) {
    let timeRemaining = "—";
    if (ongoingMeeting.meeting_end_time) {
      const endMin  = parseTimeToMinutes(ongoingMeeting.meeting_end_time);
      const diffSec = (endMin - now) * 60 - (new Date().getSeconds());
      if (diffSec > 0) {
        const m = Math.floor(diffSec / 60);
        const s = diffSec % 60;
        timeRemaining = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
      } else {
        timeRemaining = "00:00";
      }
    }

    return (
      <div style={{ ...liveStyles.badge, border: "1px solid rgba(167,139,250,0.25)", boxShadow: "0 0 0 1px rgba(167,139,250,0.12), 0 0 20px rgba(167,139,250,0.08), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
        <div style={liveStyles.header}>
          <span style={{ ...liveStyles.dot, background: "#A78BFA", animation: "pulse-ring 1.8s ease infinite" }} />
          <span style={liveStyles.headerLabel}>Executive Meeting</span>
        </div>
        <div style={liveStyles.divider} />
        <div style={liveStyles.row}>
          <span style={liveStyles.rowLabel}>Meeting</span>
          <span style={{ ...liveStyles.rowValue, fontSize: 12, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ongoingMeeting.title}
          </span>
        </div>
        {ongoingMeeting.meeting_end_time && (
          <div style={liveStyles.row}>
            <span style={liveStyles.rowLabel}>Time Remaining</span>
            <span style={{ ...liveStyles.rowValue, fontFamily: "monospace", fontSize: 16, color: timeRemaining === "00:00" ? "#EF4444" : "#A78BFA", letterSpacing: "0.08em" }}>
              {timeRemaining}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...liveStyles.badge, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
      <div style={liveStyles.header}>
        <span style={{ ...liveStyles.dot, background: "#94A3B8" }} />
        <span style={{ ...liveStyles.headerLabel, color: "rgba(255,255,255,0.5)" }}>Cabin Available</span>
      </div>
      <div style={liveStyles.divider} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 0" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>No active session</span>
      </div>
    </div>
  );
}

const liveStyles = {
  badge:      { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 14, padding: "10px 14px", minWidth: 190, backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 0 0 1px rgba(74,222,128,0.15), 0 0 20px rgba(74,222,128,0.08), inset 0 1px 0 rgba(255,255,255,0.08)" },
  header:     { display: "flex", alignItems: "center", gap: 7 },
  headerLabel:{ fontSize: 11, fontWeight: 800, color: "#4ADE80", letterSpacing: "0.08em", textTransform: "uppercase" },
  dot:        { width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0 },
  divider:    { height: 1, background: "rgba(255,255,255,0.1)", margin: "2px 0" },
  row:        { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  rowLabel:   { fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 },
  rowValue:   { fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "right" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MDDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [meetings, setMeetings]         = useState([]);
  const [tourDiary, setTourDiary]       = useState([]);
  const [popup, setPopup]               = useState(null);
  const [greeting, setGreeting]         = useState(getDynamicGreeting());

  // ── Timeline state — kept independent from realtime/today refreshes ──────
  const [timelineDate, setTimelineDate]         = useState(getTodayLocalDate());
  const [timelineAppts, setTimelineAppts]       = useState([]);
  const [timelineMeetings, setTimelineMeetings] = useState([]);
  const [timelineLoading, setTimelineLoading]   = useState(false);
  const [timelineError, setTimelineError]       = useState(null);

  // Stable today string — computed once per render cycle, never changes mid-session
  const todayRef = useRef(getTodayLocalDate());
  const today    = todayRef.current;

  // Track in-flight fetch to abort stale results
  const timelineFetchId = useRef(0);

  // Scroll target for timeline
  const timelineRef = useRef(null);

  const shownPopupsRef = useRef(new Set());

  // ── Fetch today's data (appointments + meetings + tour diary) ─────────────
  // Uses a ref so realtime callback never captures a stale closure
  const fetchAll = useCallback(async () => {
    const currentToday = getTodayLocalDate(); // always fresh

    const [apptRes, meetRes, tourRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("appointment_date", currentToday)
        .order("appointment_time", { ascending: true }),
      supabase
        .from("executive_meetings")
        .select("*")
        .eq("meeting_date", currentToday),
      supabase
        .from("tour_diary")
        .select("*"),
    ]);

    if (apptRes.error) {
      console.error("[MDDashboard] appointments fetch error:", apptRes.error);
    } else {
      console.log(`[MDDashboard] today appointments (${currentToday}):`, apptRes.data?.length ?? 0, apptRes.data);
      setAppointments(apptRes.data ?? []);
    }

    if (meetRes.error) {
      console.error("[MDDashboard] meetings fetch error:", meetRes.error);
    } else {
      console.log(`[MDDashboard] today meetings (${currentToday}):`, meetRes.data?.length ?? 0, meetRes.data);
      setMeetings(sortByTime(meetRes.data ?? [], "meeting_time"));
    }

    if (!tourRes.error) {
      setTourDiary(tourRes.data ?? []);
    }
  }, []); // no deps — always reads live today

  // ── Fetch timeline for any arbitrary date ─────────────────────────────────
  const fetchTimeline = useCallback(async (dateStr) => {
    // Cancel any in-flight fetch for a different date
    const fetchId = ++timelineFetchId.current;

    setTimelineLoading(true);
    setTimelineError(null);

    console.log(`[Timeline] fetching date: ${dateStr}`);

    const [apptRes, meetRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("appointment_date", dateStr)
        .order("appointment_time", { ascending: true }),
      supabase
        .from("executive_meetings")
        .select("*")
        .eq("meeting_date", dateStr),
    ]);

    // Discard result if a newer fetch already started
    if (fetchId !== timelineFetchId.current) {
      console.log(`[Timeline] discarding stale fetch for ${dateStr}`);
      return;
    }

    if (apptRes.error) {
      console.error("[Timeline] appointments error:", apptRes.error);
      setTimelineError(`Could not load appointments: ${apptRes.error.message}`);
    } else {
      console.log(`[Timeline] appointments for ${dateStr}:`, apptRes.data?.length ?? 0, apptRes.data);
      setTimelineAppts(apptRes.data ?? []);
    }

    if (meetRes.error) {
      console.error("[Timeline] meetings error:", meetRes.error);
    } else {
      console.log(`[Timeline] meetings for ${dateStr}:`, meetRes.data?.length ?? 0, meetRes.data);
      setTimelineMeetings(sortByTime(meetRes.data ?? [], "meeting_time"));
    }

    setTimelineLoading(false);
  }, []);

  // ── Effect: fetch timeline whenever the selected date changes ─────────────
  // NOTE: We deliberately do NOT scroll here — scrolling is handled separately below
  useEffect(() => {
    fetchTimeline(timelineDate);
  }, [timelineDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect: scroll to timeline ONLY when user changes the date ───────────
  // We track the previous date value; if it's the same as on mount, skip scroll
  const prevDateRef = useRef(timelineDate);
  useEffect(() => {
    if (prevDateRef.current !== timelineDate) {
      prevDateRef.current = timelineDate;
      if (timelineRef.current) {
        setTimeout(() => {
          timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [timelineDate]);

  // ── Effect: when today's data refreshes AND timeline is showing today,
  //    sync it — but DO NOT touch timeline if viewing a different date ────────
  useEffect(() => {
    if (timelineDate === today) {
      setTimelineAppts(appointments);
      setTimelineMeetings(meetings);
    }
    // intentionally NOT fetching from Supabase here — avoids duplicate fetches
  }, [appointments, meetings, timelineDate, today]);

  // ── Effect: initial load + 30-second polling for today's live data ─────────
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Realtime: push updates for today's data only ──────────────────────────
  useRealtime({ appointments: fetchAll, executive_meetings: fetchAll, tour_diary: fetchAll });

  // ── Effect: greeting refresh every minute ─────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setGreeting(getDynamicGreeting()), 60000);
    return () => clearInterval(t);
  }, []);

  // ── Effect: popup logic runs only on today's appointments/meetings ─────────
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

      for (const m of meetings) {
        if (!m.meeting_time) continue;
        const startMin = parseTimeToMinutes(m.meeting_time);
        const key = `meeting-${m.id}`;
        if (now >= startMin - 5 && now < startMin + 2 && !shownPopupsRef.current.has(key)) {
          shownPopupsRef.current.add(key);
          setPopup({ type: "meeting", ...m });
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
  }, [appointments, meetings]);

  const handleMarkCompleted = async () => {
    if (!popup || popup.type !== "appointment") return;
    const { error } = await supabase.from("appointments").update({ status: "Completed" }).eq("id", popup.id);
    if (error) console.error("[MDDashboard] mark completed error:", error);
    setPopup(null);
    fetchAll();
  };

  // ── Date navigation helpers ───────────────────────────────────────────────
  // Recompute today fresh each call so it's never stale
  const isOnToday      = timelineDate === today;
  const isNextDisabled = timelineDate >= today; // >= guards same-day and any future edge case

  function handlePrevDay() {
    const d = new Date(timelineDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setTimelineDate(d.toISOString().split("T")[0]);
  }

  function handleNextDay() {
    const currentToday = getTodayLocalDate(); // fresh, not from closure
    if (timelineDate >= currentToday) return;  // hard block
    const d = new Date(timelineDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split("T")[0];
    setTimelineDate(next >= currentToday ? currentToday : next);
  }

  function handleDatePick(e) {
    const picked = e.target.value;
    if (!picked) return;
    // Clamp — never allow future dates
    if (picked > today) {
      setTimelineDate(today);
    } else {
      setTimelineDate(picked);
    }
  }

  const currentCitizen  = appointments.find(a => a.status === "In Cabin") || null;
  const waitingCitizens = sortByTime(appointments.filter(a => a.status === "Waiting"), "appointment_time");
  const nextCitizen     = waitingCitizens[0] || null;
  const completedCount  = appointments.filter(a => a.status === "Completed").length;
  const totalCount      = appointments.length;
  const progressPct     = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Summary counts for the selected timeline date
  const tlApptCount    = timelineAppts.length;
  const tlMeetingCount = timelineMeetings.length;
  const tlHasEvents    = tlApptCount > 0 || tlMeetingCount > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4FF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {popup && <Popup data={popup} onComplete={handleMarkCompleted} onClose={() => setPopup(null)} />}

      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37,99,235,0.5); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 12px rgba(37,99,235,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
        @keyframes pulse-join {
          0%   { box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
          50%  { box-shadow: 0 6px 28px rgba(16,185,129,0.7); transform: scale(1.02); }
          100% { box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .stat-card:hover { transform: translateY(-4px) scale(1.02); }
        .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .meeting-card:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(37,99,235,0.15) !important; }
        .meeting-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .join-btn:hover { filter: brightness(1.1); transform: scale(1.03); }
        .join-btn { transition: filter 0.15s, transform 0.15s; }
        .citizen-row:hover { background: #EFF6FF !important; }
        .citizen-row { transition: background 0.15s; }
        .tl-nav-btn { background: #F1F5F9; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 8px 13px; cursor: pointer; font-size: 14px; font-weight: 700; color: #374151; line-height: 1; transition: background 0.15s, opacity 0.15s; }
        .tl-nav-btn:hover:not(:disabled) { background: #E2E8F0; }
        .tl-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
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
          <LiveStatusBadge currentCitizen={currentCitizen} meetings={meetings} />
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

        {/* TOUR DIARY */}
        <TourDiarySection tourDiary={tourDiary} />

        {/* ── SCHEDULE / TIMELINE ─────────────────────────────────────────── */}
        <div ref={timelineRef} style={{ background: "#fff", borderRadius: 22, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.06)", marginBottom: 28 }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>

            {/* Title + summary badge */}
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Chronological</p>
              <h2 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>
                {isOnToday ? "Today's Timeline" : "Schedule"}
              </h2>
              {/* Per-date summary counts */}
              {!timelineLoading && (
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 99, padding: "2px 10px" }}>
                    👥 {tlApptCount} citizen{tlApptCount !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 99, padding: "2px 10px" }}>
                    🤝 {tlMeetingCount} meeting{tlMeetingCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Date navigator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* ◀ Previous — always enabled */}
              <button
                onClick={handlePrevDay}
                title="Previous day"
                style={{ background: "#F1F5F9", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "8px 13px", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#374151", lineHeight: 1 }}
              >◀</button>

              {/* Date display + hidden picker */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: `1.5px solid ${isOnToday ? "#BFDBFE" : "#DDD6FE"}`, borderRadius: 12, padding: "8px 14px", cursor: "pointer", position: "relative", minWidth: 130 }}>
                <span style={{ fontSize: 15 }}>📅</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                  {isOnToday
                    ? "Today"
                    : new Date(timelineDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </span>
                {/* Hidden date input — max clamped to today */}
                <input
                  type="date"
                  value={timelineDate}
                  max={today}
                  onChange={handleDatePick}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                />
              </div>

              {/* ▶ Next — disabled when on today */}
              <button
                onClick={handleNextDay}
                disabled={isNextDisabled}
                title={isNextDisabled ? "Cannot navigate beyond today" : "Next day"}
                style={{
                  background: "#F1F5F9",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "8px 13px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: isNextDisabled ? "#C0C8D4" : "#374151",
                  lineHeight: 1,
                  cursor: isNextDisabled ? "not-allowed" : "pointer",
                  opacity: isNextDisabled ? 0.4 : 1,
                  pointerEvents: isNextDisabled ? "none" : "auto",
                }}
              >▶</button>

              {/* Back to Today pill — only when not on today */}
              {!isOnToday && (
                <button
                  onClick={() => setTimelineDate(today)}
                  style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 99, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >
                  Today
                </button>
              )}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[{ color: "#2563EB", label: "Citizen" }, { color: "#7C3AED", label: "Meeting" }, { color: "#F59E0B", label: "Break" }, { color: "#10B981", label: "Lunch" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                  <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Full date label bar */}
          <div style={{ marginBottom: 20, padding: "10px 16px", background: isOnToday ? "#EFF6FF" : "#F5F3FF", borderRadius: 12, border: `1px solid ${isOnToday ? "#BFDBFE" : "#DDD6FE"}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14 }}>{isOnToday ? "🟢" : "📆"}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: isOnToday ? "#1E3A8A" : "#4C1D95" }}>
              {new Date(timelineDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            {timelineLoading && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280", fontWeight: 600, marginLeft: "auto" }}>
                <span style={{ width: 14, height: 14, border: "2px solid #E5E7EB", borderTopColor: "#2563EB", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Loading schedule…
              </span>
            )}
          </div>

          {/* Error state */}
          {timelineError && !timelineLoading && (
            <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 14, padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#B91C1C" }}>Failed to load schedule</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#DC2626" }}>{timelineError}</p>
                <button
                  onClick={() => fetchTimeline(timelineDate)}
                  style={{ marginTop: 8, background: "#DC2626", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {timelineLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 80, height: 16, background: "#F3F4F6", borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#E5E7EB", flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 60, background: "#F8FAFC", borderRadius: 12, border: "1px solid #E5E7EB" }} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state — no loading, no error, no events */}
          {!timelineLoading && !timelineError && !tlHasEvents && (
            <div style={{ background: "linear-gradient(135deg,#F8FAFC,#F1F5F9)", border: "2px dashed #CBD5E1", borderRadius: 18, padding: "48px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 14, lineHeight: 1 }}>📋</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#374151" }}>No Schedule Found</h3>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6B7280", maxWidth: 340, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
                No appointments or meetings have been scheduled for{" "}
                <strong style={{ color: "#1E3A8A" }}>
                  {new Date(timelineDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </strong>.
              </p>
              {!isOnToday && (
                <button
                  onClick={() => setTimelineDate(today)}
                  style={{ marginTop: 20, background: "linear-gradient(135deg,#2563EB,#1E3A8A)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
                >
                  ← Back to Today
                </button>
              )}
            </div>
          )}

          {/* Timeline — only render when not loading, no error, events exist */}
          {!timelineLoading && !timelineError && tlHasEvents && (
            <TodayTimeline
              appointments={timelineAppts}
              meetings={timelineMeetings}
              isToday={isOnToday}
            />
          )}
        </div>

        {/* FOCUS + QUEUE */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>

          <div style={{ background: "#fff", borderRadius: 22, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Overview</p>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 800, color: "#111827" }}>Today's Focus</h2>
            <FocusItem title="Citizens Waiting"  value={waitingCitizens.length} color="#F59E0B" bg="#FEF3C7" />
            <FocusItem title="Meetings Today"     value={meetings.length}        color="#2563EB" bg="#DBEAFE" />
            <FocusItem title="Completed Citizens" value={completedCount}         color="#10B981" bg="#D1FAE5" />
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