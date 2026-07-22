import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bento, Badge, Chip, SectionEyebrow, Bar } from "@/components/ui-kit";
import { HealthOrb } from "@/components/health-orb";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useL, L } from "@/lib/i18n";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SauBol AI — Сіздің денсаулық көмекшіңіз" },
      { name: "description", content: "SauBol AI дашборды: денсаулық индексі, апталық тренд, дәрі-дәрмек кестесі." },
      { property: "og:title", content: "SauBol AI — Денсаулық Дашборды" },
      { property: "og:description", content: "AI-мен күшейтілген жеке денсаулық басқару орталығы." },
    ],
  }),
  component: Dashboard,
});

const TREND_7 = [
  { d: "Дс", score: 68 }, { d: "Сс", score: 71 }, { d: "Ср", score: 69 },
  { d: "Бс", score: 74 }, { d: "Жм", score: 76 }, { d: "Сб", score: 72 }, { d: "Жс", score: 78 },
];
const TREND_30 = Array.from({ length: 30 }, (_, i) => ({ d: `${i + 1}`, score: 60 + Math.round(Math.sin(i / 3) * 8 + i * 0.4) }));
const TREND_90 = Array.from({ length: 12 }, (_, i) => ({ d: `W${i + 1}`, score: 55 + Math.round(Math.cos(i / 2) * 6 + i * 1.6) }));
const TRENDS = { "7": TREND_7, "30": TREND_30, "90": TREND_90 } as const;
type Range = keyof typeof TRENDS;

const MEDS_TODAY = [
  { t: "08:00", n: "Paracetamol 500 mg", ok: true },
  { t: "09:00", n: "Ferrous bisglycinate", ok: true },
  { t: "13:00", n: "Amoxicillin 500 mg", ok: false },
  { t: "15:00", n: "Omeprazole 20 mg", ok: false },
];

function Dashboard() {
  const [range, setRange] = useState<Range>("7");
  const [meds, setMeds] = useState(MEDS_TODAY);
  const toggleMed = (t: string) => setMeds(s => s.map(m => m.t === t ? { ...m, ok: !m.ok } : m));
  const takenCount = meds.filter(m => m.ok).length;
  const L1 = useL();
  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Bento className="noise relative overflow-hidden p-8">
          <SectionEyebrow>
            <L kk="20 шілде · Дүйсенбі · Талдықорған" ru="20 июля · Понедельник · Талдыкорган" en="July 20 · Monday · Taldykorgan" />
          </SectionEyebrow>
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-foreground md:text-6xl">
            <L kk="Қайырлы таң, " ru="Доброе утро, " en="Good morning, " />
            <span className="italic text-[color:var(--mint)]">
              <L kk="Айнұр" ru="Айнур" en="Ainur" />
            </span>.
            <br />
            <L
              kk={<>Бүгін денсаулық <span className="italic">жақсы</span>, бірақ темір деңгейі назар аударуды талап етеді.</>}
              ru={<>Сегодня здоровье <span className="italic">хорошее</span>, но уровень железа требует внимания.</>}
              en={<>Health is <span className="italic">good</span> today, but iron levels need attention.</>}
            />
          </h1>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/nutrition-scan" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--mint)] px-4 py-2 text-sm font-medium text-background transition hover:scale-[1.02]">
              <L kk="Тамақ сканерлеу →" ru="Сканировать еду →" en="Scan food →" />
            </Link>
            <Link to="/prescription-rx" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground">
              <L kk="Дәрі-дәрмек" ru="Лекарства" en="Medications" />
            </Link>
            <Link to="/welcome" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
              <L kk="Онбординг" ru="Онбординг" en="Onboarding" />
            </Link>
          </div>
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[color:var(--mint)]/20 blur-3xl" />
        </Bento>

        <Bento className="flex flex-col items-center justify-center text-center">
          <SectionEyebrow>
            <L kk="Денсаулық индексі" ru="Индекс здоровья" en="Health index" />
          </SectionEyebrow>
          <div className="my-2">
            <HealthOrb value={72} size={220} label="/ 100" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge tone="mint">{L1({ kk: "+4 апта сайын", ru: "+4 за неделю", en: "+4 this week" })}</Badge>
            <Badge tone="warning">{L1({ kk: "1 назар", ru: "1 внимание", en: "1 flag" })}</Badge>
          </div>
          <p className="mt-3 max-w-[240px] text-[11px] text-muted-foreground">
            <L
              kk="Гемоглобин мен ферритинді қалпына келтірсе — индекс 85+ болады."
              ru="Восстановите гемоглобин и ферритин — индекс достигнет 85+."
              en="Restore hemoglobin and ferritin — index will reach 85+."
            />
          </p>
        </Bento>
      </div>


      {/* Trend + Meds */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Bento>
          <div className="mb-2 flex items-baseline justify-between">
            <div>
              <SectionEyebrow>
                <L kk="Апталық тренд" ru="Недельный тренд" en="Weekly trend" />
              </SectionEyebrow>
              <div className="font-serif text-2xl text-foreground">
                <L
                  kk={<>Денсаулық индексі <span className="italic text-[color:var(--mint)]">жоғарылап</span> келеді</>}
                  ru={<>Индекс здоровья <span className="italic text-[color:var(--mint)]">растёт</span></>}
                  en={<>Health index is <span className="italic text-[color:var(--mint)]">rising</span></>}
                />
              </div>
            </div>
            <div className="flex gap-1">
              {(["7","30","90"] as Range[]).map((r) => (
                <button key={r} onClick={() => setRange(r)}>
                  <Chip active={range === r}>{r} {L1({ kk: "күн", ru: "дн.", en: "d" })}</Chip>
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TRENDS[range]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            <div><div className="text-[10px] uppercase text-muted-foreground">{L1({ kk: "Орташа", ru: "Среднее", en: "Average" })}</div><div className="font-mono text-sm text-foreground">72.6</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">{L1({ kk: "Ең жоғары", ru: "Максимум", en: "Peak" })}</div><div className="font-mono text-sm text-[color:var(--mint)]">78</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">{L1({ kk: "Динамика", ru: "Динамика", en: "Trend" })}</div><div className="font-mono text-sm text-[color:var(--mint)]">+14.7%</div></div>
          </div>
        </Bento>

        <Bento>
          <div className="flex items-baseline justify-between">
            <div>
              <SectionEyebrow>
                <L kk="Бүгінгі дәрі-дәрмек" ru="Лекарства сегодня" en="Today's meds" />
              </SectionEyebrow>
              <div className="font-serif text-2xl text-foreground">
                {takenCount} <span className="text-muted-foreground">/ {meds.length} {L1({ kk: "қабылданды", ru: "принято", en: "taken" })}</span>
              </div>
            </div>
            <Link to="/prescription-rx" className="text-[11px] text-[color:var(--mint)]">
              <L kk="Толық →" ru="Всё →" en="All →" />
            </Link>
          </div>
          <div className="mt-3">
            <Bar value={(takenCount / meds.length) * 100} tone="mint" />
          </div>
          <div className="mt-4 space-y-2">
            {meds.map((m) => (
              <button
                key={m.t}
                onClick={() => {
                  toggleMed(m.t);
                  toast(m.ok ? `${m.n} ${L1({ kk: "қайта белгіленді", ru: "снято", en: "unmarked" })}` : `✓ ${m.n} ${L1({ kk: "қабылданды", ru: "принято", en: "taken" })}`);
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left transition hover:border-white/15"
              >
                <div className={`h-2 w-2 rounded-full ${m.ok ? "bg-[color:var(--mint)]" : "bg-muted-foreground"}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-muted-foreground">{m.t}</div>
                  <div className="truncate text-[12px] text-foreground">{m.n}</div>
                </div>
                {m.ok ? <Badge tone="mint">✓</Badge> : <Badge tone="muted">{L1({ kk: "Күтуде", ru: "Ждёт", en: "Pending" })}</Badge>}
              </button>
            ))}
          </div>
        </Bento>

      </div>
    </div>
  );
}
