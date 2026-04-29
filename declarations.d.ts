declare module "*.mjs" {
  export const customers: any;
  export const carriers: any;
  export const rateRules: any;
  export const shipments: any;
  export const events: any;
  export function getShipment(...args: any[]): any;
  export function getCharge(...args: any[]): any;
  export function getRule(...args: any[]): any;
  export function getShipmentEvents(...args: any[]): any;
  export function getCarrier(...args: any[]): any;
  export function getCustomer(...args: any[]): any;
  export function auditCharge(...args: any[]): any;
  export function auditShipment(...args: any[]): any;
  export function buildDashboardShipments(...args: any[]): any;
  export function generateDispute(...args: any[]): any;
  export function answerCopilot(...args: any[]): any;
}
