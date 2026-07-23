import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";
import { triageChat } from "@/lib/triage-ai.functions";

export const Route = createFileRoute("/triage-voice")({
  head: () => ({
    meta: [
      { title: "Дауыс — Family Chat & AI Doctor · SauBol" },
      { name: "description", content: "Family messenger and AI doctor chat with voice dictation." },
    ],
  }),
  component: VoiceMessenger,
});

type ContactKind = "ai" | "child" | "parent";
type Contact = {
  id: string;
  name: string;
  emoji: string;
  kind: ContactKind;
  online: boolean;
  status: string;
  last: string;
  unread?: number;
};

const CONTACTS: Contact[] = [
  { id: "ai",      name: "SauBol AI",  emoji: "🩺", kind: "ai",     online: true,  status: "AI дәрігер · 24/7",           last: "Симптомдарды талдауға дайынмын", unread: 1 },
  { id: "aidos",   name: "Айдос",      emoji: "🧒", kind: "child",  online: true,  status: "Мектепте · 8 жас",             last: "Мама, мен түскі асқа отырдым 🍎" },
  { id: "aruzhan", name: "Аружан",     emoji: "👧", kind: "child",  online: false, status: "Үйде · 4 жас · темп. 37.6°",   last: "Нурофен ішкім келмейді 🥺", unread: 2 },
  { id: "dias",    name: "Диас",       emoji: "🧑", kind: "child",  online: true,  status: "Секцияда · 14 жас",            last: "Жаттығу біттi, жақсымын 💪" },
  { id: "mama",    name: "Анара (Ана)",emoji: "👩", kind: "parent", online: true,  status: "Ана · онлайн",                 last: "Кешке дәрі ішуді ұмытпа" },
  { id: "papa",    name: "Ерлан (Әке)",emoji: "👨", kind: "parent", online: false, status: "Әке · 2 сағ бұрын",            last: "Күні жақсы өтсін!" },
];

type Msg = { who: "me" | "them"; text: string; time: string; meta?: string };

const INITIAL_THREADS: Record<string, Msg[]> = {
  ai: [
    { who: "them", time: "12:41", text: "Сәлеметсіз бе! Мен SauBol AI — сіздің медициналық көмекшіңізбін. Симптомдарыңызды сипаттаңыз." },
  ],
  aidos:   [{ who: "them", time: "13:20", text: "Мама, мен түскі асқа отырдым 🍎" }, { who: "me", time: "13:21", text: "Жарайсың! Су ішуді ұмытпа 💧" }],
  aruzhan: [{ who: "them", time: "14:02", text: "Нурофен ішкім келмейді 🥺" }, { who: "them", time: "14:03", text: "Дәмі жаман..." }],
  dias:    [{ who: "them", time: "18:40", text: "Жаттығу біттi, жақсымын 💪" }],
  mama:    [{ who: "them", time: "09:12", text: "Кешке дәрі ішуді ұмытпа" }, { who: "me", time: "09:15", text: "Иә, ана, есімде ✓" }],
  papa:    [{ who: "them", time: "08:00", text: "Күні жақсы өтсін!" }],
};

const MOCK_REPLIES: Record<string, string[]> = {
  aidos:   ["Иә, мама! ✓", "Түсіндім 👍", "Мен қазір бос емеспін, кейінірек жазамын", "Рахмет! ❤️"],
  aruzhan: ["Жақсы 😊", "Ммм... жақсы", "Мама, кел тезірек 🥺", "Ыстық сорпа ішкім келеді"],
  dias:    ["Ok 👌", "Түсінікті", "5 минуттан кейін үйде боламын", "Барлығы жақсы"],
  mama:    ["Есімде ✓", "Рахмет, балам!", "Кешке кездесеміз", "Абайла өзіңді ❤️"],
  papa:    ["Жақсы", "Ok, ұлым", "Кешке сөйлесеміз", "👍"],
};

function nowStamp() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function VoiceMessenger() {
  const [activeId, setActiveId] = useState<string>("ai");
  const [threads, setThreads] = useState<Record<string, Msg[]>>(INITIAL_THREADS);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState(1); // ru default
  const [dictating, setDictating] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [search, setSearch] = useState("");
  const feedRef = useRef<HTMLDivElement | null>(null);
  const recogRef = useRef<any>(null);
  const L1 = useL();

  const active = CONTACTS.find((c) => c.id === activeId)!;
  const messages = threads[activeId] ?? [];
  const isAI = active.kind === "ai";

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, activeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CONTACTS;
    return CONTACTS.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  const grouped = useMemo(() => ({
    ai: filtered.filter((c) => c.kind === "ai"),
    children: filtered.filter((c) => c.kind === "child"),
    parents: filtered.filter((c) => c.kind === "parent"),
  }), [filtered]);

  const send = async (text: string, meta?: string) => {
    if (!text.trim()) return;
    const mine: Msg = { who: "me", time: nowStamp(), text: text.trim(), meta };
    setThreads((s) => ({ ...s, [activeId]: [...(s[activeId] ?? []), mine] }));
    setInput("");

    if (isAI) {
      if (thinking) return;
      setThinking(true);
      try {
        const langCode = (["kk", "ru", "en"] as const)[lang];
        const history = [...(threads[activeId] ?? []), mine].map((m) => ({
          role: (m.who === "me" ? "user" : "assistant") as "user" | "assistant",
          content: m.text,
        }));
        const { text: reply } = await triageChat({ data: { messages: history, lang: langCode } });
        setThreads((s) => ({ ...s, [activeId]: [...(s[activeId] ?? []), { who: "them", time: nowStamp(), text: reply }] }));
      } catch (e: any) {
        const msg = String(e?.message ?? e ?? "");
        toast.error(msg.includes("402") ? L1({ kk: "AI лимиті таусылды", ru: "Кредиты AI исчерпаны", en: "AI credits exhausted" }) : L1({ kk: "AI қатесі", ru: "Ошибка AI", en: "AI error" }));
        setThreads((s) => ({ ...s, [activeId]: [...(s[activeId] ?? []), { who: "them", time: nowStamp(), text: L1({ kk: "Кешіріңіз, қазір жауап бере алмаймын.", ru: "Извините, сейчас не могу ответить.", en: "Sorry, I can't reply right now." }) }] }));
      } finally {
        setThinking(false);
      }
    } else {
      const pool = MOCK_REPLIES[activeId] ?? ["Ok"];
      const delay = 900 + Math.random() * 1200;
      setTimeout(() => {
        const reply = pool[Math.floor(Math.random() * pool.length)];
        setThreads((s) => ({ ...s, [activeId]: [...(s[activeId] ?? []), { who: "them", time: nowStamp(), text: reply }] }));
      }, delay);
    }
  };

  const toggleDictation = () => {
    if (dictating) { recogRef.current?.stop?.(); setDictating(false); return; }
    const SR: any = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) { toast.error(L1({ kk: "Дауыс тану қолжетімсіз", ru: "Распознавание недоступно", en: "Speech recognition unavailable" }), { description: "Chrome / Edge" }); return; }
    const rec = new SR();
    rec.lang = (["kk-KZ", "ru-RU", "en-US"])[lang] ?? "ru-RU";
    rec.interimResults = true; rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
      }
      setInput((finalText + interim).trim());
    };
    rec.onerror = () => setDictating(false);
    rec.onend = () => setDictating(false);
    recogRef.current = rec; setDictating(true);
    try { rec.start(); } catch { /* noop */ }
  };

  const LANGS = ["KZ", "RU", "EN"];

  return (
    <div>
      <PageHeader
        eyebrow={<L kk="Дауыс · Отбасылық мессенджер" ru="Голос · Семейный мессенджер" en="Voice · Family Messenger" />}
        title={<L kk="Отбасы чаты және AI дәрігер" ru="Семейный чат и AI-доктор" en="Family Chat & AI Doctor" />}
        description={<L
          kk="Балаңызбен, ата-анаңызбен сөйлесіңіз немесе AI дәрігерден кеңес алыңыз · дауыстық енгізу қосулы"
          ru="Общайтесь с детьми и родителями или консультируйтесь с AI-доктором · голосовой ввод включён"
          en="Chat with your children, parents or consult the AI doctor · voice input enabled"
        />}
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-foreground"><span className="live-dot" /> LIVE</span>
            <button onClick={() => { const n = (lang + 1) % LANGS.length; setLang(n); toast(`${L1({ kk: "Тіл", ru: "Язык", en: "Lang" })}: ${LANGS[n]}`); }} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground">{LANGS[lang]}</button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Contacts */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <div className="border-b border-border p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={L1({ kk: "Іздеу...", ru: "Поиск...", en: "Search..." })}
              className="w-full rounded-full border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-white/20"
            />
          </div>
          <div className="max-h-[640px] overflow-y-auto p-2">
            {([
              { key: "ai", title: L1({ kk: "AI дәрігер", ru: "AI-доктор", en: "AI Doctor" }), items: grouped.ai },
              { key: "children", title: L1({ kk: "Балалар", ru: "Дети", en: "Children" }), items: grouped.children },
              { key: "parents", title: L1({ kk: "Ата-ана", ru: "Родители", en: "Parents" }), items: grouped.parents },
            ] as const).map((g) => g.items.length > 0 && (
              <div key={g.key} className="mb-2">
                <div className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{g.title}</div>
                <div className="space-y-1">
                  {g.items.map((c) => {
                    const isActive = c.id === activeId;
                    const ring = c.kind === "ai" ? "ring-[color:var(--mint)]/50" : "ring-white/10";
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveId(c.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${isActive ? "bg-[color:var(--mint-soft)] border border-[color:var(--mint)]/40" : "border border-transparent hover:bg-surface"}`}
                      >
                        <div className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-xl ring-2 ${ring}`}>
                          {c.emoji}
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card ${c.online ? "bg-[color:var(--mint)]" : "bg-muted-foreground/50"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate font-serif text-[15px] text-foreground">{c.name}</div>
                            {c.unread ? <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--mint)] px-1 text-[10px] font-bold text-background">{c.unread}</span> : null}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">{c.last}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          {isAI && <div className="aurora opacity-30" />}

          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-border/60 px-5 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className={`relative grid h-10 w-10 place-items-center rounded-full bg-secondary text-xl ring-2 ${isAI ? "ring-[color:var(--mint)]/50" : "ring-white/10"}`}>
                {active.emoji}
                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card ${active.online ? "bg-[color:var(--mint)]" : "bg-muted-foreground/50"}`} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">{active.name}</div>
                <div className="text-[11px] text-muted-foreground">{active.status}</div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground"><L kk="E2E шифрлеу" ru="E2E шифрование" en="E2E encrypted" /></div>
          </div>

          {/* Messages */}
          <div ref={feedRef} className="relative max-h-[560px] space-y-4 overflow-y-auto px-5 py-6">
            {messages.map((m, i) => {
              const mine = m.who === "me";
              return (
                <div key={i} className={`flex items-end gap-2 animate-fade-in ${mine ? "flex-row-reverse" : ""}`}>
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] ${mine ? "border border-border bg-surface text-foreground" : isAI ? "bg-[color:var(--mint)] text-background mint-glow" : "bg-secondary text-foreground"}`}>
                    {mine ? "Я" : active.emoji}
                  </div>
                  <div className={`relative max-w-[68%] rounded-[22px] px-4 py-2.5 backdrop-blur-md ${
                    mine
                      ? "border border-[color:var(--mint)]/25 bg-[color:var(--mint-soft)] rounded-br-md"
                      : "border border-white/8 bg-card/70 rounded-bl-md"
                  }`}>
                    <div className={`mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground ${mine ? "flex-row-reverse" : ""}`}>
                      <span>{mine ? L1({ kk: "Мен", ru: "Я", en: "Me" }) : active.name}</span>
                      <span>·</span>
                      <span className="tabular-nums">{m.time}</span>
                      {m.meta && <><span>·</span><span>{m.meta}</span></>}
                    </div>
                    <p className={`text-[13px] leading-relaxed text-foreground ${mine ? "text-right" : ""}`}>{m.text}</p>
                  </div>
                </div>
              );
            })}
            {thinking && isAI && (
              <div className="flex items-end gap-2 animate-fade-in">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--mint)] text-[11px] font-semibold text-background mint-glow">🩺</div>
                <div className="rounded-[22px] rounded-bl-md border border-white/8 bg-card/70 px-4 py-2.5 backdrop-blur-md">
                  <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    SauBol AI · <span className="shimmer-text">{L1({ kk: "ойлануда", ru: "думает", en: "thinking" })}</span>
                  </div>
                  <div className="shimmer-bar h-1 w-32 rounded-full" />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="relative px-4 pb-4 pt-2">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-3 rounded-full border border-white/10 bg-background/60 px-2 py-2 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isAI
                  ? L1({ kk: "Симптомды жазыңыз...", ru: "Опишите симптом...", en: "Describe a symptom..." })
                  : L1({ kk: `${active.name}-ға хабарлама...`, ru: `Сообщение ${active.name}...`, en: `Message ${active.name}...` })}
                className="flex-1 bg-transparent px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={toggleDictation}
                aria-label="Voice"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm transition ${dictating ? "bg-[color:var(--mint)] text-background halo-ring" : "border border-border bg-surface text-muted-foreground hover:text-foreground"}`}
              >
                🎙
              </button>
              <button type="submit" disabled={!input.trim() || (isAI && thinking)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-background disabled:opacity-40">
                ➤
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
