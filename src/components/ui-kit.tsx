import { useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n";

export function Card({ children, className = "", title, subtitle, right }: { children: ReactNode; className?: string; title?: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            {title && <h3 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h3>}
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Badge({ tone = "muted", children }: { tone?: "muted" | "success" | "warning" | "danger" | "solid"; children: ReactNode }) {
  const map: Record<string, string> = {
    muted: "border-border bg-secondary text-muted-foreground",
    success: "border-emerald-900/60 bg-emerald-950/40 text-emerald-400",
    warning: "border-amber-900/60 bg-amber-950/40 text-amber-400",
    danger: "border-red-900/60 bg-red-950/40 text-red-400",
    solid: "border-transparent bg-foreground text-background",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${map[tone]}`}>
      {children}
    </span>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "success" | "warning" | "danger" }) {
  const color = tone === "success" ? "text-emerald-400" : tone === "warning" ? "text-amber-400" : tone === "danger" ? "text-red-400" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold tracking-tight ${color}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Bar({ value, tone = "neutral" }: { value: number; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const color = tone === "success" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-500" : tone === "danger" ? "bg-red-500" : "bg-foreground";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Accordion({ children, labelKey = "common.showDetails", closedLabelKey }: { children: ReactNode; labelKey?: string; closedLabelKey?: string }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <div className="mt-4 rounded-lg border border-border bg-surface/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-[12px] text-muted-foreground hover:text-foreground"
      >
        <span>{open ? t("common.hideDetails") : t(closedLabelKey ?? labelKey)}</span>
        <span className={`transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open && <div className="border-t border-border px-4 py-3 text-[12px] text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Ring({ value, label, sub, tone = "neutral", size = 132 }: { value: number; label: string; sub?: string; tone?: "neutral" | "success" | "warning" | "danger"; size?: number }) {
  const color = tone === "success" ? "#10b981" : tone === "warning" ? "#f59e0b" : tone === "danger" ? "#ef4444" : "#fafafa";
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, value / 100)));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={8} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={8} strokeLinecap="round" fill="none" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-xl font-semibold tabular-nums text-foreground">{label}</div>
          {sub && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
