import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";
import { triageChat } from "@/lib/triage-ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/triage-voice")({
  head: () => ({
    meta: [
      { title: "Дауыс — Family Chat & AI Doctor · SauBol" },
      { name: "description", content: "Real-time family messenger and AI doctor chat with voice dictation." },
    ],
  }),
  component: VoiceMessenger,
});

type Contact = {
  id: string;
  kind: "ai" | "family" | "friend";
  name: string;
  emoji: string;
  status: string;
  online: boolean;
  unread?: number;
  last?: string;
};

type Msg = { id: string; who: "me" | "them"; text: string; time: string };

const AI_CONTACT: Contact = {
  id: "ai",
  kind: "ai",
  name: "SauBol AI",
  emoji: "🩺",
  status: "AI дәрігер · 24/7",
  online: true,
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function VoiceMessenger() {
  const { user } = useSession();
  const L1 = useL();
  const [contacts, setContacts] = useState<Contact[]>([AI_CONTACT]);
  const [activeId, setActiveId] = useState<string>("ai");
  const [messages, setMessages] = useState<Msg[]>([{ id: "sys", who: "them", text: "Сәлеметсіз бе! Мен SauBol AI. Симптомдарыңызды сипаттаңыз.", time: fmtTime(new Date().toISOString()) }]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState(1);
  const [dictating, setDictating] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [search, setSearch] = useState("");
  const feedRef = useRef<HTMLDivElement | null>(null);
  const recogRef = useRef<any>(null);

  const active = contacts.find((c) => c.id === activeId) ?? AI_CONTACT;
  const isAI = active.kind === "ai";

  // Load contacts from friendships + family_links (accepted)
  const loadContacts = useCallback(async () => {
    if (!user) return;
    const [f, fam] = await Promise.all([
      supabase.from("friendships").select("status,user_id,friend_id").eq("status", "accepted").or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
      supabase.from("family_links").select("status,parent_id,child_id").eq("status", "accepted").or(`parent_id.eq.${user.id},child_id.eq.${user.id}`),
    ]);
    const otherIds = new Set<string>();
    const kinds = new Map<string, "family" | "friend">();
    (f.data ?? []).forEach((r: any) => {
      const oid = r.user_id === user.id ? r.friend_id : r.user_id;
      otherIds.add(oid); kinds.set(oid, "friend");
    });
    (fam.data ?? []).forEach((r: any) => {
      const oid = r.parent_id === user.id ? r.child_id : r.parent_id;
      otherIds.add(oid); kinds.set(oid, "family");
    });
    if (otherIds.size === 0) { setContacts([AI_CONTACT]); return; }
    const { data: profs } = await supabase.from("profiles")
      .select("id,full_name,username,avatar_url,role")
      .in("id", Array.from(otherIds));
    const list: Contact[] = [AI_CONTACT, ...(profs ?? []).map((p: any) => ({
      id: p.id,
      kind: kinds.get(p.id) ?? "friend",
      name: p.full_name ?? p.username ?? "User",
      emoji: p.role === "child" ? "🧒" : "👤",
      status: p.username ? `@${p.username}` : "",
      online: true,
    } as Contact))];
    setContacts(list);
  }, [user?.id]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  // Load messages for the active contact
  useEffect(() => {
    if (!user || activeId === "ai") return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("messages")
        .select("id,sender_id,content,created_at")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${activeId}),and(sender_id.eq.${activeId},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (error) { toast.error(error.message); return; }
      setMessages((data ?? []).map((m: any) => ({
        id: m.id,
        who: m.sender_id === user.id ? "me" : "them",
        text: m.content,
        time: fmtTime(m.created_at),
      })));
      // mark received as read
      await supabase.from("messages").update({ read: true })
        .eq("recipient_id", user.id).eq("sender_id", activeId).eq("read", false);
    })();
    return () => { cancelled = true; };
  }, [activeId, user?.id]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`msg:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, (payload: any) => {
        const m = payload.new;
        if (m.sender_id === activeId) {
          setMessages((prev) => [...prev, { id: m.id, who: "them", text: m.content, time: fmtTime(m.created_at) }]);
          supabase.from("messages").update({ read: true }).eq("id", m.id).then(() => {});
        } else {
          toast(L1({ kk: "Жаңа хабарлама", ru: "Новое сообщение", en: "New message" }), { description: m.content.slice(0, 60) });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, activeId]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, activeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [search, contacts]);
  const grouped = useMemo(() => ({
    ai: filtered.filter((c) => c.kind === "ai"),
    family: filtered.filter((c) => c.kind === "family"),
    friend: filtered.filter((c) => c.kind === "friend"),
  }), [filtered]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const t = text.trim();
    setInput("");

    if (isAI) {
      const mine: Msg = { id: `me-${Date.now()}`, who: "me", text: t, time: fmtTime(new Date().toISOString()) };
      setMessages((s) => [...s, mine]);
      if (thinking) return;
      setThinking(true);
      try {
        const langCode = (["kk", "ru", "en"] as const)[lang];
        const history = [...messages, mine].map((m) => ({ role: (m.who === "me" ? "user" : "assistant") as "user" | "assistant", content: m.text }));
        const { text: reply } = await triageChat({ data: { messages: history, lang: langCode } });
        setMessages((s) => [...s, { id: `ai-${Date.now()}`, who: "them", text: reply, time: fmtTime(new Date().toISOString()) }]);
      } catch (e: any) {
        toast.error(L1({ kk: "AI қатесі", ru: "Ошибка AI", en: "AI error" }));
      } finally { setThinking(false); }
    } else {
      if (!user) return;
      const optimistic: Msg = { id: `tmp-${Date.now()}`, who: "me", text: t, time: fmtTime(new Date().toISOString()) };
      setMessages((s) => [...s, optimistic]);
      const { data, error } = await supabase.from("messages")
        .insert({ sender_id: user.id, recipient_id: activeId, content: t })
        .select("id,created_at").single();
      if (error) {
        toast.error(error.message);
        setMessages((s) => s.filter((m) => m.id !== optimistic.id));
        return;
      }
      setMessages((s) => s.map((m) => m.id === optimistic.id ? { ...m, id: data.id, time: fmtTime(data.created_at) } : m));
    }
  };

  const toggleDictation = () => {
    if (dictating) { recogRef.current?.stop?.(); setDictating(false); return; }
    const SR: any = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) { toast.error(L1({ kk: "Дауыс тану қолжетімсіз", ru: "Распознавание недоступно", en: "Speech recognition unavailable" })); return; }
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
        eyebrow={<L kk="Дауыс · Мессенджер" ru="Голос · Мессенджер" en="Voice · Messenger" />}
        title={<L kk="Отбасы чаты және AI дәрігер" ru="Семейный чат и AI-доктор" en="Family Chat & AI Doctor" />}
        description={<L
          kk="Достарыңызбен, отбасыңызбен нақты уақытта сөйлесіңіз немесе AI дәрігерге сұрақ қойыңыз"
          ru="Общайтесь с семьёй и друзьями в реальном времени или задайте вопрос AI-доктору"
          en="Real-time chat with your family and friends, or consult the AI doctor"
        />}
        actions={
          <>
            <Link to="/connections" className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground">+ <L kk="Қосу" ru="Добавить" en="Add" /></Link>
            <button onClick={() => { const n = (lang + 1) % LANGS.length; setLang(n); }} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground">{LANGS[lang]}</button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <div className="border-b border-border p-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={L1({ kk: "Іздеу...", ru: "Поиск...", en: "Search..." })} className="w-full rounded-full border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-white/20" />
          </div>
          <div className="max-h-[640px] overflow-y-auto p-2">
            {([
              { key: "ai", title: L1({ kk: "AI дәрігер", ru: "AI-доктор", en: "AI Doctor" }), items: grouped.ai },
              { key: "family", title: L1({ kk: "Отбасы", ru: "Семья", en: "Family" }), items: grouped.family },
              { key: "friend", title: L1({ kk: "Достар", ru: "Друзья", en: "Friends" }), items: grouped.friend },
            ] as const).map((g) => g.items.length > 0 && (
              <div key={g.key} className="mb-2">
                <div className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{g.title}</div>
                <div className="space-y-1">
                  {g.items.map((c) => {
                    const isActive = c.id === activeId;
                    const ring = c.kind === "ai" ? "ring-[color:var(--mint)]/50" : "ring-white/10";
                    return (
                      <button key={c.id} onClick={() => setActiveId(c.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${isActive ? "bg-[color:var(--mint-soft)] border border-[color:var(--mint)]/40" : "border border-transparent hover:bg-surface"}`}>
                        <div className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-xl ring-2 ${ring}`}>
                          {c.emoji}
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card ${c.online ? "bg-[color:var(--mint)]" : "bg-muted-foreground/50"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-serif text-[15px] text-foreground">{c.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{c.status}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {contacts.length === 1 && (
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground"><L kk="Әлі байланыстар жоқ" ru="Пока нет контактов" en="No contacts yet" /></p>
                <Link to="/connections" className="mt-2 inline-flex rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background">
                  <L kk="Отбасы/дос қосу" ru="Добавить семью/друга" en="Add family/friend" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          {isAI && <div className="aurora opacity-30" />}
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

          <div ref={feedRef} className="relative max-h-[560px] space-y-4 overflow-y-auto px-5 py-6">
            {messages.map((m) => {
              const mine = m.who === "me";
              return (
                <div key={m.id} className={`flex items-end gap-2 animate-fade-in ${mine ? "flex-row-reverse" : ""}`}>
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] ${mine ? "border border-border bg-surface text-foreground" : isAI ? "bg-[color:var(--mint)] text-background mint-glow" : "bg-secondary text-foreground"}`}>
                    {mine ? "Я" : active.emoji}
                  </div>
                  <div className={`relative max-w-[68%] rounded-[22px] px-4 py-2.5 backdrop-blur-md ${mine ? "border border-[color:var(--mint)]/25 bg-[color:var(--mint-soft)] rounded-br-md" : "border border-white/8 bg-card/70 rounded-bl-md"}`}>
                    <div className={`mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground ${mine ? "flex-row-reverse" : ""}`}>
                      <span>{mine ? L1({ kk: "Мен", ru: "Я", en: "Me" }) : active.name}</span>
                      <span>·</span>
                      <span className="tabular-nums">{m.time}</span>
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
                  <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">SauBol AI · <span className="shimmer-text">{L1({ kk: "ойлануда", ru: "думает", en: "thinking" })}</span></div>
                  <div className="shimmer-bar h-1 w-32 rounded-full" />
                </div>
              </div>
            )}
          </div>

          <div className="relative px-4 pb-4 pt-2">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-3 rounded-full border border-white/10 bg-background/60 px-2 py-2 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={isAI ? L1({ kk: "Симптомды жазыңыз...", ru: "Опишите симптом...", en: "Describe a symptom..." }) : L1({ kk: `${active.name}-ға хабарлама...`, ru: `Сообщение ${active.name}...`, en: `Message ${active.name}...` })} className="flex-1 bg-transparent px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
              <button type="button" onClick={toggleDictation} aria-label="Voice" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm transition ${dictating ? "bg-[color:var(--mint)] text-background halo-ring" : "border border-border bg-surface text-muted-foreground hover:text-foreground"}`}>🎙</button>
              <button type="submit" disabled={!input.trim() || (isAI && thinking)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-background disabled:opacity-40">➤</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
