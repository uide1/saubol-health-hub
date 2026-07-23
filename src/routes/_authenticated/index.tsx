import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bento, Badge, Chip, SectionEyebrow, Bar } from "@/components/ui-kit";
import { HealthOrb } from "@/components/health-orb";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useL, L } from "@/lib/i18n";
import { useMyProfile } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";



export const Route = createFileRoute("/_authenticated/")({
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

type FamilyChild = {
  id: string;
  name: string;
  emoji: string;
  medsTaken: number;
  medsTotal: number;
};

function FamilyStrip() {
  const L1 = useL();
  const { user } = useMyProfile();
  const [children, setChildren] = useState<FamilyChild[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: links } = await supabase
        .from("family_links")
        .select("child_id,status")
        .eq("parent_id", user.id)
        .eq("status", "accepted");
      const ids = (links ?? []).map((l: any) => l.child_id);
      if (ids.length === 0) { setChildren([]); return; }
      const [{ data: profs }, { data: meds }] = await Promise.all([
        supabase.from("profiles").select("id,first_name,full_name,username").in("id", ids),
        supabase.from("medication_schedules").select("user_id,taken").in("user_id", ids),
      ]);
      const byId = new Map<string, any>((profs ?? []).map((p: any) => [p.id, p]));
      const counts = new Map<string, { t: number; ok: number }>();
      (meds ?? []).forEach((m: any) => {
        const c = counts.get(m.user_id) ?? { t: 0, ok: 0 };
        c.t += 1; if (m.taken) c.ok += 1;
        counts.set(m.user_id, c);
      });
      const emojis = ["🧒","👧","🧑","👦","👶"];
      setChildren(ids.map((id, i) => {
        const p = byId.get(id);
        const c = counts.get(id) ?? { t: 0, ok: 0 };
        return {
          id,
          name: p?.first_name || p?.full_name || p?.username || "—",
          emoji: emojis[i % emojis.length],
          medsTaken: c.ok,
          medsTotal: c.t,
        };
      }));
    })();
  }, [user?.id]);

  const list = children ?? [];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--mint)]/40 to-transparent" />
      <div className="flex items-baseline justify-between px-5 pt-4">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          <L kk="Отбасы · тікелей" ru="Семья · онлайн" en="Family · live" />
        </div>
        <div className="text-[10px] text-muted-foreground">{list.length} · {L1({ kk: "балалар", ru: "детей", en: "children" })}</div>
      </div>
      {list.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          <L kk="Балаңызды қосыңыз — " ru="Добавьте ребёнка — " en="Add a child — " />
          <Link to="/connections" className="text-[color:var(--mint)] underline">
            <L kk="Байланыстар" ru="Связи" en="Connections" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
          {list.map((p) => {
            const medsPct = p.medsTotal ? (p.medsTaken / p.medsTotal) * 100 : 0;
            const waterCur = 4, waterGoal = 6;
            const sleep = 8.5, sleepGoal = 10;
            const steps = 5200;
            return (
              <div key={p.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative grid h-11 w-11 place-items-center rounded-full bg-secondary text-xl">
                    {p.emoji}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[color:var(--mint)] ring-2 ring-card" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <div className="truncate font-serif text-base text-foreground">{p.name}</div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        {L1({ kk: "бала", ru: "ребёнок", en: "child" })}
                      </span>
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      💊 {p.medsTaken}/{p.medsTotal || "—"} · {L1({ kk: "бүгін", ru: "сегодня", en: "today" })}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                  <div>
                    <div className="flex justify-between text-muted-foreground"><span>💧 {L1({ kk: "Су", ru: "Вода", en: "Water" })}</span><span className="tabular-nums text-foreground">{waterCur}/{waterGoal}</span></div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-[#7cb8ff]" style={{ width: `${(waterCur/waterGoal)*100}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-muted-foreground"><span>😴 {L1({ kk: "Ұйқы", ru: "Сон", en: "Sleep" })}</span><span className="tabular-nums text-foreground">{sleep}ч</span></div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-[color:var(--mint)]" style={{ width: `${(sleep/sleepGoal)*100}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-muted-foreground"><span>💊 {L1({ kk: "Дәрі", ru: "Лек-ва", en: "Meds" })}</span><span className="tabular-nums text-foreground">{p.medsTaken}/{p.medsTotal || "—"}</span></div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-foreground/70" style={{ width: `${medsPct}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-muted-foreground"><span>🚶 {L1({ kk: "Қадам", ru: "Шаги", en: "Steps" })}</span><span className="tabular-nums text-foreground">{steps.toLocaleString()}</span></div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-amber-400/80" style={{ width: `${(steps/10000)*100}%` }} /></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function Dashboard() {
  const [range, setRange] = useState<Range>("7");
  const [meds, setMeds] = useState(MEDS_TODAY);
  const toggleMed = (t: string) => setMeds(s => s.map(m => m.t === t ? { ...m, ok: !m.ok } : m));
  const takenCount = meds.filter(m => m.ok).length;
  const L1 = useL();
  const { profile } = useMyProfile();
  const displayName = profile?.first_name || profile?.username || "";
  return (
    <div className="space-y-6">
      {/* Merged HERO with HealthOrb + aurora */}
      <Bento className="relative overflow-hidden p-6">
        <div className="aurora" />
        <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.5fr_auto]">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 backdrop-blur">
              <span className="live-dot" />
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <L kk="Тікелей · " ru="В эфире · " en="Live · " />
                <span className="text-foreground">
                  <L kk="20 шілде · Талдықорған" ru="20 июля · Талдыкорган" en="July 20 · Taldykorgan" />
                </span>
              </span>
            </div>
            <h1 className="font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
              <L kk="Қайырлы таң, " ru="Доброе утро, " en="Good morning, " />
              <span className="italic text-[color:var(--mint)]">
                <L kk="Айнұр" ru="Айнур" en="Ainur" />
              </span>.
              <br />
              <L
                kk={<>Бүгін денсаулық <span className="italic">жақсы</span>, бірақ темір деңгейі<br />назар аударуды талап етеді.</>}
                ru={<>Сегодня здоровье <span className="italic">хорошее</span>, но уровень железа<br />требует внимания.</>}
                en={<>Health is <span className="italic">good</span> today, but iron levels<br />need attention.</>}
              />
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/triage-voice" className="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[color:var(--mint)] px-4 py-2 text-sm font-medium text-background transition hover:scale-[1.02]">
                <L kk="Чат ашу →" ru="Открыть чат →" en="Open chat →" />
              </Link>
              <Link to="/prescription-rx" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground">
                <L kk="Дәрі-дәрмек" ru="Лекарства" en="Medications" />
              </Link>

              <Link to="/welcome" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                <L kk="Онбординг" ru="Онбординг" en="Onboarding" />
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <SectionEyebrow>
              <L kk="Денсаулық индексі" ru="Индекс здоровья" en="Health index" />
            </SectionEyebrow>
            <HealthOrb value={72} size={160} label="/ 100" />
            <div className="mt-2 flex items-center gap-2">
              <Badge tone="mint">{L1({ kk: "+4 апта сайын", ru: "+4 за неделю", en: "+4 this week" })}</Badge>
              <Badge tone="warning">{L1({ kk: "1 назар", ru: "1 внимание", en: "1 flag" })}</Badge>
            </div>
          </div>
        </div>
      </Bento>

      {/* Editorial vitals strip */}
      <FamilyStrip />



      {/* Trend + Meds */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Bento className="relative overflow-hidden">
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
              <AreaChart data={TRENDS[range]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mintFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.55} />
                    <stop offset="60%" stopColor="var(--mint)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="var(--mint)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis hide domain={["dataMin - 4", "dataMax + 4"]} />
                <Tooltip
                  cursor={{ stroke: "var(--mint)", strokeWidth: 1, strokeDasharray: "3 3" }}
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, padding: "6px 10px" }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--mint)"
                  strokeWidth={2.5}
                  fill="url(#mintFill)"
                  dot={{ r: 3, fill: "var(--mint)", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "var(--mint)", stroke: "var(--background)", strokeWidth: 2 }}
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
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
