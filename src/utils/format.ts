/** Compact number formatter — 1234 → 1.2k */
export function formatCompact(n: number) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Relative time ("3 hours ago") */
export function timeAgo(input: string | number | Date) {
  const date = new Date(input);
  const diff = (Date.now() - date.getTime()) / 1000;
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];
  let value = abs;
  let unit: Intl.RelativeTimeFormatUnit = 'second';
  for (const [step, u] of units) {
    if (value < step) {
      unit = u;
      break;
    }
    value /= step;
    unit = u;
  }
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  return rtf.format(-Math.round(value) * Math.sign(diff || 1), unit);
}

/** Stable, short id generator (good enough for client-only state) */
export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

/** Capitalize first letter */
export function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
