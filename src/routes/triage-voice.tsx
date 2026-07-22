import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Card, Badge, PageHeader } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";


export const Route = createFileRoute("/triage-voice")({
  head: () => ({
    meta: [
      { title: "Аудио Сұхбат — Triage Voice · SauBol" },
      { name: "description", content: "Chat-based emergency triage with optional voice dictation and 103 dispatch." },
    ],
  }),
  component: TriageVoice,
});

type Turn = { who: "patient" | "ai"; text: string; time: string; meta?: string };

const INITIAL: Turn[] = [
  { who: "patient", time: "12:41:02", text: "У меня острая боль внизу живота справа и тошнота уже 3 часа...", meta: "voice · 8s" },
  { who: "ai", time: "12:41:04", text: "Понял вас. Боль усиливается при нажатии на этот участок? Есть ли повышение температуры?" },
  { who: "patient", time: "12:41:22", text: "Да, когда нажимаю — резко больно. Температура 38.4.", meta: "voice · 6s" },
  { who: "ai", time: "12:41:24", text: "Симптомы согласуются с картиной острого аппендицита. Пожалуйста, не ешьте и не пейте. Я активирую протокол экстренной помощи." },
];

const LANGS = ["KZ", "RU", "EN"];

function nowStamp() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
}

function aiReply(input: string): string {
  const t = input.toLowerCase();
  if (t.includes("голов") || t.includes("бас")) return "Головная боль отмечена. Как давно она длится и есть ли тошнота или чувствительность к свету?";
  if (t.includes("температ") || t.includes("жар")) return "Повышение температуры зафиксировано. Измерьте её сейчас и сообщите точное значение.";
  if (t.includes("боль") || t.includes("ауыр")) return "Опишите характер боли (тупая/острая) и укажите, усиливается ли она при движении.";
  return "Понял. Расскажите подробнее — когда начались симптомы и что могло их спровоцировать?";
}

function TriageVoice() {
  const [turns, setTurns] = useState<Turn[]>(INITIAL);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState(0);
  const [dictating, setDictating] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const send = (text: string, meta?: string) => {
    if (!text.trim()) return;
    const patient: Turn = { who: "patient", time: nowStamp(), text: text.trim(), meta };
    setTurns((s) => [...s, patient]);
    setInput("");
    setTimeout(() => {
      setTurns((s) => [...s, { who: "ai", time: nowStamp(), text: aiReply(text) }]);
    }, 700);
  };

  const toggleDictation = () => {
    if (!dictating) {
      setDictating(true);
      toast("🎙 Дауыс жазылуда...", { description: "Сөйлеңіз — мәтінге аударылады" });
      setTimeout(() => {
        setDictating(false);
        const sample = "Голова кружится и слабость с утра";
        setInput((s) => (s ? s + " " : "") + sample);
        toast.success("Транскрипция дайын", { description: `+${sample.length} таңба` });
      }, 1800);
    } else {
      setDictating(false);
      toast("⏸ Дауыс жазба тоқтатылды");
    }
  };

  const copyTranscript = () => {
    const text = turns.map(t => `[${t.time}] ${t.who === "ai" ? "SauBol" : "Пациент"}: ${t.text}`).join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    toast.success("Транскрипт көшірілді", { description: `${turns.length} хабарлама` });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Triage Voice · Session #TR-4419"
        title="Emergency Consultation Chat"
        description="Type or dictate symptoms · KZ / RU / EN · triage model v4.2 · latency 220 ms"
        actions={
          <>
            <Badge tone="success">LIVE</Badge>
            <button onClick={() => { const n = (lang + 1) % LANGS.length; setLang(n); toast(`Тіл: ${LANGS[n]}`); }} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground">Lang: {LANGS[lang]}</button>
            <button onClick={copyTranscript} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Transcript</button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Chat */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">Interactive Dialogue</h3>
              <p className="text-[11px] text-muted-foreground">{turns.length} turns · symptom vector locked</p>
            </div>
            <div className="text-[10px] text-muted-foreground">Encrypted E2E · 24h purge</div>
          </div>

          <div ref={feedRef} className="max-h-[520px] space-y-3 overflow-y-auto p-5">
            {turns.map((t, i) => (
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

          {/* Input bar */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5"
            >
              <button
                type="button"
                onClick={toggleDictation}
                aria-label="Voice dictation"
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${dictating ? "border-[color:var(--mint)]/50 bg-[color:var(--mint-soft)] text-[color:var(--mint)] animate-pulse" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}
              >
                🎙
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Симптомды жазыңыз немесе микрофонды басыңыз..."
                className="flex-1 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background disabled:opacity-40"
              >
                Жіберу
              </button>
            </form>
            <div className="mt-2 flex flex-wrap gap-1.5 px-1">
              {["Голова болит", "Температура", "Тошнит", "Боль в груди"].map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground">{q}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          {/* Softened critical risk */}
          <div className="overflow-hidden rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent">
            <div className="flex items-center justify-between border-b border-rose-400/20 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300">Critical Risk</span>
              </div>
              <Badge tone="danger">103 dispatch</Badge>
            </div>
            <div className="p-4">
              <div className="font-serif text-xl leading-tight text-rose-100">Acute Appendicitis Suspected</div>
              <p className="mt-1.5 text-[12px] text-rose-200/70">
                GPS-координаты отправлены в <span className="font-medium text-rose-100">103 · Талдықорған</span>. Не ешьте и не пейте.
              </p>

              <div className="mt-3 grid-bg h-28 overflow-hidden rounded-md border border-rose-400/20 bg-black/30 relative">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_50%,rgba(244,63,94,0.25),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.05),transparent_50%)]" />
                <div className="absolute left-[30%] top-[50%] -translate-x-1/2 -translate-y-1/2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_0_5px_rgba(244,63,94,0.2)]" />
                </div>
                <div className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-2 py-0.5 text-[10px] text-rose-200">
                  45.01° N · 78.37° E
                </div>
                <div className="absolute right-1.5 top-1.5 rounded bg-black/50 px-2 py-0.5 text-[10px] text-rose-200">
                  ETA 6 min
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                {[["Unit","A-14"],["Dispatcher","Almira K."],["Priority","P1"]].map(([l,v]) => (
                  <div key={l} className="rounded-md border border-rose-400/20 bg-rose-500/5 p-2">
                    <div className="uppercase text-rose-300/60">{l}</div>
                    <div className="font-semibold text-rose-100">{v}</div>
                  </div>
                ))}
              </div>

              <button onClick={() => toast.error("📞 103 диспетчерімен байланысу...", { description: "Almira K. · Unit A-14 · ETA 6 min" })} className="mt-3 w-full rounded-full bg-rose-500 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">
                Speak to dispatcher
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
              {["RLQ pain","Rebound tenderness","Nausea","Fever 38.4°C","3h duration","No prior surgery"].map((s) => (
                <Badge key={s} tone="muted">{s}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
