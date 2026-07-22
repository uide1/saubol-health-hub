import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Card, Badge, PageHeader } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";
import { triageChat } from "@/lib/triage-ai.functions";


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
  const recogRef = useRef<any>(null);
  const L1 = useL();


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
    if (dictating) {
      recogRef.current?.stop?.();
      setDictating(false);
      return;
    }
    const SR: any = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) {
      toast.error(L1({ kk: "Дауыс тану қолжетімсіз", ru: "Распознавание речи недоступно", en: "Speech recognition unavailable" }), { description: L1({ kk: "Chrome/Edge браузерін қолданыңыз", ru: "Используйте Chrome/Edge", en: "Use Chrome or Edge" }) });
      return;
    }
    const rec = new SR();
    const langMap = ["kk-KZ", "ru-RU", "en-US"];
    rec.lang = langMap[lang] ?? "ru-RU";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput((finalText + interim).trim());
    };
    rec.onerror = (e: any) => {
      setDictating(false);
      toast.error(L1({ kk: "Дауыс қатесі", ru: "Ошибка микрофона", en: "Mic error" }), { description: e.error ?? "" });
    };
    rec.onend = () => {
      setDictating(false);
      if (finalText.trim()) toast.success(L1({ kk: "Транскрипция дайын", ru: "Транскрипция готова", en: "Transcription ready" }));
    };
    recogRef.current = rec;
    setDictating(true);
    toast(L1({ kk: "🎙 Тыңдап тұрмын...", ru: "🎙 Слушаю...", en: "🎙 Listening..." }));
    try { rec.start(); } catch { /* already started */ }
  };

  const copyTranscript = () => {
    const text = turns.map(t => `[${t.time}] ${t.who === "ai" ? "SauBol" : "Пациент"}: ${t.text}`).join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    toast.success(L1({ kk: "Транскрипт көшірілді", ru: "Транскрипт скопирован", en: "Transcript copied" }), { description: `${turns.length} ${L1({ kk: "хабарлама", ru: "реплик", en: "turns" })}` });
  };


  return (
    <div>
      <PageHeader
        eyebrow={<L kk="Triage Voice · Сессия #TR-4419" ru="Triage Voice · Сессия #TR-4419" en="Triage Voice · Session #TR-4419" />}
        title={<L kk="Жедел кеңес беру чаты" ru="Чат экстренной консультации" en="Emergency Consultation Chat" />}
        description={<L
          kk="Симптомды жазыңыз немесе диктовкамен айтыңыз · KZ / RU / EN · triage v4.2 · latency 220 ms"
          ru="Введите или продиктуйте симптомы · KZ / RU / EN · triage v4.2 · latency 220 ms"
          en="Type or dictate symptoms · KZ / RU / EN · triage model v4.2 · latency 220 ms"
        />}
        actions={
          <>
            <Badge tone="success">LIVE</Badge>
            <button onClick={() => { const n = (lang + 1) % LANGS.length; setLang(n); toast(`${L1({ kk: "Тіл", ru: "Язык", en: "Lang" })}: ${LANGS[n]}`); }} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground">{L1({ kk: "Тіл", ru: "Язык", en: "Lang" })}: {LANGS[lang]}</button>
            <button onClick={copyTranscript} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">{L1({ kk: "Транскрипт", ru: "Транскрипт", en: "Transcript" })}</button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Chat */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">
                <L kk="Интерактивті диалог" ru="Интерактивный диалог" en="Interactive Dialogue" />
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {turns.length} <L kk="хабарлама · симптом векторы бекітілді" ru="реплик · симптомный вектор зафиксирован" en="turns · symptom vector locked" />
              </p>
            </div>
            <div className="text-[10px] text-muted-foreground"><L kk="Шифрлеу E2E · 24сағ өшіру" ru="Шифрование E2E · очистка 24ч" en="Encrypted E2E · 24h purge" /></div>
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
                placeholder={L1({ kk: "Симптомды жазыңыз немесе микрофонды басыңыз...", ru: "Опишите симптом или нажмите на микрофон...", en: "Type a symptom or tap the mic..." })}
                className="flex-1 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background disabled:opacity-40"
              >
                <L kk="Жіберу" ru="Отправить" en="Send" />
              </button>
            </form>
            <div className="mt-2 flex flex-wrap gap-1.5 px-1">
              {[
                L1({ kk: "Басым ауырады", ru: "Голова болит", en: "Headache" }),
                L1({ kk: "Температура", ru: "Температура", en: "Fever" }),
                L1({ kk: "Жүрегім айниды", ru: "Тошнит", en: "Nausea" }),
                L1({ kk: "Кеудеде ауырсыну", ru: "Боль в груди", en: "Chest pain" }),
              ].map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground">{q}</button>
              ))}
            </div>

          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          {/* Compact critical risk — neutral tone */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--mint)]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <L kk="Критикалық қауіп" ru="Критический риск" en="Critical Risk" />
                </span>
              </div>
              <Badge tone="solid">103</Badge>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                {[
                  [L1({ kk: "Экипаж", ru: "Экипаж", en: "Unit" }), "A-14"],
                  [L1({ kk: "Диспетчер", ru: "Диспетчер", en: "Dispatcher" }), "Almira K."],
                  [L1({ kk: "Басымдық", ru: "Приоритет", en: "Priority" }), "P1"],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-md border border-border bg-surface p-2">
                    <div className="uppercase tracking-wider text-muted-foreground">{l}</div>
                    <div className="mt-0.5 font-semibold text-foreground">{v}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => toast(L1({ kk: "📞 103 диспетчерімен байланысу...", ru: "📞 Связь с диспетчером 103...", en: "📞 Connecting to dispatcher..." }), { description: "Almira K. · Unit A-14 · ETA 6 min" })} className="mt-3 w-full rounded-full bg-foreground py-2 text-sm font-semibold text-background transition hover:opacity-90">
                <L kk="Диспетчермен сөйлесу" ru="Связаться с диспетчером" en="Speak to dispatcher" />
              </button>
            </div>
          </div>

          <Card title={L1({ kk: "Үй жағдайында көмек", ru: "Помощь дома", en: "Home Care Guidance" })} subtitle={L1({ kk: "Жеңіл жағдайлар үшін", ru: "Только при лёгких симптомах", en: "Applicable to mild presentations only" })}>
            <ol className="list-decimal space-y-1.5 pl-5 text-[12px] text-muted-foreground">
              <li>Lie on your left side, knees drawn to chest.</li>
              <li>Do not apply heat to the abdomen.</li>
              <li>No food, drink, or painkillers before EMS.</li>
              <li>Unlock the door for paramedic access.</li>
              <li>Keep phone on speaker within reach.</li>
            </ol>
          </Card>

          <Card title={L1({ kk: "Анықталған симптомдар", ru: "Обнаруженные симптомы", en: "Detected Symptom Vector" })}>
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
