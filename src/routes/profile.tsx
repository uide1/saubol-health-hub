import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bento, Badge, Chip, SectionEyebrow, Gauge } from "@/components/ui-kit";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Профиль — SauBol AI" },
      { name: "description", content: "Жеке медициналық профиль, барлық сканерлер тарихы, PDF экспорт." },
      { property: "og:title", content: "Профиль · SauBol AI" },
      { property: "og:description", content: "Сіздің денсаулық журналыңыз бір орында." },
    ],
  }),
  component: ProfilePage,
});

type HistTone = "warning" | "danger" | "success" | "muted";
const HISTORY: { date: string; type: string; title: string; note: string; tone: HistTone; to: "/nutrition-scan" | "/triage-voice" | "/prescription-rx" }[] = [
  { date: "20 шіл", type: "food", title: "Fried chicken burger", note: "Sugar +168% · Sodium 62%", tone: "danger", to: "/nutrition-scan" },
  { date: "19 шіл", type: "voice", title: "Аудио триаж — ішке ауырсыну", note: "Аппендицит күдігі · 103", tone: "danger", to: "/triage-voice" },
  { date: "18 шіл", type: "rx", title: "Рецепт Rx-2026-0472", note: "7 дәрі-дәрмек · 2 өзара әсер", tone: "warning", to: "/prescription-rx" },
  { date: "17 шіл", type: "food", title: "Quinoa bowl", note: "Дұрыс тамақтану", tone: "success", to: "/nutrition-scan" },
  { date: "10 шіл", type: "rx", title: "Vitamin D3 4000 IU", note: "Ұзақ мерзімді курс", tone: "muted", to: "/prescription-rx" },
  { date: "05 шіл", type: "voice", title: "Бас ауруы сұхбаты", note: "Мигрень белгілері", tone: "muted", to: "/triage-voice" },
];

const TABS = [
  { k: "all", l: "Барлығы", n: 6 },
  { k: "food", l: "Тамақ", n: 2 },
  { k: "voice", l: "Дауыс", n: 2 },
  { k: "rx", l: "Дәрі", n: 2 },
];


function ProfilePage() {
  const [tab, setTab] = useState("all");
  const [lang, setLang] = useState("kk");
  const [goals, setGoals] = useState<string[]>(["🩸 Анемия", "💤 Ұйқы", "⚖️ Салмақ"]);
  const [privacy, setPrivacy] = useState({ enc: true, sos: true, share: false });
  const filtered = tab === "all" ? HISTORY : HISTORY.filter((h) => h.type === tab);
  const toggleGoal = (g: string) => setGoals(s => s.includes(g) ? s.filter(x => x !== g) : [...s, g]);

  return (
    <div className="space-y-6">
      {/* Profile hero */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Bento className="noise flex items-center gap-6 p-8">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[color:var(--mint)] to-emerald-800 font-serif text-4xl text-background">
            АН
          </div>
          <div className="flex-1">
            <SectionEyebrow>Пациент профилі · SB-24817</SectionEyebrow>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-foreground">Айнұр Нұрланова</h1>
            <p className="mt-1 text-sm text-muted-foreground">32 жас · Талдықорған · II (A+) қан тобы · SauBol-да 4 ай</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="mint">Premium</Badge>
              <Badge tone="warning">Пенициллинге аллергия</Badge>
              <Badge tone="muted">Анемия · курста</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => toast.info("Өңдеу режимі жақында", { description: "Профиль редакторы дайындалуда" })} className="rounded-full border border-border bg-surface px-4 py-2 text-xs text-foreground">Өңдеу</button>
            <button onClick={() => toast.success("📄 PDF дайындалуда...", { description: "47 сканер · 4 ай тарихы жүктеледі" })} className="rounded-full bg-foreground px-4 py-2 text-xs text-background">PDF экспорт</button>
          </div>
        </Bento>

        <Bento className="flex items-center gap-4">
          <Gauge value={72} label="Индекс" size={120} />
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Бүгін</span><span className="font-mono text-foreground">72</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Апта</span><span className="font-mono text-[color:var(--mint)]">+4</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Ай</span><span className="font-mono text-[color:var(--mint)]">+11</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Барлық сканер</span><span className="font-mono text-foreground">47</span></div>
          </div>
        </Bento>
      </div>

      {/* Body metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
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

      {/* History */}
      <Bento>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionEyebrow>Медициналық хронология</SectionEyebrow>
            <h2 className="font-serif text-3xl text-foreground">Барлық сканерлер</h2>
          </div>
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)}>
                <Chip active={tab === t.k}>{t.l} · {t.n}</Chip>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {filtered.map((h, i) => (
            <Link key={i} to={h.to} className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 transition hover:border-white/15">
              <div className="w-14 shrink-0 font-mono text-[11px] text-muted-foreground">{h.date}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{h.title}</div>
                <div className="truncate text-[11px] text-muted-foreground">{h.note}</div>
              </div>
              <Badge tone={h.tone}>{h.type}</Badge>
              <span className="text-muted-foreground">→</span>
            </Link>
          ))}
        </div>
      </Bento>

      {/* Preferences */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Bento>
          <SectionEyebrow>Тіл</SectionEyebrow>
          <div className="flex gap-2">
            {[["kk","Қазақша"],["ru","Русский"],["en","English"]].map(([k,v]) => (
              <button key={k} onClick={() => { setLang(k); toast(`Тіл: ${v}`); }}>
                <Chip active={lang === k}>{v}</Chip>
              </button>
            ))}
          </div>
        </Bento>
        <Bento>
          <SectionEyebrow>Мақсаттар</SectionEyebrow>
          <div className="flex flex-wrap gap-1.5">
            {["🩸 Анемия", "💤 Ұйқы", "⚖️ Салмақ", "🍎 Тамақ", "🏃 Спорт"].map((g) => (
              <button key={g} onClick={() => toggleGoal(g)}>
                <Chip active={goals.includes(g)}>{g}</Chip>
              </button>
            ))}
          </div>
        </Bento>
        <Bento>
          <SectionEyebrow>Құпиялылық</SectionEyebrow>
          <div className="space-y-1.5 text-[12px] text-foreground">
            {[
              { k: "enc" as const, l: "Деректер шифрлеу" },
              { k: "sos" as const, l: "103-ке автотабысу" },
              { k: "share" as const, l: "Дәрігермен бөлісу" },
            ].map((r) => (
              <button key={r.k} onClick={() => { setPrivacy(p => ({ ...p, [r.k]: !p[r.k] })); toast(`${r.l}: ${!privacy[r.k] ? "Қосулы" : "Өшірулі"}`); }} className="flex w-full items-center justify-between">
                <span>{r.l}</span>
                <Badge tone={privacy[r.k] ? "mint" : "muted"}>{privacy[r.k] ? "Қосулы" : "Өшірулі"}</Badge>
              </button>
            ))}
          </div>
        </Bento>
      </div>
    </div>
  );
}
