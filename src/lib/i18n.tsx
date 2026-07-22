import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "kk" | "ru" | "en";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangCtx = createContext<Ctx>({ lang: "kk", setLang: () => {} });

const STORAGE_KEY = "saubol-lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("kk");
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "kk" || stored === "ru" || stored === "en") setLangState(stored);
    } catch {}
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    try { document.documentElement.lang = l; } catch {}
  };
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang(): Lang { return useContext(LangCtx).lang; }
export function useSetLang() { return useContext(LangCtx).setLang; }

export function useL() {
  const lang = useLang();
  return function L<T>(v: Record<Lang, T>): T { return v[lang]; };
}

export function L({ kk, ru, en }: { kk: ReactNode; ru: ReactNode; en: ReactNode }) {
  const lang = useLang();
  return <>{lang === "ru" ? ru : lang === "en" ? en : kk}</>;
}

export function LangSwitcher() {
  const lang = useLang();
  const setLang = useSetLang();
  const opts: { k: Lang; l: string }[] = [
    { k: "kk", l: "KZ" },
    { k: "ru", l: "RU" },
    { k: "en", l: "EN" },
  ];
  return (
    <div className="flex items-center rounded-full border border-border bg-surface p-0.5 text-[10px] font-medium">
      {opts.map((o) => (
        <button
          key={o.k}
          onClick={() => setLang(o.k)}
          aria-pressed={lang === o.k}
          className={`rounded-full px-2 py-0.5 transition ${lang === o.k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
