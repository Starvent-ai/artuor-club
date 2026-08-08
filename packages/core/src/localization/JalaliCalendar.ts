function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b;
}

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
];

interface JalaliCalendarInfo {
  leap: number;
  gregorianYear: number;
  marchDay: number;
}

function computeJalaliCalendarInfo(jalaliYear: number): JalaliCalendarInfo {
  const breaksCount = BREAKS.length;
  const gregorianYear = jalaliYear + 621;

  let leapJalali = -14;
  let previousBreak = BREAKS[0];

  if (jalaliYear < previousBreak || jalaliYear >= BREAKS[breaksCount - 1]) {
    throw new Error("YEAR_OUT_OF_SUPPORTED_RANGE");
  }

  let jump = 0;
  let currentBreak = previousBreak;

  for (let i = 1; i < breaksCount; i += 1) {
    currentBreak = BREAKS[i];
    jump = currentBreak - previousBreak;
    if (jalaliYear < currentBreak) {
      break;
    }
    leapJalali += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    previousBreak = currentBreak;
  }

  let n = jalaliYear - previousBreak;

  leapJalali += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJalali += 1;
  }

  const leapGregorian = div(gregorianYear, 4) - div((div(gregorianYear, 100) + 1) * 3, 4) - 150;
  const marchDay = 20 + leapJalali - leapGregorian;

  if (jump - n < 6) {
    n = n - jump + div(jump, 33) * 33;
  }

  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) {
    leap = 4;
  }

  return { leap, gregorianYear, marchDay };
}

function gregorianToJulianDayNumber(year: number, month: number, day: number): number {
  let julianDay =
    div((year + div(month - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(month + 9, 12) + 2, 5) +
    day -
    34840408;
  julianDay = julianDay - div(div(year + 100100 + div(month - 8, 6), 100) * 3, 4) + 752;
  return julianDay;
}

function julianDayNumberToGregorian(julianDayNumber: number): { year: number; month: number; day: number } {
  let julianDay = 4 * julianDayNumber + 139361631;
  julianDay = julianDay + div(div(4 * julianDayNumber + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(julianDay, 1461), 4) * 5 + 308;
  const day = div(mod(i, 153), 5) + 1;
  const month = mod(div(i, 153), 12) + 1;
  const year = div(julianDay, 1461) - 100100 + div(8 - month, 6);
  return { year, month, day };
}

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

export function gregorianToJalali(gregorianYear: number, gregorianMonth: number, gregorianDay: number): JalaliDate {
  const julianDayNumber = gregorianToJulianDayNumber(gregorianYear, gregorianMonth, gregorianDay);

  let jalaliYear = gregorianYear - 621;
  let calendarInfo = computeJalaliCalendarInfo(jalaliYear);

  let daysSinceNewYear =
    julianDayNumber - gregorianToJulianDayNumber(gregorianYear, 3, calendarInfo.marchDay);

  if (daysSinceNewYear < 0) {
    jalaliYear -= 1;
    calendarInfo = computeJalaliCalendarInfo(jalaliYear);
    daysSinceNewYear =
      julianDayNumber - gregorianToJulianDayNumber(gregorianYear - 1, 3, calendarInfo.marchDay);
  }

  let jalaliMonth: number;
  let jalaliDay: number;

  if (daysSinceNewYear < 186) {
    jalaliMonth = 1 + div(daysSinceNewYear, 31);
    jalaliDay = mod(daysSinceNewYear, 31) + 1;
  } else {
    jalaliMonth = 7 + div(daysSinceNewYear - 186, 30);
    jalaliDay = mod(daysSinceNewYear - 186, 30) + 1;
  }

  return { year: jalaliYear, month: jalaliMonth, day: jalaliDay };
}

export function jalaliToGregorian(jalaliYear: number, jalaliMonth: number, jalaliDay: number): {
  year: number;
  month: number;
  day: number;
} {
  const calendarInfo = computeJalaliCalendarInfo(jalaliYear);

  const dayOfYear =
    jalaliMonth <= 6
      ? (jalaliMonth - 1) * 31 + jalaliDay
      : 186 + (jalaliMonth - 7) * 30 + jalaliDay;

  const julianDayNumber =
    gregorianToJulianDayNumber(calendarInfo.gregorianYear, 3, calendarInfo.marchDay) + dayOfYear - 1;

  return julianDayNumberToGregorian(julianDayNumber);
}

const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function formatJalaliDate(date: JalaliDate): string {
  const monthName = JALALI_MONTH_NAMES[date.month - 1];
  return `${date.day} ${monthName} ${date.year}`;
}

export function isJalaliLeapYear(jalaliYear: number): boolean {
  return computeJalaliCalendarInfo(jalaliYear).leap === 0;
}
