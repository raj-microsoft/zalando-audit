export type Category =
  | "order" | "cancelled" | "payment" | "shipment"
  | "return_initiated" | "return_transit" | "return_received"
  | "refund" | "reminder" | "support" | "marketing" | "other";

export type OrderStatus =
  | "refunded" | "awaiting_refund" | "return_in_transit"
  | "no_return" | "cancelled" | "payment_overdue" | "other";

export interface EmailEvent {
  id: string;
  date: string;
  dateISO: string | null;
  category: Category;
  subject: string;
  snippet: string;
  amount: number | null;
  hasHtml: boolean;
  from: string;
}
export interface Order {
  orderNumber: string;
  synthetic: boolean;
  status: OrderStatus;
  firstDate: number;
  lastDate: number;
  firstDateISO: string;
  lastDateISO: string;
  amount: number | null;
  refundAmt: number | null;
  orderAmt: number | null;
  daysSinceReturn: number | null;
  eventCount: number;
  categories: Category[];
  hasSupport: boolean;
  events: EmailEvent[];
}
export interface Totals {
  totalEmails: number;
  totalOrders: number;
  refunded: number;
  awaitingRefund: number;
  returnInTransit: number;
  cancelled: number;
  noReturn: number;
  paymentOverdue: number;
  reminders: number;
  supportThreads: number;
  awaitingRefundTotalEUR: number;
  categoryCounts: Record<Category, number>;
}
export interface Reconciliation {
  generatedAt: string;
  totals: Totals;
  orders: Order[];
}
export interface Email {
  id: string;
  threadId: string;
  date: string;
  dateISO: string | null;
  from: string;
  subject: string;
  snippet: string;
  orderNumber: string | null;
  amount: number | null;
  productNames: string[];
  hasHtml: boolean;
  text: string;
  html: string;
}
