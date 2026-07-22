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
          {/* Daily stats */}
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
            <p className="mt-2 text-[12px] text-muted-foreground">{kid.note}</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label={L1({ kk: "Калория", ru: "Калории", en: "Calories" })} value={`${kid.today.calories}`} hint="/ 1600" tone="mint" />
              <Stat label={L1({ kk: "Қант", ru: "Сахар", en: "Sugar" })} value={`${kid.today.sugar} г`} hint={L1({ kk: "шек 25 г", ru: "лимит 25 г", en: "limit 25 g" })} tone={kid.today.sugar > 25 ? "danger" : "success"} />
              <Stat label={L1({ kk: "Су", ru: "Вода", en: "Water" })} value={`${kid.today.water} ст`} hint="/ 6" />
            </div>
          </Bento>

          {/* Alerts + Meds side by side */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Bento>
              <SectionEyebrow><L kk="Ескертулер" ru="Уведомления" en="Alerts" /></SectionEyebrow>
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
                    <L kk="Ескертулер жоқ ✓" ru="Уведомлений нет ✓" en="No alerts ✓" />
                  </div>
                )}
              </div>
            </Bento>

            <Bento>
              <div className="flex items-baseline justify-between">
                <SectionEyebrow><L kk="Дәрі-дәрмек" ru="Лекарства" en="Meds" /></SectionEyebrow>
                <span className="text-[11px] text-muted-foreground">{kid.meds.filter(m=>m.ok).length}/{kid.meds.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {kid.meds.length === 0 && <div className="text-[12px] text-muted-foreground"><L kk="Тағайындалған дәрі жоқ." ru="Назначений нет." en="No prescriptions." /></div>}
                {kid.meds.map((m) => {
                  const ok = isMedOk(m.t, m.n, m.ok);
                  return (
                    <button key={m.t + m.n} onClick={() => toggleMed(m.t, m.n, m.ok)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition hover:border-white/15">
                      <div className={`h-2 w-2 rounded-full ${ok ? "bg-[color:var(--mint)]" : "bg-muted-foreground"}`} />
                      <div className="font-mono text-[11px] text-muted-foreground">{m.t}</div>
                      <div className="flex-1 text-[12px] text-foreground">{m.n}</div>
                      {ok ? <Badge tone="mint">✓</Badge> : <Badge tone="warning">…</Badge>}
                    </button>
                  );
                })}
              </div>
            </Bento>
          </div>
        </div>
      </div>
    </div>
  );
}

