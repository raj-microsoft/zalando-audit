import { getReconciliation } from "@/lib/data";
import { fmtDate, fmtEUR, STATUS_CLASS, STATUS_LABEL } from "@/lib/format";
import { EventTimeline } from "@/components/event-timeline";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  const { orders } = getReconciliation();
  return orders.map(o => ({ id: o.orderNumber }));
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orders } = getReconciliation();
  const o = orders.find(x => x.orderNumber === id);
  if (!o) notFound();

  const span = o.firstDate === o.lastDate
    ? fmtDate(o.firstDateISO)
    : `${fmtDate(o.firstDateISO)} → ${fmtDate(o.lastDateISO)}`;

  return (
    <div className="space-y-8">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm muted hover:text-[rgb(var(--fg))]">
        <ArrowLeft className="w-4 h-4" /> All orders
      </Link>

      <div>
        <div className="text-xs uppercase tracking-widest muted">Order</div>
        <h1 className="mt-1 text-3xl font-serif tracking-tight font-mono">{o.orderNumber}</h1>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CLASS[o.status]}`}>
            {STATUS_LABEL[o.status]}
          </span>
          <span className="text-sm muted">{span}</span>
          {o.amount != null && <span className="text-sm tabular-nums">· {fmtEUR(o.amount)}</span>}
          <span className="text-sm muted">· {o.eventCount} events</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Order amount" value={fmtEUR(o.orderAmt)} />
        <MiniStat label="Refunded" value={fmtEUR(o.refundAmt)} />
        <MiniStat label="Days since return" value={o.daysSinceReturn != null ? `${o.daysSinceReturn}d` : "—"} />
        <MiniStat label="Categories" value={o.categories.length.toString()} />
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-widest muted mb-4">Event timeline</h2>
        <EventTimeline events={o.events} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wide muted">{label}</div>
      <div className="mt-1 text-lg font-serif tabular-nums">{value}</div>
    </div>
  );
}
