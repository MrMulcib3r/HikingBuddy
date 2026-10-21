/** "1 gearlist" / "3 gearlists" — instead of "gearlist(s)" (UI review 2026-10-14, point 6). */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "12 Sep 2026, 8:30" (24-hour, no seconds) — for snapshot dates (UI review point 10).
 * Built by hand so it reads the same in every browser language. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${d.getHours()}:${minutes}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "14:02" in the user's time zone (Activity, FR-25). */
export function formatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "20 Nov" — e.g. "Restorable until 20 Nov". */
export function formatDayMonth(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Tue 21 Oct" — a day in Activity. */
export function formatDayShort(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return `${WEEKDAYS[d.getDay()]} ${formatDayMonth(d)}`;
}
