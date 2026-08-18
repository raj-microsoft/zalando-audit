"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, Mail } from "lucide-react";
import { CATEGORY_CLASS, fmtDateTime, fmtEUR } from "@/lib/format";

interface EventLike {
  id: string; date: string; dateISO: string | null; category: string;
  subject: string; snippet: string; amount: number | null; hasHtml: boolean; from: string;
}

export function EventTimeline({ events }: { events: EventLike[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <ol className="relative border-l-2 hairline border-l-2 pl-6 space-y-4">
      {events.map((e, i) => {
        const isOpen = open[e.id];
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[33px] top-1.5 w-3 h-3 rounded-full bg-zalando ring-4 ring-[rgb(var(--bg))]"></span>
            <div className="card rounded-lg p-4 border hairline">
              <button
                onClick={() => setOpen(o => ({ ...o, [e.id]: !o[e.id] }))}
                className="w-full flex items-start gap-3 text-left"
              >
                <span className={`shrink-0 text-[10px] uppercase font-semibold tracking-wide px-2 py-0.5 rounded ${CATEGORY_CLASS[e.category] || CATEGORY_CLASS.other}`}>
                  {e.category.replace(/_/g, " ")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{e.subject || "(no subject)"}</div>
                  <div className="text-xs muted mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{fmtDateTime(e.dateISO || e.date)}</span>
                    {e.amount != null && <span className="tabular-nums">· {fmtEUR(e.amount)}</span>}
                    <span className="truncate max-w-[16rem]">· {e.from}</span>
                  </div>
                  {e.snippet && <p className="text-xs muted mt-2 line-clamp-2">{e.snippet}</p>}
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 muted shrink-0" /> : <ChevronRight className="w-4 h-4 muted shrink-0" />}
              </button>
              {isOpen && (
                <div className="mt-4 pt-4 border-t hairline">
                  <div className="flex items-center gap-2 text-xs muted mb-2">
                    <Mail className="w-3 h-3" /> Email body {e.hasHtml ? "(HTML)" : "(text)"}
                  </div>
                  <iframe
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/email/${e.id}/body/`}
                    sandbox="allow-same-origin"
                    className="w-full h-[600px] rounded-md border hairline bg-white"
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
