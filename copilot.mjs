import { auditCharge, auditShipment } from "./audit-engine.mjs";
import { generateDispute } from "./dispute.mjs";
import { getCharge, getShipment, getShipmentEvents } from "./sample-data.mjs";

export function answerCopilot(message, shipmentId, chargeId) {
  const shipment = getShipment(shipmentId);
  if (!shipment) throw new Error("Shipment not found.");

  const lower = message.toLowerCase();
  const charge = chargeId ? getCharge(shipmentId, chargeId) : shipment.charges[0];
  const decision = charge ? auditCharge(shipmentId, charge.id) : auditShipment(shipmentId)[0];
  const evidence = charge ? getShipmentEvents(shipmentId, charge.stopId).filter((event) => decision.evidenceIds.includes(event.id)) : [];

  if (lower.includes("dispute") || lower.includes("letter") || lower.includes("draft")) {
    const draft = generateDispute(shipmentId, charge.id, decision);
    return {
      answer: `I would draft this as ${draft.reasonCode}. The request is: ${draft.requestedResolution}`,
      evidenceIds: draft.evidenceIds
    };
  }

  if (lower.includes("why") || lower.includes("denied") || lower.includes("recommend")) {
    return {
      answer: `${decision.summary} The strongest finding is: ${decision.findings[0]?.detail ?? "No finding was generated."}`,
      evidenceIds: decision.evidenceIds
    };
  }

  if (lower.includes("evidence") || lower.includes("support")) {
    const evidenceSummary = evidence.map((event) => `${event.label}: ${event.detail}`).join(" ");
    return {
      answer: evidenceSummary || "I do not have enough supporting evidence for that charge yet.",
      evidenceIds: decision.evidenceIds
    };
  }

  if (lower.includes("missing")) {
    return {
      answer: decision.missingData.length ? `Missing data: ${decision.missingData.join(" ")}` : "No required data is missing for this review.",
      evidenceIds: decision.evidenceIds
    };
  }

  return {
    answer: `${charge?.label ?? "This shipment"} is currently marked ${decision.recommendation.replaceAll("_", " ")} with ${(decision.confidence * 100).toFixed(0)}% confidence. ${decision.summary}`,
    evidenceIds: decision.evidenceIds
  };
}
