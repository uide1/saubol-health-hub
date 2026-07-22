import { useMemo } from "react";

/**
 * 3D Health Orb — pure CSS/SVG, no external deps.
 * Renders a floating spherical gauge with orbiting rings.
 */
export function HealthOrb({ value = 72, size = 220, label = "Индекс" }: { value?: number; size?: number; label?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const status = useMemo(() => {
    if (pct >= 80) return { t: "Керемет", c: "var(--mint)" };
    if (pct >= 60) return { t: "Жақсы", c: "var(--mint)" };
    if (pct >= 40) return { t: "Орташа", c: "var(--warning)" };
    return { t: "Назар", c: "var(--danger)" };
  }, [pct]);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle at 50% 45%, ${status.c}33 0%, transparent 65%)` }}
      />
      {/* Orbit rings */}
      <div className="orb-rotate absolute inset-2 rounded-full border" style={{ borderColor: `${status.c}22`, borderStyle: "dashed" }} />
      <div className="absolute inset-6 rounded-full border" style={{ borderColor: `${status.c}18` }} />

      {/* Sphere */}
      <div
        className="orb-float relative rounded-full"
        style={{
          width: size * 0.72,
          height: size * 0.72,
          background: `radial-gradient(circle at 32% 28%, color-mix(in oklab, ${status.c} 55%, white) 0%, ${status.c} 32%, color-mix(in oklab, ${status.c} 40%, black) 78%, #000 100%)`,
          boxShadow: `inset -20px -30px 60px rgba(0,0,0,.55), inset 12px 18px 40px color-mix(in oklab, ${status.c} 40%, white), 0 30px 60px -20px ${status.c}66`,
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: "10%", left: "18%", width: "35%", height: "22%",
            background: "radial-gradient(ellipse at center, rgba(255,255,255,.55), transparent 70%)",
            filter: "blur(2px)",
          }}
        />
        {/* Progress ring on top */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} strokeWidth="3" stroke="rgba(255,255,255,.12)" fill="none" />
          <circle
            cx="60" cy="60" r={r}
            strokeWidth="3" strokeLinecap="round"
            stroke="rgba(255,255,255,.9)" fill="none"
            strokeDasharray={c} strokeDashoffset={offset}
          />
        </svg>
        {/* Center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="font-serif text-4xl leading-none text-white drop-shadow tabular-nums">{Math.round(pct)}</div>
          <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-white/70">{label}</div>
        </div>
      </div>

      {/* Status pill */}
      <div
        className="absolute bottom-0 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-widest backdrop-blur"
        style={{ borderColor: `${status.c}55`, color: status.c, background: `${status.c}14` }}
      >
        {status.t}
      </div>
    </div>
  );
}
