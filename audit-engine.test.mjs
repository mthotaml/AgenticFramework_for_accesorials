import test from "node:test";
import assert from "node:assert/strict";
import { auditCharge, auditShipment } from "../lib/audit-engine.mjs";
import { generateDispute } from "../lib/dispute.mjs";
import { answerCopilot } from "../lib/copilot.mjs";

test("approves supported detention and lumper charges", () => {
  const detention = auditCharge("SHP-10482", "chg-10482-det");
  assert.equal(detention.recommendation, "approve");
  assert.equal(detention.allowedAmount, 340);
  assert.equal(detention.disputedAmount, 0);
  assert.ok(detention.evidenceIds.includes("evt-10482-arr"));

  const lumper = auditCharge("SHP-10482", "chg-10482-lumper");
  assert.equal(lumper.recommendation, "approve");
  assert.equal(lumper.allowedAmount, 280);
});

test("disputes detention inside free time and duplicate lines", () => {
  const primary = auditCharge("SHP-10510", "chg-10510-det");
  assert.equal(primary.recommendation, "dispute");
  assert.equal(primary.allowedAmount, 0);
  assert.equal(primary.disputedAmount, 255);
  assert.ok(primary.findings.some((finding) => finding.id === "detention-within-grace"));
  assert.ok(primary.findings.some((finding) => finding.id === "duplicate-charge"));
});

test("approves TONU when cancellation is inside allowed window", () => {
  const decision = auditCharge("SHP-10577", "chg-10577-tonu");
  assert.equal(decision.recommendation, "approve");
  assert.equal(decision.allowedAmount, 250);
});

test("flags layover with missing departure and lumper receipt issues", () => {
  const decisions = auditShipment("SHP-10603");
  const layover = decisions.find((decision) => decision.chargeId === "chg-10603-layover");
  const lumper = decisions.find((decision) => decision.chargeId === "chg-10603-lumper");

  assert.equal(layover.recommendation, "approve");
  assert.equal(lumper.recommendation, "deny");
  assert.ok(lumper.missingData.includes("Lumper receipt is missing."));
});

test("generates dispute draft from invalid charge", () => {
  const draft = generateDispute("SHP-10510", "chg-10510-det");
  assert.equal(draft.reasonCode, "DUPLICATE_CHARGE");
  assert.match(draft.body, /Please remove or credit \$255\.00/);
});

test("copilot answers with grounded evidence references", () => {
  const answer = answerCopilot("What evidence supports disputing this charge?", "SHP-10510", "chg-10510-det");
  assert.match(answer.answer, /Delivery appointment|Driver arrived|Driver departed/);
  assert.ok(answer.evidenceIds.includes("evt-10510-arr"));
});
