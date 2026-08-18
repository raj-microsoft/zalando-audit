import { getReconciliation } from "@/lib/data";
import { fmtDate, fmtEUR } from "@/lib/format";
import { CopyButton } from "@/components/copy-button";
import Link from "next/link";
import { AlertTriangle, MessageSquare } from "lucide-react";

export default function Gaps() {
  const { orders, totals } = getReconciliation();
  const gaps = orders
    .filter(o => !o.synthetic && o.status === "awaiting_refund")
    .sort((a, b) => b.lastDate - a.lastDate);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest muted">Refund Gaps</div>
        <h1 className="mt-1 text-3xl font-serif tracking-tight">
          {gaps.length} orders awaiting refund
        </h1>
        <p className="mt-2 muted max-w-2xl text-sm">
          These orders have a "return received" email from Zalando but no follow-up refund confirmation.
          Total nominal value (upper bound): <b className="text-[rgb(var(--fg))]">{fmtEUR(totals.awaitingRefundTotalEUR)}</b>.
          Sorted by most recent activity first — start at the top when contacting Zalando support.
        </p>
      </div>

      <div className="card rounded-xl border-l-4 border-l-zalando p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-zalando shrink-0 mt-0.5" />
        <div className="text-sm">
          <b>Tip:</b> click a row's <span className="font-mono">Copy</span> button to grab the order number,
          then paste into Zalando's contact form. Ancient gaps (100+ days) are hardest to recover — Zalando's
          support policy expects refund within 14 days of return receipt.
        </div>
      </div>

      <div className="card rounded-xl overflow-hidden border hairline">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide muted bg-black/[0.02] dark:bg-white/[0.02]">
            <tr>
              <th className="px-4 py-3 text-left">Last event</th>
              <th className="px-4 py-3 text-left">Order #</th>
              <th className="px-4 py-3 text-right">Days since return</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Events</th>
              <th className="px-4 py-3 text-left w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y hairline">
            {gaps.map(o => {
              const days = o.daysSinceReturn ?? 0;
              const severity = days > 90 ? "text-rose-600 dark:text-rose-400"
                : days > 30 ? "text-zalando-600 dark:text-zalando-500"
                : "muted";
              return (
                <tr key={o.orderNumber} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-3 whitespace-nowrap muted">{fmtDate(o.lastDateISO)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.orderNumber}`} className="font-mono text-[13px] hover:text-zalando">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${severity}`}>
                    {o.daysSinceReturn != null ? `${o.daysSinceReturn}d` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtEUR(o.amount)}</td>
                  <td className="px-4 py-3 muted">
                    {o.eventCount}
                    {o.hasSupport && <MessageSquare className="inline w-3.5 h-3.5 ml-2 text-purple-500" />}
                  </td>
                  <td className="px-4 py-3"><CopyButton text={o.orderNumber} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
