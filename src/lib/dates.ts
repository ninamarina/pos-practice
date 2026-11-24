// Calendar-day helpers that work in a given IANA time zone (e.g. "America/Mexico_City").
// A "day" is a string "YYYY-MM-DD": it's what the user picks, what goes in the URL and what the API receives.
// Only the server turns a day into UTC instants, using the store's time zone.

export type DateRangePreset = 'today' | 'yesterday' | 'week' | 'month';

export type DayRange = { from: string; to: string };

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDay(value: string): boolean {
  if (!DAY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects impossible dates such as 2026-02-30, which Date would roll over to March
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// The calendar day that `instant` falls on in `timeZone`
export function dayInZone(instant: Date, timeZone: string): string {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

export function addDays(day: string, amount: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + amount)).toISOString().slice(0, 10);
}

// 0 = Monday … 6 = Sunday (weeks start on Monday in Mexico)
function weekdayIndex(day: string): number {
  const [year, month, date] = day.split('-').map(Number);
  return (new Date(Date.UTC(year, month - 1, date)).getUTCDay() + 6) % 7;
}

// Presets are resolved against "today" in the store's time zone, not the browser's
export function resolvePreset(preset: DateRangePreset, today: string): DayRange {
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case 'week':
      return { from: addDays(today, -weekdayIndex(today)), to: today };
    case 'month':
      return { from: `${today.slice(0, 8)}01`, to: today };
  }
}

// Offset of `timeZone` from UTC at `instant`, in milliseconds (e.g. -6 h for Mexico City)
function zoneOffset(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - (instant.getTime() - instant.getMilliseconds());
}

// The UTC instant when `day` starts (00:00) in `timeZone`
export function startOfDay(day: string, timeZone: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  const midnightAsUtc = Date.UTC(year, month - 1, date);
  // First guess with the offset at that moment, then correct once in case it crosses a DST change
  const guess = midnightAsUtc - zoneOffset(new Date(midnightAsUtc), timeZone);
  return new Date(midnightAsUtc - zoneOffset(new Date(guess), timeZone));
}

// Number of days in a range, both ends included
export function daysInRange({ from, to }: DayRange): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000) + 1;
}
