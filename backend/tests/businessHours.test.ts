import assert from "node:assert";
import {
  parseBusinessHours,
  normalizeBusinessHours,
  formatBusinessHours,
  getBusinessStatus,
  BusinessHour,
} from "../src/utils/businessHours";

console.log("Running businessHours unit tests...");

// Test 1: parseBusinessHours
const parsed1 = parseBusinessHours("8:00 AM – 6:00 PM");
assert.strictEqual(parsed1.openTime, "08:00");
assert.strictEqual(parsed1.closeTime, "18:00");
assert.strictEqual(parsed1.closed, false);

const parsed2 = parseBusinessHours("Closed");
assert.strictEqual(parsed2.openTime, null);
assert.strictEqual(parsed2.closeTime, null);
assert.strictEqual(parsed2.closed, true);

// Test 2: normalizeBusinessHours with 2 entries containing range strings
const legacyHours: BusinessHour[] = [
  { dayOfWeek: 1, openTime: "8:00 AM – 6:00 PM", closeTime: null, closed: false },
  { dayOfWeek: 6, openTime: "Closed", closeTime: null, closed: true },
];

const normalized = normalizeBusinessHours(legacyHours);
assert.strictEqual(normalized.length, 7);
assert.strictEqual(normalized[1].openTime, "08:00");
assert.strictEqual(normalized[1].closeTime, "18:00");
assert.strictEqual(normalized[1].closed, false);
// Tuesday (day 2) should copy Monday template
assert.strictEqual(normalized[2].openTime, "08:00");
assert.strictEqual(normalized[2].closeTime, "18:00");
// Sunday (day 0) should copy Saturday template
assert.strictEqual(normalized[0].closed, true);

// Test 3: formatBusinessHours
assert.strictEqual(formatBusinessHours(normalized[1]), "8:00 AM – 6:00 PM");
assert.strictEqual(formatBusinessHours(normalized[0]), "Closed");

// Test 4: getBusinessStatus
const statusResult = getBusinessStatus(legacyHours, "Africa/Mogadishu");
assert.ok(["OPEN", "CLOSING_SOON", "CLOSED", "HOURS_UNAVAILABLE"].includes(statusResult.status));

console.log("All businessHours unit tests passed successfully!");
