import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bento, Badge, Chip, SectionEyebrow, Bar } from "@/components/ui-kit";
import { HealthOrb } from "@/components/health-orb";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SauBol AI — Сіздің денсаулық көмекшіңіз" },
      { name: "description", content: "SauBol AI дашборды: денсаулық индексі, апталық тренд, соңғы сканерлер, дәрі-дәрмек кестесі, AI дәрігермен жылдам сұхбат." },
      { property: "og:title", content: "SauBol AI — Денсаулық Дашборды" },
      { property: "og:description", content: "AI-мен күшейтілген жеке денсаулық басқару орталығы." },
    ],
  }),
  component: Dashboard,
});

const TREND = [
  { d: "Дс", score: 68 }, { d: "Сс", score: 71 }, { d: "Ср", score: 69 },
  { d: "Бс", score: 74 }, { d: "Жм", score: 76 }, { d: "Сб", score: 72 }, { d: "Жс", score: 78 },
];

const RECENT = [
  { icon: "🍔", title: "Fried chicken burger", note: "168% қант шегі", to: "/nutrition-scan" as const, tone: "danger" as const, time: "5 сағ" },
  { icon: "🎙", title: "Дауыстық консультация", note: "Аппендицит күдігі · 103", to: "/triage-voice" as const, tone: "danger" as const, time: "Кеше" },
  { icon: "💊", title: "Рецепт декодталды", note: "3 дәрі · 1 өзара әрекет", to: "/prescription-rx" as const, tone: "warning" as const, time: "2 күн" },
];


const MEDS_TODAY = [
  { t: "08:00", n: "Paracetamol 500 mg", ok: true },
  { t: "09:00", n: "Ferrous bisglycinate", ok: true },
  { t: "13:00", n: "Amoxicillin 500 mg", ok: false },
  { t: "15:00", n: "Omeprazole 20 mg", ok: false },
];

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Bento className="noise relative overflow-hidden p-8">
          <SectionEyebrow>20 шілде · Дүйсенбі · Талдықорған</SectionEyebrow>
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-foreground md:text-6xl">
            Қайырлы таң, <span className="italic text-[color:var(--mint)]">Айнұр</span>.
            <br />
            Бүгін денсаулық <span className="italic">жақсы</span>, бірақ темір деңгейі назар аударуды талап етеді.
          </h1>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/nutrition-scan" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--mint)] px-4 py-2 text-sm font-medium text-background transition hover:scale-[1.02]">
              Тамақ сканерлеу →
            </Link>
            <Link to="/prescription-rx" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground">
              Дәрі-дәрмек
            </Link>
            <Link to="/welcome" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
              Онбординг
            </Link>
          </div>

          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[color:var(--mint)]/20 blur-3xl" />
        </Bento>

        <Bento className="flex flex-col items-center justify-center text-center">
          <SectionEyebrow>Денсаулық индексі</SectionEyebrow>
          <div className="my-2">
            <HealthOrb value={72} size={220} label="/ 100" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge tone="mint">+4 апта сайын</Badge>
            <Badge tone="warning">1 назар</Badge>
          </div>
          <p className="mt-3 max-w-[240px] text-[11px] text-muted-foreground">
            Гемоглобин мен ферритинді қалпына келтірсе — индекс 85+ болады.
          </p>
        </Bento>
      </div>

      {/* MODULE GRID */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl tracking-tight text-foreground">Модульдер</h2>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">5 белсенді</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {[
            { to: "/nutrition-scan" as const, e: "🥗", t: "Тамақ", s: "SmartNutri", d: "Фото/штрих-код" },
            { to: "/triage-voice" as const, e: "🎙", t: "Дауыс", s: "Voice AI", d: "KZ/RU/EN, 103" },
            { to: "/prescription-rx" as const, e: "💊", t: "Дәрілер", s: "RxClarify", d: "OCR, әрекеттесу" },
            { to: "/family" as const, e: "👨‍👩‍👧", t: "Family", s: "Balalar", d: "Ата-ана бақылауы" },
            { to: "/feed" as const, e: "📰", t: "Feed", s: "KZ Health", d: "Тексерілген жаңалық" },

          ].map((m) => (
            <Link key={m.to} to={m.to} className="group">
              <Bento className="h-full transition group-hover:-translate-y-0.5">
                <div className="mb-4 text-3xl">{m.e}</div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{m.s}</div>
                <div className="mt-1 font-serif text-xl text-foreground">{m.t}</div>
                <p className="mt-1 text-[12px] text-muted-foreground">{m.d}</p>
                <div className="mt-4 flex items-center gap-1 text-[11px] text-[color:var(--mint)]">
                  Ашу
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </div>
              </Bento>
            </Link>
          ))}
        </div>
      </div>

      {/* BENTO GRID: trend + recent + meds */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Bento className="lg:col-span-2">
          <div className="mb-2 flex items-baseline justify-between">
            <div>
              <SectionEyebrow>Апталық тренд</SectionEyebrow>
              <div className="font-serif text-2xl text-foreground">Денсаулық индексі <span className="italic text-[color:var(--mint)]">жоғарылап</span> келеді</div>
            </div>
            <div className="flex gap-1">
              <Chip active>7 күн</Chip>
              <Chip>30 күн</Chip>
              <Chip>90 күн</Chip>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--mint)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--mint)" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-3 border-t border-border pt-3">
            <div><div className="text-[10px] uppercase text-muted-foreground">Орташа</div><div className="font-mono text-sm text-foreground">72.6</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Ең жоғары</div><div className="font-mono text-sm text-[color:var(--mint)]">78</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Динамика</div><div className="font-mono text-sm text-[color:var(--mint)]">+14.7%</div></div>
          </div>
        </Bento>

        <Bento>
          <SectionEyebrow>Соңғы сканерлер</SectionEyebrow>
          <div className="mt-2 space-y-2">
            {RECENT.map((r) => (
              <Link key={r.title} to={r.to} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition hover:border-white/15">
                <div className="text-xl">{r.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium text-foreground">{r.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{r.note}</div>
                </div>
                <Badge tone={r.tone}>{r.time}</Badge>
              </Link>
            ))}
          </div>
        </Bento>
      </div>

      {/* Meds today + Insight */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Bento>
          <div className="flex items-baseline justify-between">
            <div>
              <SectionEyebrow>Бүгінгі дәрі-дәрмек</SectionEyebrow>
              <div className="font-serif text-2xl text-foreground">4 <span className="text-muted-foreground">/ 7 қабылданды</span></div>
            </div>
            <Link to="/prescription-rx" className="text-[11px] text-[color:var(--mint)]">Толық →</Link>
          </div>
          <div className="mt-3">
            <Bar value={57} tone="mint" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {MEDS_TODAY.map((m) => (
              <div key={m.t} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                <div className={`h-2 w-2 rounded-full ${m.ok ? "bg-[color:var(--mint)]" : "bg-muted-foreground"}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-muted-foreground">{m.t}</div>
                  <div className="truncate text-[12px] text-foreground">{m.n}</div>
                </div>
                {m.ok ? <Badge tone="mint">✓</Badge> : <Badge tone="muted">Күтуде</Badge>}
              </div>
            ))}
          </div>
        </Bento>

        <Bento accent className="relative">
          <SectionEyebrow>SauBol Ақыл-кеңесі · күнделікті</SectionEyebrow>
          <blockquote className="font-serif text-2xl leading-tight text-foreground">
            «Темір препараттарын <em className="italic text-[color:var(--mint)]">С витаминімен</em> бірге ішіңіз — сіңірілу 3 есе артады. Кофе мен қара шайдан кейін 2 сағат күтіңіз.»
          </blockquote>
          <div className="mt-4 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">S</div>
            <div className="text-[11px] text-muted-foreground">SauBol AI · сіздің профиліңізге лайықталған</div>
          </div>
        </Bento>
      </div>
    </div>
  );
}
