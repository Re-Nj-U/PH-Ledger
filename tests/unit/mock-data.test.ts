import assert from "node:assert/strict";
import test from "node:test";
import {
  mockPeriods,
  mockExpenses,
  mockPartners,
  mockFundingHistory,
  periodSummary,
} from "../../lib/mock-data.ts";
import { sumMinor, subtractMinor } from "../../lib/money.ts";

test("September fixture reconciles cash, trip balances, and unpaid costs", () => {
  const september = periodSummary(mockPeriods[2]);
  assert.equal(september.received, "1840000");
  assert.equal(september.agreed, "2050000");
  assert.equal(september.tripCosts, "523000");
  assert.equal(september.incurred, "662000");
  assert.equal(september.paid, "632000");
  assert.equal(september.operatingCash, "1063000");
  assert.equal(september.movement, "1113000");
  assert.equal(september.closing, "2093000");
  assert.equal(september.outstanding, "210000");
  assert.equal(september.unpaidCosts, "30000");
  assert.equal(
    sumMinor(mockExpenses.map((expense) => expense.incurred)),
    september.incurred,
  );
  assert.equal(
    sumMinor(mockExpenses.map((expense) => expense.paid)),
    september.paid,
  );
});

test("negative month is retained and consecutive cash balances reconcile", () => {
  assert.equal(periodSummary(mockPeriods[1]).operatingCash, "-385000");
  assert.equal(periodSummary(mockPeriods[1]).movement, "-335000");
  for (let index = 1; index < mockPeriods.length; index++) {
    assert.equal(
      periodSummary(mockPeriods[index - 1]).closing,
      mockPeriods[index].opening,
    );
  }
});

test("partner statements and cash history use the same distinct categories", () => {
  const period = mockPeriods[2];
  assert.equal(
    sumMinor(mockPartners.map((partner) => partner.contributions)),
    period.funding,
  );
  assert.equal(
    sumMinor(mockPartners.map((partner) => partner.repaid)),
    period.repayments,
  );
  assert.equal(
    sumMinor(mockPartners.map((partner) => partner.distributions)),
    period.distributions,
  );
  const historyMovement = sumMinor(
    mockFundingHistory.map((event) =>
      event.direction === "in" ? event.amount : `-${event.amount}`,
    ),
  );
  assert.equal(
    historyMovement,
    subtractMinor(
      period.funding,
      sumMinor([period.repayments, period.distributions]),
    ),
  );
});
