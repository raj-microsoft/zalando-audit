import { getReconciliation } from "@/lib/data";
import { fmtEUR } from "@/lib/format";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Mail, Package, RefreshCw, XCircle } from "lucide-react";

export default function Dashboard() {
  const { totals, generatedAt } = getReconciliation();
  const gapPct = totals.totalOrders ? ((totals.awaitingRefund / totals.totalOrders) * 100).toFixed(0) : "0";

  const stats = [
    { label: "Emails scanned", value: totals.totalEmails.toLocaleString(), icon: Mail, tone: "" },
    { label: "Unique orders", value: totals.totalOrders.toLocaleString(), icon: Package, tone: "" },
    { label: "Refunded", value: totals.refunded.toLocaleString(), icon: CheckCircle2, tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Awaiting refund", value: totals.awaitingRefund.toLocaleString(), icon: AlertTriangle, tone: "text-zalando-600 dark:text-zalando-500", sub: `${gapPct}% of orders` },
    { label: "Cancelled", value: totals.cancelled.toLocaleString(), icon: XCircle, tone: "" },
    { label: "Payment reminders", value: totals.reminders.toLocaleString(), icon: RefreshCw, tone: "text-rose-600 dark:text-rose-400" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <div className="text-xs uppercase tracking-widest muted">Zalando refund reconciliation</div>
        <h1 className="mt-1 text-4xl font-serif tracking-tight">Manasa's mailbox, audited.</h1>
        <p className="mt-3 max-w-2xl muted">
          Every Zalando email between Dec 2020 and today, grouped by order and cross-checked against refund confirmations.
          {" "}Generated <span className="text-[rgb(var(--fg))]">{new Date(generatedAt).toLocaleDateString("nl-NL", { dateStyle: "long" })}</span>.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide muted">{s.label}</div>
              <s.icon className={`w-4 h-4 ${s.tone || "muted"}`} />
            </div>
            <div className={`mt-2 text-3xl font-serif tracking-tight ${s.tone}`}>{s.value}</div>
            {s.sub && <div className="text-xs muted mt-1">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="card rounded-xl p-6 border-l-4 border-l-zalando">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-zalando shrink-0 mt-1" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest muted">Potentially owed</div>
            <div className="mt-1 text-3xl font-serif tracking-tight">{fmtEUR(totals.awaitingRefundTotalEUR)}</div>
            <p className="mt-2 muted text-sm max-w-xl">
              Sum of extractable amounts across <b>{totals.awaitingRefund}</b> orders where a return was
              received but no refund email arrived. Amounts include list prices where refund value wasn't
              parseable — treat as an upper bound.
            </p>
            <Link href="/gaps" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zalando text-white text-sm font-medium hover:bg-zalando-600 transition">
              Review the {totals.awaitingRefund} gaps →
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-widest muted mb-3">Category breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Object.entries(totals.categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, n]) => (
              <div key={cat} className="card rounded-md px-3 py-2 flex items-center justify-between text-sm">
                <span className="capitalize muted">{cat.replace(/_/g, " ")}</span>
                <span className="tabular-nums">{n}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
