import { createFileRoute } from "@tanstack/react-router";
import { Card, Badge, PageHeader, Accordion, Ring } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/nutrition-scan")({
  head: () => ({
    meta: [
      { title: "Тамақ & Калория — SmartNutri · SauBol" },
      { name: "description", content: "Photo & barcode nutrition scanning with medical contraindications." },
    ],
  }),
  component: NutritionScan,
});

const TOP_FLAGS = [
  { name: "Maltodextrin (hidden)", tag: "Glycemic spike", tone: "danger" as const },
  { name: "Sodium 1,240 mg", tag: "62% RDI", tone: "danger" as const },
  { name: "Palm oil", tag: "Sat. fat", tone: "warning" as const },
];

const ALL_INGREDIENTS = [
  { name: "Refined wheat flour", tag: "Processed carb", tone: "warning" as const },
  { name: "E211 — Sodium benzoate", tag: "Preservative", tone: "warning" as const },
  { name: "E621 — MSG", tag: "Flavor enhancer", tone: "warning" as const },
  { name: "Sunflower oil", tag: "Neutral", tone: "muted" as const },
  { name: "Wheat gluten", tag: "Allergen", tone: "warning" as const },
];

function NutritionScan() {
  const t = useT();
  return (
    <div>
      <PageHeader
        eyebrow={t("nutri.eyebrow")}
        title={t("nutri.title")}
        description={t("nutri.desc")}
      />

      {/* HERO — Scanner */}
      <section className="mb-8">
        <div className="grid-bg relative flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/40 px-6 py-12">
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl border border-white/10" />
            <div className="absolute -inset-8 rounded-2xl border border-white/5" />
            <div className="relative grid h-28 w-28 place-items-center rounded-2xl border border-border bg-gradient-to-b from-zinc-800 to-zinc-950 text-4xl">
              📷
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="text-base font-medium text-foreground">{t("nutri.hero")}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t("nutri.heroSub")}</div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">{t("nutri.photo")}</button>
            <button className="rounded-md border border-border bg-surface px-4 py-2 text-xs text-foreground">{t("nutri.barcode")}</button>
            <button className="rounded-md border border-border bg-surface px-4 py-2 text-xs text-muted-foreground">{t("nutri.log")}</button>
          </div>
        </div>
      </section>

      {/* RESULT CARDS */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card title={t("nutri.calRing")} subtitle="Meal 3 of 5 · goal 2,000 kcal">
          <div className="flex items-center gap-5">
            <Ring value={34} label="680" sub="kcal" tone="warning" />
            <div className="flex-1 space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Protein</span><span className="tabular-nums text-foreground">28 g</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Carbs</span><span className="tabular-nums text-foreground">72 g</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">— sugars</span><span className="tabular-nums text-red-400">42 g</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fats</span><span className="tabular-nums text-foreground">34 g</span></div>
            </div>
          </div>
        </Card>

        <Card title={t("nutri.restr")} subtitle="Type 2 Diabetes · Hypertension · CKD" right={<Badge tone="danger">Triggered</Badge>}>
          <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-red-900/60 bg-red-950/50 text-red-400">⚠</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-200">Forbidden combination</div>
                <p className="mt-1 text-[12px] text-red-200/80">{t("nutri.restrMsg")}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="danger">Sugar +168%</Badge>
                  <Badge tone="danger">Sodium 62%</Badge>
                  <Badge tone="warning">Sat. fat +55%</Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title={t("nutri.flagged")} subtitle="12 detected · 3 critical">
          <ul className="space-y-2">
            {TOP_FLAGS.map((i) => (
              <li key={i.name} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-[12px]">
                <span className="text-foreground">{i.name}</span>
                <Badge tone={i.tone}>{i.tag}</Badge>
              </li>
            ))}
          </ul>
          <Accordion>
            <ul className="space-y-2">
              {ALL_INGREDIENTS.map((i) => (
                <li key={i.name} className="flex items-center justify-between py-1">
                  <span className="text-foreground">{i.name}</span>
                  <Badge tone={i.tone}>{i.tag}</Badge>
                </li>
              ))}
            </ul>
          </Accordion>
        </Card>
      </section>
    </div>
  );
}
