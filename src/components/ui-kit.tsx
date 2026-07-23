import { useRef, type MouseEvent, type ReactNode } from "react";

export function Card({ children, className = "", title, subtitle, right }: { children: ReactNode; className?: string; title?: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-border bg-card ${className}`}>
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

export function Badge({ tone = "muted", children }: { tone?: "muted" | "success" | "warning" | "danger" | "solid" | "mint"; children: ReactNode }) {
  const map: Record<string, string> = {
    muted: "border-border bg-secondary text-muted-foreground",
    success: "border-emerald-900/60 bg-emerald-950/40 text-emerald-300",
    warning: "border-amber-900/60 bg-amber-950/40 text-amber-300",
    danger: "border-red-900/60 bg-red-950/40 text-red-300",
    solid: "border-transparent bg-foreground text-background",
    mint: "border-[color:var(--mint)]/30 bg-[color:var(--mint-soft)] text-[color:var(--mint)]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${map[tone]}`}>
      {children}
    </span>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "success" | "warning" | "danger" | "mint" }) {
  const color =
    tone === "success" ? "text-emerald-300" :
    tone === "warning" ? "text-amber-300" :
    tone === "danger" ? "text-red-300" :
    tone === "mint" ? "text-[color:var(--mint)]" :
    "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold tracking-tight tabular-nums ${color}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Bar({ value, tone = "neutral" }: { value: number; tone?: "neutral" | "success" | "warning" | "danger" | "mint" }) {
  const color =
    tone === "success" ? "bg-emerald-500" :
    tone === "warning" ? "bg-amber-500" :
    tone === "danger" ? "bg-red-500" :
    tone === "mint" ? "bg-[color:var(--mint)]" :
    "bg-foreground";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: ReactNode; title: ReactNode; description: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>
        <h1 className="mt-2 font-serif text-4xl font-normal leading-[1.05] tracking-tight text-foreground md:text-5xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ============ Bento with mouse-tracked spotlight ============ */
export function Bento({ children, className = "", accent = false }: { children: ReactNode; className?: string; accent?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`bento group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition duration-300 hover:border-white/20 ${accent ? "bg-gradient-to-br from-[color:var(--mint-soft)] to-transparent" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Chip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition ${active ? "border-[color:var(--mint)]/40 bg-[color:var(--mint-soft)] text-[color:var(--mint)]" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}>
      {children}
    </span>
  );
}

export function Gauge({ value, label, size = 140 }: { value: number; label: string; size?: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} strokeWidth="8" className="stroke-secondary" fill="none" />
        <circle cx="60" cy="60" r={r} strokeWidth="8" strokeLinecap="round" className="stroke-[color:var(--mint)]" fill="none" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-serif text-3xl tabular-nums text-foreground">{Math.round(pct)}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">{children}</div>;
}
