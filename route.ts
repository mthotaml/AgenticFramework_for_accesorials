import { NextRequest, NextResponse } from "next/server";
import { auditCharge } from "@/lib/audit-engine.mjs";

export async function POST(request: NextRequest) {
  const { shipmentId, chargeId } = await request.json();
  if (!shipmentId || !chargeId) {
    return NextResponse.json({ error: "shipmentId and chargeId are required." }, { status: 400 });
  }

  try {
    return NextResponse.json(auditCharge(shipmentId, chargeId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Audit failed." }, { status: 404 });
  }
}
