import { test } from "node:test";
import assert from "node:assert/strict";
import { TimeRoundingService } from "../TimeRoundingService";

test("rounding table matches exact business rule examples", () => {
  const cases: Array<[number, number]> = [
    [10, 10],
    [11, 10],
    [12, 15],
    [13, 15],
    [14, 15],
    [15, 15],
    [16, 15],
    [17, 20],
    [18, 20],
    [19, 20],
    [20, 20],
    [21, 20],
    [22, 25],
    [23, 25],
    [24, 25],
    [25, 25],
    [26, 25],
    [0, 0],
    [1, 0],
    [4, 5],
  ];

  for (const [input, expected] of cases) {
    assert.equal(
      TimeRoundingService.roundMinutes(input),
      expected,
      `rounding ${input} should equal ${expected}`
    );
  }
});

test("computeBilledMinutesFromSeconds rounds fractional minutes correctly", () => {
  assert.equal(TimeRoundingService.computeBilledMinutesFromSeconds(16 * 60), 15);
  assert.equal(TimeRoundingService.computeBilledMinutesFromSeconds(17 * 60), 20);
  assert.equal(TimeRoundingService.computeBilledMinutesFromSeconds(16 * 60 + 40), 15);
  assert.equal(TimeRoundingService.computeBilledMinutesFromSeconds(0), 0);
});

test("negative durations are rejected", () => {
  assert.throws(() => TimeRoundingService.roundMinutes(-1));
});
