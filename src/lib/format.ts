export function fmtEUR(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(+d)) return "—";
  return d.toLocaleDateString("nl-NL", { year: "numeric", month: "short", day: "2-digit" });
}
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(+d)) return "—";
  return d.toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
}
export const STATUS_LABEL: Record<string, string> = {
  refunded: "Refunded",
  awaiting_refund: "Awaiting refund",
  return_in_transit: "Return in transit",
  no_return: "No return",
  cancelled: "Cancelled",
  payment_overdue: "Payment overdue",
  other: "Other",
};
export const STATUS_CLASS: Record<string, string> = {
  refunded: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  awaiting_refund: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900",
  return_in_transit: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900",
  no_return: "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900/40 dark:text-neutral-300 dark:border-neutral-800",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-900/60 dark:text-neutral-400 dark:border-neutral-800",
  payment_overdue: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
  other: "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-900/40 dark:text-neutral-400 dark:border-neutral-800",
};
export const CATEGORY_CLASS: Record<string, string> = {
  order: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  cancelled: "bg-neutral-100 text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400",
  payment: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  shipment: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  return_initiated: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  return_transit: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  return_received: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  refund: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  reminder: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  support: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  marketing: "bg-neutral-50 text-neutral-500 dark:bg-neutral-900/40 dark:text-neutral-400",
  other: "bg-neutral-50 text-neutral-500 dark:bg-neutral-900/40 dark:text-neutral-400",
};
