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
  const [thinking, setThinking] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const recogRef = useRef<any>(null);
  const L1 = useL();


  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  const send = async (text: string, meta?: string) => {
    if (!text.trim() || thinking) return;
    const patient: Turn = { who: "patient", time: nowStamp(), text: text.trim(), meta };
    const nextTurns = [...turns, patient];
    setTurns(nextTurns);
    setInput("");
    setThinking(true);
    try {
      const langCode = (["kk", "ru", "en"] as const)[lang];
      const messages = nextTurns.map((t) => ({
        role: (t.who === "ai" ? "assistant" : "user") as "assistant" | "user",
        content: t.text,
      }));
      const { text: reply } = await triageChat({ data: { messages, lang: langCode } });
      setTurns((s) => [...s, { who: "ai", time: nowStamp(), text: reply }]);
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? "");
      const is402 = msg.includes("402");
      const is429 = msg.includes("429");
      toast.error(
        is402
          ? L1({ kk: "AI лимиті таусылды", ru: "Кредиты AI исчерпаны", en: "AI credits exhausted" })
          : is429
            ? L1({ kk: "Тым көп сұрау", ru: "Слишком много запросов", en: "Too many requests" })
            : L1({ kk: "AI қатесі", ru: "Ошибка AI", en: "AI error" }),
      );
      setTurns((s) => [
        ...s,
        { who: "ai", time: nowStamp(), text: L1({ kk: "Кешіріңіз, қазір жауап бере алмаймын. Қайталап көріңіз.", ru: "Извините, сейчас не могу ответить. Попробуйте ещё раз.", en: "Sorry, I can't respond right now. Please try again." }) },
      ]);
    } finally {
      setThinking(false);
    }
  };

  // ignore reference below
  void aiReply;

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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-foreground"><span className="live-dot" /> LIVE</span>
            <button onClick={() => { const n = (lang + 1) % LANGS.length; setLang(n); toast(`${L1({ kk: "Тіл", ru: "Язык", en: "Lang" })}: ${LANGS[n]}`); }} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground">{L1({ kk: "Тіл", ru: "Язык", en: "Lang" })}: {LANGS[lang]}</button>
            <button onClick={copyTranscript} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">{L1({ kk: "Транскрипт", ru: "Транскрипт", en: "Transcript" })}</button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* LEFT — Voice orb + session + 103 + symptoms */}
        <div className="space-y-4">
          {/* Voice Orb card */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5">
            <div className="aurora opacity-40" />
            <div className="relative flex flex-col items-center">
              <div className="relative grid h-[220px] w-[220px] place-items-center">
                {/* pulse rings */}
                <span className={`absolute inset-0 rounded-full border border-white/15 ${dictating ? "orb-pulse" : ""}`} />
                <span className={`absolute inset-3 rounded-full border border-white/10 ${dictating ? "orb-pulse" : ""}`} style={{ animationDelay: "0.6s" }} />
                <span className={`absolute inset-6 rounded-full border border-white/5 ${dictating ? "orb-pulse" : ""}`} style={{ animationDelay: "1.2s" }} />
                {/* orb */}
                <div className="relative grid h-[150px] w-[150px] place-items-center rounded-full"
                     style={{ background: "radial-gradient(circle at 35% 30%, #4b5563, #1f2937 70%, #0b0f14 100%)", boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                  <div className="flex items-end gap-1 h-10">
                    {[0.4, 0.9, 0.55, 1, 0.65].map((h, i) => (
                      <span key={i} className="spark-bar w-1.5 rounded-full bg-white/70"
                            style={{ height: `${h * 100}%`, animationDelay: `${i * 0.12}s`, animationIterationCount: dictating ? "infinite" as any : 1, animationDirection: "alternate" }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex w-full items-center gap-2 text-[11px] text-muted-foreground">
                <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-foreground/60" style={{ width: `${Math.min(100, turns.length * 12)}%` }} />
                </div>
                <span className="tabular-nums">{turns.length} <L kk="turn" ru="turn" en="turn" /></span>
              </div>
            </div>
          </div>

          {/* 103 dispatch — compact */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <L kk="103 диспетчер" ru="103 диспетчер" en="103 Dispatch" />
                </span>
              </div>
              <Badge tone="solid">P1</Badge>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  [L1({ kk: "Экипаж", ru: "Экипаж", en: "Unit" }), "A-14"],
                  [L1({ kk: "ETA", ru: "ETA", en: "ETA" }), "6 min"],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-md border border-border bg-surface p-2">
                    <div className="uppercase tracking-wider text-muted-foreground">{l}</div>
                    <div className="mt-0.5 text-sm font-semibold text-foreground">{v}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => toast(L1({ kk: "📞 103 диспетчерімен байланысу...", ru: "📞 Связь с диспетчером 103...", en: "📞 Connecting to dispatcher..." }), { description: "Almira K. · Unit A-14 · ETA 6 min" })} className="mt-2 w-full rounded-full bg-foreground py-2 text-xs font-semibold text-background transition hover:opacity-90">
                <L kk="Диспетчер" ru="Связаться" en="Call dispatch" />
              </button>
            </div>
          </div>

          {/* Detected symptoms */}
          <Card title={L1({ kk: "Симптомдар", ru: "Симптомы", en: "Symptoms" })}>
            <div className="flex flex-wrap gap-1.5">
              {["RLQ pain", "Rebound", "Nausea", "38.4°C", "3h"].map((s) => (
                <Badge key={s} tone="muted">{s}</Badge>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT — Chat with aurora + floating bubbles + sticky composer */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <div className="aurora opacity-30" />

          {/* header */}
          <div className="relative flex items-center justify-between border-b border-border/60 px-5 py-3 backdrop-blur-md">
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

          {/* messages */}
          <div ref={feedRef} className="relative max-h-[560px] space-y-4 overflow-y-auto px-5 py-6">
            {turns.map((t, i) => {
              const isAi = t.who === "ai";
              return (
                <div key={i} className={`flex items-end gap-2 animate-fade-in ${isAi ? "" : "flex-row-reverse"}`}>
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${isAi ? "bg-[color:var(--mint)] text-background mint-glow" : "border border-border bg-surface text-foreground"}`}>
                    {isAi ? "S" : "👤"}
                  </div>
                  <div className={`relative max-w-[68%] rounded-[22px] px-4 py-2.5 backdrop-blur-md ${
                    isAi
                      ? "border border-white/8 bg-card/70 rounded-bl-md"
                      : "border border-[color:var(--mint)]/25 bg-[color:var(--mint-soft)] rounded-br-md max-w-[62%]"
                  }`}>
                    <div className={`mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground ${isAi ? "" : "flex-row-reverse"}`}>
                      <span>{isAi ? "SauBol AI" : "Patient"}</span>
                      <span>·</span>
                      <span className="tabular-nums">{t.time}</span>
                      {t.meta && <><span>·</span><span>{t.meta}</span></>}
                    </div>
                    <p className={`text-[13px] leading-relaxed text-foreground ${isAi ? "" : "text-right"}`}>{t.text}</p>
                  </div>
                </div>
              );
            })}
            {thinking && (
              <div className="flex items-end gap-2 animate-fade-in">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--mint)] text-[11px] font-semibold text-background mint-glow">S</div>
                <div className="rounded-[22px] rounded-bl-md border border-white/8 bg-card/70 px-4 py-2.5 backdrop-blur-md">
                  <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    SauBol AI · <span className="shimmer-text">{L1({ kk: "ойлануда", ru: "думает", en: "thinking" })}</span>
                  </div>
                  <div className="shimmer-bar h-1 w-32 rounded-full" />
                </div>
              </div>
            )}
          </div>

          {/* sticky composer */}
          <div className="relative px-4 pb-4 pt-2">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-3 rounded-full border border-white/10 bg-background/60 px-2 py-2 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={toggleDictation}
                aria-label="Voice dictation"
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg transition ${
                  dictating
                    ? "bg-[color:var(--mint)] text-background halo-ring"
                    : "border border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
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
                disabled={!input.trim() || thinking}
                aria-label="Send"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-foreground text-background transition hover:opacity-90 disabled:opacity-40"
              >
                →
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-1.5 px-1">
              {[
                L1({ kk: "Басым ауырады", ru: "Голова болит", en: "Headache" }),
                L1({ kk: "Температура", ru: "Температура", en: "Fever" }),
                L1({ kk: "Жүрегім айниды", ru: "Тошнит", en: "Nausea" }),
                L1({ kk: "Кеудеде ауырсыну", ru: "Боль в груди", en: "Chest pain" }),
              ].map((q) => (
                <button key={q} onClick={() => send(q)} className="hover-scale rounded-full border border-white/10 bg-background/50 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur-md hover:text-foreground">{q}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
