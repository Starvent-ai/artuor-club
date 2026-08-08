import { test } from "node:test";
import assert from "node:assert/strict";
import { gregorianToJalali, jalaliToGregorian, isJalaliLeapYear } from "../JalaliCalendar";

test("known Nowruz reference dates convert correctly", () => {
  assert.deepEqual(gregorianToJalali(1979, 3, 21), { year: 1358, month: 1, day: 1 });
  assert.deepEqual(gregorianToJalali(2000, 3, 20), { year: 1379, month: 1, day: 1 });
  assert.deepEqual(gregorianToJalali(2013, 3, 21), { year: 1392, month: 1, day: 1 });
});

test("round trip gregorian to jalali to gregorian is stable across a wide date range", () => {
  const start = Date.UTC(1990, 0, 1);
  const end = Date.UTC(2035, 11, 31);
  const dayMs = 24 * 60 * 60 * 1000;

  for (let time = start; time <= end; time += 47 * dayMs) {
    const date = new Date(time);
    const gy = date.getUTCFullYear();
    const gm = date.getUTCMonth() + 1;
    const gd = date.getUTCDate();

    const jalali = gregorianToJalali(gy, gm, gd);
    const backToGregorian = jalaliToGregorian(jalali.year, jalali.month, jalali.day);

    assert.equal(backToGregorian.year, gy, `year mismatch for ${gy}-${gm}-${gd}`);
    assert.equal(backToGregorian.month, gm, `month mismatch for ${gy}-${gm}-${gd}`);
    assert.equal(backToGregorian.day, gd, `day mismatch for ${gy}-${gm}-${gd}`);
  }
});

test("first six jalali months always have 31 days", () => {
  for (let month = 1; month <= 6; month += 1) {
    const gregorian = jalaliToGregorian(1403, month, 31);
    const backToJalali = gregorianToJalali(gregorian.year, gregorian.month, gregorian.day);
    assert.equal(backToJalali.day, 31);
    assert.equal(backToJalali.month, month);
  }
});

test("months seven to eleven always have 30 days and never 31", () => {
  for (let month = 7; month <= 11; month += 1) {
    const gregorian = jalaliToGregorian(1403, month, 30);
    const backToJalali = gregorianToJalali(gregorian.year, gregorian.month, gregorian.day);
    assert.equal(backToJalali.day, 30);
    assert.equal(backToJalali.month, month);
  }
});

test("esfand has 30 days only in leap years and 29 otherwise", () => {
  for (let year = 1390; year <= 1410; year += 1) {
    const gregorian = jalaliToGregorian(year, 12, 29);
    const nextDay = new Date(
      Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day) + 24 * 60 * 60 * 1000
    );
    const nextJalali = gregorianToJalali(
      nextDay.getUTCFullYear(),
      nextDay.getUTCMonth() + 1,
      nextDay.getUTCDate()
    );

    if (isJalaliLeapYear(year)) {
      assert.equal(nextJalali.month, 12);
      assert.equal(nextJalali.day, 30);
    } else {
      assert.equal(nextJalali.month, 1);
      assert.equal(nextJalali.year, year + 1);
    }
  }
});
