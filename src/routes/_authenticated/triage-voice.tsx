import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useState, useEffect } from "react";
import { Bento, Badge, SectionEyebrow } from "@/components/ui-kit";
import { L, useL } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/triage-voice")({
  head: () => ({
    meta: [
      { title: "Аудио Сұхбат · Triage AI — SauBol" },
      { name: "description", content: "AI triage chat with real-time voice input and medical guidance." },
      { property: "og:title", content: "Triage AI · SauBol" },
      { property: "og:description", content: "Симптомды жазыңыз — AI дәрігер кеңес береді." },
    ],
  }),
  component: TriagePage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;

function TriagePage() {
  const L1 = useL();
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message),
  });
  const [input, setInput] = useState("");
  const [dictating, setDictating] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const recogRef = useRef<SR>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || status === "streaming" || status === "submitted") return;
    sendMessage({ text: text.trim() });
    setInput("");
  };

  const toggleMic = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { toast.error(L1({kk:"Микрофон қолжетімсіз",ru:"Микрофон недоступен",en:"Speech recognition unavailable"})); return; }
    if (dictating) { recogRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "ru-RU"; r.continuous = false; r.interimResults = true;
    r.onresult = (e: SR) => {
      let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(t);
    };
    r.onend = () => setDictating(false);
    r.onerror = () => setDictating(false);
    recogRef.current = r; r.start(); setDictating(true);
  };

  const loading = status === "submitted" || status === "streaming";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionEyebrow>Triage AI · {L1({kk:"Тікелей эфир",ru:"В прямом эфире",en:"Live"})}</SectionEyebrow>
          <h1 className="mt-2 font-serif text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
            <L kk={<>AI дəрігермен <span className="italic text-[color:var(--mint)]">сөйлесу</span></>} ru={<>Диалог с <span className="italic text-[color:var(--mint)]">AI-врачом</span></>} en={<>Talk to the <span className="italic text-[color:var(--mint)]">AI doctor</span></>} />
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Bento className="flex flex-col p-0">
          <div ref={feedRef} className="max-h-[520px] min-h-[420px] flex-1 space-y-3 overflow-auto p-6">
            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-[13px] text-muted-foreground">
                <L kk="Симптомыңызды жазыңыз немесе микрофонды басыңыз." ru="Опишите симптомы или нажмите микрофон." en="Describe your symptoms or tap the mic." />
              </div>
            )}
            {messages.map(m => {
              const text = m.parts.map(p => p.type === "text" ? p.text : "").join("");
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${isUser ? "bg-foreground text-background" : "border border-border bg-surface text-foreground"}`}>
                    {text || <span className="opacity-50">...</span>}
                  </div>
                </div>
              );
            })}
            {loading && <div className="text-[11px] text-muted-foreground">AI {L1({kk:"жауап жазуда...",ru:"печатает...",en:"is typing..."})}</div>}
          </div>
          <div className="border-t border-border p-3">
            <form onSubmit={(e)=>{e.preventDefault(); send(input);}} className="flex items-center gap-2">
              <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder={L1({kk:"Симптомыңызды жазыңыз...",ru:"Опишите симптом...",en:"Describe your symptom..."})} className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-[13px] text-foreground" />
              <button type="button" onClick={toggleMic} className={`grid h-9 w-9 place-items-center rounded-full border ${dictating?"border-[color:var(--mint)] bg-[color:var(--mint)] text-background":"border-border bg-surface text-foreground"}`} aria-label="mic">🎙</button>
              <button disabled={loading} className="rounded-full bg-foreground px-4 py-2 text-[12px] font-medium text-background disabled:opacity-50">→</button>
            </form>
          </div>
        </Bento>

        <Bento>
          <SectionEyebrow><L kk="Диспетчер" ru="Диспетчер" en="Dispatcher" /></SectionEyebrow>
          <div className="mt-2 space-y-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-[10px] uppercase text-muted-foreground"><L kk="Бөлім басымдығы" ru="Приоритет вызова" en="Unit priority" /></div>
              <div className="mt-1 font-serif text-2xl text-foreground">Priority-2</div>
              <div className="mt-1 text-[11px] text-muted-foreground">ETA · 7 min · #4 Almaty EMS</div>
            </div>
            <button onClick={()=>toast.info(L1({kk:"Диспетчерге қосылу...",ru:"Соединение с диспетчером...",en:"Connecting to dispatcher..."}))} className="w-full rounded-full bg-foreground py-2.5 text-xs font-medium text-background">
              📞 <L kk="Диспетчермен сөйлесу" ru="Говорить с диспетчером" en="Speak to Dispatcher" />
            </button>
            <div className="rounded-xl border border-border bg-surface p-3 text-[11px] text-muted-foreground">
              <div className="mb-1 text-[10px] uppercase">Vitals</div>
              HR 108 · BP 138/92 · SpO₂ 96% · T 38.4°
            </div>
            <Badge tone="muted"><L kk="AI ұсыныс — диагноз емес" ru="Совет AI — не диагноз" en="AI guidance — not a diagnosis" /></Badge>
          </div>
        </Bento>
      </div>
    </div>
  );
}
