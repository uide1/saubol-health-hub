import { createFileRoute } from "@tanstack/react-router";
import { Card, Badge, PageHeader, Accordion } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/triage-voice")({
  head: () => ({
    meta: [
      { title: "Аудио Сұхбат — Triage Voice · SauBol" },
      { name: "description", content: "Voice-driven emergency triage with automatic 103 dispatch." },
    ],
  }),
  component: TriageVoice,
});

type Turn = { who: "patient" | "ai"; text: string; time: string };
const TURNS_PREVIEW: Turn[] = [
  { who: "patient", time: "12:41", text: "Резкая боль справа внизу живота, температура 38.4..." },
  { who: "ai", time: "12:41", text: "Симптомы согласуются с острым аппендицитом. Активирую 103." },
];
const TURNS_FULL: Turn[] = [
  { who: "patient", time: "12:41:02", text: "У меня острая боль внизу живота справа и тошнота уже 3 часа..." },
  { who: "ai", time: "12:41:04", text: "Понял вас. Боль усиливается при нажатии на этот участок? Есть ли температура?" },
  { who: "patient", time: "12:41:22", text: "Да, когда нажимаю — резко больно. Температура 38.4." },
  { who: "ai", time: "12:41:24", text: "Симптомы согласуются с картиной острого аппендицита. Не ешьте и не пейте." },
  { who: "patient", time: "12:41:47", text: "Мне очень плохо, я один дома..." },
  { who: "ai", time: "12:41:49", text: "Отправил ваши GPS-координаты в службу 103. Оставайтесь на связи." },
];

function TriageVoice() {
  const t = useT();
  return (
    <div>
      <PageHeader
        eyebrow={t("voice.eyebrow")}
        title={t("voice.title")}
        description={t("voice.desc")}
        actions={<Badge tone="danger">LIVE</Badge>}
      />

      {/* HERO — Voice Orb */}
      <section className="mb-8">
        <div className="grid-bg flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/40 px-6 py-14">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-white/5" />
            <div className="absolute -inset-6 rounded-full border border-white/10" />
            <div className="absolute -inset-12 rounded-full border border-white/5" />
            <div className="relative grid h-36 w-36 place-items-center rounded-full border border-border bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-[0_0_60px_-10px_rgba(255,255,255,0.15)]">
              <span className="text-4xl">🎤</span>
            </div>
          </div>
          <div className="mt-8 flex items-end gap-1 h-8">
            {[8,14,22,30,18,26,32,24,16,28,20,12,24,30,22,16,10,20,26,18].map((h, i) => (
              <span key={i} className="w-1 rounded-full bg-foreground/70" style={{ height: `${h}px` }} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="text-base font-medium text-foreground">{t("voice.tap")}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{t("voice.rec")}</div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">{t("voice.pause")}</button>
            <span className="text-[11px] text-muted-foreground">Encrypted E2E · session auto-purges 24h</span>
          </div>
        </div>
      </section>

      {/* SIDE PANELS */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <Card title={t("voice.dialogue")} subtitle="Symptom vector locked · 6 turns">
          <div className="space-y-3">
            {TURNS_PREVIEW.map((t2, i) => (
              <div key={i} className={`flex gap-3 ${t2.who === "ai" ? "" : "flex-row-reverse text-right"}`}>
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-xs ${t2.who === "ai" ? "bg-foreground text-background" : "bg-surface text-foreground"}`}>
                  {t2.who === "ai" ? "S" : "👤"}
                </div>
                <div className={`max-w-[80%] rounded-lg border border-border px-3 py-2 ${t2.who === "ai" ? "bg-surface" : "bg-secondary"}`}>
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{t2.who === "ai" ? "SauBol AI" : "Patient"} · {t2.time}</div>
                  <p className="text-[13px] leading-relaxed text-foreground">{t2.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Accordion>
            <div className="space-y-3">
              {TURNS_FULL.map((t2, i) => (
                <div key={i} className={`flex gap-3 ${t2.who === "ai" ? "" : "flex-row-reverse text-right"}`}>
                  <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-[10px] ${t2.who === "ai" ? "bg-foreground text-background" : "bg-surface text-foreground"}`}>
                    {t2.who === "ai" ? "S" : "P"}
                  </div>
                  <div className="max-w-[80%]">
                    <div className="mb-0.5 text-[10px] uppercase tracking-wider">{t2.who} · {t2.time}</div>
                    <p className="text-[12px] leading-relaxed text-foreground">{t2.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Accordion>
        </Card>

        <div className="overflow-hidden rounded-xl border border-red-900/60 bg-red-950/30">
          <div className="flex items-center justify-between border-b border-red-900/60 bg-red-950/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-300">{t("voice.emergency")}</span>
            </div>
            <Badge tone="danger">103 DISPATCH</Badge>
          </div>
          <div className="p-5">
            <div className="text-lg font-semibold text-red-200">Acute Appendicitis Suspected</div>
            <p className="mt-1 text-[12px] text-red-200/80">{t("voice.dispatched")} — 103 Ambulance · Taldykorgan.</p>

            <div className="mt-4 grid-bg h-32 overflow-hidden rounded-md border border-red-900/60 bg-black/40 relative">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_50%,rgba(220,38,38,0.35),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.05),transparent_50%)]" />
              <div className="absolute left-[30%] top-[50%] -translate-x-1/2 -translate-y-1/2">
                <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_0_6px_rgba(220,38,38,0.25)]" />
              </div>
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] text-red-200">45.0154° N · 78.3728° E</div>
              <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] text-red-200">ETA 6 min</div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="rounded-md border border-red-900/60 bg-red-950/40 p-2">
                <div className="uppercase text-red-300/70">Unit</div>
                <div className="font-semibold text-red-200">A-14</div>
              </div>
              <div className="rounded-md border border-red-900/60 bg-red-950/40 p-2">
                <div className="uppercase text-red-300/70">Dispatcher</div>
                <div className="font-semibold text-red-200">Almira K.</div>
              </div>
              <div className="rounded-md border border-red-900/60 bg-red-950/40 p-2">
                <div className="uppercase text-red-300/70">Priority</div>
                <div className="font-semibold text-red-200">P1</div>
              </div>
            </div>

            <button className="mt-4 w-full rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500">Speak to dispatcher</button>
          </div>
        </div>
      </section>
    </div>
  );
}
