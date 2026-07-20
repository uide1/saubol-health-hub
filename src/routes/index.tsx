import { createFileRoute } from "@tanstack/react-router";
import { Card, Badge, Stat, Bar, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Анализдер — BioSign AI · SauBol" },
      { name: "description", content: "AI-driven blood panel analysis with micro-element and disease diagnostics." },
    ],
  }),
  component: LabAnalysis,
});

const BIOMARKERS = [
  { name: "Hemoglobin", value: "105", unit: "g/L", ref: "120–160", status: "low", tone: "danger" as const, pct: 60 },
  { name: "Ferritin", value: "12", unit: "µg/L", ref: "30–200", status: "critical", tone: "danger" as const, pct: 15 },
  { name: "Vitamin B12", value: "198", unit: "pg/mL", ref: "200–900", status: "low", tone: "warning" as const, pct: 40 },
  { name: "Vitamin D", value: "18", unit: "ng/mL", ref: "30–100", status: "low", tone: "warning" as const, pct: 32 },
  { name: "Glucose (fasting)", value: "4.8", unit: "mmol/L", ref: "3.9–5.6", status: "normal", tone: "success" as const, pct: 78 },
  { name: "TSH", value: "2.4", unit: "mIU/L", ref: "0.4–4.0", status: "normal", tone: "success" as const, pct: 72 },
  { name: "MCV", value: "76", unit: "fL", ref: "80–100", status: "low", tone: "warning" as const, pct: 55 },
  { name: "Iron (serum)", value: "5.2", unit: "µmol/L", ref: "11–30", status: "critical", tone: "danger" as const, pct: 20 },
  { name: "Creatinine", value: "72", unit: "µmol/L", ref: "62–106", status: "normal", tone: "success" as const, pct: 65 },
  { name: "ALT", value: "22", unit: "U/L", ref: "7–56", status: "normal", tone: "success" as const, pct: 55 },
];

function LabAnalysis() {
  return (
    <div>
      <PageHeader
        eyebrow="BioSign AI · Панель № LP-24817"
        title="Blood Panel Analysis"
        description="Оқылған: 20 шілде 2026 · Лаборатория Invivo Taldykorgan · Пациент: Айнұр Н., 32 ж."
        actions={
          <>
            <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Export PDF</button>
            <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Re-analyze</button>
          </>
        }
      />

      {/* Upload zone */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
        <div className="grid-bg flex items-center justify-between rounded-xl border border-dashed border-border bg-surface/40 p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface text-muted-foreground">↑</div>
            <div>
              <div className="text-sm font-medium text-foreground">Drop lab report — PDF, JPG, PNG</div>
              <div className="text-xs text-muted-foreground">Supports Invivo, Olymp, Helix, KDL formats · OCR + LOINC mapping</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="success">HIPAA</Badge>
            <Badge tone="muted">On-device OCR</Badge>
            <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground">Browse</button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Recent uploads</div>
          <ul className="mt-2 space-y-1.5 text-xs text-foreground">
            <li className="flex justify-between"><span>CBC-jul-20.pdf</span><span className="text-muted-foreground">2m</span></li>
            <li className="flex justify-between"><span>Ferritin-panel.jpg</span><span className="text-muted-foreground">3d</span></li>
            <li className="flex justify-between"><span>Lipids-2026.pdf</span><span className="text-muted-foreground">2w</span></li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* LEFT — biomarker table */}
        <Card
          title="Analyzed Blood Profile"
          subtitle="42 biomarkers · 8 out of range · confidence 98.4%"
          right={
            <div className="flex items-center gap-1">
              <Badge tone="danger">3 critical</Badge>
              <Badge tone="warning">5 low</Badge>
              <Badge tone="success">34 normal</Badge>
            </div>
          }
        >
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Overall Score" value="62 / 100" hint="Mild deficiency pattern" tone="warning" />
            <Stat label="Anemia Risk" value="High" hint="Iron / microcytic" tone="danger" />
            <Stat label="Metabolic" value="Stable" hint="Glucose · lipids OK" tone="success" />
            <Stat label="Inflammation" value="Low" hint="CRP 1.2 mg/L" tone="success" />
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-surface text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Marker</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2 w-[28%]">Distribution</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {BIOMARKERS.map((b) => (
                  <tr key={b.name} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">{b.name}</td>
                    <td className="px-3 py-2 tabular-nums text-foreground">{b.value} <span className="text-muted-foreground">{b.unit}</span></td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{b.ref}</td>
                    <td className="px-3 py-2"><Bar value={b.pct} tone={b.tone} /></td>
                    <td className="px-3 py-2">
                      <Badge tone={b.tone}>{b.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* RIGHT — diagnostics */}
        <div className="space-y-4">
          <Card title="Primary AI Diagnosis" subtitle="Cross-referenced with 14.2M panels">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Severity</div>
                <div className="mt-1 text-xl font-semibold tracking-tight text-foreground">High Anemia Risk</div>
                <div className="text-xs text-muted-foreground">Iron-deficiency, microcytic hypochromic pattern</div>
              </div>
              <Badge tone="danger">Priority 1</Badge>
            </div>
            <div className="mt-4">
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
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-border bg-surface p-2">
                <div className="text-[10px] uppercase text-muted-foreground">ICD-10</div>
                <div className="text-xs font-medium text-foreground">D50.9</div>
              </div>
              <div className="rounded-md border border-border bg-surface p-2">
                <div className="text-[10px] uppercase text-muted-foreground">Confidence</div>
                <div className="text-xs font-medium text-foreground">94.1%</div>
              </div>
              <div className="rounded-md border border-border bg-surface p-2">
                <div className="text-[10px] uppercase text-muted-foreground">Follow-up</div>
                <div className="text-xs font-medium text-foreground">2 weeks</div>
              </div>
            </div>
          </Card>

          <Card title="Root Cause Breakdown">
            <ul className="space-y-3 text-[12px]">
              {[
                { t: "Depleted iron stores", d: "Ferritin 12 µg/L — below therapeutic floor.", tone: "danger" as const },
                { t: "Reduced oxygen carriage", d: "Hemoglobin 105 g/L → mild functional hypoxia risk.", tone: "warning" as const },
                { t: "B12 co-deficiency", d: "Slows erythropoiesis; supplement alongside iron.", tone: "warning" as const },
              ].map((x) => (
                <li key={x.t} className="flex gap-3">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${x.tone === "danger" ? "bg-red-500" : "bg-amber-500"}`} />
                  <div>
                    <div className="font-medium text-foreground">{x.t}</div>
                    <div className="text-muted-foreground">{x.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Recommended Protocol" subtitle="Non-prescriptive · confirm with physician">
            <div className="space-y-2 text-[12px]">
              {[
                ["Ferrous bisglycinate", "25 mg elemental Fe · 2×/day · with vitamin C"],
                ["Methylcobalamin B12", "1000 µg sublingual · daily · 8 weeks"],
                ["Cholecalciferol D3", "4000 IU · daily with fat meal"],
              ].map(([a, b]) => (
                <div key={a} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
                  <div>
                    <div className="font-medium text-foreground">{a}</div>
                    <div className="text-[11px] text-muted-foreground">{b}</div>
                  </div>
                  <Badge tone="success">Safe</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Questions for your doctor">
            <ol className="list-decimal space-y-1.5 pl-5 text-[12px] text-muted-foreground">
              <li>Should we screen for GI blood loss given ferritin depletion?</li>
              <li>Is IV iron indicated if oral therapy fails after 4 weeks?</li>
              <li>Do I need a celiac panel to rule out malabsorption?</li>
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
