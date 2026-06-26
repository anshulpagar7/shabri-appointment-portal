import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import tribalLogoSrc from "../../assets/tribal-logo.jpg";
import tdcLogoSrc    from "../../assets/tdc-logo.jpeg";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function thisMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateLong(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${suffix}`;
}

function daysBetween(start, end) {
  if (!start || !end) return 0;
  const a = new Date(start + "T00:00:00");
  const b = new Date(end   + "T00:00:00");
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0; // inclusive
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Upcoming:  { bg: "#FEF3C7", color: "#D97706", dot: "#F59E0B", border: "#FDE68A" },
  Completed: { bg: "#ECFDF5", color: "#059669", dot: "#10B981", border: "#A7F3D0" },
  Cancelled: { bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444", border: "#FECACA" },
  Ongoing:   { bg: "#DBEAFE", color: "#2563EB", dot: "#3B82F6", border: "#BFDBFE" },
};

const TRAVEL_MODES = [
  "Flight ✈️",
  "Train 🚆",
  "Road 🚗",
  "Government Vehicle 🏛️",
  "Other",
];

const STATUS_OPTIONS = ["Upcoming", "Ongoing", "Completed", "Cancelled"];

const EMPTY_FORM = {
  destination: "",
  purpose: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  mode_of_travel: "",
  remarks: "",
  status: "Upcoming",
};

// ─── Print ────────────────────────────────────────────────────────────────────

function printTourDiary(tours, filterLabel) {
  const rows = tours.map(t => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-weight:700;color:#1E3A8A;">${t.destination || "—"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;">${t.purpose || "—"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;white-space:nowrap;">${formatDate(t.start_date)}${t.end_date && t.end_date !== t.start_date ? ` – ${formatDate(t.end_date)}` : ""}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;white-space:nowrap;">${formatTime(t.start_time)}${t.end_time ? ` – ${formatTime(t.end_time)}` : ""}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;">${t.mode_of_travel || "—"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;">${t.status || "—"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#64748B;">${t.remarks || "—"}</td>
    </tr>`).join("");

  const html = `
    <html>
      <head>
        <title>Tour Diary — Managing Director</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          .gov-header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #6B1A1A; padding-bottom: 18px; margin-bottom: 24px; }
          .logos { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
          .logo-img { width: 68px; height: 68px; object-fit: contain; border-radius: 6px; }
          .logo-divider { width: 1px; height: 48px; background: #D1D5DB; flex-shrink: 0; }
          .gov-text p { margin: 2px 0; }
          .gov-title { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #2563EB; text-transform: uppercase; }
          .gov-org { font-size: 16px; font-weight: 800; color: #111827; }
          .gov-sub { font-size: 12px; color: #64748B; }
          .report-heading { margin-bottom: 20px; }
          .report-heading h2 { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 4px; }
          .report-heading p { font-size: 13px; color: #64748B; }
          .meta { display: flex; gap: 24px; margin-bottom: 20px; padding: 14px 18px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; }
          .meta-item { font-size: 12px; color: #64748B; }
          .meta-item strong { display: block; font-size: 14px; color: #111827; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
          thead tr { background: #1E3A8A; }
          th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.8px; text-transform: uppercase; }
          tr:nth-child(even) td { background: #F8FAFC; }
          .footer { font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 14px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="gov-header">
          <div class="logos">
            <img src="data:image/jpeg;base64,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" alt="Tribal Logo" class="logo-img" />
            <div class="logo-divider"></div>
            <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAB4AG4DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD31FFSqopntT1yKxNB6gCngiqeo39npthNf6hdQ2lpAheaaZwqIo7knpXz947/AGgtR1O9m0X4Y6W1y6g79TuY+FXuyo3Cr/tyce1Q2jalQnVfuo+h9R1Cw0y0a81K9trK2XrNcSrGg/FiBXDXvxn8AxSSxafqN5rcsQy6aTYS3IX6sAF/WvA9T0SPXdKtpvGd5d6vrNwywPdC6ZhFPMGe2ZXJ2CE4WNlWMgM33ulcR4C8S6fpXh+503WYYPLttRhuwhhDTSgho5FG7jI/dt2OFbBBOaTWup3U8DBxbvdo+gr39qHwXbztCmg+IXZG2tvSKMjHsXzn2NOs/wBqDwDM4W50vxBaj+8YYpB+j5rx24+JemTa0LlEe7DR2cjSGywA6HbOhQNyGUAhiW6YOc8cfoWvaXH411O/1hPMt70yCNprZZEQtICrPHwSoXPCkHOOoBBT8mdEcFSad4NfM+w/Dvxm+GmvSLFaeKrW2mbgRXytbNn0y42/rXdJJHLCs0TpJE4yjowZWHqCODXwZYyeHdQ+JOq6i2l2T6BZLcTxW0Z8mORE+WHg8Es5jyDxycjArunTxZ4PNrdeBtaa01F3lNxpcaFbe4jQqC4jYeWfmJXcNgbgqM5qot2OWtg4xaUXa/c+uCM0wrXinww+P+l6teLoPji0HhzWgwjMjgrbu/o27mJvZuPcV7YTkAjBB5BHeqTucFWnKm7SRC61TuTg1fbpWZqr7FUj1pmaNUDis/xJrmmeHdEutZ1i6S1sbVN8sjfoAO5J4AHU1edwFyTgepNfJ3xZ8V3XxW+ISeHtLa9bwvpMhMr2cJleUjIeUIPvE8qg/Hualvojpw9H2stdluXPHeqXvxOvoJvEWsXeg+HjH9ptLOKIMixbdwllYkB32fMSoZY1I5ydp56/1jS9B0qz0C10S7t7+RY3bSktpP8ATFlXDxzseZAyFGjdQSrDOFztDvFN7qdnfWnhfSbZv7TU/ZNOtbScyJbdVMkEv303bSJYZRgtlj7e2/Bz4f6d4ZszrGoX6614iO6O6v5JTILYjlo4y33RyctwWznoaqMbuyO+dSNGCb26I8q8P/C/xVrt/af8J/rtzp0DxxpLDuD3bW7s3lrLLjkCSNAN27aWX7uQK9p0D4W/Dzw3CZIPDti7xAtJcX/79xgZJJfgevQVkfH2y8c3+gQQ+CNNjnkKSpdTxzKLgROuGjRTwwYcnvlVxzzXK/sr3UOm+GfEI1/UYbfUH1Ii4hvZwsqBIwCXDnI5LDn0NaJRjK1vmc9SdSrR9opW8kdNp3xE8Ap4u+xQ+KLJonleO3t7ZCYSSIljA2Jg5zJ+PPYVvfErX/CukQJperXui21/dtEsUd7EjYjaUI8mGUrhRvPPGRXhpvvBXhz9oqK/03S4be3MQkhhupxDDHcuMq68YiDKcqH4BYE7R92x+0l478LeKNP0zTLW1iluI51kFzI5WaBDw6lQDtBx0bngELjBM+0913K+qp1YcqdmvI7+w+Enw/8AGfhGz1OSwjt7m8j84XOnSLGY93IUhfkYgYzkZJzmuC8T/Dnx58PnbVNGmHizRre3CC3kUiS3VCzxMYweQjsW+UkHJBGCa92+Hlt4d0vwla2vh+yi02zXgwlhvEmBu3t/Gx4O7uCCOCK8v8ffFi2sfibfeDtbs410+0kj+zzBC6mVkjKtOnJdE3OwCjkhcjiqlGCSb0Io1a0puMdV2Z5gLnRvH6tDeyKbxoRO9zPMqSWSIyxlmfaFd5ZH3mP7oAAUhnrrvhP8TdZ+Gur2vhDxvNLdeHbhQ2n37K+beMnCsAwDeV6owDJ6dj0vxV+EMN7aDxR4JJbWUAnmglIePU1yH+ZT8u4kA7cbWwBgHFeF+C9Gi8Y6trc/iPUL+XU1RpWUjDlicPM8jkKoj4JVvvDIGCKxkpJ26nVH2Vam39nt1R93pLHNAk0MiSRuoZHRsqykZBBHUEd6ztTXcAMd68E/Zn8d3ek6s/wy8R3SS7MnSLlZN6OMbvLVv4kZfnQ+5HcV9AXa5wRVJ3R5VWk6U+VnBftB+IbzSvBMml6TKkWpasHgjkeQIsMIUtNKzH7oVOM+rDvXypfaF4j8GO10q2+oWCFDcvbTGW3WTaQEl2EMrLvIw23knrXrXxY1q91n9ozStJsr6S3i0iELI0eT95fMkBA6hhsQjvXHeKtI1TxB4/0Dw1epo73WrPCs95atI91IgJDNMXAIOAx24H3RnOAahq+p62E/dRSezV3/AF6Hqn7NfhCZrSf4h+IEWXVtXB+y7kAEVv8AdyB0G7GB/sgeprnv2itG8ZyajHpHhXQdZk0U2qrcTWsbP5xJJEJZeWjTjarZwSQOMCvRfF3xG0nwd4InvbWw3vabba0tkdTExB2oCynKjaM4YA8YxmtLRfiV4V1Twba+I/7Qit0uFKm3aVRNHIB86EEgDbnO44GCDnmuhxjy8lziVWqqntuW62OR8MfF7SpvBGnaVazGfxQljHbSQSusGy4A8scyEFjkA4UN6Vwvibwxpnw98Yx+LfGst9HZ6pezRx6Xp0waRokC/NO/3ZA38aA87s5PIrc0HwdeLpV/8WPD0Ec+tC0hk0i0BEyMY0EU7sMfMXCuVCnPQg5Neo+CbiTxX8OdK1fx1o+nrdFGuZYri2ASLazbZNr52HaAamzlozSU40W3DZ6Pv/SOP8W+HNVb4laF/wAIn8P9Gk0Q5n1K+ubeIx3CzkbwwbncqqCOpBPHHFXvHfgLUtd+KOhSReH/AA7N4ThjY3/nQRrI7NuD5wA5bG3aQcA5Jr06wu7XULOK+sZ4rq1mXdFNEwZHHqCODUiSRvEZkkR4xkF1YFeDg89ODWns0zk+szVrLZW/rzPmbx/ZWOt61P4Q+FlzcwahbK8V7pMtmEDiBCC6TyZfOAq7Sfm4Irtf2dLSx0Pwuq6vAbPVZXUTPd2rI4lLPhTI69dvl8Z9MV6rJpOnw6hc61aaVZf2tLCY2ufKVZJQB8qM+M4yAP8A9VfPHxG8M/EzxT4bufF99o48P6nDILa6s7KaUNeW44811DkHZwOOWXJ6AVm48j5tzphVVaHs27LTXrf9TtvFPxbl0v4vy+CIYIGgaKKBLgxs7xXbfMRtB+fIKqFyvzYyQM1x/wAY/CzeH7z/AITu9sFSK+jeHUbeRFlha6A3QTSwodhDEFSuSA+G5zXeeCvhj8P9R0ey1GfTE1LUFk8x7yW4l89nDZUyfMCGIwcEDrXceK9JsfF/hbVtDeSKeK6ie3dkYN5cvUE46MrbTir5JSTv8jP21OlNKC8mfLXj9pdVsk8U6X5EOp6LMJle0JlZbfzAUMroDCsiM6fIrE4c56V9SfDrxLD4y8EaX4giCq11CDMi/wDLOUfK6/gwP4Yr5d+F1tfzaLL4dks4ZI01CaC5S6vZcKzIY5BDEgChirgZckFgpwNua9J/ZS1m7XUPFXhG/EUc1ndfaFSOMRqpz5cgCjgcqpx6k1gu/c6MXTTpu32fyZ5zpbw698W/HF7dy2axOZ0LXDSYVfOUBgI2V+NgGQeMjg9K3fgxate/tEXE12YpLnT7GV5mS+kux520Rn96/JI3EdSBjANeJeKM/wDCT6ru+99tmz/32a9O/ZU8yTxzqtrAVE8+jyrHukZOkkZPzLypxnBGcHsamnK8kjtr0uWjKSfSx9H/ABC8BaD45srW01dXjWG5WdpLdUWWQBWGwuQSF+bJx6CvLfip8HfCzG20rwzYfYNUuLT/AIlscbM/nyRPmUSFj08twd56bPwqv8YNG+KGoePvDsPh7+1Hmt7d54bhbtGSBy+HLOsaKowF4YHI/KofiDbfFiy8WaNc61eWNzZJcWlxcXGnwMEQI4B3rw5RGJJCkD58nGRjadne8Tz6EZw5bVF6Ho/gbwT4t8N+OZZ38WyXnhSK0FvZ6fLIzNGAAEGMBRtwfmHJHXvVT9ov4hSeDPDa2Fvp73F1rEMsUU7PiOLG0PnBDZ2uSMHqKu+D9N+I2lfE7Vj4g1VNZ8PXsBkgnUiNLaQMNsaxZJXjI4JBGDnNcz+19pf2v4dWWpqcNYagufdZFKn9QtVK6g7GVO08RHnaa02PmTRPEviDRC39k61f2QYMGWGdlU7l2sSM4yQetbXhDwp478XaNd/8I/bahfWVgAjQrMQnztkqikgMc/MQPqa2fht8GvFvjExXT27aTpblW+13UZG9CcExr1YjrzgH1r658DeFdF8G6CmjaHbGG2DGRyzlnkkIALsT3OB7DtXPSoue+x6eLx1OjpCzkcB+yumoWngbVNK1ZLmO+s9WlSVJkb5DtUEBjw2GVs4PB61d8aeDvGmq/EK61HTdZs4vDt/pDafeW1xvk6qwO2MYG4kghtwxznPQ+k28UNurR20McSvI0jKigBnY5ZuO5PJPevL/ABHZ3OteJ5/HehfEGePTtBgmhn063haVBPErb1ZdwDZJGcjPTB6Y63BKKR5EarnVlNaX+Z554E8IfFLxDpNzZT+OrjTXiiNtcAsZJY1H3IZJAdxPUgAnaueedtdV8Ffht4n8M2esadrVxHbFbtJ7O4hdpUkJXDMuHXH3Vzlc1wHwm174l+FfD0+rReG5dY0m3tZJRHJLsaONyG3cZJQHLBcZ+ZiOCa9C+C/xV1TxSus6l4kS2trOKSKK1itYSApIYtySWdjleASfQc1lT5Lq97nXiFWSly2t5Hn2oabBF8dfGegXH2k2d7+/e3tzJiUs0bnEcbKzkB2xydvLEEAisO112fwb8VtTvoriJ2ubCPdJDL5iOXWJiQ3RvmB571Q/aVlVvjTruw8oYUJHqIUzXnYeaRgd7swUKMnOFHQfSsZSs2vM76VHnpqTejSOh+Kdi2m/EbXrMjG29kYfRjuH862/2edYTRvi3ossrhIbp2s5CT/z1UqP/HttdD+1boL6f45i1dEIhv4gGOON6/8A1j+leQQTSwTJNC5jkjYMjL1Ug5B/Os78srl0mq+Ht3Vj9BfEOtWPh7QrrWdUkkjsrRA8zJGXKjIGdo5PWvJfih8W/CGpeE44fDmof2rqElwPJt4opFlVwrFTyAQN23OOoyOc1taBrN18TPA9uVSN7DULXyNQGQixTAbZVYht7c4YKAoIYZbHFZHwZ+DsXhO91q418WupSTsbazIGR5Gcl8dVdjt6cjbwea75OUtI7M8SnGnTTdT4l0IvhXq/j/x3qmjeIn8SQWdjphFprGmbXWSd1GTIy7QMyZHfA2nHpXq2t6boPjDw7daTqHkajp1x8koimBG5WzwynhgRXiPxT8Y6p8PvGt5p2mTXerNqUaGezuyZCIPs/lpiQDzMhyxHPbnOc11fwP8ACng/QdB/t/w5Dqkmpz27QyLqLGGYvtD+X5ZwozhcEZ45z1qIvXl+8qtDRVFp2seq6dbW9hp9vY2iFLe2iWGJSxYqijAGTyeBVgmvOPg/408SeJ/Dd/rXifQo9Lt4XLWrwq48+MAliFYknGANw4YnjpUHwm+Imo+PvCWtX9tYQQ6lZzyx2qMCsMmVLQhjk89A35960Uloc0qM1e/Tc7Dxl4w0DwfYQX/iC/FpDNMIoz5bOWbGeignAHJPavHviv4ct/C/hrUNP8Cy6jLeeK5DLexNdxtEYOXL5fBXO7AIPILZziqOg+JLG+8FX/hr4ii28T+Jory5ngsppTIsO0KPmmjysS5LYIJGPTtQ+Hl/q2m/EqT/AIWObE3OoG3W1u7meCWGNbck4VwSo+U4A4JJ7ms5T5tP6R10qLp3fb7n2t6HU+B/i5o/hrSBpXjmC+0fUQElWIWZeORSihpEK8bXZWb0yxr1TwnougaZoTR6Lpq2Wn6jJ9ueB4yo3SBWyUb7vAX5e2K5n4jfDrRfH+o6Fqlxcqv2CXMrxYf7TAefLzyPvYIPIwW9ay/jBrx8AfDXUwl6GvtSY2mnoo2BNy4Zwo4UhSSduFztwBk1orxvzbIxly1WlT0b3R8u/EnWB4g8f67rCtujur6V4znqm7C/oBV34WeHZPEuu3Foi5EVq0hP/AlA/ma5CvpL9kHw2X0/VtdmTH2hhBET/dU5JH4n9K4Ye9K7PaxVT2FDT0R3/wC0J4RPijwVMsEYN5bfvID/ALQ6D8eR+NfF7q0bsjqVZThgRgg+lfoteRLPE8bqGRlwRXyT+0P8PZ9G1ibX9PgJtZm3XKqPuMf+Wn0Pf0P1qqkep5+X4nkfs5dTG+AvxFbwP4ia31B3bRL9gt0Bz5LDhZQPboR3HuBXvfxjkuPEfhtNK8L61dW+osyTQyWs7xpcBl+SIFf9ZvzkbeFClmIANfHVerfBP4jaz4WaRbnSptZ0OzjzM6RbpbCN25KPj5UJ6oSATzwaqlU05HsdWKw15e1hv+Z6n+z/APD/AFLS7fWrrxjp08eqNdolvNJM3mhFU5ZJVbJUlscHB21m/tJaI1xd6PpWixyXes6pco1shvC04aNXB++2QrKy88cx16/4U8T6H4o05dQ0HUYL2HjcEOHjPo6nlT9a8Hm+GfjC9+KCeJdL8Q2+qiK8F4lzeTFJGjSYqOgIIJRwMcYHQVvOKUFGKucFKo5VXObtbodx4X8K+PNC+Hz2Ntr2ox37WpBM9wJ3hZR+7W3TlUUYwcklgTgKQtcJ8FNN8beL7HVbe/1vVbXSZZZYpkA8uJpJDmYkYG5uoCjGCckrtwfbfiTc+JLfwfqEnhK2WfVSu2HdIq+UpzukG7glR0Hrj0rif2bLTxjpWhahpPiWxeK1jmE1pJJOrvukAd1IBJwdyvn1JocFzJCjVbpSnpe/zOE8PaT4Z+FXxofTNf1kGwuLVJYZFhO1N0m5I5iSSq5QEkZzhc4Ga9D/AGg/CN3418MaLF4YtLa5nfUVczR7QnlPGwMjOOqjg55qv4/+EOleIfF134m1PVbyRrySKKO2RMJF8gRckZZhuAJAxwTzmuovfEnhH4e+DrH7csWi2624aDTUy02TyVVCdxOSck8epoULJxeiHOrzShODvIp/DHS9P+G/g69sNQnt7eCxAub+7kYhjIw5JHIKED5CuCehUNnPzP8AGLx3c+PfFkmoEPFp9uDDYwN1SPP3j/tMeT+A7Vr/ABw8d+KfFF3bQajp9xoujyILmysnBBlTJCyuf4icHHYdvU+Z1hVqfYWx6GEw9m6s/iZc0fT7rVdUttNsozJcXMgjjUep7/Qda+8vhj4ct/DPg+x0yAcRxAE4xuPc/icn8a8T/Zl+GssDL4m1e3Kzyp+4jccxRnufRm/QfWvpWNQFAAwB0p042V2cGYYj2k+WOyKhNZHiTR7bV9Pktp40bKkDcMg56g+xrT3UE5qzzz40+LHwvvvD95PfaTbySWIJLwgZaH6eq/yq18BPFOh6UbnRr5Bpdzds0kutpMivHAihzDtcEMGKEY6ndX1hq2lWuowGOdBnHDY5FeG/Er4JWl9JJeacBZXDc741zG5/2h2NZqLi7o9Cni1OHs6v3mbq3hfQbtItaaV/BGt6gyiG207ezN50m2KKSD+8yEMdrAYz8vWr+ja78S/Dt7c2VovhfxhsYRyfZ7hYbnbGTGAEJX5QQVAVSM57k1w2r6h8TPDGpWd3c2EF2LS4juWmFsJBcSRpsR3IG/IX3xkZ65rC8P8AxDvIYdK03XnmmsLC/jmlSOCNpZohOJmjLN8wAf5gAcHuOhq+dJ9jZU3OPRr+vme23XxU8SR2s1tqfwt8TWrvGyF7cFwuQRkEx4rG0H43teXT6b4W8D319dum/wAuW9UbUjjC5OF6BV5JNUNG8cC/8F3d3bXcMU0k2oxB766ZHWa4LuqQxRqWkOwjDMwCk49K8R8J6rFo2uw391b3FzAquksUNyYGdWUgjcAeOeQQQehpyqyVtRU8PCSleO3qfQLeKfih4m0v7f8A2lofg/TJIJp8x5mvDFCcSlU+Zsr3GFIqlZ+HNJ0e4vriT7XfeKlso9ShudYeOW6liDnzjFbElVcIpZGctnjFcRd/FOdtQWXSNKSeUajPewiRDtVLiARTW7IpO4cA7sjJGcCqHh3wD448UQwQzxy2ljHgRtdk5RcYCqD82AO2QKTmn5lez5F7zUV/XzZa+LnjTQPF8cNjp1hf3F1YzCOw1GeQtNcW7LllmByWfeSRjgdAK674I/By5ubyDWfEVvgqQ8Fo4+76NJ/Rfz9K9C+Fvwb0jQDHeSxG4u8f8fE4yR/uDt/nmvYrO1htIRHCgUD8zSUbvmkc9XF2j7OlsJplnFY2qwRDgdT6mrecCo91G6rOAz804GiikA4GkYAgggEGiigDMv8AQ7C6B3RBCf7o4/KuU1n4Z6HqJJn0+xuM/wB+MA0UUDTa2Ocn+CHhh2J/sWEf7kpH9als/gl4XiYE6JbH/ro5b+tFFKyL9rP+ZnW6J8PtF0wAW1nZ24H/ADyiAP511Flpdna4McQLD+JuaKKZDd9zQVgKXfxRRTEIGoJoooA//9k=" alt="TDC Logo" class="logo-img" />
          </div>
          <div class="gov-text">
            <p class="gov-title">Government of Maharashtra</p>
            <p class="gov-org">Maharashtra State Cooperative Tribal Development Corporation Limited</p>
            <p class="gov-sub">SHABRI Smart Appointment Portal — Official Document</p>
          </div>
        </div>

        <div class="report-heading">
          <h2>📖 Official Tour Diary</h2>
          <p>Travel record of the Managing Director — Leena Bansod</p>
        </div>

        <div class="meta">
          <div class="meta-item"><strong>${tours.length}</strong> Total Tours</div>
          <div class="meta-item"><strong>${filterLabel || "All Tours"}</strong> Filter Applied</div>
          <div class="meta-item"><strong>${new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })}</strong> Report Generated</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Destination</th>
              <th>Purpose</th>
              <th>Dates</th>
              <th>Time</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="footer">
          This is an official document generated by SHABRI Smart Appointment Portal. Printed on ${new Date().toLocaleString("en-IN")}.
        </div>
      </body>
    </html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}

// ─── Single Tour Print ─────────────────────────────────────────────────────

function printSingleTour(t) {
  printTourDiary([t], t.destination);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TourDiary() {
  const [tours, setTours]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editId, setEditId]             = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [errors, setErrors]             = useState({});
  const [saving, setSaving]             = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // tour id to confirm

  // Filters
  const [search, setSearch]             = useState("");
  const [filterYear, setFilterYear]     = useState("All");
  const [filterMonth, setFilterMonth]   = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDest, setFilterDest]     = useState("All");

  useEffect(() => { fetchTours(); }, []);

  async function fetchTours() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tour_diary")
      .select("*")
      .order("start_date", { ascending: false });
    if (error) { console.log(error); }
    else setTours(data || []);
    setLoading(false);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalTours  = tours.length;
    const thisMonth   = tours.filter(t => t.start_date?.startsWith(thisMonthStr())).length;
    const cities      = new Set(tours.map(t => (t.destination || "").trim().toLowerCase()).filter(Boolean)).size;
    const daysOnTour  = tours.reduce((acc, t) => acc + daysBetween(t.start_date, t.end_date || t.start_date), 0);
    return { totalTours, thisMonth, cities, daysOnTour };
  }, [tours]);

  // ── Derived filter options ────────────────────────────────────────────────

  const years = useMemo(() => {
    const s = new Set(tours.map(t => t.start_date?.slice(0,4)).filter(Boolean));
    return ["All", ...Array.from(s).sort().reverse()];
  }, [tours]);

  const destinations = useMemo(() => {
    const s = new Set(tours.map(t => t.destination?.trim()).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [tours]);

  const MONTHS = ["All","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // ── Filtered tours ────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return tours.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (t.destination || "").toLowerCase().includes(q) ||
        (t.purpose     || "").toLowerCase().includes(q);
      const matchYear   = filterYear   === "All" || (t.start_date || "").startsWith(filterYear);
      const monthIdx    = MONTHS.indexOf(filterMonth);
      const matchMonth  = filterMonth  === "All" || (t.start_date || "").slice(5,7) === String(monthIdx).padStart(2,"0");
      const matchStatus = filterStatus === "All" || t.status === filterStatus;
      const matchDest   = filterDest   === "All" || t.destination === filterDest;
      return matchSearch && matchYear && matchMonth && matchStatus && matchDest;
    });
  }, [tours, search, filterYear, filterMonth, filterStatus, filterDest]);

  // ── Form handlers ─────────────────────────────────────────────────────────

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  function validate() {
    const e = {};
    if (!form.destination.trim()) e.destination = "Destination is required";
    if (!form.purpose.trim())     e.purpose     = "Purpose is required";
    if (!form.start_date)         e.start_date  = "Start date is required";
    if (!form.status)             e.status      = "Status is required";
    if (form.end_date && form.end_date < form.start_date) e.end_date = "End date cannot be before start date";
    return e;
  }

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);

    const payload = {
      destination:   form.destination.trim(),
      purpose:       form.purpose.trim(),
      start_date:    form.start_date,
      end_date:      form.end_date  || null,
      start_time:    form.start_time || null,
      end_time:      form.end_time   || null,
      mode_of_travel: form.mode_of_travel || null,
      remarks:       form.remarks   || null,
      status:        form.status,
    };

    if (editId) {
      const { error } = await supabase.from("tour_diary").update(payload).eq("id", editId);
      if (error) { console.log(error); alert("Failed to update: " + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("tour_diary").insert([payload]);
      if (error) { console.log(error); alert("Failed to save: " + error.message); setSaving(false); return; }
    }

    setSaving(false);
    closeForm();
    fetchTours();
  };

  const handleEdit = (t) => {
    setForm({
      destination:    t.destination   || "",
      purpose:        t.purpose       || "",
      start_date:     t.start_date    || "",
      end_date:       t.end_date      || "",
      start_time:     t.start_time    || "",
      end_time:       t.end_time      || "",
      mode_of_travel: t.mode_of_travel || "",
      remarks:        t.remarks       || "",
      status:         t.status        || "Upcoming",
    });
    setEditId(t.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("tour_diary").delete().eq("id", id);
    if (error) { console.log(error); alert("Failed to delete: " + error.message); return; }
    setDeleteConfirm(null);
    fetchTours();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  // ── Active filter label for print ─────────────────────────────────────────
  const activeFilterLabel = [
    filterYear   !== "All" ? filterYear   : null,
    filterMonth  !== "All" ? filterMonth  : null,
    filterStatus !== "All" ? filterStatus : null,
    filterDest   !== "All" ? filterDest   : null,
    search                 ? `"${search}" ` : null,
  ].filter(Boolean).join(", ") || "All Tours";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ── Page Header ── */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>STAFF PORTAL</p>
          <h1 style={styles.title}>📖 Tour Diary</h1>
          <p style={styles.sub}>Official travel record of the Managing Director — Leena Bansod</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button
            onClick={() => printTourDiary(filtered, activeFilterLabel)}
            style={styles.printBtn}
          >
            🖨 Print Diary
          </button>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setErrors({}); }}
            style={styles.newBtn}
          >
            + Add Tour
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={styles.statsRow}>
        <StatCard label="Total Tours"      value={stats.totalTours}  icon="🗺️"  color="#2563EB" />
        <StatCard label="Tours This Month" value={stats.thisMonth}   icon="📅"  color="#F59E0B" />
        <StatCard label="Cities Visited"   value={stats.cities}      icon="🏙️" color="#10B981" />
        <StatCard label="Days on Tour"     value={stats.daysOnTour}  icon="⏳"  color="#8B5CF6" />
      </div>

      {/* ── Filters & Search ── */}
      <div style={styles.filtersBar}>
        {/* Search */}
        <div style={styles.searchWrap}>
          <span style={{ fontSize:15, marginRight:8 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search destination or purpose…"
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch("")} style={styles.clearBtn}>✕</button>
          )}
        </div>

        {/* Year */}
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={styles.select}>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>

        {/* Month */}
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={styles.select}>
          {MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>

        {/* Status */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.select}>
          <option value="All">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>

        {/* Destination */}
        <select value={filterDest} onChange={e => setFilterDest(e.target.value)} style={styles.select}>
          {destinations.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* ── Timeline ── */}
      {loading ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize:36 }}>⏳</span>
          <p style={{ marginTop:12, color:"#64748B", fontWeight:600 }}>Loading tour records…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize:48 }}>✈️</span>
          <p style={{ margin:"14px 0 4px", fontWeight:700, fontSize:18, color:"#111827" }}>No tours found</p>
          <p style={{ margin:0, color:"#64748B", fontSize:14 }}>
            {tours.length === 0
              ? "No tour records yet. Click \"+ Add Tour\" to get started."
              : "No tours match your current filters."}
          </p>
        </div>
      ) : (
        <div style={styles.timeline}>
          {filtered.map((t, idx) => {
            const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG["Upcoming"];
            const isLast = idx === filtered.length - 1;
            const nights = daysBetween(t.start_date, t.end_date || t.start_date);

            return (
              <div key={t.id} style={styles.timelineItem}>
                {/* ── Left: date column ── */}
                <div style={styles.timelineLeft}>
                  <div style={styles.timelineDateBox}>
                    <span style={styles.timelineDay}>
                      {t.start_date ? new Date(t.start_date+"T00:00:00").getDate() : "—"}
                    </span>
                    <span style={styles.timelineMon}>
                      {t.start_date ? new Date(t.start_date+"T00:00:00").toLocaleString("default",{month:"short"}) : ""}
                    </span>
                    <span style={styles.timelineYear}>
                      {t.start_date ? new Date(t.start_date+"T00:00:00").getFullYear() : ""}
                    </span>
                  </div>
                  {nights > 1 && (
                    <span style={styles.nightsBadge}>{nights}d</span>
                  )}
                </div>

                {/* ── Centre: connector line + dot ── */}
                <div style={styles.timelineConnector}>
                  <div style={{ ...styles.timelineDot, background: sc.dot, border:`3px solid ${sc.border}` }} />
                  {!isLast && <div style={styles.timelineLine} />}
                </div>

                {/* ── Right: card ── */}
                <div style={styles.timelineCard}>
                  {/* Card header */}
                  <div style={styles.cardTop}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                        <span style={{ ...styles.statusBadge, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>
                          <span style={{ ...styles.statusDot, background:sc.dot }} />
                          {t.status}
                        </span>
                        {t.mode_of_travel && (
                          <span style={styles.modeBadge}>{t.mode_of_travel}</span>
                        )}
                      </div>
                      <h3 style={styles.destination}>📍 {t.destination}</h3>
                      <p style={styles.purpose}>{t.purpose}</p>
                    </div>

                    {/* Action buttons */}
                    <div style={styles.cardActions}>
                      <button onClick={() => handleEdit(t)} style={styles.actionBtn} title="Edit">✏️</button>
                      <button onClick={() => printSingleTour(t)} style={styles.actionBtn} title="Print">🖨</button>
                      <button
                        onClick={() => setDeleteConfirm(t.id)}
                        style={{ ...styles.actionBtn, color:"#DC2626" }}
                        title="Delete"
                      >🗑</button>
                    </div>
                  </div>

                  {/* Date + time row */}
                  <div style={styles.metaRow}>
                    <MetaChip icon="📅" text={
                      t.end_date && t.end_date !== t.start_date
                        ? `${formatDate(t.start_date)} – ${formatDate(t.end_date)}`
                        : formatDate(t.start_date)
                    } />
                    {(t.start_time || t.end_time) && (
                      <MetaChip icon="🕐" text={
                        t.end_time
                          ? `${formatTime(t.start_time)} – ${formatTime(t.end_time)}`
                          : formatTime(t.start_time)
                      } />
                    )}
                  </div>

                  {/* Remarks */}
                  {t.remarks && (
                    <div style={styles.remarksBox}>
                      <span style={{ fontSize:13, marginRight:6 }}>📝</span>
                      <span style={{ fontSize:13, color:"#64748B", fontStyle:"italic" }}>{t.remarks}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Result count ── */}
      {!loading && filtered.length > 0 && (
        <p style={{ textAlign:"center", fontSize:12, color:"#94A3B8", fontWeight:600, marginTop:8 }}>
          Showing {filtered.length} of {tours.length} tour records
        </p>
      )}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editId ? "✏️ Edit Tour" : "✈️ Add New Tour"}</h2>
              <button onClick={closeForm} style={styles.modalClose}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGrid}>

                <FormField label="Destination" required error={errors.destination} span={2}>
                  <input
                    name="destination" value={form.destination} onChange={handleChange}
                    placeholder="e.g. Nagpur, Pune, Mumbai"
                    style={{ ...styles.input, borderColor: errors.destination ? "#FCA5A5" : "#E2E8F0" }}
                  />
                </FormField>

                <FormField label="Purpose of Visit" required error={errors.purpose} span={2}>
                  <textarea
                    name="purpose" value={form.purpose} onChange={handleChange}
                    placeholder="e.g. Review of tribal development schemes, field inspection"
                    rows={2}
                    style={{ ...styles.input, resize:"vertical", borderColor: errors.purpose ? "#FCA5A5" : "#E2E8F0" }}
                  />
                </FormField>

                <FormField label="Start Date" required error={errors.start_date}>
                  <input
                    type="date" name="start_date" value={form.start_date} onChange={handleChange}
                    style={{ ...styles.input, borderColor: errors.start_date ? "#FCA5A5" : "#E2E8F0" }}
                  />
                </FormField>

                <FormField label="End Date" error={errors.end_date}>
                  <input
                    type="date" name="end_date" value={form.end_date} onChange={handleChange}
                    style={{ ...styles.input, borderColor: errors.end_date ? "#FCA5A5" : "#E2E8F0" }}
                  />
                </FormField>

                <FormField label="Start Time">
                  <input
                    type="time" name="start_time" value={form.start_time} onChange={handleChange}
                    style={styles.input}
                  />
                </FormField>

                <FormField label="End Time">
                  <input
                    type="time" name="end_time" value={form.end_time} onChange={handleChange}
                    style={styles.input}
                  />
                </FormField>

                <FormField label="Mode of Travel" span={2}>
                  <select name="mode_of_travel" value={form.mode_of_travel} onChange={handleChange} style={styles.input}>
                    <option value="">Select mode</option>
                    {TRAVEL_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </FormField>

                <FormField label="Status" required error={errors.status}>
                  <select name="status" value={form.status} onChange={handleChange}
                    style={{ ...styles.input, borderColor: errors.status ? "#FCA5A5" : "#E2E8F0" }}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </FormField>

                <FormField label="Remarks" span={2}>
                  <textarea
                    name="remarks" value={form.remarks} onChange={handleChange}
                    placeholder="Additional notes or observations…"
                    rows={3}
                    style={{ ...styles.input, resize:"vertical" }}
                  />
                </FormField>

              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeForm} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Tour Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth:440 }}>
            <div style={styles.modalHeader}>
              <h2 style={{ ...styles.modalTitle, color:"#DC2626" }}>🗑 Delete Tour Record</h2>
              <button onClick={() => setDeleteConfirm(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={{ padding:"24px 28px" }}>
              <p style={{ margin:0, fontSize:14, color:"#374151", lineHeight:1.6 }}>
                Are you sure you want to permanently delete this tour record? This action cannot be undone.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setDeleteConfirm(null)} style={styles.cancelBtn}>Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{ ...styles.saveBtn, background:"linear-gradient(135deg,#DC2626,#B91C1C)" }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background:"#fff", borderRadius:14, padding:"20px 24px", flex:1,
      boxShadow:"0 1px 3px rgba(0,0,0,0.06)", borderTop:`4px solid ${color}`,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <p style={{ margin:0, fontSize:12, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</p>
        <span style={{ fontSize:20 }}>{icon}</span>
      </div>
      <p style={{ margin:0, fontSize:32, fontWeight:900, color }}>{value}</p>
    </div>
  );
}

function FormField({ label, required, error, children, span = 1 }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : undefined, marginBottom:4 }}>
      <label style={{ display:"block", marginBottom:7, fontSize:13, fontWeight:600, color:"#374151" }}>
        {label} {required && <span style={{ color:"#EF4444" }}>*</span>}
      </label>
      {children}
      {error && <p style={{ margin:"5px 0 0", color:"#DC2626", fontSize:12 }}>{error}</p>}
    </div>
  );
}

function MetaChip({ icon, text }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:"#F8FAFC", border:"1px solid #E2E8F0",
      borderRadius:8, padding:"4px 10px", fontSize:12, color:"#374151", fontWeight:600,
    }}>
      <span>{icon}</span> {text}
    </span>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page:          { padding:"36px 40px", background:"#F8FAFC", minHeight:"100vh", fontFamily:"'Segoe UI', system-ui, sans-serif" },
  pageHeader:    { display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28, flexWrap:"wrap", gap:16 },
  eyebrow:       { margin:"0 0 6px", fontSize:11, fontWeight:700, letterSpacing:"2px", color:"#2563EB" },
  title:         { margin:"0 0 4px", fontSize:28, fontWeight:800, color:"#111827" },
  sub:           { margin:0, fontSize:14, color:"#64748B" },
  newBtn:        { background:"linear-gradient(135deg,#2563EB,#1d4ed8)", color:"#fff", border:"none", padding:"12px 20px", borderRadius:12, fontWeight:700, fontSize:14, cursor:"pointer" },
  printBtn:      { background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"12px 18px", fontSize:14, fontWeight:600, color:"#374151", cursor:"pointer" },
  // Stats
  statsRow:      { display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" },
  // Filters
  filtersBar:    { display:"flex", gap:10, marginBottom:28, flexWrap:"wrap", alignItems:"center" },
  searchWrap:    { flex:1, minWidth:220, display:"flex", alignItems:"center", background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"0 14px" },
  searchInput:   { flex:1, border:"none", outline:"none", fontSize:14, padding:"11px 0", background:"transparent", color:"#111827" },
  clearBtn:      { background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:14, padding:"4px" },
  select:        { padding:"11px 14px", border:"1.5px solid #E2E8F0", borderRadius:12, fontSize:13, background:"#fff", color:"#374151", cursor:"pointer", outline:"none", fontWeight:600 },
  // Timeline
  timeline:      { display:"flex", flexDirection:"column", gap:0, marginBottom:16 },
  timelineItem:  { display:"flex", gap:0, alignItems:"flex-start" },
  timelineLeft:  { width:80, flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:20, gap:6 },
  timelineDateBox: { background:"#1E3A8A", borderRadius:10, padding:"8px 10px", display:"flex", flexDirection:"column", alignItems:"center", minWidth:56, textAlign:"center" },
  timelineDay:   { color:"#fff", fontSize:22, fontWeight:900, lineHeight:1 },
  timelineMon:   { color:"rgba(255,255,255,0.8)", fontSize:11, fontWeight:700, textTransform:"uppercase", lineHeight:1.4 },
  timelineYear:  { color:"rgba(255,255,255,0.55)", fontSize:10, lineHeight:1.3 },
  nightsBadge:   { background:"#EFF6FF", color:"#2563EB", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, border:"1px solid #BFDBFE" },
  timelineConnector: { width:40, flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:22 },
  timelineDot:   { width:16, height:16, borderRadius:"50%", flexShrink:0, zIndex:1 },
  timelineLine:  { width:2, flex:1, background:"#E2E8F0", minHeight:40, marginTop:4 },
  // Card
  timelineCard:  { flex:1, background:"#fff", borderRadius:16, padding:"20px 24px", marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", marginLeft:0 },
  cardTop:       { display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 },
  destination:   { margin:"0 0 4px", fontSize:18, fontWeight:800, color:"#111827" },
  purpose:       { margin:0, fontSize:13, color:"#64748B", lineHeight:1.5 },
  cardActions:   { display:"flex", gap:6, flexShrink:0 },
  actionBtn:     { background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:15 },
  metaRow:       { display:"flex", flexWrap:"wrap", gap:8, marginTop:12 },
  remarksBox:    { marginTop:12, display:"flex", alignItems:"flex-start", gap:4, background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"10px 14px" },
  statusBadge:   { display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 },
  statusDot:     { width:6, height:6, borderRadius:"50%", flexShrink:0 },
  modeBadge:     { background:"#F1F5F9", color:"#64748B", fontSize:12, fontWeight:600, padding:"4px 10px", borderRadius:20 },
  // Empty
  emptyState:    { textAlign:"center", padding:"80px 0" },
  // Modal
  modalOverlay:  { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 },
  modal:         { background:"#fff", borderRadius:20, width:"100%", maxWidth:600, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column" },
  modalHeader:   { padding:"24px 28px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" },
  modalTitle:    { margin:0, fontSize:20, fontWeight:700, color:"#111827" },
  modalClose:    { background:"#F1F5F9", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:14, color:"#64748B" },
  modalBody:     { padding:"20px 28px", overflowY:"auto", flex:1 },
  modalFooter:   { padding:"16px 28px 24px", borderTop:"1px solid #F1F5F9", display:"flex", justifyContent:"flex-end", gap:12 },
  formGrid:      { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
  input:         { width:"100%", padding:"11px 14px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, background:"#F8FAFC", color:"#111827", outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  cancelBtn:     { background:"#F1F5F9", color:"#374151", border:"none", padding:"12px 20px", borderRadius:10, cursor:"pointer", fontWeight:600, fontSize:14 },
  saveBtn:       { background:"linear-gradient(135deg,#2563EB,#1d4ed8)", color:"#fff", border:"none", padding:"12px 24px", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:14 },
};