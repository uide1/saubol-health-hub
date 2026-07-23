import { useEffect, useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { useL } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  run: () => void;
  group: "nav" | "action";
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const L1 = useL();
  const { toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setI(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const actions: Action[] = useMemo(() => [
    { id: "home", group: "nav", icon: "◈", label: L1({ kk: "Басты бет", ru: "Главная", en: "Home" }), hint: "/", run: () => nav({ to: "/" }) },
    { id: "voice", group: "nav", icon: "◐", label: L1({ kk: "Дауыс · Чат", ru: "Голос · Чат", en: "Voice · Chat" }), hint: "/triage-voice", run: () => nav({ to: "/triage-voice" }) },
    { id: "rx", group: "nav", icon: "◇", label: L1({ kk: "Дәрі-дәрмек", ru: "Лекарства", en: "Medications" }), hint: "/prescription-rx", run: () => nav({ to: "/prescription-rx" }) },
    { id: "conn", group: "nav", icon: "◉", label: L1({ kk: "Отбасы · Достар", ru: "Семья · Друзья", en: "Family · Friends" }), hint: "/connections", run: () => nav({ to: "/connections" }) },
    { id: "profile", group: "nav", icon: "◎", label: L1({ kk: "Профиль", ru: "Профиль", en: "Profile" }), hint: "/profile", run: () => nav({ to: "/profile" }) },
    { id: "theme", group: "action", icon: "☾", label: L1({ kk: "Тақырыпты ауыстыру", ru: "Сменить тему", en: "Toggle theme" }), run: toggle },
    { id: "sos", group: "action", icon: "!", label: L1({ kk: "103 шақыру", ru: "Вызвать 103", en: "Call 103" }), run: () => { toast.error(L1({ kk: "103 шақырылды (демо)", ru: "Вызов 103 (демо)", en: "103 dispatched (demo)" })); } },
    { id: "copy-id", group: "action", icon: "⧉", label: L1({ kk: "Профиль сілтемесін көшіру", ru: "Копировать ссылку профиля", en: "Copy profile link" }), run: () => { navigator.clipboard.writeText(window.location.origin + "/profile"); toast.success("Copied"); } },
  ], [L1, nav, toggle]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(s) || a.hint?.toLowerCase().includes(s));
  }, [q, actions]);

  useEffect(() => { setI(0); }, [q]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setI((v) => Math.min(filtered.length - 1, v + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setI((v) => Math.max(0, v - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); filtered[i]?.run(); setOpen(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-background/60 px-4 pt-[15vh] backdrop-blur-md animate-fade-in" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-card/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b border-border">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--mint)]/50 to-transparent" />
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="text-lg text-[color:var(--mint)]">⌘</span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={L1({ kk: "Іздеу немесе бұйрық...", ru: "Поиск или команда...", en: "Search or run command..." })}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">esc</kbd>
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {(["nav", "action"] as const).map((g) => {
            const items = filtered.filter((a) => a.group === g);
            if (items.length === 0) return null;
            return (
              <div key={g} className="mb-1">
                <div className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {g === "nav" ? L1({ kk: "Навигация", ru: "Навигация", en: "Navigate" }) : L1({ kk: "Әрекеттер", ru: "Действия", en: "Actions" })}
                </div>
                {items.map((a) => {
                  const idx = filtered.indexOf(a);
                  const active = idx === i;
                  return (
                    <button
                      key={a.id}
                      onMouseEnter={() => setI(idx)}
                      onClick={() => { a.run(); setOpen(false); }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-[color:var(--mint-soft)] text-foreground" : "text-muted-foreground hover:bg-surface"}`}
                    >
                      <span className={`grid h-7 w-7 place-items-center rounded-md text-sm ${active ? "bg-[color:var(--mint)] text-background" : "bg-secondary text-foreground"}`}>{a.icon}</span>
                      <span className="flex-1 text-[13px] text-foreground">{a.label}</span>
                      {a.hint && <span className="font-mono text-[10px] text-muted-foreground">{a.hint}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {L1({ kk: "Ештеңе табылмады", ru: "Ничего не найдено", en: "No results" })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-background/40 px-4 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">↑↓</kbd>
            <span>{L1({ kk: "таңдау", ru: "выбор", en: "select" })}</span>
            <kbd className="ml-2 rounded border border-border bg-surface px-1.5 py-0.5 font-mono">↵</kbd>
            <span>{L1({ kk: "ашу", ru: "открыть", en: "open" })}</span>
          </div>
          <div className="font-serif italic">SauBol · ⌘ palette</div>
        </div>
      </div>
    </div>
  );
}
