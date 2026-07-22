import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Badge, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/triage-voice")({
  head: () => ({
    meta: [
      { title: "Аудио Сұхбат — Triage Voice · SauBol" },
      { name: "description", content: "Voice-driven emergency triage with automatic 103 dispatch." },
    ],
  }),
  component: TriageVoice,
});

type Turn = { who: "patient" | "ai"; text: string; time: string; meta?: string };
const TURNS: Turn[] = [
  { who: "patient", time: "12:41:02", text: "У меня острая боль внизу живота справа и тошнота уже 3 часа...", meta: "voice · 8s" },
  { who: "ai", time: "12:41:04", text: "Понял вас. Боль усиливается при нажатии на этот участок? Есть ли повышение температуры?" },
  { who: "patient", time: "12:41:22", text: "Да, когда нажимаю — резко больно. Температура 38.4.", meta: "voice · 6s" },
  { who: "ai", time: "12:41:24", text: "Симптомы согласуются с картиной острого аппендицита. Пожалуйста, не ешьте и не пейте. Я активирую протокол экстренной помощи." },
  { who: "patient", time: "12:41:47", text: "Мне очень плохо, я один дома...", meta: "voice · 4s" },
  { who: "ai", time: "12:41:49", text: "Я уже отправил ваши GPS-координаты в службу 103. Оставайтесь на связи, помощь в пути." },
];

const LANGS = ["KZ", "RU", "EN"];
const VOICES = ["Aigerim", "Dana", "Alua"];

function TriageVoice() {
  const [recording, setRecording] = useState(true);
  const [lang, setLang] = useState(0);
  const [voice, setVoice] = useState(0);
  const copyTranscript = () => {
    const text = TURNS.map(t => `[${t.time}] ${t.who === "ai" ? "SauBol" : "Пациент"}: ${t.text}`).join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    toast.success("Транскрипт көшірілді", { description: `${TURNS.length} хабарлама алмасу буферінде` });
  };
  return (
    <div>
      <PageHeader
        eyebrow="Triage Voice · Session #TR-4419"
        title="Emergency Voice Consultation"
        description="Live symptom capture · KZ / RU / EN · triage model v4.2 · latency 220 ms"
        actions={
          <>
            <Badge tone={recording ? "danger" : "muted"}>{recording ? "LIVE" : "PAUSED"}</Badge>
            <button onClick={copyTranscript} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Transcript</button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Voice orb */}
          <Card>
            <div className="grid-bg -m-5 mb-0 flex flex-col items-center justify-center rounded-t-xl border-b border-border px-6 py-10">
              <div className="relative">
                {recording && <div className="absolute inset-0 animate-ping rounded-full bg-white/5" />}
                <div className="absolute -inset-6 rounded-full border border-white/10" />
                <div className="absolute -inset-12 rounded-full border border-white/5" />
                <button onClick={() => { setRecording(r => !r); toast(recording ? "⏸ Жазба тоқтатылды" : "🔴 Жазба жалғасуда"); }} className="relative grid h-32 w-32 place-items-center rounded-full border border-border bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-[0_0_60px_-10px_rgba(255,255,255,0.15)] transition hover:scale-105">
                  <span className="text-3xl">{recording ? "🎤" : "⏸"}</span>
                </button>
              </div>
              <div className="mt-6 flex items-end gap-1 h-8">
                {[8,14,22,30,18,26,32,24,16,28,20,12,24,30,22,16,10,20,26,18].map((h, i) => (
                  <span key={i} className={`w-1 rounded-full bg-foreground/70 ${recording ? "animate-pulse" : "opacity-40"}`} style={{ height: `${h}px`, animationDelay: `${i * 40}ms` }} />
                ))}
              </div>
              <div className="mt-4 text-sm font-medium text-foreground">{recording ? "Хотите сказать симптом? Нажмите и говорите" : "Жазба кідіртілді — жалғастыру үшін басыңыз"}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{recording ? "Recording · 00:47" : "Paused"} · {LANGS[lang]} detected</div>
            </div>
            <div className="flex items-center justify-between pt-5">
              <div className="flex items-center gap-2">
                <button onClick={() => { setRecording(r => !r); toast(recording ? "⏸ Кідіртілді" : "▶ Жалғастырылды"); }} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{recording ? "Pause" : "Resume"}</button>
                <button onClick={() => { const n = (lang + 1) % LANGS.length; setLang(n); toast(`Тіл: ${LANGS[n]}`); }} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground">Language: {LANGS[lang]}</button>
                <button onClick={() => { const n = (voice + 1) % VOICES.length; setVoice(n); toast(`Дауыс: ${VOICES[n]}`); }} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground">Voice: {VOICES[voice]}</button>
              </div>
              <div className="text-[11px] text-muted-foreground">Encrypted E2E · session auto-purges in 24h</div>
            </div>
          </Card>

          {/* Dialogue feed */}
          <Card title="Interactive Dialogue Feed" subtitle="6 turns · symptom vector locked">
            <div className="space-y-3">
              {TURNS.map((t, i) => (
                <div key={i} className={`flex gap-3 ${t.who === "ai" ? "" : "flex-row-reverse text-right"}`}>
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-xs ${t.who === "ai" ? "bg-foreground text-background" : "bg-surface text-foreground"}`}>
                    {t.who === "ai" ? "S" : "👤"}
                  </div>
                  <div className={`max-w-[80%] rounded-lg border border-border px-3 py-2 ${t.who === "ai" ? "bg-surface" : "bg-secondary"}`}>
                    <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>{t.who === "ai" ? "SauBol AI" : "Patient"}</span>
                      <span>·</span>
                      <span className="tabular-nums">{t.time}</span>
                      {t.meta && <><span>·</span><span>{t.meta}</span></>}
                    </div>
                    <p className="text-[13px] leading-relaxed text-foreground">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Critical alert */}
          <div className="overflow-hidden rounded-xl border border-red-900/60 bg-red-950/30">
            <div className="flex items-center justify-between border-b border-red-900/60 bg-red-950/50 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-red-300">Critical Risk</span>
              </div>
              <Badge tone="danger">103 DISPATCH</Badge>
            </div>
            <div className="p-4">
              <div className="text-lg font-semibold text-red-200">Acute Appendicitis Suspected</div>
              <p className="mt-1 text-[12px] text-red-200/80">
                Auto-dispatching GPS coordinates to <span className="font-semibold">103 Ambulance Service · Taldykorgan</span>. Do not eat or drink. Stay on the line.
              </p>

              <div className="mt-3 grid-bg h-32 overflow-hidden rounded-md border border-red-900/60 bg-black/40 relative">
                {/* mock map */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_50%,rgba(220,38,38,0.35),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.05),transparent_50%)]" />
                <div className="absolute left-[30%] top-[50%] -translate-x-1/2 -translate-y-1/2">
                  <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_0_6px_rgba(220,38,38,0.25)]" />
                </div>
                <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] text-red-200">
                  45.0154° N · 78.3728° E · ±8 m
                </div>
                <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] text-red-200">
                  ETA 6 min
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
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

              <button onClick={() => toast.error("📞 103 диспетчерімен байланысу...", { description: "Almira K. · Unit A-14 · ETA 6 min" })} className="mt-3 w-full rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500">
                Speak to dispatcher now
              </button>
            </div>
          </div>

          <Card title="Home Care Guidance" subtitle="Applicable to mild presentations only">
            <ol className="list-decimal space-y-1.5 pl-5 text-[12px] text-muted-foreground">
              <li>Lie on your left side, knees drawn to chest.</li>
              <li>Do not apply heat to the abdomen.</li>
              <li>No food, drink, or painkillers before EMS.</li>
              <li>Unlock the door for paramedic access.</li>
              <li>Keep phone on speaker within reach.</li>
            </ol>
          </Card>

          <Card title="Detected Symptom Vector">
            <div className="flex flex-wrap gap-1.5">
              {["Right lower quadrant pain","Rebound tenderness","Nausea","Fever 38.4°C","3h duration","No prior surgery"].map((s) => (
                <Badge key={s} tone="muted">{s}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
