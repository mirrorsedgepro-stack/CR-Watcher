export const TARGET_END_DATE = new Date('2027-03-27T23:59:59');

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Returns the 7 days of the week starting on Monday for a given anchor date,
 * OR if `startFromAnchorDay` is true, returns 7 consecutive days starting on `anchorDate`.
 */
export function getWeekDays(anchorDate: Date, rolling7Days = false): Date[] {
  const start = startOfDay(anchorDate);
  if (rolling7Days) {
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }
  // Standard Monday-start week
  const day = start.getDay(); // 0 (Sun) to 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = addDays(start, diffToMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatTimeShort(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateWithYear(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFullDayHeader(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCountdown(targetDate: Date, now: Date): {
  text: string;
  isPast: boolean;
  isImminent: boolean;
} {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs < 0) {
    const pastMins = Math.floor(Math.abs(diffMs) / 60000);
    if (pastMins < 60) {
      return { text: `Aired ${pastMins}m ago`, isPast: true, isImminent: false };
    }
    const pastHours = Math.floor(pastMins / 60);
    if (pastHours < 24) {
      return { text: `Aired ${pastHours}h ago`, isPast: true, isImminent: false };
    }
    const pastDays = Math.floor(pastHours / 24);
    return { text: `Aired ${pastDays}d ago`, isPast: true, isImminent: false };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 60) {
    return { text: `in ${totalMinutes}m`, isPast: false, isImminent: true };
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours < 24) {
    return {
      text: `in ${hours}h ${mins}m`,
      isPast: false,
      isImminent: hours < 6,
    };
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (days < 14) {
    return {
      text: `in ${days}d ${remHours}h`,
      isPast: false,
      isImminent: false,
    };
  }
  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  return {
    text: remDays > 0 ? `in ${weeks}w ${remDays}d` : `in ${weeks}w`,
    isPast: false,
    isImminent: false,
  };
}

export function getLocalTimezoneName(): string {
  try {
    const intl = Intl.DateTimeFormat(undefined, { timeZoneName: 'short' });
    const parts = intl.formatToParts(new Date());
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value;
    const iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz ? `${tz} (${iana})` : iana;
  } catch {
    return 'Local Time';
  }
}

export function formatFuzzyDate(d: {
  year: number | null;
  month: number | null;
  day: number | null;
}): string {
  if (!d.year) return 'TBA';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  if (!d.month) return `${d.year}`;
  const mName = months[d.month - 1] || '';
  if (!d.day) return `${mName} ${d.year}`;
  return `${mName} ${d.day}, ${d.year}`;
}
