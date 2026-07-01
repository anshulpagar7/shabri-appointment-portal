// src/lib/calendarSync.js
// Adi Sampark — Google Calendar sync helpers.
//
// Supports three event types — routing is handled by the edge function
// based on the appointment_id prefix:
//   Citizen appointments  → appointment_id: "SHA-XXXX"
//   Executive meetings    → appointment_id: "MTG-{id}"
//   Tour diary entries    → appointment_id: "TOUR-{id}"
//
// All fields are spread into the request body so nothing is silently dropped.

import { supabase } from "./supabase";

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function syncCalendarCreate(fields) {
  try {
    const { data, error } = await supabase.functions.invoke("google-calendar", {
      body: { action: "create", ...fields },
    });

    if (error) {
      console.error("[calendarSync] create error:", error);
      return null;
    }

    console.log("[calendarSync] created:", data?.google_event_id);
    return data; // { success, action, google_event_id, event_link }
  } catch (err) {
    console.error("[calendarSync] create exception:", err);
    return null;
  }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function syncCalendarUpdate(fields) {
  if (!fields?.google_event_id) {
    console.warn("[calendarSync] update skipped — no google_event_id");
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke("google-calendar", {
      body: { action: "update", ...fields },
    });

    if (error) {
      console.error("[calendarSync] update error:", error);
      return null;
    }

    console.log("[calendarSync] updated:", data?.google_event_id);
    return data;
  } catch (err) {
    console.error("[calendarSync] update exception:", err);
    return null;
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function syncCalendarDelete(fields) {
  if (!fields?.google_event_id) {
    console.warn("[calendarSync] delete skipped — no google_event_id");
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke("google-calendar", {
      body: {
        action:          "delete",
        google_event_id: fields.google_event_id,
        appointment_id:  fields.appointment_id,
      },
    });

    if (error) {
      console.error("[calendarSync] delete error:", error);
      return null;
    }

    console.log("[calendarSync] deleted:", fields.google_event_id);
    return data;
  } catch (err) {
    console.error("[calendarSync] delete exception:", err);
    return null;
  }
}