import { NextResponse } from "next/server";
import { getEmailById, getEmails } from "@/lib/data";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getEmails().map(e => ({ id: e.id }));
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = getEmailById(id);
  if (!e) return new NextResponse("Not found", { status: 404 });
  const body = e.html || `<pre style="font-family:ui-sans-serif,system-ui;padding:16px;white-space:pre-wrap;line-height:1.5">${escapeHtml(e.text || e.snippet || "(empty)")}</pre>`;
  const wrapped = `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>body{margin:0;font-family:ui-sans-serif,system-ui;color:#111}</style></head><body>${body}</body></html>`;
  return new NextResponse(wrapped, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]);
}
