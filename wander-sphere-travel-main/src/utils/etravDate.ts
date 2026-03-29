/**
 * Shared date utilities for eTrav API date strings.
 * eTrav returns dates in /Date(timestamp+offset)/ format.
 */

/** Parse eTrav date strings to a JS Date object */
export function parseEtravDate(val: unknown): Date | null {
  if (!val) return null;
  const s = String(val).trim();
  
  // /Date(1743165000000+0530)/
  const m = s.match(/\/Date\((\d+)([+-]\d+)?\)\//);
  if (m) return new Date(Number(m[1]));
  
  // Unix ms timestamp as string
  if (/^\d{13}$/.test(s)) return new Date(Number(s));
  
  // ISO with T
  if (s.includes('T')) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // "2026-03-30 10:45:00"
  if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    const d = new Date(s.replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }
  
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Format Rupee prices consistently */
export function formatPrice(amount: number | string | undefined | null): string {
  const num = Number(amount);
  if (!amount || isNaN(num) || num <= 0) 
    return "Price on request";
  return '\u20B9' + num.toLocaleString('en-IN');
}

/** Format date to time string: "10:45 AM" */
export function formatTime(val: unknown): string {
  const d = parseEtravDate(val);
  if (!d) return '--:--';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/** Format date to short date string: "28 Mar" */
export function formatShortDate(val: unknown): string {
  const d = parseEtravDate(val);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });
}

/** Format date to full string: "Saturday, 28 March 2026" */
export function formatFullDate(dStr: string | null | undefined): string {
  const d = parseEtravDate(dStr);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Convert duration string to human format: "2h 05m" */
export function formatDuration(raw: string | null | undefined): string {
  if (!raw) return '';
  // ISO PT2H15M
  const isoMatch = raw.match(/PT(\d+H)?(\d+M)?/);
  if (isoMatch) {
    const h = isoMatch[1] ? parseInt(isoMatch[1]) : 0;
    const m = isoMatch[2] ? parseInt(isoMatch[2]) : 0;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }
  // HH:MM
  const colonMatch = raw.match(/^(\d+):(\d+)$/);
  if (colonMatch) {
    return `${colonMatch[1]}h ${colonMatch[2].padStart(2, '0')}m`;
  }
  return raw;
}

/** Compute duration between two date strings: "2h 05m" */
export function computeDuration(depStr: string | null | undefined, arrStr: string | null | undefined): string {
  const dep = parseEtravDate(depStr);
  const arr = parseEtravDate(arrStr);
  if (!dep || !arr) return '';
  const mins = Math.round((arr.getTime() - dep.getTime()) / 60000);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
