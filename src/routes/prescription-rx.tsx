import { createFileRoute } from "@tanstack/react-router";
import { Card, Badge, PageHeader, Accordion } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/prescription-rx")({
  head: () => ({
    meta: [
      { title: "Дәрілер — RxClarify · SauBol" },
      { name: "description", content: "Prescription OCR, daily schedule, and drug-drug interaction safety." },
    ],
  }),
  component: PrescriptionRx,
});

const SCHEDULE = [
  { time: "08:00", drug: "Paracetamol 500 mg", note: "After breakfast", tone: "muted" as const },
  { time: "09:00", drug: "Ferrous bisglycinate 25 mg", note: "With vitamin C", tone: "success" as const },
  { time: "13:00", drug: "Amoxicillin 500 mg", note: "With meal", tone: "muted" as const },
  { time: "15:00", drug: "Omeprazole 20 mg", note: "Before lunch", tone: "warning" as const },
  { time: "19:00", drug: "Amoxicillin 500 mg", note: "With meal", tone: "muted" as const },
  { time: "21:00", drug: "Vitamin D3 4000 IU", note: "With fats", tone: "success" as const },
  { time: "22:30", drug: "Melatonin 3 mg", note: "Before sleep", tone: "muted" as const },
];

function PrescriptionRx() {
  const t = useT();
  return (
    <div>
      <PageHeader
        eyebrow={t("rx.eyebrow")}
        title={t("rx.title")}
        description={t("rx.desc")}
      />

      {/* HERO — Upload Rx */}
      <section className="mb-8">
        <div className="grid-bg flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-xl border border-border bg-surface text-xl text-muted-foreground">℞</div>
          <div className="mt-4 text-base font-medium text-foreground">{t("rx.drop")}</div>
          <div className="mt-1 text-xs text-muted-foreground">{t("rx.dropSub")}</div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">{t("common.upload")}</button>
            <Badge tone="success">7 drugs decoded</Badge>
            <Badge tone="warning">2 interactions</Badge>
          </div>
        </div>
      </section>

      {/* SCHEDULE + INTERACTION */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card title={t("rx.schedule")} subtitle="Asia/Almaty · adherence 92% this week">
          {/* Timeline ruler */}
          <div className="grid text-[9px] text-muted-foreground" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="border-l border-border pl-1">{h.toString().padStart(2, "0")}</div>
            ))}
          </div>
          <div className="relative mt-1 h-14 rounded-md border border-border bg-surface">
            {SCHEDULE.map((s) => {
              const [hh, mm] = s.time.split(":").map(Number);
              const left = ((hh + mm / 60) / 24) * 100;
              const color = s.tone === "success" ? "bg-emerald-500" : s.tone === "warning" ? "bg-amber-500" : "bg-foreground";
              return (
                <div key={s.time} className="absolute top-0 h-full" style={{ left: `${left}%` }}>
                  <div className={`h-full w-[3px] ${color}`} />
                  <div className="absolute top-full mt-1 -translate-x-1/2 text-[9px] tabular-nums text-muted-foreground">{s.time}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 space-y-1.5">
            {SCHEDULE.slice(0, 4).map((s) => (
              <div key={s.time} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-[12px]">
                <div className="tabular-nums font-mono text-muted-foreground">{s.time}</div>
                <div>
                  <div className="font-medium text-foreground">{s.drug}</div>
                  <div className="text-[11px] text-muted-foreground">{s.note}</div>
                </div>
                <Badge tone={s.tone}>{s.tone === "success" ? "Safe" : s.tone === "warning" ? "Watch" : "Scheduled"}</Badge>
              </div>
            ))}
          </div>

          <Accordion>
            <div className="space-y-1.5">
              {SCHEDULE.slice(4).map((s) => (
                <div key={s.time} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-[12px]">
                  <div className="tabular-nums font-mono text-muted-foreground">{s.time}</div>
                  <div>
                    <div className="font-medium text-foreground">{s.drug}</div>
                    <div className="text-[11px] text-muted-foreground">{s.note}</div>
                  </div>
                  <Badge tone={s.tone}>{s.tone === "success" ? "Safe" : s.tone === "warning" ? "Watch" : "Scheduled"}</Badge>
                </div>
              ))}
            </div>
          </Accordion>
        </Card>

        <div className="overflow-hidden rounded-xl border border-red-900/60 bg-red-950/25">
          <div className="flex items-center justify-between border-b border-red-900/60 bg-red-950/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-300">{t("rx.interaction")}</span>
            </div>
            <Badge tone="danger">Do not take</Badge>
          </div>
          <div className="p-5">
            <div className="text-sm font-semibold text-red-200">Aspirin ⚡ Ibuprofen</div>
            <p className="mt-1 text-[12px] text-red-200/80">{t("rx.toxic")}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="rounded-md border border-red-900/60 bg-red-950/40 p-2">
                <div className="uppercase text-red-300/70">Severity</div>
                <div className="font-semibold text-red-200">Major</div>
              </div>
              <div className="rounded-md border border-red-900/60 bg-red-950/40 p-2">
                <div className="uppercase text-red-300/70">Evidence</div>
                <div className="font-semibold text-red-200">A · RCT</div>
              </div>
              <div className="rounded-md border border-red-900/60 bg-red-950/40 p-2">
                <div className="uppercase text-red-300/70">Onset</div>
                <div className="font-semibold text-red-200">Rapid</div>
              </div>
            </div>

            <Accordion>
              <ul className="space-y-2">
                {[
                  { a: "Warfarin", b: "Amoxicillin", note: "May potentiate INR — monitor within 48h", sev: "Moderate" },
                  { a: "Omeprazole", b: "Iron supplement", note: "Reduces iron absorption — separate by 4h", sev: "Minor" },
                  { a: "Metformin", b: "Alcohol", note: "Lactic acidosis if >2 units/day", sev: "Moderate" },
                ].map((i) => (
                  <li key={`${i.a}-${i.b}`} className="flex items-center justify-between text-[12px]">
                    <div>
                      <div className="font-medium text-foreground">{i.a} ↔ {i.b}</div>
                      <div className="text-[11px]">{i.note}</div>
                    </div>
                    <Badge tone="warning">{i.sev}</Badge>
                  </li>
                ))}
              </ul>
            </Accordion>

            <button className="mt-4 w-full rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500">Replace with safer alternative</button>
          </div>
        </div>
      </section>
    </div>
  );
}
