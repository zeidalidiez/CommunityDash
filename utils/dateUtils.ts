/** Local calendar date as YYYY-MM-DD (device timezone). */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Previous local calendar day relative to a YYYY-MM-DD string. */
export function previousLocalDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return toLocalDateString(dt);
}
