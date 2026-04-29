export type ChargeKind = "detention" | "layover" | "tonu" | "lumper" | "reweigh" | "fuel";

export type Recommendation = "approve" | "deny" | "dispute" | "needs_more_info";

export type RiskLevel = "low" | "medium" | "high";

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  stopId: string;
  type: "appointment" | "arrival" | "departure" | "note" | "document" | "invoice";
  label: string;
  timestamp: string;
  source: "tms" | "carrier" | "facility" | "document" | "billing";
  detail: string;
}

export interface Stop {
  id: string;
  facilityName: string;
  city: string;
  state: string;
  appointmentTime?: string;
  arrivalTime?: string;
  departureTime?: string;
}

export interface AccessorialCharge {
  id: string;
  shipmentId: string;
  stopId: string;
  kind: ChargeKind;
  label: string;
  amount: number;
  quantity?: number;
  unitRate?: number;
  invoiceNumber: string;
  carrierNote?: string;
  receiptId?: string;
}

export interface RateRule {
  id: string;
  customerId: string;
  kind: ChargeKind;
  description: string;
  graceMinutes?: number;
  hourlyRate?: number;
  flatAmount?: number;
  maxAmount?: number;
  requiresReceipt?: boolean;
  earliestCancelHours?: number;
}

export interface AgentFinding {
  id: string;
  title: string;
  severity: RiskLevel;
  detail: string;
  evidenceIds: string[];
}

export interface AuditDecision {
  shipmentId: string;
  chargeId: string;
  recommendation: Recommendation;
  confidence: number;
  summary: string;
  allowedAmount: number;
  disputedAmount: number;
  findings: AgentFinding[];
  evidenceIds: string[];
  missingData: string[];
  agentReviews: Array<{
    agent: string;
    stance: string;
    detail: string;
  }>;
}

export interface DisputeDraft {
  chargeId: string;
  reasonCode: string;
  subject: string;
  requestedResolution: string;
  body: string;
  evidenceIds: string[];
}
