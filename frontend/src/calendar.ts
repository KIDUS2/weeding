// "Add to calendar" helpers. Times are Addis Ababa local time.
import type { WeddingEvent } from './api';

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

function range(ev: WeddingEvent) {
  const start = new Date(ev.eventDate!);
  const end = new Date(start.getTime() + 6 * 3600_000);
  return { start, end };
}

const title = (ev: WeddingEvent) => `${ev.brideName} & ${ev.groomName} — Wedding`;
const where = (ev: WeddingEvent) => [ev.venueName, ev.venueAddress].filter(Boolean).join(', ');

export function googleCalendarUrl(ev: WeddingEvent, link: string) {
  const { start, end } = range(ev);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: title(ev),
    dates: `${stamp(start)}/${stamp(end)}`,
    ctz: 'Africa/Addis_Ababa',
    location: where(ev),
    details: `Your invitation and entry pass: ${link}`,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function downloadIcs(ev: WeddingEvent, link: string) {
  const { start, end } = range(ev);
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//wedding//invite//EN', 'BEGIN:VEVENT',
    `UID:${stamp(start)}-${Math.random().toString(36).slice(2)}@wedding`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;TZID=Africa/Addis_Ababa:${stamp(start)}`,
    `DTEND;TZID=Africa/Addis_Ababa:${stamp(end)}`,
    `SUMMARY:${esc(title(ev))}`,
    `LOCATION:${esc(where(ev))}`,
    `DESCRIPTION:${esc(`Your invitation and entry pass: ${link}`)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', 'DESCRIPTION:Wedding today', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'wedding.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
