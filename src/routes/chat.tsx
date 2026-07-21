import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bento, Chip, Badge, SectionEyebrow } from "@/components/ui-kit";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Дәрігер — SauBol" },
      { name: "description", content: "Симптомдарыңызды жазыңыз — AI сізге ықтимал себептер мен алдын алу шараларын түсіндіреді. Дәрігердің орнын баспайды." },
      { property: "og:title", content: "SauBol AI Дәрігер" },
      { property: "og:description", content: "Медициналық сұрақтарыңызға арналған жасанды интеллект көмекшісі." },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Бас ауырады, 3 күн өтпейді",
  "Дене қызуы 38, не істеу керек?",
  "Ферритин 12 — қаншалықты қауіпті?",
  "Аспиринді Ибупрофенмен ішуге бола ма?",
];

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }, { role: "assistant", content: "" }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.slice(0, -1).map(m => ({ role: m.role, content: m.content })) }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Кешіріңіз, қате орын алды. Қайталап көріңіз." };
        return copy;
      });
      console.error(e);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
      <Bento className="flex h-[calc(100vh-220px)] min-h-[560px] flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--mint)] font-serif text-lg text-background">S</div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-[color:var(--mint)]" />
            </div>
            <div>
              <div className="font-serif text-lg text-foreground">SauBol AI Дәрігер</div>
              <div className="text-[11px] text-muted-foreground">Онлайн · GPT-5.5 · KZ/RU/EN</div>
            </div>
          </div>
          <Badge tone="mint">HIPAA-safe</Badge>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {messages.length === 0 && (
            <div className="mx-auto max-w-lg pt-12 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[color:var(--mint-soft)] font-serif text-2xl text-[color:var(--mint)]">S</div>
              <h2 className="mt-4 font-serif text-3xl tracking-tight text-foreground">Не мазалайды?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Симптомдарыңызды, анализ нәтижелеріңізді немесе кез келген медициналық сұрағыңызды жазыңыз.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] text-foreground transition hover:border-[color:var(--mint)]/40 hover:text-[color:var(--mint)]">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-medium ${m.role === "user" ? "bg-secondary text-foreground" : "bg-[color:var(--mint)] text-background"}`}>
                {m.role === "user" ? "АН" : "S"}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${m.role === "user" ? "bg-secondary text-foreground" : "text-foreground"}`}>
                {m.content ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <span className="shimmer-text">Ойлануда...</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              rows={1}
              placeholder="Симптомыңызды жазыңыз... (Enter — жіберу, Shift+Enter — жаңа жол)"
              className="min-h-[36px] max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={streaming}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--mint)] text-background transition disabled:opacity-40"
            >
              →
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-muted-foreground">
            SauBol AI диагноз қоймайды. Ауыр жағдайда — 103.
          </div>
        </div>
      </Bento>

      {/* Sidebar */}
      <div className="space-y-4">
        <Bento>
          <SectionEyebrow>Жылдам сұрақтар</SectionEyebrow>
          <div className="space-y-1.5">
            {[
              "Иммунитетті қалай көтеру керек?",
              "Стресспен күресудің AI жолдары",
              "Дұрыс ұйықтау үшін не істеу?",
              "Салмақ жоғалту стратегиясы",
            ].map((q) => (
              <button key={q} onClick={() => send(q)} disabled={streaming} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-left text-[12px] text-muted-foreground transition hover:border-white/15 hover:text-foreground disabled:opacity-50">
                {q}
              </button>
            ))}
          </div>
        </Bento>

        <Bento>
          <SectionEyebrow>Қашан 103 шақыру керек</SectionEyebrow>
          <ul className="space-y-2 text-[12px] text-foreground">
            {["Кеуде ауруы 15 мин+","Естен тану","Қатты қан кету","Тыныс алудың бұзылуы","Инсульт белгілері"].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-[color:var(--danger)]" />
                {s}
              </li>
            ))}
          </ul>
          <button className="mt-4 w-full rounded-full bg-[color:var(--danger)] py-2 text-[13px] font-medium text-white">
            103 шақыру
          </button>
        </Bento>

        <Bento>
          <div className="flex items-center gap-2">
            <Chip active>Kazakh</Chip>
            <Chip>Russian</Chip>
            <Chip>English</Chip>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            AI сіз қай тілде жазсаңыз — сол тілде жауап береді.
          </p>
        </Bento>
      </div>
    </div>
  );
}
