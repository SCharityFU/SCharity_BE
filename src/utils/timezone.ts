const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type VietnamDateParts = {
  year: number;
  month: number;
  day: number;
};

const format2 = (value: number): string => String(value).padStart(2, '0');

const isDateOnlyString = (input: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(input);

const parseDateOnlyString = (input: string): VietnamDateParts => {
  const [year, month, day] = input.split('-').map(Number);
  return { year, month, day };
};

const toVietnamDatePartsFromInstant = (instant: Date): VietnamDateParts => {
  const shifted = new Date(instant.getTime() + VIETNAM_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
};

const toVietnamDateString = (parts: VietnamDateParts): string => {
  return `${parts.year}-${format2(parts.month)}-${format2(parts.day)}`;
};

export const getVietnamDateStringFromInstant = (instant: Date): string => {
  return toVietnamDateString(toVietnamDatePartsFromInstant(instant));
};

export const getVietnamDateString = (value: string | Date): string => {
  if (typeof value === 'string' && isDateOnlyString(value)) {
    return value;
  }

  const instant = value instanceof Date ? value : new Date(value);
  return getVietnamDateStringFromInstant(instant);
};

const vietnamDayStartUtcFromParts = (parts: VietnamDateParts): Date => {
  const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) - VIETNAM_OFFSET_MS;
  return new Date(utcMs);
};

export const getVietnamDayRangeUtc = (value: string | Date): { startUtc: Date; endUtc: Date } => {
  const parts =
    typeof value === 'string' && isDateOnlyString(value)
      ? parseDateOnlyString(value)
      : toVietnamDatePartsFromInstant(value instanceof Date ? value : new Date(value));

  const startUtc = vietnamDayStartUtcFromParts(parts);
  const endUtc = new Date(startUtc.getTime() + DAY_MS - 1);
  return { startUtc, endUtc };
};

export const getVietnamRecentDaysRange = (
  days: number,
  now: Date = new Date(),
): { startUtc: Date; endUtc: Date; dateKeys: string[] } => {
  const safeDays = Math.max(1, days);
  const todayParts = toVietnamDatePartsFromInstant(now);

  const todayVirtual = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day));
  const startVirtual = new Date(todayVirtual);
  startVirtual.setUTCDate(startVirtual.getUTCDate() - (safeDays - 1));

  const dateKeys: string[] = [];
  for (let i = 0; i < safeDays; i++) {
    const current = new Date(startVirtual);
    current.setUTCDate(startVirtual.getUTCDate() + i);
    dateKeys.push(
      `${current.getUTCFullYear()}-${format2(current.getUTCMonth() + 1)}-${format2(current.getUTCDate())}`,
    );
  }

  const startUtc = getVietnamDayRangeUtc(dateKeys[0]).startUtc;
  const endUtc = getVietnamDayRangeUtc(dateKeys[dateKeys.length - 1]).endUtc;

  return { startUtc, endUtc, dateKeys };
};
