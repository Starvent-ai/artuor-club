import { test } from "node:test";
import assert from "node:assert/strict";
import { PsSegmentBillingService } from "../PsSegmentBillingService";

test("total is sum of independently rounded segments", () => {
  const start = new Date("2026-01-01T20:00:00Z");
  const controllerChange = new Date("2026-01-01T20:16:00Z");
  const end = new Date("2026-01-01T20:31:00Z");

  const segments = [
    {
      controllerCount: 2,
      startedAt: start,
      endedAt: controllerChange,
      ratePerHourForControllerCount: 60000,
    },
    {
      controllerCount: 3,
      startedAt: controllerChange,
      endedAt: end,
      ratePerHourForControllerCount: 90000,
    },
  ];

  const firstSegment = PsSegmentBillingService.calculateSegment(segments[0]);
  const secondSegment = PsSegmentBillingService.calculateSegment(segments[1]);

  assert.equal(firstSegment.billedMinutes, 15);
  assert.equal(secondSegment.billedMinutes, 15);

  const total = PsSegmentBillingService.calculateTotal(segments);
  assert.equal(total.toToman(), firstSegment.amount.toToman() + secondSegment.amount.toToman());
});

test("reversed segment range is rejected", () => {
  assert.throws(() =>
    PsSegmentBillingService.calculateSegment({
      controllerCount: 1,
      startedAt: new Date("2026-01-01T20:10:00Z"),
      endedAt: new Date("2026-01-01T20:00:00Z"),
      ratePerHourForControllerCount: 60000,
    })
  );
});
