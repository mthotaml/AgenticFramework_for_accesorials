import { getCarrier, getCharge, getCustomer, getShipment, getShipmentEvents } from "./sample-data.mjs";
import { auditCharge } from "./audit-engine.mjs";

export function generateDispute(shipmentId, chargeId, suppliedDecision) {
  const shipment = getShipment(shipmentId);
  const charge = getCharge(shipmentId, chargeId);
  if (!shipment || !charge) throw new Error("Shipment or charge not found.");

  const decision = suppliedDecision ?? auditCharge(shipmentId, chargeId);
  const carrier = getCarrier(shipment.carrierId);
  const customer = getCustomer(shipment.customerId);
  const events = getShipmentEvents(shipment.id, charge.stopId);
  const evidence = events.filter((event) => decision.evidenceIds.includes(event.id));
  const primaryFinding = decision.findings.find((finding) => finding.severity === "high") ?? decision.findings[0];
  const reasonCode = primaryFinding?.id?.toUpperCase().replaceAll("-", "_") ?? "ACCESSORIAL_REVIEW";

  const evidenceLines = evidence.map((event) => `- ${event.label}: ${formatDateTime(event.timestamp)} (${event.source}) - ${event.detail}`);
  const missingLines = decision.missingData.map((item) => `- Missing: ${item}`);
  const requestedResolution =
    decision.disputedAmount > 0
      ? `Please remove or credit $${decision.disputedAmount.toFixed(2)} from invoice ${charge.invoiceNumber}.`
      : `Please provide additional support before this charge can be approved.`;

  const body = [
    `Hello ${carrier?.name ?? "Carrier Billing Team"},`,
    "",
    `We reviewed ${charge.label} on shipment ${shipment.id} (${shipment.lane}) for ${customer?.name ?? "the customer"}. Based on the tariff and available shipment evidence, the current recommendation is ${decision.recommendation.replaceAll("_", " ")}.`,
    "",
    `Reason code: ${reasonCode}`,
    `Invoice line amount: $${charge.amount.toFixed(2)}`,
    `Allowed amount: $${decision.allowedAmount.toFixed(2)}`,
    `Disputed amount: $${decision.disputedAmount.toFixed(2)}`,
    "",
    "Supporting evidence:",
    ...(evidenceLines.length ? evidenceLines : ["- No supporting evidence was available for this line."]),
    ...missingLines,
    "",
    requestedResolution,
    "",
    "Thank you,"
  ].join("\n");

  return {
    chargeId,
    reasonCode,
    subject: `Dispute ${charge.invoiceNumber}: ${shipment.id} ${charge.label}`,
    requestedResolution,
    body,
    evidenceIds: decision.evidenceIds
  };
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(value));
}
