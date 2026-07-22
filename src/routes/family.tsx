import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bento, Badge, Bar, Chip, SectionEyebrow, Stat } from "@/components/ui-kit";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "SauBol AI — Family Mode · Отбасы бақылауы" },
      { name: "description", content: "Ата-аналар балаларының денсаулық жағдайын, дәрі-дәрмегін, тамағын және вакцинасын бір экраннан бақылайды." },
      { property: "og:title", content: "SauBol Family — Балалардың денсаулығы қолыңызда" },
      { property: "og:description", content: "SauBol Family Mode: балалардың дәрілері, вакциналары, тамақ ескертулері және SOS сигналдары." },
    ],
  }),
  component: FamilyPage,
});

type Kid = {
  id: string;
  name: string;
  age: number;
  emoji: string;
  score: number;
  weight: string;
  height: string;
  status: "ok" | "watch" | "alert";
  note: string;
  meds: { t: string; n: string; ok: boolean }[];
  vaccines: { n: string; d: string; done: boolean }[];
  today: { calories: number; sugar: number; water: number };
  alerts: { icon: string; t: string; tone: "success" | "warning" | "danger" | "muted" }[];
};

const KIDS: Kid[] = [
  {
    id: "aidos", name: "Айдос", age: 8, emoji: "🧒", score: 82,
    weight: "26 кг", height: "128 см", status: "ok", note: "Бәрі қалыпты, бүгін мектепте.",
    meds: [{ t: "08:00", n: "Витамин D 400 IU", ok: true }, { t: "20:00", n: "Ferrum syrup 5 ml", ok: false }],
    vaccines: [{ n: "MMR (қорғаныш)", d: "2024·02", done: true }, { n: "Tdap (7 жас)", d: "2025·09", done: true }, { n: "Grippol (жыл сайын)", d: "2026·10", done: false }],
    today: { calories: 1420, sugar: 32, water: 5 },
    alerts: [{ icon: "🥛", t: "Сүт өнімі шектелген — кальций жетпейді", tone: "warning" }],
  },
  {
    id: "aruzhan", name: "Аружан", age: 4, emoji: "👧", score: 68,
    weight: "16 кг", height: "104 см", status: "watch", note: "Түнде 37.6° болды — бақылауда.",
    meds: [{ t: "09:00", n: "Nurofen susp. 5 ml", ok: true }, { t: "15:00", n: "Nurofen susp. 5 ml", ok: false }, { t: "21:00", n: "Probiotic drops", ok: false }],
    vaccines: [{ n: "МMR", d: "2023·05", done: true }, { n: "Varicella (5 жас)", d: "2027·01", done: false }],
    today: { calories: 980, sugar: 41, water: 3 },
    alerts: [
      { icon: "🌡", t: "Температура 37.6° — 4 сағ бұрын", tone: "warning" },
      { icon: "🍭", t: "Қант шегі 82% — конфеттер шектеу", tone: "danger" },
    ],
  },
  {
    id: "dias", name: "Диас", age: 14, emoji: "🧑", score: 74,
    weight: "48 кг", height: "162 см", status: "ok", note: "Спорт секциясы — 3 сағ жүктеме.",
    meds: [],
    vaccines: [{ n: "HPV (1 доза)", d: "2026·03", done: true }, { n: "HPV (2 доза)", d: "2026·09", done: false }],
    today: { calories: 2380, sugar: 28, water: 8 },
    alerts: [{ icon: "💪", t: "Ақуыз мақсаты орындалды", tone: "success" }],
  },
];

const FAMILY_FEED = [
  { who: "Аружан", icon: "🌡", t: "Температура өлшенді · 37.6°", ago: "4 сағ", tone: "warning" as const },
  { who: "Айдос", icon: "🥗", t: "Түскі ас: Тауық + күріш · 520 ккал", ago: "6 сағ", tone: "muted" as const },
  { who: "Диас", icon: "🏃", t: "Жаттығу аяқталды · 78 мин", ago: "8 сағ", tone: "success" as const },
  { who: "Аружан", icon: "💊", t: "Nurofen қабылданды", ago: "9 сағ", tone: "muted" as const },
  { who: "Айдос", icon: "😴", t: "Ұйқы: 9 сағ 12 мин", ago: "12 сағ", tone: "success" as const },
];

function FamilyPage() {
  const [active, setActive] = useState(KIDS[0].id);
  const [medsState, setMedsState] = useState<Record<string, boolean>>({});
  const kid = KIDS.find((k) => k.id === active)!;
  const medKey = (t: string, n: string) => `${active}-${t}-${n}`;
  const toggleMed = (t: string, n: string, current: boolean) => {
    const k = medKey(t, n);
    const next = k in medsState ? !medsState[k] : !current;
    setMedsState(s => ({ ...s, [k]: next }));
    toast(next ? `✓ ${n} қабылданды` : `${n} қайта белгіленді`);
  };
  const isMedOk = (t: string, n: string, current: boolean) => {
    const k = medKey(t, n);
    return k in medsState ? medsState[k] : current;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionEyebrow>Family Mode · Ата-ана бақылауы</SectionEyebrow>
          <h1 className="mt-2 font-serif text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
            Отбасы <span className="italic text-[color:var(--mint)]">аман</span>. 3 бала қосылған.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Балалардың дәрі-дәрмегі, вакциналары, тамақ талдауы мен төтенше сигналдары бір орында.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip>Ата-ана PIN қосулы</Chip>
          <button onClick={() => { const n = window.prompt("Баланың аты"); if (n) toast.success(`+ ${n} қосылды`, { description: "Профиль жасалуда..." }); }} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">+ Бала қосу</button>
        </div>
      </div>

      {/* Kid switcher */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {KIDS.map((k) => {
          const isActive = k.id === active;
          const tone = k.status === "ok" ? "success" : k.status === "watch" ? "warning" : "danger";
          return (
            <button
              key={k.id}
              onClick={() => setActive(k.id)}
              className={`text-left transition ${isActive ? "-translate-y-0.5" : ""}`}
            >
              <div className={`relative overflow-hidden rounded-2xl border p-5 ${isActive ? "border-[color:var(--mint)]/50 bg-[color:var(--mint-soft)]" : "border-border bg-card"}`}>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-2xl">{k.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <div className="font-serif text-xl text-foreground">{k.name}</div>
                      <span className="text-[11px] text-muted-foreground">{k.age} жас</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{k.weight} · {k.height}</div>
                  </div>
                  <Badge tone={tone}>{k.score}</Badge>
                </div>
                <p className="mt-3 text-[12px] text-muted-foreground line-clamp-2">{k.note}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected kid detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Bento>
          <div className="flex items-baseline justify-between">
            <div>
              <SectionEyebrow>Бүгін · {kid.name}</SectionEyebrow>
              <div className="font-serif text-2xl text-foreground">Күнделікті көрсеткіштер</div>
            </div>
            <Badge tone={kid.status === "ok" ? "success" : kid.status === "watch" ? "warning" : "danger"}>
              {kid.status === "ok" ? "Аман" : kid.status === "watch" ? "Бақылауда" : "Назар"}
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Калория" value={`${kid.today.calories}`} hint="/ мақсат 1600" tone="mint" />
            <Stat label="Қант" value={`${kid.today.sugar} г`} hint="шек 25 г" tone={kid.today.sugar > 25 ? "danger" : "success"} />
            <Stat label="Су" value={`${kid.today.water} ст`} hint="/ 6 стакан" />
          </div>
          <div className="mt-5 space-y-3">
            {[
              { l: "Калория", v: Math.min(100, (kid.today.calories / 1600) * 100), t: "mint" as const },
              { l: "Қант", v: Math.min(100, (kid.today.sugar / 25) * 100), t: kid.today.sugar > 25 ? ("danger" as const) : ("success" as const) },
              { l: "Су", v: (kid.today.water / 6) * 100, t: "neutral" as const },
            ].map((r) => (
              <div key={r.l}>
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{r.l}</span><span className="font-mono">{Math.round(r.v)}%</span>
                </div>
                <Bar value={r.v} tone={r.t} />
              </div>
            ))}
          </div>
        </Bento>

        <Bento>
          <SectionEyebrow>Ескертулер</SectionEyebrow>
          <div className="mt-2 space-y-2">
            {kid.alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
                <div className="text-xl">{a.icon}</div>
                <div className="flex-1 text-[12px] text-foreground">{a.t}</div>
                <Badge tone={a.tone}>·</Badge>
              </div>
            ))}
            {kid.alerts.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-surface px-3 py-6 text-center text-[12px] text-muted-foreground">
                Ескертулер жоқ ✓
              </div>
            )}
          </div>
          <button className="mt-4 w-full rounded-full border border-red-900/60 bg-red-950/30 py-2 text-[12px] font-medium uppercase tracking-wider text-red-300">
            🚨 SOS · 103 шақыру
          </button>
        </Bento>
      </div>

      {/* Meds + Vaccines */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bento>
          <div className="flex items-baseline justify-between">
            <SectionEyebrow>Дәрі-дәрмек кестесі</SectionEyebrow>
            <span className="text-[11px] text-muted-foreground">{kid.meds.filter(m=>m.ok).length}/{kid.meds.length} қабылданды</span>
          </div>
          <div className="mt-3 space-y-2">
            {kid.meds.length === 0 && <div className="text-[12px] text-muted-foreground">Тағайындалған дәрі жоқ.</div>}
            {kid.meds.map((m) => (
              <div key={m.t + m.n} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
                <div className={`h-2 w-2 rounded-full ${m.ok ? "bg-[color:var(--mint)]" : "bg-muted-foreground"}`} />
                <div className="font-mono text-[11px] text-muted-foreground">{m.t}</div>
                <div className="flex-1 text-[12px] text-foreground">{m.n}</div>
                {m.ok ? <Badge tone="mint">✓</Badge> : <Badge tone="warning">Күтуде</Badge>}
              </div>
            ))}
          </div>
        </Bento>

        <Bento>
          <div className="flex items-baseline justify-between">
            <SectionEyebrow>Вакцина күнтізбесі</SectionEyebrow>
            <span className="text-[11px] text-muted-foreground">ҚР МЗ қалдырма</span>
          </div>
          <div className="mt-3 space-y-2">
            {kid.vaccines.map((v) => (
              <div key={v.n} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
                <div className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${v.done ? "bg-[color:var(--mint-soft)] text-[color:var(--mint)]" : "bg-secondary text-muted-foreground"}`}>
                  {v.done ? "✓" : "•"}
                </div>
                <div className="flex-1 text-[12px] text-foreground">{v.n}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{v.d}</div>
              </div>
            ))}
          </div>
        </Bento>
      </div>

      {/* Family feed */}
      <Bento>
        <div className="flex items-baseline justify-between">
          <div>
            <SectionEyebrow>Отбасылық лента · нақты уақыт</SectionEyebrow>
            <div className="font-serif text-2xl text-foreground">Соңғы 24 сағат</div>
          </div>
          <Chip active>Live</Chip>
        </div>
        <div className="mt-4 divide-y divide-border">
          {FAMILY_FEED.map((f, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-lg">{f.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] text-foreground">{f.t}</div>
                <div className="text-[11px] text-muted-foreground">{f.who}</div>
              </div>
              <Badge tone={f.tone}>{f.ago}</Badge>
            </div>
          ))}
        </div>
      </Bento>
    </div>
  );
}
