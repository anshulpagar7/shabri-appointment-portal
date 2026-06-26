import { useState, useEffect } from "react";
import tribalLogo from "../../assets/tribal-logo.jpg";
import { supabase } from "../../lib/supabase";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTodayLocalDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDynamicGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning, Madam 🌿";
  if (hour >= 12 && hour < 17) return "Good Afternoon, Madam ☀️";
  if (hour >= 17 && hour < 21) return "Good Evening, Madam 🌆";
  return "Good Night, Madam 🌙";
}

function getMeetingTimeLabel(timeStr) {
  if (!timeStr) return "";
  // timeStr expected as "HH:MM" or "HH:MM:SS"
  const [hourStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

function isMeetLinkValid(link) {
  return link && link.trim() !== "" && link.trim().toLowerCase() !== "no";
}

function sortByTime(arr, key) {
  return [...arr].sort((a, b) => {
    const ta = a[key] ?? "";
    const tb = b[key] ?? "";
    return ta.localeCompare(tb);
  });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MDDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const today = getTodayLocalDate();

  useEffect(() => {
    fetchAppointments();
    fetchMeetings();
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", today)
      .order("appointment_time", { ascending: true });
    if (error) {
      console.log(error);
      return;
    }
    setAppointments(data ?? []);
  };

  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from("executive_meetings")
      .select("*")
      .eq("meeting_date", today);
    if (error) {
      console.log(error);
      return;
    }
    // Sort by meeting_time ASC
    setMeetings(sortByTime(data ?? [], "meeting_time"));
  };

  // ── Derived data (today-only records already filtered by query) ──
  const currentCitizen = appointments.find(a => a.status === "In Cabin") || null;

  // Waiting citizens sorted by appointment_time ASC
  const waitingCitizens = sortByTime(
    appointments.filter(a => a.status === "Waiting"),
    "appointment_time"
  );

  const nextCitizen = waitingCitizens[0] || null;
  const completedCount = appointments.filter(a => a.status === "Completed").length;
  const totalCount = appointments.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4FF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* ── Inject keyframes ── */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37,99,235,0.5); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 12px rgba(37,99,235,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
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

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)",
        padding: "0 36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 24px rgba(37,99,235,0.3)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        minHeight: 80,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            <img src={tribalLogo} alt="Logo" style={{ width: 48, height: 48, objectFit: "contain" }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Government of Maharashtra
            </p>
            <h2 style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
              Maharashtra State Cooperative Tribal Development Corporation Limited
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", borderRadius: 99, padding: "8px 16px" }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: "#4ADE80",
              animation: "pulse-ring 1.8s ease infinite",
              display: "inline-block",
            }} />
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

        {/* ── WELCOME BANNER ── */}
        <div style={{
          background: "linear-gradient(120deg, #1E3A8A 0%, #2563EB 50%, #7C3AED 100%)",
          borderRadius: 24,
          padding: "36px 40px",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(37,99,235,0.35)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -40, right: 120, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -60, right: -20, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div style={{ position: "relative" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Executive Monitoring Dashboard
            </p>
            <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
              {getDynamicGreeting()}
            </h1>
            <p style={{ margin: "10px 0 0", fontSize: 15, color: "rgba(255,255,255,0.75)" }}>
              You have <strong style={{ color: "#fff" }}>{totalCount} citizens</strong> scheduled and <strong style={{ color: "#fff" }}>{meetings.length} executive meetings</strong> today.
            </p>
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            position: "relative",
          }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>👩‍💼</div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Leena Bansod</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Managing Director</span>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 28 }}>
          <StatCard title="Today's Citizens" value={totalCount} icon="👥" gradient="linear-gradient(135deg,#3B82F6,#2563EB)" shadow="rgba(37,99,235,0.35)" />
          <StatCard title="Waiting" value={waitingCitizens.length} icon="⏳" gradient="linear-gradient(135deg,#F59E0B,#D97706)" shadow="rgba(217,119,6,0.35)" />
          <StatCard title="Meetings" value={meetings.length} icon="📋" gradient="linear-gradient(135deg,#10B981,#059669)" shadow="rgba(5,150,105,0.35)" />
          <StatCard title="Completed" value={completedCount} icon="✅" gradient="linear-gradient(135deg,#8B5CF6,#7C3AED)" shadow="rgba(124,58,237,0.35)" />
        </div>

        {/* ── CURRENT + NEXT CITIZEN ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 }}>

          {/* Currently Meeting */}
          <div style={{
            background: "#fff",
            borderRadius: 22,
            padding: 28,
            boxShadow: "0 8px 32px rgba(37,99,235,0.12)",
            border: "2px solid #DBEAFE",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: "linear-gradient(90deg, #2563EB, #7C3AED)",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%", background: "#3B82F6",
                animation: "pulse-ring 1.8s ease infinite",
                display: "inline-block", flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Currently Meeting
              </span>
            </div>

            {currentCitizen ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "linear-gradient(135deg,#DBEAFE,#EFF6FF)",
                    border: "2px solid #BFDBFE",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: "#2563EB",
                  }}>
                    {currentCitizen.citizen_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>{currentCitizen.citizen_name}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>{currentCitizen.purpose} · {currentCitizen.appointment_time}</p>
                  </div>
                </div>
                <div style={{
                  background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
                  borderRadius: 14,
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 13, color: "#1E3A8A", fontWeight: 600 }}>Token</span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#2563EB", letterSpacing: "0.04em" }}>{currentCitizen.appointment_id}</span>
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
          <div style={{
            background: "#fff",
            borderRadius: 22,
            padding: 28,
            boxShadow: "0 8px 32px rgba(16,185,129,0.1)",
            border: "2px solid #D1FAE5",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: "linear-gradient(90deg, #10B981, #059669)",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                ⏭ Next Citizen
              </span>
            </div>

            {nextCitizen ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "linear-gradient(135deg,#D1FAE5,#ECFDF5)",
                    border: "2px solid #A7F3D0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: "#059669",
                  }}>
                    {nextCitizen.citizen_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>{nextCitizen.citizen_name}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>{nextCitizen.purpose} · {nextCitizen.appointment_time}</p>
                  </div>
                </div>
                <div style={{
                  background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
                  borderRadius: 14,
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 13, color: "#065F46", fontWeight: 600 }}>Token</span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#10B981", letterSpacing: "0.04em" }}>{nextCitizen.appointment_id}</span>
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

        {/* ── EXECUTIVE MEETINGS ── */}
        <div style={{
          background: "#fff",
          borderRadius: 22,
          padding: 28,
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          marginBottom: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Scheduled</p>
              <h2 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>Executive Meetings</h2>
            </div>
            <span style={{
              background: "#EFF6FF",
              color: "#2563EB",
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 14px",
              borderRadius: 99,
              border: "1px solid #BFDBFE",
            }}>{meetings.length} Today</span>
          </div>

          {meetings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No executive meetings scheduled today</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
              {meetings.map((meeting, index) => {
                const linkValid = isMeetLinkValid(meeting.meet_link);
                return (
                  <div
                    key={meeting.id ?? index}
                    className="meeting-card"
                    style={{
                      background: "linear-gradient(135deg,#F8FAFF,#F0F4FF)",
                      padding: "22px 24px",
                      borderRadius: 18,
                      border: "1px solid #DBEAFE",
                      boxShadow: "0 4px 16px rgba(37,99,235,0.07)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          {getMeetingTimeLabel(meeting.meeting_time)}
                        </p>
                        <h3 style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 800, color: "#111827" }}>{meeting.title}</h3>
                      </div>
                      <span style={{
                        background: "#fff",
                        color: "#2563EB",
                        fontSize: 13,
                        fontWeight: 700,
                        padding: "5px 12px",
                        borderRadius: 99,
                        border: "1px solid #BFDBFE",
                        flexShrink: 0,
                        marginLeft: 10,
                      }}>{meeting.meeting_time}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14 }}>🏛️</span>
                        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{meeting.meeting_with}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14 }}>🎥</span>
                        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{meeting.mode ?? "Google Meet"}</span>
                      </div>
                      {meeting.status && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>📌</span>
                          <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{meeting.status}</span>
                        </div>
                      )}
                    </div>

                    {linkValid ? (
                      <a
                        href={meeting.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="join-btn"
                        style={{
                          display: "block",
                          background: "linear-gradient(135deg,#10B981,#059669)",
                          color: "white",
                          border: "none",
                          padding: "11px 22px",
                          borderRadius: 12,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                          boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
                          width: "100%",
                          textAlign: "center",
                          textDecoration: "none",
                          boxSizing: "border-box",
                        }}
                      >
                        🔗 Join Meeting
                      </a>
                    ) : (
                      <button
                        disabled
                        style={{
                          background: "#E5E7EB",
                          color: "#9CA3AF",
                          border: "none",
                          padding: "11px 22px",
                          borderRadius: 12,
                          cursor: "not-allowed",
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                          width: "100%",
                          opacity: 0.7,
                        }}
                      >
                        🚫 No Meeting Link
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOCUS + UPCOMING ── */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>

          {/* Today's Focus */}
          <div style={{
            background: "#fff",
            borderRadius: 22,
            padding: 28,
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Overview</p>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 800, color: "#111827" }}>Today's Focus</h2>

            <FocusItem title="Citizens Waiting" value={waitingCitizens.length} color="#F59E0B" bg="#FEF3C7" />
            <FocusItem title="Meetings Today" value={meetings.length} color="#2563EB" bg="#DBEAFE" />
            <FocusItem title="Completed Citizens" value={completedCount} color="#10B981" bg="#D1FAE5" />

            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Daily Progress</span>
                <span style={{ fontSize: 12, color: "#2563EB", fontWeight: 700 }}>{progressPct}%</span>
              </div>
              <div style={{ height: 8, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg,#2563EB,#7C3AED)",
                  borderRadius: 99,
                }} />
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>{completedCount} of {totalCount} citizens completed</p>
            </div>
          </div>

          {/* Upcoming Citizens */}
          <div style={{
            background: "#fff",
            borderRadius: 22,
            padding: 28,
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Queue</p>
                <h2 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>Upcoming Citizens</h2>
              </div>
              <span style={{
                background: "#FEF3C7",
                color: "#D97706",
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 14px",
                borderRadius: 99,
                border: "1px solid #FDE68A",
              }}>{waitingCitizens.length} in queue</span>
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
                    <th style={{ ...th, borderRadius: "0 10px 10px 0", paddingRight: 14 }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {waitingCitizens.map((citizen, index) => (
                    <tr key={citizen.appointment_id ?? index} className="citizen-row" style={{ borderRadius: 10, cursor: "default" }}>
                      <td style={{ ...td, paddingLeft: 14 }}>
                        <span style={{
                          background: "#EFF6FF",
                          color: "#2563EB",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: 99,
                          border: "1px solid #BFDBFE",
                          whiteSpace: "nowrap",
                        }}>
                          {citizen.appointment_id}
                        </span>
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: `hsl(${(index * 80 + 200)},70%,90%)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700,
                            color: `hsl(${(index * 80 + 200)},60%,40%)`,
                            flexShrink: 0,
                          }}>
                            {citizen.citizen_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{citizen.citizen_name}</span>
                        </div>
                      </td>
                      <td style={td}>
                        <span style={{
                          background: "#F3F4F6",
                          color: "#374151",
                          fontSize: 12,
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: 8,
                        }}>
                          {citizen.purpose}
                        </span>
                      </td>
                      <td style={{ ...td, paddingRight: 14 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#6B7280" }}>🕐 {citizen.appointment_time}</span>
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

// ── Sub-components ──────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, gradient, shadow }) {
  return (
    <div
      className="stat-card"
      style={{
        background: gradient,
        color: "white",
        borderRadius: 22,
        padding: "28px 24px",
        boxShadow: `0 8px 24px ${shadow}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 90, height: 90, borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", letterSpacing: "0.03em" }}>{title}</p>
        <span style={{
          fontSize: 22,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 10,
          padding: "6px 8px",
          lineHeight: 1,
        }}>{icon}</span>
      </div>
      <h1 style={{ margin: 0, fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</h1>
    </div>
  );
}

function FocusItem({ title, value, color, bg }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 0",
      borderBottom: "1px solid #F3F4F6",
    }}>
      <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{title}</span>
      <span style={{
        background: bg,
        color: color,
        fontWeight: 800,
        fontSize: 15,
        padding: "4px 14px",
        borderRadius: 99,
        minWidth: 36,
        textAlign: "center",
      }}>{value}</span>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "10px 12px",
  color: "#6B7280",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const td = {
  padding: "14px 12px",
  borderBottom: "1px solid #F3F4F6",
  fontSize: 14,
  color: "#374151",
};