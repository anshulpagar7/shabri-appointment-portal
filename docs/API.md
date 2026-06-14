# SHABRI Appointment Management System

## Citizen APIs

### Book Appointment

POST /api/appointments

Request:

{
"name": "Rahul Sharma",
"mobile": "9876543210",
"purpose": "Scholarship Inquiry",
"date": "2026-06-15",
"time": "11:00 AM"
}

Response:

{
"token": "SHA-1001",
"status": "Booked"
}

---

### Get Available Slots

GET /api/slots?date=2026-06-15

Response:

{
"availableSlots": [
"11:00 AM",
"11:10 AM",
"11:20 AM"
]
}

---

### Get Queue Status

GET /api/queue

Response:

{
"currentToken": "SHA-1001",
"waitingCount": 12
}

---

## Staff APIs

### Get Appointments

GET /api/appointments

---

### Update Appointment Status

PUT /api/appointments/:id

Request:

{
"status": "Completed"
}

---

### Add Holiday

POST /api/holidays

Request:

{
"holiday_name": "Independence Day",
"holiday_date": "2026-08-15"
}

---

### Add Event

POST /api/events

Request:

{
"title": "Scholarship Camp",
"event_date": "2026-07-10"
}

---

### Send Notification

POST /api/notifications

Request:

{
"appointment_id": 1,
"message": "Your appointment is confirmed."
}
