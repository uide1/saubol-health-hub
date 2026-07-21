import { createFileRoute } from "@tanstack/react-router";
import { Card, Badge, Stat, Bar, PageHeader } from "@/components/ui-kit";

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

function NutritionScan() {
  return (
    <div>
      <PageHeader
        eyebrow="SmartNutri · Meal 03"
        title="Nutrition & Safety Scan"
        description="Dish: «Fried chicken burger + soda» · scanned 12:47 · GS1 barcode 4870204..."
        actions={
          <>
            <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">📷 Photo</button>
            <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">🧾 Barcode</button>
            <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Log meal</button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        <Stat label="Total Kcal" value="680 kcal" hint="34% of 2000 goal" tone="warning" />
        <Stat label="Sugars" value="42 g" hint="Limit 25 g/day" tone="danger" />
        <Stat label="Sodium" value="1,240 mg" hint="Limit 2,000 mg" tone="danger" />
        <Stat label="Fiber" value="2.1 g" hint="Target 30 g" tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
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

          <div className="mt-5 rounded-lg border border-amber-900/60 bg-amber-950/30 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-md border border-amber-900/60 bg-amber-950/50 text-amber-400">⚠</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-amber-300">Excessive Sugar & Sodium — Medical Restriction Triggered</div>
                <p className="mt-1 text-xs text-amber-200/80">
                  Both added sugar (168% of daily ceiling) and sodium (62% RDI in a single meal) exceed clinical intake thresholds. SauBol has flagged this meal in your medical timeline.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="danger">Sugar +168%</Badge>
                  <Badge tone="danger">Sodium 1,240 mg</Badge>
                  <Badge tone="warning">Sat. fat +55%</Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Ingredient Analysis" subtitle="12 detected · 4 flagged · 1 hidden">
            <ul className="divide-y divide-border">
              {INGREDIENTS.map((i) => (
                <li key={i.name} className="flex items-center justify-between py-2 text-[12px]">
                  <span className="text-foreground">{i.name}</span>
                  <Badge tone={i.tone}>{i.tag}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Contraindication Matrix" subtitle="Cross-checked with 6 patient conditions">
            <div className="space-y-2">
              <div className="rounded-md border border-red-900/60 bg-red-950/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-300">STRICTLY FORBIDDEN</span>
                  <Badge tone="danger">Triggered</Badge>
                </div>
                <p className="mt-1 text-[11px] text-red-200/80">
                  For patients with Type 2 Diabetes, Hypertension, and Chronic Kidney Disease. Sodium and refined-carb load exceed safe thresholds for all three conditions simultaneously.
                </p>
              </div>
              {[
                { c: "Type 2 Diabetes (E11)", r: "Glycemic index 78 — post-prandial spike expected", tone: "danger" as const },
                { c: "Hypertension (I10)", r: "Sodium 1,240 mg — exceeds per-meal ceiling of 600 mg", tone: "danger" as const },
                { c: "CKD stage 2", r: "Potassium 320 mg · phosphates elevated", tone: "warning" as const },
                { c: "Gluten sensitivity", r: "Contains wheat gluten", tone: "warning" as const },
                { c: "GERD", r: "Fried preparation may trigger reflux", tone: "warning" as const },
                { c: "Pediatric (<12y)", r: "Preservatives E211 above pediatric guidance", tone: "warning" as const },
              ].map((r) => (
                <div key={r.c} className="flex items-start justify-between rounded-md border border-border bg-surface px-3 py-2">
                  <div>
                    <div className="text-[12px] font-medium text-foreground">{r.c}</div>
                    <div className="text-[11px] text-muted-foreground">{r.r}</div>
                  </div>
                  <Badge tone={r.tone}>Avoid</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Healthier substitutes">
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              {[
                { n: "Grilled chicken wrap", k: "420 kcal" },
                { n: "Quinoa bowl", k: "380 kcal" },
                { n: "Lentil soup + bread", k: "310 kcal" },
              ].map((s) => (
                <div key={s.n} className="rounded-md border border-border bg-surface p-3">
                  <div className="text-2xl">🥗</div>
                  <div className="mt-1 font-medium text-foreground">{s.n}</div>
                  <div className="text-muted-foreground">{s.k}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
