import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/gaps", label: "Refund Gaps" },
  { href: "/spending", label: "Spending" },
  { href: "/support", label: "Support" },
];

export function Header() {
  return (
    <header className="border-b hairline sticky top-0 z-10 backdrop-blur bg-[rgb(var(--bg))]/85">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="w-2.5 h-2.5 rounded-full bg-zalando"></span>
          <span>Zalando Audit</span>
          <span className="muted text-xs font-normal ml-1">/ Manasa</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className={cn(
              "px-3 py-1.5 rounded-md muted hover:text-[rgb(var(--fg))] hover:bg-black/5 dark:hover:bg-white/10 transition"
            )}>{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
