// supabase/functions/google-calendar-sync/index.ts
// Adi Sampark — Google Calendar Integration
// Single-office, refresh-token-based. No user OAuth required.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Event colour map ─────────────────────────────────────────────────────────
// appointment_id prefixes determine event type:
//   citizen appointments → no prefix   → colorId "9"  (Blueberry)
//   executive meetings   → "MTG-"      → colorId "3"  (Grape / Purple)
//   tour diary entries   → "TOUR-"     → colorId "5"  (Banana / Yellow)

const EVENT_COLORS: Record<string, string> = {
  citizen:   "9",   // Blueberry
  executive: "3",   // Grape (purple)
  tour:      "5",   // Banana (yellow)
};

function resolveColorId(appointmentId: string): string {
  if (appointmentId.startsWith("TOUR-")) return EVENT_COLORS.tour;
  if (appointmentId.startsWith("MTG-"))  return EVENT_COLORS.executive;
  return EVENT_COLORS.citizen;
}

// ─── Google OAuth helpers ─────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const clientId     = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to refresh access token: ${err}`);
  }

  const json = await res.json();
  if (!json.access_token) {
    throw new Error(`No access_token in response: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

// Convert "12:05 PM" + "YYYY-MM-DD" → ISO 8601 datetime string (IST = UTC+5:30)
function toIST(dateStr: string, timeStr: string): string {
  // Parse time string — handles both "12:05 PM" and "14:05"
  let hours = 0, minutes = 0;
  const ampm = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampm) {
    hours   = parseInt(ampm[1], 10);
    minutes = parseInt(ampm[2], 10);
    if (ampm[3].toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (ampm[3].toUpperCase() === "AM" && hours === 12) hours  = 0;
  } else {
    const parts = timeStr.split(":");
    hours   = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  }

  // Build ISO string with IST offset (+05:30)
  const [year, month, day] = dateStr.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
}

// ─── Google Calendar API wrappers ─────────────────────────────────────────────

const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3/calendars";

async function createCalendarEvent(token: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const calendarId = encodeURIComponent(Deno.env.get("GOOGLE_CALENDAR_ID")!);
  const res = await fetch(`${CALENDAR_BASE}/${calendarId}/events`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(`Calendar create failed: ${JSON.stringify(json)}`);
  return json;
}

async function updateCalendarEvent(token: string, eventId: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const calendarId = encodeURIComponent(Deno.env.get("GOOGLE_CALENDAR_ID")!);
  const res = await fetch(`${CALENDAR_BASE}/${calendarId}/events/${eventId}`, {
    method:  "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(`Calendar update failed: ${JSON.stringify(json)}`);
  return json;
}

async function deleteCalendarEvent(token: string, eventId: string): Promise<void> {
  const calendarId = encodeURIComponent(Deno.env.get("GOOGLE_CALENDAR_ID")!);
  const res = await fetch(`${CALENDAR_BASE}/${calendarId}/events/${eventId}`, {
    method:  "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 410) {
    // 410 = already deleted — treat as success
    const text = await res.text();
    throw new Error(`Calendar delete failed (${res.status}): ${text}`);
  }
}

// ─── Citizen Appointment payload ─────────────────────────────────────────────

interface AppointmentPayload {
  action:                "create" | "update" | "delete";
  google_event_id?:      string;
  appointment_id:        string;
  citizen_name:          string;
  purpose:               string;
  appointment_date:      string;      // YYYY-MM-DD
  appointment_time:      string;      // "12:05 PM"
  appointment_end_time?: string;
  appointment_duration?: number;
  officer_name:          string;
  location?:             string;
  mobile?:               string;
  notes?:                string;
  meeting_link?:         string;
}

// ─── Executive Meeting payload ────────────────────────────────────────────────

interface ExecutiveMeetingPayload {
  action:               "create" | "update" | "delete";
  google_event_id?:     string;
  appointment_id:       string;       // always starts with "MTG-"
  meeting_title:        string;
  meeting_with:         string;
  meeting_date:         string;       // YYYY-MM-DD
  meeting_start_time:   string;       // "10:00 AM"
  meeting_end_time:     string;       // "11:00 AM"
  meeting_link?:        string;
  notes?:               string;
}

// Union — anything the handler receives
type IncomingBody = AppointmentPayload | ExecutiveMeetingPayload;

// ─── Citizen Appointment event builder ───────────────────────────────────────

function buildAppointmentEventPayload(data: AppointmentPayload): Record<string, unknown> {
  const startISO = toIST(data.appointment_date, data.appointment_time);

  let endISO: string;
  if (data.appointment_end_time) {
    endISO = toIST(data.appointment_date, data.appointment_end_time);
  } else {
    const durationMs = (data.appointment_duration ?? 5) * 60 * 1000;
    const startMs    = new Date(startISO).getTime();
    endISO           = toIST(
      data.appointment_date,
      (() => {
        const d = new Date(startMs + durationMs);
        const h = d.getUTCHours() + 5;
        const m = d.getUTCMinutes() + 30;
        const totalMin = h * 60 + m;
        const hh = Math.floor(totalMin / 60) % 24;
        const mm  = totalMin % 60;
        return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
      })()
    );
  }

  const meetingLinkSection = data.meeting_link?.trim()
    ? [``, `------------------------------------`, `🔗 Online Meeting`, data.meeting_link.trim(), `------------------------------------`]
    : [];

  const isGoogleMeet = (data.meeting_link || "").includes("meet.google.com");

  const description = [
    `🎫 Token: ${data.appointment_id}`,
    `👤 Citizen: ${data.citizen_name}`,
    `📋 Purpose: ${data.purpose}`,
    `📱 Mobile: ${data.mobile || "—"}`,
    `📍 Location: ${data.location || "—"}`,
    data.notes ? `📝 Notes: ${data.notes}` : null,
    ``,
    `🏛 Officer: ${data.officer_name}`,
    `📅 Date: ${data.appointment_date}`,
    `🕐 Time: ${data.appointment_time}${data.appointment_end_time ? ` – ${data.appointment_end_time}` : ""}`,
    ...meetingLinkSection,
    ``,
    `Generated by Adi Sampark Portal`,
  ].filter(line => line !== null).join("\n");

  const eventLocation = isGoogleMeet
    ? data.meeting_link!.trim()
    : "Adivasi Vikas Bhavan, Government of Maharashtra";

  return {
    summary:     `[${data.appointment_id}] ${data.citizen_name} — ${data.purpose}`,
    description,
    start:       { dateTime: startISO, timeZone: "Asia/Kolkata" },
    end:         { dateTime: endISO,   timeZone: "Asia/Kolkata" },
    location:    eventLocation,
    colorId:     resolveColorId(data.appointment_id),
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 10 },
        { method: "popup", minutes: 2  },
      ],
    },
    extendedProperties: {
      private: {
        appointment_id: data.appointment_id,
        citizen_name:   data.citizen_name,
        source:         "adi-sampark",
      },
    },
  };
}

// ─── Executive Meeting event builder ─────────────────────────────────────────

function buildExecutiveEventPayload(data: ExecutiveMeetingPayload): Record<string, unknown> {
  const startISO = toIST(data.meeting_date, data.meeting_start_time);
  const endISO   = toIST(data.meeting_date, data.meeting_end_time);

  const link        = data.meeting_link?.trim() || "";
  const isGoogleMeet = link.includes("meet.google.com");

  // Description — clean meeting format, no citizen fields
  const descLines: string[] = [
    `🏛 Executive Meeting`,
    ``,
    `Meeting With: ${data.meeting_with}`,
  ];

  if (link) {
    descLines.push(``, `------------------------------------`);
    descLines.push(`🔗 Online Meeting`);
    descLines.push(link);
    descLines.push(`------------------------------------`);
  }

  if (data.notes?.trim()) {
    descLines.push(``, `📝 Notes: ${data.notes.trim()}`);
  }

  descLines.push(``, `Generated by Adi Sampark Portal`);

  const description  = descLines.join("\n");
  const eventLocation = isGoogleMeet
    ? link
    : "Adivasi Vikas Bhavan, Government of Maharashtra";

  return {
    summary:     `[${data.appointment_id}] ${data.meeting_title}`,
    description,
    start:       { dateTime: startISO, timeZone: "Asia/Kolkata" },
    end:         { dateTime: endISO,   timeZone: "Asia/Kolkata" },
    location:    eventLocation,
    colorId:     EVENT_COLORS.executive,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 10 },
        { method: "popup", minutes: 2  },
      ],
    },
    extendedProperties: {
      private: {
        appointment_id: data.appointment_id,
        source:         "adi-sampark",
      },
    },
  };
}

// ─── Route to correct builder ─────────────────────────────────────────────────

function buildEventPayload(body: IncomingBody): Record<string, unknown> {
  if (body.appointment_id.startsWith("MTG-")) {
    return buildExecutiveEventPayload(body as ExecutiveMeetingPayload);
  }
  return buildAppointmentEventPayload(body as AppointmentPayload);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status:  405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  let body: IncomingBody;

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status:  400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // ── Validate: fields depend on event type ──────────────────────────────────
  const isExecutive = (body.appointment_id || "").startsWith("MTG-");

  const missingBase = ["action", "appointment_id"].filter(
    f => !(body as Record<string, unknown>)[f]
  );

  // Delete only needs action + appointment_id + google_event_id — skip typed validation
  const missingTyped = body.action === "delete"
    ? []
    : isExecutive
      ? (["meeting_title", "meeting_with", "meeting_date", "meeting_start_time", "meeting_end_time"] as const)
          .filter(f => !(body as unknown as Record<string, unknown>)[f])
      : (["citizen_name", "purpose", "appointment_date", "appointment_time", "officer_name"] as const)
          .filter(f => !(body as unknown as Record<string, unknown>)[f]);

  const missing = [...missingBase, ...missingTyped];

  if (missing.length > 0) {
    return new Response(JSON.stringify({ error: `Missing fields: ${missing.join(", ")}` }), {
      status:  400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if ((body.action === "update" || body.action === "delete") && !body.google_event_id) {
    return new Response(JSON.stringify({ error: "google_event_id required for update/delete" }), {
      status:  400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const token = await getAccessToken();

    if (body.action === "delete") {
      await deleteCalendarEvent(token, body.google_event_id!);
      return new Response(JSON.stringify({
        success:         true,
        action:          "delete",
        google_event_id: body.google_event_id,
      }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const eventPayload = buildEventPayload(body);

    let event: Record<string, unknown>;
    if (body.action === "update") {
      event = await updateCalendarEvent(token, body.google_event_id!, eventPayload);
    } else {
      event = await createCalendarEvent(token, eventPayload);
    }

    return new Response(JSON.stringify({
      success:         true,
      action:          body.action,
      google_event_id: event.id,
      event_link:      event.htmlLink,
    }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[google-calendar-sync] Error:", message);

    return new Response(JSON.stringify({
      success: false,
      error:   message,
    }), {
      status:  500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});