import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Badge, PageHeader } from "@/components/ui-kit";

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

const CURRENT = ["Aspirin 75 mg", "Ibuprofen 400 mg", "Warfarin 5 mg", "Metformin 850 mg"];

function PrescriptionRx() {
  const [current, setCurrent] = useState<string[]>(["Aspirin 75 mg", "Ibuprofen 400 mg", "Warfarin 5 mg", "Metformin 850 mg"]);
  const [synced, setSynced] = useState(false);
  const [replaced, setReplaced] = useState(false);

  const addDrug = () => {
    const name = window.prompt("Дәрі атауы (мысалы: Losartan 50 mg)");
    if (!name) return;
    setCurrent((s) => [...s, name.trim()]);
    toast.success(`+ ${name} қосылды`, { description: "Өзара әрекет тексерілуде..." });
  };
  const removeDrug = (n: string) => { setCurrent((s) => s.filter(x => x !== n)); toast(`${n} алынды`); };

  return (
    <div>
      <PageHeader
        eyebrow="RxClarify · Rx № 2026-0472"
        title="Prescription Decoder & Safety"
        description="Handwriting decoded · 7 medications · 2 interaction flags · pharmacist-verified schedule"
        actions={
          <>
            <button onClick={() => toast.info("📸 Рецепт суретін жүктеңіз", { description: "OCR модельі жазуды тануға дайын" })} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Upload photo</button>
            <button onClick={() => { setSynced(true); toast.success(synced ? "Apple Health-пен қайта синхрондалды" : "✓ Apple Health-ке синхрондалды", { description: "7 дәрі-дәрмек кестесі экспортталды" }); }} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{synced ? "Synced ✓" : "Sync to Apple Health"}</button>
          </>
        }
      />


      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          <Card title="Deciphered Prescription" subtitle="Dr. Nurlan T. · Polyclinic №3 · handwriting confidence 96.2%">
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <div className="grid-bg grid h-40 place-items-center rounded-md border border-border bg-surface text-xs text-muted-foreground">
                Rx image
              </div>
              <div className="space-y-2">
                {[
                  ["Paracetamol", "500 mg · 1 tab · 3× daily · after meals · 5 days"],
                  ["Amoxicillin", "500 mg · 1 cap · 2× daily · with food · 7 days"],
                  ["Omeprazole", "20 mg · 1 cap · once daily · morning · 14 days"],
                  ["Ferrous bisglycinate", "25 mg · 2× daily · with vit C · 8 weeks"],
                  ["Vitamin D3", "4000 IU · 1× daily · with fats"],
                  ["Melatonin", "3 mg · at bedtime · as needed"],
                  ["Loratadine", "10 mg · 1× daily · as needed"],
                ].map(([n, d]) => (
                  <div key={n} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-[12px]">
                    <div>
                      <div className="font-medium text-foreground">{n}</div>
                      <div className="text-[11px] text-muted-foreground">{d}</div>
                    </div>
                    <Badge tone="success">Verified</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Visual Daily Schedule" subtitle="Timezone Asia/Almaty · adherence 92% this week">
            <div className="relative">
              <div className="grid gap-px text-[9px] text-muted-foreground" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="border-l border-border pl-1 pb-1">{h.toString().padStart(2, "0")}</div>
                ))}
              </div>
              <div className="relative mt-1 h-16 rounded-md border border-border bg-surface">
                {SCHEDULE.map((s) => {
                  const [hh, mm] = s.time.split(":").map(Number);
                  const left = ((hh + mm / 60) / 24) * 100;
                  const color = s.tone === "success" ? "bg-emerald-500" : s.tone === "warning" ? "bg-amber-500" : "bg-foreground";
                  return (
                    <div key={s.time} className="absolute top-0 h-full" style={{ left: `${left}%` }}>
                      <div className={`h-full w-[3px] ${color}`} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-1.5">
                {SCHEDULE.map((s) => (
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
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Currently Taken Medications" subtitle="Add drugs to test against your prescription">
            <div className="flex flex-wrap gap-2">
              {current.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[12px] text-foreground">
                  {c}
                  <button onClick={() => removeDrug(c)} className="text-muted-foreground hover:text-foreground">×</button>
                </span>
              ))}
              <button onClick={addDrug} className="rounded-md border border-dashed border-border px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground">+ Add drug</button>
            </div>
          </Card>

          <div className="overflow-hidden rounded-xl border border-red-900/60 bg-red-950/25">
            <div className="flex items-center justify-between border-b border-red-900/60 bg-red-950/50 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-red-300">Toxic Combination</span>
              </div>
              <Badge tone="danger">Do not take</Badge>
            </div>
            <div className="p-4">
              <div className="text-sm font-semibold text-red-200">Aspirin ⚡ Ibuprofen — Severe interaction</div>
              <p className="mt-1 text-[12px] text-red-200/80">
                Concurrent use dramatically increases the risk of gastric mucosal erosion and upper GI bleeding.
                In your profile (Warfarin co-therapy), the bleeding risk becomes life-threatening.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
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
              <button className="mt-3 w-full rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500">
                Replace with safer alternative
              </button>
            </div>
          </div>

          <Card title="Additional Interaction Flags">
            {[
              { a: "Warfarin", b: "Amoxicillin", sev: "Moderate", tone: "warning" as const, note: "May potentiate INR — monitor within 48h" },
              { a: "Omeprazole", b: "Iron supplement", sev: "Minor", tone: "warning" as const, note: "Reduces iron absorption — separate by 4h" },
              { a: "Metformin", b: "Alcohol", sev: "Moderate", tone: "warning" as const, note: "Lactic acidosis risk if intake exceeds 2 units/day" },
              { a: "Melatonin", b: "Warfarin", sev: "Minor", tone: "muted" as const, note: "Theoretical INR shift — clinically silent" },
            ].map((i) => (
              <div key={`${i.a}-${i.b}`} className="flex items-center justify-between border-t border-border py-2 first:border-t-0 text-[12px]">
                <div>
                  <div className="font-medium text-foreground">{i.a} <span className="text-muted-foreground">↔</span> {i.b}</div>
                  <div className="text-[11px] text-muted-foreground">{i.note}</div>
                </div>
                <Badge tone={i.tone}>{i.sev}</Badge>
              </div>
            ))}
          </Card>

          <Card title="Refill & Cost" subtitle="Nearest pharmacy · Europharma Taldykorgan">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-border bg-surface p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Refill in</div>
                <div className="mt-1 text-sm font-semibold text-foreground">4 days</div>
              </div>
              <div className="rounded-md border border-border bg-surface p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Est. cost</div>
                <div className="mt-1 text-sm font-semibold text-foreground">₸ 8,420</div>
              </div>
              <div className="rounded-md border border-border bg-surface p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Coverage</div>
                <div className="mt-1 text-sm font-semibold text-emerald-400">72%</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
