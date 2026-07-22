import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState, type ReactNode } from "react";
import { Card, Badge, PageHeader, SectionEyebrow, Bar } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";


export const Route = createFileRoute("/nutrition-scan")({
  head: () => ({
    meta: [
      { title: "Тамақ & Калория — SmartNutri · SauBol" },
      { name: "description", content: "Photo & barcode nutrition scanning with medical contraindications." },
    ],
  }),
  component: NutritionScan,
});

const INGREDIENTS = [
  { name: "Refined wheat flour", tag: "Processed carb", tone: "warning" as const },
  { name: "Palm oil", tag: "Sat. fat", tone: "warning" as const },
  { name: "Maltodextrin (hidden)", tag: "Glycemic spike", tone: "danger" as const },
  { name: "Sodium 1,240 mg", tag: "62% RDI", tone: "danger" as const },
  { name: "E211 — Sodium benzoate", tag: "Preservative", tone: "warning" as const },
  { name: "E621 — MSG", tag: "Flavor enhancer", tone: "warning" as const },
  { name: "Sunflower oil", tag: "Neutral", tone: "muted" as const },
  { name: "Wheat gluten", tag: "Allergen", tone: "warning" as const },
];

const CONTRA = [
  { c: "Type 2 Diabetes (E11)", r: "Glycemic index 78 — post-prandial spike expected", tone: "danger" as const },
  { c: "Hypertension (I10)", r: "Sodium 1,240 mg — exceeds per-meal ceiling of 600 mg", tone: "danger" as const },
  { c: "CKD stage 2", r: "Potassium 320 mg · phosphates elevated", tone: "warning" as const },
  { c: "Gluten sensitivity", r: "Contains wheat gluten", tone: "warning" as const },
  { c: "GERD", r: "Fried preparation may trigger reflux", tone: "warning" as const },
  { c: "Pediatric (<12y)", r: "Preservatives E211 above pediatric guidance", tone: "warning" as const },
];

const SUBS = [
  { n: "Grilled chicken wrap", k: "420 kcal", e: "🌯" },
  { n: "Quinoa bowl", k: "380 kcal", e: "🥗" },
  { n: "Lentil soup + bread", k: "310 kcal", e: "🍲" },
  { n: "Baked salmon + veg", k: "460 kcal", e: "🐟" },
];

const ALLERGENS = [
  { n: "Wheat gluten", s: "High", tone: "danger" as const },
  { n: "Soy lecithin", s: "Trace", tone: "warning" as const },
  { n: "Sesame", s: "Present", tone: "warning" as const },
  { n: "Milk protein", s: "Trace", tone: "muted" as const },
  { n: "Egg (bun glaze)", s: "Trace", tone: "muted" as const },
];

// Semicircle calorie ring, matching uploaded reference
function CalorieRing({ eaten, remaining, burned, goal }: { eaten: number; remaining: number; burned: number; goal: number }) {
  const pct = Math.min(100, Math.max(0, (eaten / goal) * 100));
  const r = 80;
  const c = Math.PI * r; // half-circle circumference
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative mx-auto" style={{ width: 240, height: 150 }}>
      <svg width={240} height={150} viewBox="0 0 200 120">
        <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="var(--secondary)" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke="var(--mint)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <circle cx={20 + (160 * pct) / 100} cy={110 - Math.sin((pct / 100) * Math.PI) * 78} r="6" fill="var(--mint)" />
      </svg>
      <div className="absolute inset-x-0 top-6 flex items-end justify-between px-2 text-center">
        <div>
          <div className="font-serif text-2xl text-foreground tabular-nums">{eaten}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <L kk="Жеді" ru="Съедено" en="Eaten" />
          </div>
        </div>
        <div>
          <div className="font-serif text-4xl text-foreground tabular-nums">{remaining.toLocaleString("ru")}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <L kk="Қалды" ru="Осталось" en="Left" />
          </div>
        </div>
        <div>
          <div className="font-serif text-2xl text-foreground tabular-nums">{burned}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <L kk="Күйдірілді" ru="Сожжено" en="Burned" />
          </div>
        </div>
      </div>

    </div>
  );
}

function Macro({ label, value, goal }: { label: string; value: number; goal: number }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-center text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-3">
        <Bar value={pct} tone="mint" />
      </div>
      <div className="mt-2 text-center font-mono text-[12px] text-foreground">{value} / {goal} г</div>
    </div>
  );
}

// Expandable square block: small tile → click → modal-like expansion
function SquareBlock({ title, badge, icon, expanded, onToggle, children, summary }: { title: string; badge?: string; icon: string; expanded: boolean; onToggle: () => void; children: ReactNode; summary: string }) {
  return (
    <>
      <button
        onClick={onToggle}
        className="group relative flex aspect-square flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left transition hover:border-[color:var(--mint)]/40 hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between">
          <div className="text-3xl">{icon}</div>
          {badge && <Badge tone="warning">{badge}</Badge>}
        </div>
        <div>
          <div className="font-serif text-lg leading-tight text-foreground">{title}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{summary}</div>
          <div className="mt-3 text-[11px] text-[color:var(--mint)] opacity-0 transition group-hover:opacity-100">Ашу →</div>
        </div>
      </button>
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onToggle}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{icon}</div>
                <div>
                  <h3 className="font-serif text-2xl text-foreground">{title}</h3>
                  <div className="text-[11px] text-muted-foreground">{summary}</div>
                </div>
              </div>
              <button onClick={onToggle} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Жабу ✕</button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}

function NutritionScan() {
  const [logged, setLogged] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (k: string) => setOpen((s) => (s === k ? null : k));
  const L1 = useL();

  const eaten = 680;
  const burned = 162;
  const goal = 2000;
  const remaining = Math.max(0, goal - eaten + burned);

  return (
    <div>
      <PageHeader
        eyebrow={<L kk="SmartNutri · Тағам 03" ru="SmartNutri · Приём 03" en="SmartNutri · Meal 03" />}
        title={<L kk="Тамақтану және қауіпсіздік сканері" ru="Сканер питания и безопасности" en="Nutrition & Safety Scan" />}
        description={<L
          kk="Тағам: «Fried chicken burger + soda» · 12:47 сканерленді · GS1 4870204..."
          ru="Блюдо: «Fried chicken burger + soda» · отсканировано 12:47 · GS1 4870204..."
          en="Dish: «Fried chicken burger + soda» · scanned 12:47 · GS1 barcode 4870204..."
        />}
        actions={
          <>
            <button onClick={() => toast.info(L1({ kk: "📷 Камера ашылуда...", ru: "📷 Открываем камеру...", en: "📷 Opening camera..." }), { description: L1({ kk: "Тағамды фотоға түсіріңіз", ru: "Сфотографируйте блюдо", en: "Take a photo of the meal" }) })} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">📷 {L1({ kk: "Фото", ru: "Фото", en: "Photo" })}</button>
            <button onClick={() => toast.info(L1({ kk: "🧾 Штрих-код сканері", ru: "🧾 Сканер штрих-кода", en: "🧾 Barcode scanner" }), { description: L1({ kk: "Өнім штрих-кодына бағыттаңыз", ru: "Наведите на штрих-код", en: "Point at product barcode" }) })} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">🧾 {L1({ kk: "Штрих-код", ru: "Штрих-код", en: "Barcode" })}</button>
            <button onClick={() => { setLogged(true); toast.success(logged ? L1({ kk: "Тағам жаңартылды", ru: "Приём обновлён", en: "Meal updated" }) : L1({ kk: "Тағам күнделігіне жазылды ✓", ru: "Приём записан в дневник ✓", en: "Meal logged ✓" }), { description: L1({ kk: "680 ккал · хронологияға қосылды", ru: "680 ккал · добавлено в хронологию", en: "680 kcal · added to timeline" }) }); }} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{logged ? L1({ kk: "Тіркелді ✓", ru: "Записано ✓", en: "Logged ✓" }) : L1({ kk: "Тіркеу", ru: "Записать", en: "Log meal" })}</button>
          </>
        }
      />

      {/* Calorie summary widget (from reference screenshot) */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-serif text-3xl text-foreground"><L kk="Қорытынды" ru="Сводка" en="Summary" /></h2>
          <button className="text-sm font-medium text-[color:var(--mint)]"><L kk="Толығырақ →" ru="Подробности →" en="Details →" /></button>
        </div>
        <CalorieRing eaten={eaten} remaining={remaining} burned={burned} goal={goal} />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Macro label={L1({ kk: "Көмірсу", ru: "Углеводы", en: "Carbs" })} value={72} goal={268} />
          <Macro label={L1({ kk: "Ақуыз", ru: "Белки", en: "Protein" })} value={28} goal={107} />
          <Macro label={L1({ kk: "Май", ru: "Жиры", en: "Fat" })} value={34} goal={71} />
        </div>
      </div>

      {/* Alert */}
      <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400">⚠</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-300">
              <L kk="Қант және натрий шектен тыс — медициналық шектеу" ru="Превышен сахар и натрий — медицинское ограничение" en="Excessive Sugar & Sodium — Medical Restriction Triggered" />
            </div>
            <p className="mt-1 text-xs text-amber-200/80">
              <L
                kk="Қант күндік шектен 168%, натрий 62% RDI — бір тағамда. Хронологияға белгіленді."
                ru="Добавленный сахар 168% дневной нормы, натрий 62% RDI — за один приём. Отмечено в хронологии."
                en="Added sugar 168% of daily ceiling and sodium 62% RDI in a single meal. Flagged in your medical timeline."
              />
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="danger">{L1({ kk: "Қант", ru: "Сахар", en: "Sugar" })} +168%</Badge>
              <Badge tone="danger">{L1({ kk: "Натрий", ru: "Натрий", en: "Sodium" })} 1,240 mg</Badge>
              <Badge tone="warning">{L1({ kk: "Қаныққан май", ru: "Насыщ. жиры", en: "Sat. fat" })} +55%</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 4-square expandable grid */}
      <SectionEyebrow>
        <L kk="Терең талдау · басып ашыңыз" ru="Глубокий анализ · нажмите, чтобы открыть" en="Deep analysis · tap to expand" />
      </SectionEyebrow>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

        <SquareBlock
          title="Ingredients"
          icon="🧪"
          badge="4 flagged"
          summary="12 detected · 1 hidden"
          expanded={open === "ing"}
          onToggle={() => toggle("ing")}
        >
          <ul className="divide-y divide-border">
            {INGREDIENTS.map((i) => (
              <li key={i.name} className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-foreground">{i.name}</span>
                <Badge tone={i.tone}>{i.tag}</Badge>
              </li>
            ))}
          </ul>
        </SquareBlock>

        <SquareBlock
          title="Contraindications"
          icon="⚕️"
          badge="6 conditions"
          summary="Cross-checked profile"
          expanded={open === "contra"}
          onToggle={() => toggle("contra")}
        >
          <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-rose-300">STRICTLY FORBIDDEN</span>
              <Badge tone="danger">Triggered</Badge>
            </div>
            <p className="mt-1 text-[12px] text-rose-200/80">
              For patients with Type 2 Diabetes, Hypertension, and CKD combined.
            </p>
          </div>
          <div className="space-y-2">
            {CONTRA.map((r) => (
              <div key={r.c} className="flex items-start justify-between rounded-md border border-border bg-surface px-3 py-2">
                <div>
                  <div className="text-[13px] font-medium text-foreground">{r.c}</div>
                  <div className="text-[11px] text-muted-foreground">{r.r}</div>
                </div>
                <Badge tone={r.tone}>Avoid</Badge>
              </div>
            ))}
          </div>
        </SquareBlock>

        <SquareBlock
          title="Healthier subs"
          icon="🥗"
          badge="4 options"
          summary="Under 500 kcal"
          expanded={open === "sub"}
          onToggle={() => toggle("sub")}
        >
          <div className="grid grid-cols-2 gap-2">
            {SUBS.map((s) => (
              <button key={s.n} onClick={() => { toast.success(`✓ ${s.n} таңдалды`, { description: `${s.k} · ұсыныс сақталды` }); setOpen(null); }} className="rounded-lg border border-border bg-surface p-3 text-left transition hover:border-[color:var(--mint)]/40">
                <div className="text-2xl">{s.e}</div>
                <div className="mt-1 text-[13px] font-medium text-foreground">{s.n}</div>
                <div className="text-[11px] text-muted-foreground">{s.k}</div>
              </button>
            ))}
          </div>
        </SquareBlock>

        <SquareBlock
          title="Allergens"
          icon="🌾"
          badge="2 high"
          summary="Personal profile scan"
          expanded={open === "all"}
          onToggle={() => toggle("all")}
        >
          <ul className="divide-y divide-border">
            {ALLERGENS.map((a) => (
              <li key={a.n} className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-foreground">{a.n}</span>
                <Badge tone={a.tone}>{a.s}</Badge>
              </li>
            ))}
          </ul>
        </SquareBlock>
      </div>

      {/* Macro breakdown card underneath */}
      <div className="mt-6">
        <Card title="Calorie & Macro Breakdown" subtitle="USDA + KZ Nutrient DB · portion 340 g" right={<Badge tone="warning">Above target</Badge>}>
          <div className="flex gap-4">
            <div className="grid-bg grid h-40 w-40 shrink-0 place-items-center rounded-lg border border-border bg-surface text-4xl">🍔</div>
            <div className="flex-1 space-y-3">
              {[
                { l: "Protein", v: "28 g", pct: 40, note: "16% kcal" },
                { l: "Carbohydrates", v: "72 g", pct: 82, note: "42% kcal" },
                { l: "of which sugars", v: "42 g", pct: 95, tone: "danger" as const, note: "168% daily limit" },
                { l: "Fats", v: "34 g", pct: 68, note: "45% kcal" },
                { l: "of which saturated", v: "11 g", pct: 55, tone: "warning" as const, note: "55% limit" },
              ].map((r) => (
                <div key={r.l}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-foreground">{r.l}</span>
                    <span className="tabular-nums text-muted-foreground">{r.v} · {r.note}</span>
                  </div>
                  <Bar value={r.pct} tone={(r as { tone?: "danger" | "warning" }).tone ?? "neutral"} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
