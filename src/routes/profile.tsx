import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bento, Badge, SectionEyebrow, Gauge } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";


export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Профиль — SauBol AI" },
      { name: "description", content: "Жеке медициналық профиль, PDF экспорт, тіл және құпиялылық баптаулары." },
      { property: "og:title", content: "Профиль · SauBol AI" },
      { property: "og:description", content: "Сіздің денсаулық журналыңыз бір орында." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [lang, setLang] = useState("kk");
  const [goals, setGoals] = useState<string[]>(["🩸 Анемия", "💤 Ұйқы", "⚖️ Салмақ"]);
  const [privacy, setPrivacy] = useState({ enc: true, sos: true, share: false });
  const [water, setWater] = useState(5); // glasses of 8
  const [mood, setMood] = useState<number | null>(3);
  const [sleep] = useState([6.2, 7.1, 5.8, 7.8, 6.9, 8.1, 7.4]);
  const toggleGoal = (g: string) => setGoals(s => s.includes(g) ? s.filter(x => x !== g) : [...s, g]);
  const L1 = useL();

  const hrSeries = [
    { t: "00", v: 62 }, { t: "04", v: 58 }, { t: "08", v: 74 },
    { t: "12", v: 82 }, { t: "14", v: 91 }, { t: "18", v: 78 },
    { t: "22", v: 66 },
  ];
  const weekLabels = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  const moods = ["😔","😐","🙂","😊","🤩"];
  const timeline = [
    { time: "09:12", icon: "💊", tone: "mint" as const, label: L1({ kk: "Ferrum 100мг қабылданды", ru: "Принят Ferrum 100мг", en: "Ferrum 100mg taken" }) },
    { time: "08:40", icon: "🥗", tone: "muted" as const, label: L1({ kk: "Таңғы ас · 420 ккал", ru: "Завтрак · 420 ккал", en: "Breakfast · 420 kcal" }) },
    { time: "07:55", icon: "🏃", tone: "mint" as const, label: L1({ kk: "Жүру · 2.4 км", ru: "Ходьба · 2.4 км", en: "Walk · 2.4 km" }) },
    { time: "07:10", icon: "😴", tone: "muted" as const, label: L1({ kk: "Ұйқы · 7с 24м · терең фаза 22%", ru: "Сон · 7ч 24м · глубокая фаза 22%", en: "Sleep · 7h 24m · deep 22%" }) },
    { time: "06:45", icon: "❤️", tone: "warning" as const, label: L1({ kk: "Демалыс ЖСС 62 bpm", ru: "Пульс покоя 62 bpm", en: "Resting HR 62 bpm" }) },
  ];



  return (
    <div className="space-y-6">
      {/* Profile hero */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Bento className="noise flex items-center gap-6 p-8">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[color:var(--mint)] to-emerald-800 font-serif text-4xl text-background">
            АН
          </div>
          <div className="flex-1">
            <SectionEyebrow><L kk="Пациент профилі · SB-24817" ru="Профиль пациента · SB-24817" en="Patient profile · SB-24817" /></SectionEyebrow>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-foreground">Айнұр Нұрланова</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <L kk="32 жас · Талдықорған · II (A+) қан тобы · SauBol-да 4 ай" ru="32 года · Талдыкорган · группа крови II (A+) · в SauBol 4 месяца" en="32 y.o. · Taldykorgan · blood type A+ · 4 months on SauBol" />
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="mint">Premium</Badge>
              <Badge tone="warning"><L kk="Пенициллинге аллергия" ru="Аллергия на пенициллин" en="Penicillin allergy" /></Badge>
              <Badge tone="muted"><L kk="Анемия · курста" ru="Анемия · курс лечения" en="Anemia · in treatment" /></Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => toast.info(L1({ kk: "Өңдеу режимі жақында", ru: "Режим редактирования скоро", en: "Edit mode coming soon" }))} className="rounded-full border border-border bg-surface px-4 py-2 text-xs text-foreground"><L kk="Өңдеу" ru="Изменить" en="Edit" /></button>
            <button onClick={() => toast.success(L1({ kk: "📄 PDF дайындалуда...", ru: "📄 PDF готовится...", en: "📄 Preparing PDF..." }))} className="rounded-full bg-foreground px-4 py-2 text-xs text-background"><L kk="PDF экспорт" ru="Экспорт PDF" en="Export PDF" /></button>
          </div>
        </Bento>

        <Bento className="flex items-center gap-4">
          <Gauge value={72} label={L1({ kk: "Индекс", ru: "Индекс", en: "Index" })} size={120} />
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground"><L kk="Бүгін" ru="Сегодня" en="Today" /></span><span className="font-mono text-foreground">72</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground"><L kk="Апта" ru="Неделя" en="Week" /></span><span className="font-mono text-[color:var(--mint)]">+4</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground"><L kk="Ай" ru="Месяц" en="Month" /></span><span className="font-mono text-[color:var(--mint)]">+11</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground"><L kk="Барлық сканер" ru="Всего сканов" en="Total scans" /></span><span className="font-mono text-foreground">47</span></div>
          </div>
        </Bento>
      </div>

      {/* Interactive widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Heart rate sparkline */}
        <Bento className="lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <SectionEyebrow><L kk="Жүрек соғысы · 24 сағат" ru="Пульс · 24 часа" en="Heart rate · 24h" /></SectionEyebrow>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-foreground">72</span>
                <span className="text-[11px] text-muted-foreground">bpm avg</span>
                <Badge tone="mint">–4 vs {L1({ kk: "апта", ru: "неделя", en: "week" })}</Badge>
              </div>
            </div>
            <div className="text-right text-[10px] text-muted-foreground">
              <div><L kk="Мин" ru="Мин" en="Min" /> <span className="font-mono text-foreground">58</span></div>
              <div><L kk="Макс" ru="Макс" en="Max" /> <span className="font-mono text-foreground">91</span></div>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer>
              <AreaChart data={hrSeries} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--mint)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />
                <Area type="monotone" dataKey="v" stroke="var(--mint)" strokeWidth={2} fill="url(#hrFill)" activeDot={{ r: 4, fill: "var(--mint)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Bento>

        {/* Water tracker */}
        <Bento>
          <SectionEyebrow><L kk="Су · бүгін" ru="Вода · сегодня" en="Water · today" /></SectionEyebrow>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-3xl text-foreground">{(water * 0.25).toFixed(2)}<span className="text-base text-muted-foreground"> L</span></span>
            <span className="text-[11px] text-muted-foreground">/ 2.00 L</span>
          </div>
          <div className="mt-3 grid grid-cols-8 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setWater(i + 1 === water ? i : i + 1)}
                className={`aspect-[3/4] rounded-md border text-xs transition ${i < water ? "border-[color:var(--mint)]/50 bg-[color:var(--mint-soft)] text-[color:var(--mint)]" : "border-border bg-surface text-muted-foreground hover:border-[color:var(--mint)]/30"}`}
                aria-label={`glass-${i+1}`}
              >💧</button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { setWater(w => Math.min(8, w + 1)); toast.success(L1({ kk: "+250 мл", ru: "+250 мл", en: "+250 ml" })); }} className="flex-1 rounded-full bg-foreground py-1.5 text-[11px] font-medium text-background">+ 250 мл</button>
            <button onClick={() => setWater(0)} className="rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"><L kk="Тазалау" ru="Сброс" en="Reset" /></button>
          </div>
        </Bento>
      </div>

      {/* Sleep week + mood + timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Bento>
          <SectionEyebrow><L kk="Ұйқы · 7 күн" ru="Сон · 7 дней" en="Sleep · 7 days" /></SectionEyebrow>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-3xl text-foreground">{(sleep.reduce((a,b)=>a+b,0)/sleep.length).toFixed(1)}<span className="text-base text-muted-foreground">ч</span></span>
            <Badge tone="mint">+0.4</Badge>
          </div>
          <div className="mt-3 flex h-24 items-end gap-2">
            {sleep.map((h, i) => {
              const pct = Math.min(100, (h / 9) * 100);
              const ok = h >= 7;
              return (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex h-full w-full items-end">
                    <div style={{ height: `${pct}%` }} className={`w-full rounded-md ${ok ? "bg-gradient-to-t from-[color:var(--mint-soft)] to-[color:var(--mint)]" : "bg-gradient-to-t from-surface to-muted"} transition group-hover:opacity-80`} />
                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[9px] text-background opacity-0 transition group-hover:opacity-100">{h}ч</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{weekLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </Bento>

        <Bento>
          <SectionEyebrow><L kk="Бүгінгі көңіл-күй" ru="Настроение сегодня" en="Today's mood" /></SectionEyebrow>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-3xl text-foreground">{mood !== null ? moods[mood] : "—"}</span>
            <span className="text-[11px] text-muted-foreground"><L kk="8 күн тізбегі" ru="серия 8 дней" en="8-day streak" /></span>
          </div>
          <div className="mt-3 flex gap-2">
            {moods.map((m, i) => (
              <button
                key={i}
                onClick={() => { setMood(i); toast(m); }}
                className={`grid h-11 flex-1 place-items-center rounded-lg border text-xl transition ${mood === i ? "border-[color:var(--mint)] bg-[color:var(--mint-soft)]" : "border-border bg-surface hover:border-[color:var(--mint)]/40"}`}
              >{m}</button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
            {[
              [L1({ kk: "Күйзеліс", ru: "Стресс", en: "Stress" }), "Low"],
              [L1({ kk: "Энергия", ru: "Энергия", en: "Energy" }), "78%"],
              [L1({ kk: "Фокус", ru: "Фокус", en: "Focus" }), "Good"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-border bg-surface p-2">
                <div className="uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="mt-0.5 font-semibold text-foreground">{v}</div>
              </div>
            ))}
          </div>
        </Bento>

        <Bento>
          <SectionEyebrow><L kk="Соңғы белсенділік" ru="Последняя активность" en="Recent activity" /></SectionEyebrow>
          <ol className="mt-1 space-y-2">
            {timeline.map((e, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-border/50 pb-2 last:border-none">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-surface text-sm">{e.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] text-foreground">{e.label}</div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">{e.time}</div>
                </div>
                <Badge tone={e.tone}>·</Badge>
              </li>
            ))}
          </ol>
        </Bento>
      </div>


      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          ["Бой", "165 см"], ["Салмақ", "58 кг"], ["BMI", "21.3"],
          ["ЖСС", "68 bpm"], ["АҚ", "118/76"], ["SpO₂", "98%"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border bg-surface p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
            <div className="mt-1 font-mono text-lg text-foreground">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
