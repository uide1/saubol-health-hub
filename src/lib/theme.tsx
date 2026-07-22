import { useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light";
const KEY = "saubol-theme";

function apply(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(t);
  root.style.colorScheme = t;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(KEY) as Theme | null)) || "dark";
    setTheme(stored);
    apply(stored);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem(KEY, next); } catch {}
      return next;
    });
  }, []);

  return { theme, toggle };
}
