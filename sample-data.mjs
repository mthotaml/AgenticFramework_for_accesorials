export const customers = [
  { id: "cust-nova", name: "Nova Retail Group", billingContact: "ap.disputes@novaretail.example" },
  { id: "cust-apex", name: "Apex Home Goods", billingContact: "freight.audit@apex.example" }
];

export const carriers = [
  { id: "car-axis", name: "Axis Freight Lines", email: "billing@axisfreight.example" },
  { id: "car-blue", name: "BlueRoad Logistics", email: "accessorials@blueroad.example" }
];

export const rateRules = [
  {
    id: "rule-detention-nova",
    customerId: "cust-nova",
    kind: "detention",
    description: "Detention allowed after 120 free minutes at $85/hr, capped at $425.",
    graceMinutes: 120,
    hourlyRate: 85,
    maxAmount: 425
  },
  {
    id: "rule-layover-nova",
    customerId: "cust-nova",
    kind: "layover",
    description: "Layover allowed only when carrier is held past midnight due to shipper or receiver delay.",
    flatAmount: 300,
    maxAmount: 300
  },
  {
    id: "rule-tonu-nova",
    customerId: "cust-nova",
    kind: "tonu",
    description: "TONU applies when cancellation occurs within 24 hours of pickup appointment.",
    flatAmount: 250,
    maxAmount: 250,
    earliestCancelHours: 24
  },
  {
    id: "rule-lumper-nova",
    customerId: "cust-nova",
    kind: "lumper",
    description: "Lumper charges require a matching receipt and are reimbursed at actual cost.",
    requiresReceipt: true,
    maxAmount: 350
  },
  {
    id: "rule-reweigh-nova",
    customerId: "cust-nova",
    kind: "reweigh",
    description: "Reweigh charges require scale ticket documentation.",
    requiresReceipt: true,
    maxAmount: 95
  }
];

export const shipments = [
  {
    id: "SHP-10482",
    customerId: "cust-nova",
    carrierId: "car-axis",
    lane: "Columbus, OH -> Joliet, IL",
    status: "Delivered",
    pickupDate: "2026-04-14",
    totalInvoiceAmount: 2140,
    stops: [
      {
        id: "stop-10482-pu",
        facilityName: "Nova DC Columbus",
        city: "Columbus",
        state: "OH",
        appointmentTime: "2026-04-14T09:00:00-04:00",
        arrivalTime: "2026-04-14T08:54:00-04:00",
        departureTime: "2026-04-14T10:43:00-04:00"
      },
      {
        id: "stop-10482-del",
        facilityName: "Joliet Crossdock",
        city: "Joliet",
        state: "IL",
        appointmentTime: "2026-04-15T08:00:00-05:00",
        arrivalTime: "2026-04-15T07:52:00-05:00",
        departureTime: "2026-04-15T12:53:00-05:00"
      }
    ],
    charges: [
      {
        id: "chg-10482-det",
        shipmentId: "SHP-10482",
        stopId: "stop-10482-del",
        kind: "detention",
        label: "Receiver detention",
        amount: 340,
        quantity: 4,
        unitRate: 85,
        invoiceNumber: "AX-77821",
        carrierNote: "Driver delayed at receiver for unload door assignment."
      },
      {
        id: "chg-10482-lumper",
        shipmentId: "SHP-10482",
        stopId: "stop-10482-del",
        kind: "lumper",
        label: "Lumper service",
        amount: 280,
        invoiceNumber: "AX-77821",
        receiptId: "doc-10482-lumper"
      }
    ]
  },
  {
    id: "SHP-10510",
    customerId: "cust-nova",
    carrierId: "car-blue",
    lane: "Dallas, TX -> Phoenix, AZ",
    status: "Delivered",
    pickupDate: "2026-04-16",
    totalInvoiceAmount: 1880,
    stops: [
      {
        id: "stop-10510-pu",
        facilityName: "Apex Dallas Pool",
        city: "Dallas",
        state: "TX",
        appointmentTime: "2026-04-16T14:00:00-05:00",
        arrivalTime: "2026-04-16T13:58:00-05:00",
        departureTime: "2026-04-16T15:05:00-05:00"
      },
      {
        id: "stop-10510-del",
        facilityName: "Phoenix Final Mile Hub",
        city: "Phoenix",
        state: "AZ",
        appointmentTime: "2026-04-18T10:00:00-07:00",
        arrivalTime: "2026-04-18T09:50:00-07:00",
        departureTime: "2026-04-18T11:20:00-07:00"
      }
    ],
    charges: [
      {
        id: "chg-10510-det",
        shipmentId: "SHP-10510",
        stopId: "stop-10510-del",
        kind: "detention",
        label: "Receiver detention",
        amount: 255,
        quantity: 3,
        unitRate: 85,
        invoiceNumber: "BR-22019",
        carrierNote: "Receiver delayed unloading."
      },
      {
        id: "chg-10510-dup",
        shipmentId: "SHP-10510",
        stopId: "stop-10510-del",
        kind: "detention",
        label: "Detention duplicate line",
        amount: 255,
        quantity: 3,
        unitRate: 85,
        invoiceNumber: "BR-22019",
        carrierNote: "Duplicate detention line from invoice import."
      }
    ]
  },
  {
    id: "SHP-10577",
    customerId: "cust-nova",
    carrierId: "car-axis",
    lane: "Atlanta, GA -> Charlotte, NC",
    status: "Canceled",
    pickupDate: "2026-04-20",
    totalInvoiceAmount: 250,
    stops: [
      {
        id: "stop-10577-pu",
        facilityName: "Nova Atlanta DC",
        city: "Atlanta",
        state: "GA",
        appointmentTime: "2026-04-20T13:00:00-04:00"
      }
    ],
    charges: [
      {
        id: "chg-10577-tonu",
        shipmentId: "SHP-10577",
        stopId: "stop-10577-pu",
        kind: "tonu",
        label: "Truck ordered not used",
        amount: 250,
        invoiceNumber: "AX-77902",
        carrierNote: "Load canceled after dispatch."
      }
    ]
  },
  {
    id: "SHP-10603",
    customerId: "cust-nova",
    carrierId: "car-blue",
    lane: "Reno, NV -> Portland, OR",
    status: "Delivered",
    pickupDate: "2026-04-21",
    totalInvoiceAmount: 2325,
    stops: [
      {
        id: "stop-10603-del",
        facilityName: "Portland North DC",
        city: "Portland",
        state: "OR",
        appointmentTime: "2026-04-22T07:00:00-07:00",
        arrivalTime: "2026-04-22T07:04:00-07:00"
      }
    ],
    charges: [
      {
        id: "chg-10603-layover",
        shipmentId: "SHP-10603",
        stopId: "stop-10603-del",
        kind: "layover",
        label: "Layover",
        amount: 300,
        invoiceNumber: "BR-22088",
        carrierNote: "Receiver could not unload until next day."
      },
      {
        id: "chg-10603-lumper",
        shipmentId: "SHP-10603",
        stopId: "stop-10603-del",
        kind: "lumper",
        label: "Lumper service",
        amount: 390,
        invoiceNumber: "BR-22088"
      }
    ]
  }
];

export const events = [
  {
    id: "evt-10482-appt",
    shipmentId: "SHP-10482",
    stopId: "stop-10482-del",
    type: "appointment",
    label: "Delivery appointment",
    timestamp: "2026-04-15T08:00:00-05:00",
    source: "tms",
    detail: "Receiver appointment confirmed for 08:00 local."
  },
  {
    id: "evt-10482-arr",
    shipmentId: "SHP-10482",
    stopId: "stop-10482-del",
    type: "arrival",
    label: "Driver arrived",
    timestamp: "2026-04-15T07:52:00-05:00",
    source: "carrier",
    detail: "Carrier check-in EDI event."
  },
  {
    id: "evt-10482-dep",
    shipmentId: "SHP-10482",
    stopId: "stop-10482-del",
    type: "departure",
    label: "Driver departed",
    timestamp: "2026-04-15T12:53:00-05:00",
    source: "carrier",
    detail: "Carrier check-out EDI event."
  },
  {
    id: "evt-10482-note",
    shipmentId: "SHP-10482",
    stopId: "stop-10482-del",
    type: "note",
    label: "Facility delay note",
    timestamp: "2026-04-15T09:17:00-05:00",
    source: "facility",
    detail: "Receiver reported dock congestion and delayed door assignment."
  },
  {
    id: "doc-10482-lumper",
    shipmentId: "SHP-10482",
    stopId: "stop-10482-del",
    type: "document",
    label: "Lumper receipt",
    timestamp: "2026-04-15T11:12:00-05:00",
    source: "document",
    detail: "Receipt submitted for $280 lumper service."
  },
  {
    id: "evt-10510-appt",
    shipmentId: "SHP-10510",
    stopId: "stop-10510-del",
    type: "appointment",
    label: "Delivery appointment",
    timestamp: "2026-04-18T10:00:00-07:00",
    source: "tms",
    detail: "Receiver appointment confirmed for 10:00 local."
  },
  {
    id: "evt-10510-arr",
    shipmentId: "SHP-10510",
    stopId: "stop-10510-del",
    type: "arrival",
    label: "Driver arrived",
    timestamp: "2026-04-18T09:50:00-07:00",
    source: "carrier",
    detail: "Driver arrived before appointment."
  },
  {
    id: "evt-10510-dep",
    shipmentId: "SHP-10510",
    stopId: "stop-10510-del",
    type: "departure",
    label: "Driver departed",
    timestamp: "2026-04-18T11:20:00-07:00",
    source: "carrier",
    detail: "Total onsite duration was 90 minutes."
  },
  {
    id: "evt-10577-cancel",
    shipmentId: "SHP-10577",
    stopId: "stop-10577-pu",
    type: "note",
    label: "Cancellation recorded",
    timestamp: "2026-04-19T18:30:00-04:00",
    source: "tms",
    detail: "Customer canceled 18.5 hours before pickup appointment."
  },
  {
    id: "evt-10603-appt",
    shipmentId: "SHP-10603",
    stopId: "stop-10603-del",
    type: "appointment",
    label: "Delivery appointment",
    timestamp: "2026-04-22T07:00:00-07:00",
    source: "tms",
    detail: "Delivery appointment confirmed."
  },
  {
    id: "evt-10603-arr",
    shipmentId: "SHP-10603",
    stopId: "stop-10603-del",
    type: "arrival",
    label: "Driver arrived",
    timestamp: "2026-04-22T07:04:00-07:00",
    source: "carrier",
    detail: "Carrier check-in recorded."
  },
  {
    id: "evt-10603-note",
    shipmentId: "SHP-10603",
    stopId: "stop-10603-del",
    type: "note",
    label: "Unload delayed",
    timestamp: "2026-04-22T16:10:00-07:00",
    source: "carrier",
    detail: "Carrier reported receiver pushed unloading to the next morning."
  }
];

export function getShipment(shipmentId) {
  return shipments.find((shipment) => shipment.id === shipmentId);
}

export function getCharge(shipmentId, chargeId) {
  const shipment = getShipment(shipmentId);
  return shipment?.charges.find((charge) => charge.id === chargeId);
}

export function getRule(customerId, kind) {
  return rateRules.find((rule) => rule.customerId === customerId && rule.kind === kind);
}

export function getShipmentEvents(shipmentId, stopId) {
  return events
    .filter((event) => event.shipmentId === shipmentId && (!stopId || event.stopId === stopId))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getCarrier(carrierId) {
  return carriers.find((carrier) => carrier.id === carrierId);
}

export function getCustomer(customerId) {
  return customers.find((customer) => customer.id === customerId);
}
