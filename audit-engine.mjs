import { getRule, getShipment, getShipmentEvents } from "./sample-data.mjs";

const money = (value) => Math.round(value * 100) / 100;

function minutesBetween(start, end) {
  if (!start || !end) return null;
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

function hoursBetween(start, end) {
  if (!start || !end) return null;
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 3600000);
}

function finding(id, title, severity, detail, evidenceIds = []) {
  return { id, title, severity, detail, evidenceIds };
}

function stopFor(shipment, charge) {
  return shipment.stops.find((stop) => stop.id === charge.stopId);
}

function duplicateCharges(shipment, charge) {
  return shipment.charges.filter((candidate) => {
    return (
      candidate.id !== charge.id &&
      candidate.kind === charge.kind &&
      candidate.stopId === charge.stopId &&
      candidate.amount === charge.amount &&
      candidate.invoiceNumber === charge.invoiceNumber
    );
  });
}

function auditDetention(shipment, charge, rule, events, findings, missingData) {
  const stop = stopFor(shipment, charge);
  const arrival = stop?.arrivalTime;
  const departure = stop?.departureTime;

  if (!arrival) missingData.push("Arrival timestamp is missing.");
  if (!departure) missingData.push("Departure timestamp is missing.");
  if (!rule?.graceMinutes || !rule?.hourlyRate) missingData.push("Detention rule is incomplete.");
  if (!arrival || !departure || !rule?.graceMinutes || !rule?.hourlyRate) return { allowedAmount: 0 };

  const onsiteMinutes = minutesBetween(arrival, departure);
  const billableMinutes = Math.max(0, onsiteMinutes - rule.graceMinutes);
  const billableHours = Math.ceil(billableMinutes / 60);
  const allowedAmount = money(Math.min(billableHours * rule.hourlyRate, rule.maxAmount ?? Number.POSITIVE_INFINITY));
  const evidenceIds = events.filter((event) => ["arrival", "departure", "appointment", "note"].includes(event.type)).map((event) => event.id);

  if (billableMinutes <= 0) {
    findings.push(
      finding(
        "detention-within-grace",
        "Detention falls inside free time",
        "high",
        `Driver was onsite for ${onsiteMinutes} minutes, which does not exceed the ${rule.graceMinutes}-minute grace period.`,
        evidenceIds
      )
    );
  } else if (charge.amount > allowedAmount) {
    findings.push(
      finding(
        "detention-overbilled",
        "Detention amount exceeds tariff",
        "high",
        `Allowed detention is ${billableHours} billable hour(s) at $${rule.hourlyRate}/hr, capped at $${rule.maxAmount}; invoice billed $${charge.amount}.`,
        evidenceIds
      )
    );
  } else {
    findings.push(
      finding(
        "detention-supported",
        "Detention is supported by timeline",
        "low",
        `Onsite time was ${onsiteMinutes} minutes with ${billableHours} billable hour(s) after free time.`,
        evidenceIds
      )
    );
  }

  return { allowedAmount };
}

function auditLayover(shipment, charge, rule, events, findings, missingData) {
  const hasNextDayDelay = events.some((event) => /next morning|next day|midnight/i.test(event.detail));
  const evidenceIds = events.filter((event) => ["arrival", "departure", "note"].includes(event.type)).map((event) => event.id);
  const allowedAmount = hasNextDayDelay ? rule?.flatAmount ?? 0 : 0;

  if (!rule) missingData.push("Layover rule is missing.");

  if (!hasNextDayDelay) {
    findings.push(
      finding(
        "layover-not-supported",
        "Layover lacks overnight support",
        "high",
        "No event indicates the carrier was held past midnight by shipper or receiver delay.",
        evidenceIds
      )
    );
  } else if (charge.amount > allowedAmount) {
    findings.push(
      finding(
        "layover-over-cap",
        "Layover exceeds flat allowance",
        "medium",
        `Rule allows $${allowedAmount}; invoice billed $${charge.amount}.`,
        evidenceIds
      )
    );
  } else {
    findings.push(
      finding(
        "layover-supported",
        "Layover is supported by carrier note",
        "low",
        `Rule allows the $${allowedAmount} layover because the receiver pushed unloading to the next day.`,
        evidenceIds
      )
    );
  }

  return { allowedAmount };
}

function auditTonu(shipment, charge, rule, events, findings, missingData) {
  const pickupStop = stopFor(shipment, charge);
  const cancellation = events.find((event) => /cancel/i.test(event.label) || /cancel/i.test(event.detail));
  if (!pickupStop?.appointmentTime) missingData.push("Pickup appointment timestamp is missing.");
  if (!cancellation?.timestamp) missingData.push("Cancellation timestamp is missing.");
  if (!rule?.earliestCancelHours) missingData.push("TONU cancellation window rule is missing.");

  if (!pickupStop?.appointmentTime || !cancellation?.timestamp || !rule?.earliestCancelHours) return { allowedAmount: 0 };

  const hoursBeforePickup = hoursBetween(cancellation.timestamp, pickupStop.appointmentTime);
  const allowedAmount = hoursBeforePickup <= rule.earliestCancelHours ? rule.flatAmount ?? 0 : 0;

  if (allowedAmount > 0) {
    findings.push(
      finding(
        "tonu-supported",
        "TONU cancellation window is met",
        "low",
        `Cancellation happened ${hoursBeforePickup.toFixed(1)} hours before pickup, inside the ${rule.earliestCancelHours}-hour window.`,
        [cancellation.id]
      )
    );
  } else {
    findings.push(
      finding(
        "tonu-outside-window",
        "TONU is outside the cancellation window",
        "high",
        `Cancellation happened ${hoursBeforePickup.toFixed(1)} hours before pickup, outside the ${rule.earliestCancelHours}-hour window.`,
        [cancellation.id]
      )
    );
  }

  return { allowedAmount };
}

function auditReceiptBased(kindLabel, charge, rule, events, findings, missingData) {
  const receiptEvent = events.find((event) => event.id === charge.receiptId || /receipt|ticket/i.test(event.label));
  const evidenceIds = receiptEvent ? [receiptEvent.id] : [];
  const allowedAmount = receiptEvent ? Math.min(charge.amount, rule?.maxAmount ?? charge.amount) : 0;

  if (rule?.requiresReceipt && !receiptEvent) {
    missingData.push(`${kindLabel} receipt is missing.`);
    findings.push(
      finding(
        `${charge.kind}-receipt-missing`,
        `${kindLabel} receipt is missing`,
        "high",
        `${kindLabel} reimbursement requires a matching receipt before approval.`,
        evidenceIds
      )
    );
  } else if (charge.amount > (rule?.maxAmount ?? Number.POSITIVE_INFINITY)) {
    findings.push(
      finding(
        `${charge.kind}-over-cap`,
        `${kindLabel} exceeds maximum allowance`,
        "medium",
        `Invoice billed $${charge.amount}, above the $${rule.maxAmount} maximum allowance.`,
        evidenceIds
      )
    );
  } else {
    findings.push(
      finding(
        `${charge.kind}-supported`,
        `${kindLabel} has supporting documentation`,
        "low",
        `${kindLabel} amount is supported by required documentation.`,
        evidenceIds
      )
    );
  }

  return { allowedAmount };
}

export function auditCharge(shipmentId, chargeId) {
  const shipment = getShipment(shipmentId);
  if (!shipment) throw new Error(`Shipment ${shipmentId} was not found.`);
  const charge = shipment.charges.find((item) => item.id === chargeId);
  if (!charge) throw new Error(`Charge ${chargeId} was not found.`);

  const rule = getRule(shipment.customerId, charge.kind);
  const events = getShipmentEvents(shipment.id, charge.stopId);
  const findings = [];
  const missingData = [];

  if (!rule) {
    missingData.push(`No ${charge.kind} rule exists for this customer.`);
  }

  const duplicates = duplicateCharges(shipment, charge);
  if (duplicates.length > 0) {
    findings.push(
      finding(
        "duplicate-charge",
        "Potential duplicate invoice line",
        "high",
        `Found ${duplicates.length} matching ${charge.kind} charge on the same stop, invoice, and amount.`,
        []
      )
    );
  }

  let result = { allowedAmount: 0 };
  if (charge.kind === "detention") result = auditDetention(shipment, charge, rule, events, findings, missingData);
  if (charge.kind === "layover") result = auditLayover(shipment, charge, rule, events, findings, missingData);
  if (charge.kind === "tonu") result = auditTonu(shipment, charge, rule, events, findings, missingData);
  if (charge.kind === "lumper") result = auditReceiptBased("Lumper", charge, rule, events, findings, missingData);
  if (charge.kind === "reweigh") result = auditReceiptBased("Reweigh", charge, rule, events, findings, missingData);

  const allowedAmount = money(result.allowedAmount ?? 0);
  const disputedAmount = money(Math.max(0, charge.amount - allowedAmount));
  const highFindings = findings.filter((item) => item.severity === "high").length;
  const mediumFindings = findings.filter((item) => item.severity === "medium").length;

  let recommendation = "approve";
  if (missingData.length > 0 && highFindings === 0 && disputedAmount === 0) recommendation = "needs_more_info";
  if (disputedAmount > 0 || highFindings > 0) recommendation = "dispute";
  if (allowedAmount === 0 && highFindings > 0) recommendation = "deny";
  if (duplicates.length > 0) recommendation = "dispute";

  const evidenceIds = [...new Set(findings.flatMap((item) => item.evidenceIds).filter(Boolean))];
  const confidence = missingData.length > 0 ? 0.68 : highFindings > 0 ? 0.91 : mediumFindings > 0 ? 0.82 : 0.88;

  const summary =
    recommendation === "approve"
      ? `${charge.label} is supported by tariff rules and shipment evidence.`
      : recommendation === "needs_more_info"
        ? `${charge.label} needs more data before approval.`
        : `${charge.label} should be challenged for $${disputedAmount}.`;

  return {
    shipmentId,
    chargeId,
    recommendation,
    confidence,
    summary,
    allowedAmount,
    disputedAmount,
    findings,
    evidenceIds,
    missingData,
    agentReviews: buildAgentReviews(charge, rule, findings, missingData, recommendation)
  };
}

export function auditShipment(shipmentId) {
  const shipment = getShipment(shipmentId);
  if (!shipment) throw new Error(`Shipment ${shipmentId} was not found.`);
  return shipment.charges.map((charge) => auditCharge(shipment.id, charge.id));
}

export function buildDashboardShipments() {
  return import("./sample-data.mjs").then(({ shipments, customers, carriers, events }) => {
    return shipments.map((shipment) => {
      const decisions = shipment.charges.map((charge) => auditCharge(shipment.id, charge.id));
      const disputedAmount = decisions.reduce((sum, decision) => sum + decision.disputedAmount, 0);
      const risk = decisions.some((decision) => decision.recommendation === "deny" || decision.recommendation === "dispute")
        ? "high"
        : decisions.some((decision) => decision.recommendation === "needs_more_info")
          ? "medium"
          : "low";
      return {
        ...shipment,
        customer: customers.find((customer) => customer.id === shipment.customerId),
        carrier: carriers.find((carrier) => carrier.id === shipment.carrierId),
        events: events.filter((event) => event.shipmentId === shipment.id),
        decisions,
        disputedAmount,
        risk,
        recommendedAction: risk === "high" ? "Review dispute" : risk === "medium" ? "Request missing data" : "Approve"
      };
    });
  });
}

function buildAgentReviews(charge, rule, findings, missingData, recommendation) {
  const hasHigh = findings.some((item) => item.severity === "high");
  return [
    {
      agent: "Contract reviewer",
      stance: rule ? "Rule found" : "Rule gap",
      detail: rule ? rule.description : `No tariff rule was found for ${charge.kind}.`
    },
    {
      agent: "Shipment investigator",
      stance: missingData.length ? "Incomplete evidence" : "Evidence checked",
      detail: missingData.length ? missingData.join(" ") : "Timeline and document evidence were available for review."
    },
    {
      agent: "Billing analyst",
      stance: hasHigh ? "Challenge line" : "Amount check complete",
      detail: hasHigh ? "At least one high-risk issue affects this charge." : "No high-risk billing issue was found."
    },
    {
      agent: "Final adjudicator",
      stance: recommendation.replaceAll("_", " "),
      detail: `Final recommendation is ${recommendation.replaceAll("_", " ")} based on tariff, evidence, and invoice consistency.`
    }
  ];
}
