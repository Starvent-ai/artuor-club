import {
  gregorianToJalali,
  jalaliToGregorian,
  formatJalaliDate,
} from "../../../core/src/localization/JalaliCalendar";
import { toPersianDigits } from "../../../core/src/localization/PersianDigits";

export function formatJalaliDateLabel(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const jalali = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return toPersianDigits(formatJalaliDate(jalali));
}

export function formatJalaliTimeLabel(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return toPersianDigits(`${hours}:${minutes}`);
}

export function formatJalaliDateTimeLabel(isoTimestamp: string): string {
  return `${formatJalaliDateLabel(isoTimestamp)} — ${formatJalaliTimeLabel(isoTimestamp)}`;
}

export function jalaliToIsoStartOfDay(year: number, month: number, day: number): string {
  const gregorian = jalaliToGregorian(year, month, day);
  const date = new Date(gregorian.year, gregorian.month - 1, gregorian.day);
  return date.toISOString();
}

export function isoToJalaliParts(isoTimestamp: string): { year: number; month: number; day: number } {
  const date = new Date(isoTimestamp);
  const jalali = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { year: jalali.year, month: jalali.month, day: jalali.day };
}
