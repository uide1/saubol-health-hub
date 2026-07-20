import { createFileRoute } from "@tanstack/react-router";
import { Card, Badge, Stat, Bar, PageHeader, Accordion } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Анализдер — BioSign AI · SauBol" },
      { name: "description", content: "AI-driven blood panel analysis with micro-element and disease diagnostics." },
    ],
  }),
  component: LabAnalysis,
});

const KEY4 = [
  { name: "Hemoglobin", value: "105", unit: "g/L", ref: "120–160", status: "Low", tone: "danger" as const, pct: 60 },
  { name: "Ferritin", value: "12", unit: "µg/L", ref: "30–200", status: "Critical", tone: "danger" as const, pct: 15 },
  { name: "Vitamin B12", value: "198", unit: "pg/mL", ref: "200–900", status: "Low", tone: "warning" as const, pct: 40 },
  { name: "Glucose", value: "4.8", unit: "mmol/L", ref: "3.9–5.6", status: "Normal", tone: "success" as const, pct: 78 },
];

const EXTRA = [
  { name: "Vitamin D", value: "18 ng/mL", ref: "30–100", tone: "warning" as const, pct: 32 },
  { name: "MCV", value: "76 fL", ref: "80–100", tone: "warning" as const, pct: 55 },
  { name: "Iron (serum)", value: "5.2 µmol/L", ref: "11–30", tone: "danger" as const, pct: 20 },
  { name: "TSH", value: "2.4 mIU/L", ref: "0.4–4.0", tone: "success" as const, pct: 72 },
  { name: "Creatinine", value: "72 µmol/L", ref: "62–106", tone: "success" as const, pct: 65 },
  { name: "ALT", value: "22 U/L", ref: "7–56", tone: "success" as const, pct: 55 },
];

function LabAnalysis() {
  const t = useT();
  return (
    <div>
      <PageHeader
        eyebrow={t("labs.eyebrow")}
        title={t("labs.title")}
        description={t("labs.desc")}
        actions={
          <>
            <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">{t("common.export")}</button>
            <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{t("common.reanalyze")}</button>
          </>
        }
      />

      {/* HERO — Upload */}
      <section className="mb-8">
        <div className="grid-bg flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-14 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-xl border border-border bg-surface text-xl text-muted-foreground">↑</div>
          <div className="mt-4 text-base font-medium text-foreground">{t("labs.drop")}</div>
          <div className="mt-1 text-xs text-muted-foreground">{t("labs.dropSub")}</div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">{t("common.browse")}</button>
            <Badge tone="success">HIPAA</Badge>
            <Badge tone="muted">On-device OCR</Badge>
          </div>
        </div>
      </section>

      {/* KEY RESULTS + SUMMARY */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card
          title={t("labs.key")}
          subtitle={t("labs.keySub")}
          right={<Badge tone="danger">2 critical</Badge>}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {KEY4.map((b) => (
              <div key={b.name} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{b.name}</div>
                  <Badge tone={b.tone}>{b.status}</Badge>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-semibold tabular-nums text-foreground">{b.value}</span>
                  <span className="text-[11px] text-muted-foreground">{b.unit}</span>
                </div>
                <div className="mt-2"><Bar value={b.pct} tone={b.tone} /></div>
                <div className="mt-1 text-[10px] text-muted-foreground">Ref {b.ref}</div>
              </div>
            ))}
          </div>

          <Accordion>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-surface text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Marker</th>
                    <th className="px-3 py-2">Value</th>
                    <th className="px-3 py-2">Ref</th>
                    <th className="px-3 py-2 w-[35%]">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {EXTRA.map((b) => (
                    <tr key={b.name} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-foreground">{b.name}</td>
                      <td className="px-3 py-2 tabular-nums text-foreground">{b.value}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{b.ref}</td>
                      <td className="px-3 py-2"><Bar value={b.pct} tone={b.tone} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Accordion>
        </Card>

        <Card title={t("labs.summary")} subtitle={t("labs.summarySub")}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Severity</div>
              <div className="mt-1 text-xl font-semibold tracking-tight text-foreground">{t("labs.diagTitle")}</div>
              <div className="text-xs text-muted-foreground">{t("labs.diagSub")}</div>
            </div>
            <Badge tone="danger">Priority 1</Badge>
          </div>

          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Risk gauge</span><span className="tabular-nums">78 / 100</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: "78%" }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Normal</span><span>Watch</span><span>High</span><span>Critical</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat label="ICD-10" value="D50.9" />
            <Stat label="Confidence" value="94.1%" />
            <Stat label="Follow-up" value="2 wk" />
          </div>

          <Accordion>
            <ul className="space-y-3">
              {[
                { t: "Depleted iron stores", d: "Ferritin 12 µg/L — below therapeutic floor." },
                { t: "Reduced oxygen carriage", d: "Hemoglobin 105 g/L → mild functional hypoxia risk." },
                { t: "B12 co-deficiency", d: "Slows erythropoiesis; supplement alongside iron." },
              ].map((x) => (
                <li key={x.t}>
                  <div className="font-medium text-foreground">{x.t}</div>
                  <div>{x.d}</div>
                </li>
              ))}
            </ul>
          </Accordion>
        </Card>
      </section>
    </div>
  );
}
