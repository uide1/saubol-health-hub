import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bento, Badge, Chip, SectionEyebrow, Stat } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";


export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "SauBol AI — Family Mode · Отбасы бақылауы" },
      { name: "description", content: "Ата-аналар балаларының денсаулық жағдайын, дәрі-дәрмегін және тамағын бір экраннан бақылайды." },
      { property: "og:title", content: "SauBol Family — Балалардың денсаулығы қолыңызда" },
      { property: "og:description", content: "SauBol Family Mode: балалардың дәрілері, тамақ ескертулері және SOS сигналдары." },
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
  today: { calories: number; sugar: number; water: number };
  alerts: { icon: string; t: string; tone: "success" | "warning" | "danger" | "muted" }[];
};

const KIDS: Kid[] = [
  {
    id: "aidos", name: "Айдос", age: 8, emoji: "🧒", score: 82,
    weight: "26 кг", height: "128 см", status: "ok", note: "Бәрі қалыпты, бүгін мектепте.",
    meds: [{ t: "08:00", n: "Витамин D 400 IU", ok: true }, { t: "20:00", n: "Ferrum syrup 5 ml", ok: false }],
    today: { calories: 1420, sugar: 32, water: 5 },
    alerts: [
      { icon: "🥛", t: "Сүт өнімі шектелген — кальций жетпейді", tone: "warning" },
      { icon: "💊", t: "Ferrum syrup 20:00 — кешкі доза күтуде", tone: "muted" },
      { icon: "🏫", t: "Мектеп асханасы: салат + сорпа таңдалды", tone: "success" },
      { icon: "🌙", t: "Ұйқы уақыты 22:00 — экран режимін өшіріңіз", tone: "muted" },
    ],
  },

  {
    id: "aruzhan", name: "Аружан", age: 4, emoji: "👧", score: 68,
    weight: "16 кг", height: "104 см", status: "watch", note: "Түнде 37.6° болды — бақылауда.",
    meds: [{ t: "09:00", n: "Nurofen susp. 5 ml", ok: true }, { t: "15:00", n: "Nurofen susp. 5 ml", ok: false }, { t: "21:00", n: "Probiotic drops", ok: false }],
    today: { calories: 980, sugar: 41, water: 3 },
    alerts: [
      { icon: "🌡", t: "Температура 37.6° — 4 сағ бұрын", tone: "warning" },
      { icon: "🍭", t: "Қант шегі 82% — конфеттер шектеу", tone: "danger" },
      { icon: "💊", t: "Nurofen 15:00 — 30 мин ішінде", tone: "warning" },
      { icon: "💧", t: "Су нормасы: 3/6 стакан — арттыру керек", tone: "muted" },
      { icon: "😴", t: "Ұйқы 8.5 сағ — жақсы режим", tone: "success" },
    ],
  },
  {
    id: "dias", name: "Диас", age: 14, emoji: "🧑", score: 74,
    weight: "48 кг", height: "162 см", status: "ok", note: "Спорт секциясы — 3 сағ жүктеме.",
    meds: [],
    today: { calories: 2380, sugar: 28, water: 8 },
    alerts: [
      { icon: "💪", t: "Ақуыз мақсаты орындалды (128 г)", tone: "success" },
      { icon: "🏃", t: "Кардио 45 мин — ЖСС макс 168", tone: "success" },
      { icon: "📱", t: "Экран уақыты 4.2 сағ — шектеу ұсынылады", tone: "warning" },
    ],
  },

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

  const L1 = useL();
  return (
    <div className="space-y-6">
      {/* Top bar — actions only */}
      <div className="flex items-center justify-between gap-3">
        <SectionEyebrow>
          <L kk="Отбасы · бақылау" ru="Семья · контроль" en="Family · monitor" />
        </SectionEyebrow>
        <div className="flex items-center gap-2">
          <Chip>{L1({ kk: "Ата-ана PIN қосулы", ru: "PIN родителя вкл.", en: "Parent PIN on" })}</Chip>
          <button
            onClick={() => {
              const n = window.prompt(L1({ kk: "Баланың аты", ru: "Имя ребёнка", en: "Child's name" }));
              if (n) toast.success(`+ ${n} ${L1({ kk: "қосылды", ru: "добавлен(а)", en: "added" })}`, { description: L1({ kk: "Профиль жасалуда...", ru: "Профиль создаётся...", en: "Creating profile..." }) });
            }}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            + <L kk="Бала қосу" ru="Добавить ребёнка" en="Add child" />
          </button>
        </div>
      </div>

      {/* Two-column layout: children list | selected kid detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        {/* Children list block */}
        <Bento>
          <div className="flex items-baseline justify-between">
            <SectionEyebrow>
              <L kk="Балалар" ru="Дети" en="Children" />
            </SectionEyebrow>
            <span className="text-[11px] text-muted-foreground">{KIDS.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {KIDS.map((k) => {
              const isActive = k.id === active;
              const tone = k.status === "ok" ? "success" : k.status === "watch" ? "warning" : "danger";
              return (
                <button
                  key={k.id}
                  onClick={() => setActive(k.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${isActive ? "border-[color:var(--mint)]/50 bg-[color:var(--mint-soft)]" : "border-border bg-surface hover:border-white/15"}`}
                >
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-2xl">{k.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <div className="font-serif text-lg text-foreground">{k.name}</div>
                      <span className="text-[11px] text-muted-foreground">{k.age} {L1({ kk: "жас", ru: "лет", en: "y" })}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{k.weight} · {k.height}</div>
                  </div>
                  <Badge tone={tone}>{k.score}</Badge>
                </button>
              );
            })}
          </div>
        </Bento>

        {/* Selected kid detail column */}
        <div className="space-y-4">
          {/* Three circular summary rings — above daily metrics */}
          {(() => {
            const alertsPct = Math.min(100, kid.alerts.length * 20);
            const alertsTone = kid.alerts.some(a => a.tone === "danger") ? "#ff6b6b" : kid.alerts.some(a => a.tone === "warning") ? "#f5b64c" : "#A8FF60";
            const medsTaken = kid.meds.filter(m => isMedOk(m.t, m.n, m.ok)).length;
            const medsPct = kid.meds.length ? Math.round((medsTaken / kid.meds.length) * 100) : 100;
            const sleepHours = kid.id === "aidos" ? 9.2 : kid.id === "aruzhan" ? 8.5 : 7.4;
            const sleepPct = Math.min(100, Math.round((sleepHours / 10) * 100));

            const rings: { label: React.ReactNode; center: React.ReactNode; sub: React.ReactNode; pct: number; color: string }[] = [
              {
                label: <L kk="Ескертулер" ru="Уведомления" en="Alerts" />,
                center: <span className="font-serif text-3xl text-foreground">{kid.alerts.length}</span>,
                sub: <L kk="белсенді" ru="активных" en="active" />,
                pct: alertsPct, color: alertsTone,
              },
              {
                label: <L kk="Дәрі-дәрмек" ru="Лекарства" en="Meds" />,
                center: <span className="font-serif text-3xl text-foreground">{medsTaken}<span className="text-muted-foreground text-lg">/{kid.meds.length || 0}</span></span>,
                sub: <>{medsPct}% <L kk="орындалды" ru="выполнено" en="done" /></>,
                pct: medsPct, color: "#A8FF60",
              },
              {
                label: <L kk="Ұйқы" ru="Сон" en="Sleep" />,
                center: <span className="font-serif text-3xl text-foreground">{sleepHours}<span className="text-muted-foreground text-lg">сағ</span></span>,
                sub: <L kk="соңғы түн" ru="прошлая ночь" en="last night" />,
                pct: sleepPct, color: "#7cb8ff",
              },
            ];
            const R = 46, C = 2 * Math.PI * R;
            return (
              <div className="grid grid-cols-3 gap-4">
                {rings.map((r, i) => (
                  <Bento key={i}>
                    <div className="flex flex-col items-center gap-2 py-2">
                      <SectionEyebrow>{r.label}</SectionEyebrow>
                      <div className="relative h-[120px] w-[120px]">
                        <svg viewBox="0 0 108 108" className="h-full w-full -rotate-90">
                          <circle cx="54" cy="54" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                          <circle cx="54" cy="54" r={R} fill="none" stroke={r.color} strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={C} strokeDashoffset={C - (C * r.pct) / 100}
                            style={{ transition: "stroke-dashoffset 600ms ease" }} />
                        </svg>
                        <div className="absolute inset-0 grid place-items-center">{r.center}</div>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{r.sub}</div>
                    </div>
                  </Bento>
                ))}
              </div>
            );
          })()}

          {/* Daily stats — image-style */}
          <Bento>
            <div className="flex items-baseline justify-between">
              <div>
                <SectionEyebrow><L kk="Бүгін" ru="Сегодня" en="Today" /> · {kid.name}</SectionEyebrow>
                <div className="font-serif text-2xl text-foreground">
                  <L kk="Күнделікті көрсеткіштер" ru="Дневные показатели" en="Daily metrics" />
                </div>
              </div>
              <Badge tone={kid.status === "ok" ? "success" : kid.status === "watch" ? "warning" : "danger"}>
                {kid.status === "ok" ? L1({ kk: "Аман", ru: "В норме", en: "OK" }) : kid.status === "watch" ? L1({ kk: "Бақылауда", ru: "Наблюдение", en: "Watch" }) : L1({ kk: "Назар", ru: "Внимание", en: "Alert" })}
              </Badge>
            </div>

            {(() => {
              const calPct = Math.min(100, Math.round((kid.today.calories / 1600) * 100));
              const sugarPct = Math.min(100, Math.round((kid.today.sugar / 25) * 100));
              const waterPct = Math.min(100, Math.round((kid.today.water / 6) * 100));
              const cards = [
                { k: L1({ kk: "КАЛОРИЯ", ru: "КАЛОРИИ", en: "CALORIES" }), v: `${kid.today.calories}`, sub: `/ ${L1({ kk: "мақсат", ru: "цель", en: "goal" })} 1600`, color: "text-[color:var(--mint)]", bar: "bg-[color:var(--mint)]", pct: calPct },
                { k: L1({ kk: "ҚАНТ", ru: "САХАР", en: "SUGAR" }), v: `${kid.today.sugar} г`, sub: `${L1({ kk: "шек", ru: "лимит", en: "limit" })} 25 г`, color: kid.today.sugar > 25 ? "text-rose-400" : "text-foreground", bar: kid.today.sugar > 25 ? "bg-rose-400" : "bg-foreground", pct: sugarPct },
                { k: L1({ kk: "СУ", ru: "ВОДА", en: "WATER" }), v: `${kid.today.water} ст`, sub: `/ 6 ${L1({ kk: "стакан", ru: "стаканов", en: "cups" })}`, color: "text-foreground", bar: "bg-white/80", pct: waterPct },
              ];
              return (
                <>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {cards.map((c) => (
                      <div key={c.k} className="rounded-xl border border-border bg-surface px-4 py-3">
                        <div className="text-[10px] tracking-[0.14em] text-muted-foreground">{c.k}</div>
                        <div className={`mt-1 font-serif text-3xl ${c.color}`}>{c.v}</div>
                        <div className="text-[11px] text-muted-foreground">{c.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 space-y-3">
                    {cards.map((c) => (
                      <div key={c.k}>
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{c.k.charAt(0) + c.k.slice(1).toLowerCase()}</span>
                          <span>{c.pct}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${c.pct}%`, transition: "width 600ms ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
            <p className="mt-4 text-[12px] text-muted-foreground">{kid.note}</p>
          </Bento>
        </div>
      </div>
    </div>
  );
}

