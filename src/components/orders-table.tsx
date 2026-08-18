"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Order } from "@/lib/types";
import { fmtDate, fmtEUR, STATUS_LABEL, STATUS_CLASS } from "@/lib/format";
import { Search, ArrowUpDown, MessageSquare } from "lucide-react";

type SortKey = "lastDate" | "orderNumber" | "amount" | "eventCount" | "status";

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("lastDate");
  const [dir, setDir] = useState<1 | -1>(-1);

  const filtered = useMemo(() => {
    let list = orders.filter(o => !o.synthetic);
    if (status !== "all") list = list.filter(o => o.status === status);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(o =>
        o.orderNumber.includes(needle) ||
        o.categories.join(" ").includes(needle)
      );
    }
    list = [...list].sort((a, b) => {
      const va = a[sort] as any, vb = b[sort] as any;
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return list;
  }, [orders, q, status, sort, dir]);

  function toggleSort(k: SortKey) {
    if (sort === k) setDir(d => (d === 1 ? -1 : 1));
    else { setSort(k); setDir(-1); }
  }

  const statuses = ["all", ...Object.keys(STATUS_LABEL)];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search order # or category…"
            className="w-full pl-9 pr-3 py-2 rounded-md card hairline border text-sm outline-none focus:border-zalando"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                status === s ? "bg-zalando text-white border-zalando" : "card hairline border muted hover:text-[rgb(var(--fg))]"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="text-xs muted">
        Showing <b className="text-[rgb(var(--fg))]">{filtered.length}</b> of {orders.filter(o=>!o.synthetic).length} orders.
      </div>

      <div className="card rounded-xl overflow-hidden border hairline">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide muted bg-black/[0.02] dark:bg-white/[0.02]">
            <tr>
              <Th onClick={() => toggleSort("lastDate")} active={sort==="lastDate"} dir={dir}>Last event</Th>
              <Th onClick={() => toggleSort("orderNumber")} active={sort==="orderNumber"} dir={dir}>Order #</Th>
              <Th onClick={() => toggleSort("status")} active={sort==="status"} dir={dir}>Status</Th>
              <Th onClick={() => toggleSort("amount")} active={sort==="amount"} dir={dir} align="right">Amount</Th>
              <Th onClick={() => toggleSort("eventCount")} active={sort==="eventCount"} dir={dir} align="right">Events</Th>
              <th className="px-4 py-3 text-left w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y hairline">
            {filtered.map(o => (
              <tr key={o.orderNumber} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition">
                <td className="px-4 py-3 whitespace-nowrap muted">{fmtDate(o.lastDateISO)}</td>
                <td className="px-4 py-3">
                  <Link href={`/orders/${o.orderNumber}`} className="font-mono text-[13px] hover:text-zalando">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_CLASS[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtEUR(o.amount)}</td>
                <td className="px-4 py-3 text-right tabular-nums muted">{o.eventCount}</td>
                <td className="px-4 py-3">{o.hasSupport && <MessageSquare className="w-4 h-4 text-purple-500" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, onClick, active, dir, align="left" }: any) {
  return (
    <th className={`px-4 py-3 text-${align} cursor-pointer select-none`} onClick={onClick}>
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${active ? "text-zalando" : "opacity-40"}`} />
        {active && <span className="text-[10px]">{dir === -1 ? "↓" : "↑"}</span>}
      </span>
    </th>
  );
}
