export const TZ = 'Asia/Kolkata';

export function businessDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function nowMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour').value);
  const minute = Number(parts.find((part) => part.type === 'minute').value);
  return hour * 60 + minute;
}

export function parseHHMM(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || '');
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function formatClock(date = new Date()) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function shiftDate(days) {
  const base = businessDate();
  const noon = new Date(`${base}T12:00:00+05:30`);
  noon.setUTCDate(noon.getUTCDate() + days);
  return businessDate(noon);
}

export function pastWithinToday(minutesAgo) {
  const today = businessDate();
  const earliest = new Date(`${today}T00:10:00+05:30`).getTime();
  const proposed = Date.now() - minutesAgo * 60 * 1000;
  return new Date(Math.max(earliest, proposed));
}
