import { getSpending } from "@/lib/data";
import { fmtEUR } from "@/lib/format";
import { AlertTriangle, CheckCircle2, Package, ShoppingBag, Store, TrendingDown } from "lucide-react";

export const metadata = { title: "Spending — Zalando Audit" };

type Bucket = {
  orderCount: number;
  orderTotal: number;
  refundedCount: number;
  refundedTotal: number;
  awaitingCount: number;
  awaitingTotal: number;
  cancelledCount: number;
  netSpend: number;
  byYear: Record<string, { orderCount: number; orderTotal: number; refundedTotal: number; awaitingTotal: number; netSpend: number }>;
};

export default function SpendingPage() {
  const data = getSpending() as {
    generatedAt: string;
    cutoff: string;
    buckets: { zalando: Bucket; lounge: Bucket };
    combined: {
      orderCount: number; orderTotal: number;
      refundedCount: number; refundedTotal: number;
      awaitingCount: number; awaitingTotal: number;
      cancelledCount: number; netSpend: number;
    };
  };

  const { buckets, combined } = data;

  const retailers: Array<{ key: "zalando" | "lounge"; label: string; icon: any }> = [
    { key: "zalando", label: "Zalando", icon: ShoppingBag },
    { key: "lounge", label: "Zalando Lounge", icon: Store },
  ];

  // Union of years across both buckets, sorted descending
  const years = Array.from(
    new Set([
      ...Object.keys(buckets.zalando.byYear),
      ...Object.keys(buckets.lounge.byYear),
    ])
  ).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-10">
      <div>
        <div className="text-xs uppercase tracking-widest muted">Spending analysis</div>
        <h1 className="mt-1 text-4xl font-serif tracking-tight">2022 → today</h1>
        <p className="mt-3 max-w-2xl muted">
          Total order value versus refunds actually confirmed, split by <b>Zalando</b> and <b>Zalando Lounge</b>.
          Cancelled orders are excluded from spend totals.
        </p>
      </div>

      {/* Headline combined stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total ordered" value={fmtEUR(combined.orderTotal)} sub={`${combined.orderCount} orders`} icon={Package} />
        <StatCard label="Refunded" value={fmtEUR(combined.refundedTotal)} sub={`${combined.refundedCount} orders`} icon={CheckCircle2} tone="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Awaiting refund" value={fmtEUR(combined.awaitingTotal)} sub={`${combined.awaitingCount} orders`} icon={AlertTriangle} tone="text-zalando-600 dark:text-zalando-500" />
        <StatCard label="Net spend" value={fmtEUR(combined.netSpend)} sub="ordered − refunded" icon={TrendingDown} />
      </div>

      {/* Split by retailer */}
      <div className="grid md:grid-cols-2 gap-6">
        {retailers.map(r => {
          const b = buckets[r.key];
          const refundRate = b.orderTotal ? (b.refundedTotal / b.orderTotal) * 100 : 0;
          return (
            <div key={r.key} className="card rounded-xl p-6">
              <div className="flex items-center gap-2 text-sm">
                <r.icon className="w-4 h-4 muted" />
                <span className="uppercase tracking-widest muted text-xs">{r.label}</span>
              </div>
              <div className="mt-3 text-4xl font-serif tracking-tight">{fmtEUR(b.orderTotal)}</div>
              <div className="text-xs muted mt-1">{b.orderCount} orders since 2022</div>

              <dl className="mt-6 grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <dt className="muted">Refunded</dt>
                <dd className="tabular-nums text-right text-emerald-600 dark:text-emerald-400">{fmtEUR(b.refundedTotal)}</dd>
                <dt className="muted">Awaiting refund</dt>
                <dd className="tabular-nums text-right text-zalando-600 dark:text-zalando-500">{fmtEUR(b.awaitingTotal)}</dd>
                <dt className="muted">Cancelled</dt>
                <dd className="tabular-nums text-right muted">{b.cancelledCount}</dd>
                <dt className="muted">Net spend</dt>
                <dd className="tabular-nums text-right font-medium">{fmtEUR(b.netSpend)}</dd>
                <dt className="muted">Refund rate</dt>
                <dd className="tabular-nums text-right muted">{refundRate.toFixed(1)}%</dd>
              </dl>
            </div>
          );
        })}
      </div>

      {/* Year breakdown table */}
      <div>
        <h2 className="text-sm uppercase tracking-widest muted mb-3">By year</h2>
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b hairline">
              <tr className="text-xs uppercase tracking-wide muted">
                <th className="text-left px-4 py-3">Year</th>
                <th className="text-left px-4 py-3">Retailer</th>
                <th className="text-right px-4 py-3">Orders</th>
                <th className="text-right px-4 py-3">Ordered</th>
                <th className="text-right px-4 py-3">Refunded</th>
                <th className="text-right px-4 py-3">Awaiting</th>
                <th className="text-right px-4 py-3">Net</th>
              </tr>
            </thead>
            <tbody>
              {years.flatMap(y =>
                retailers.map(r => {
                  const row = buckets[r.key].byYear[y];
                  if (!row) return null;
                  return (
                    <tr key={`${y}-${r.key}`} className="border-b hairline/50">
                      <td className="px-4 py-3 tabular-nums">{y}</td>
                      <td className="px-4 py-3 muted">{r.label}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.orderCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmtEUR(row.orderTotal)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{fmtEUR(row.refundedTotal)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-zalando-600 dark:text-zalando-500">{fmtEUR(row.awaitingTotal)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtEUR(row.netSpend)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs muted max-w-2xl">
        Amounts are extracted from order confirmation emails. Where an exact refund amount wasn't parseable but a
        refund confirmation exists, the original order value is used as a proxy — treat totals as an upper bound.
        Zalando Lounge uses <code>@zalando-lounge.nl</code> senders; everything else is classified as Zalando.
      </p>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, tone }: {
  label: string; value: string; sub?: string; icon: any; tone?: string;
}) {
  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide muted">{label}</div>
        <Icon className={`w-4 h-4 ${tone || "muted"}`} />
      </div>
      <div className={`mt-2 text-3xl font-serif tracking-tight ${tone || ""}`}>{value}</div>
      {sub && <div className="text-xs muted mt-1">{sub}</div>}
    </div>
  );
}
