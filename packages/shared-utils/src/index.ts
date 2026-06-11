// ─── Date helpers ─────────────────────────────────────────────────────────
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Validation helpers ───────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidTime(hhmm: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(hhmm);
}

// ─── Coordinate helpers ───────────────────────────────────────────────────
export function toDMS(decimal: number, isLat: boolean): string {
  const dir = isLat ? (decimal >= 0 ? 'N' : 'S') : decimal >= 0 ? 'E' : 'W';
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60);
  return `${deg}°${min}'${sec}" ${dir}`;
}

// ─── Category label helper ─────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  museum: 'Museum',
  restaurant: 'Restaurant',
  landmark: 'Landmark',
  park: 'Park',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  religious: 'Religious site',
  viewpoint: 'Viewpoint',
  beach: 'Beach',
  other: 'Attraction',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? 'Attraction';
}

// ─── Availability helper ────────────────────────────────────────────────────
const WEEKDAY_NAMES = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
] as const;

/**
 * Whether a place is open on the given ISO date ("YYYY-MM-DD").
 * Mirrors the backend engine semantics: no data or missing day → assume open;
 * only an explicit `closed: true` marks the place unavailable.
 */
export function isPlaceOpenOn(
  openingHours: import('@gowander/shared-types').OpeningHours | null | undefined,
  isoDate: string,
): boolean {
  if (!openingHours) return true;
  if (openingHours.always_open) return true;
  const [y, m, d] = isoDate.split('-').map(Number);
  const dayName = WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()];
  const dayData = openingHours[dayName];
  if (!dayData) return true;
  return !dayData.closed;
}
