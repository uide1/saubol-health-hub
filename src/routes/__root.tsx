import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useTheme } from "@/lib/theme";
import { CustomCursor } from "@/components/cursor";
import { Toaster, toast } from "sonner";
import { LangProvider, LangSwitcher, useL, L } from "@/lib/i18n";
import { useSession } from "@/lib/use-session";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-serif text-8xl text-foreground">404</div>
        <p className="mt-4 text-sm text-muted-foreground">
          <L kk="Бұл бет табылмады." ru="Страница не найдена." en="Page not found." />
        </p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background">
          <L kk="Басты бетке" ru="На главную" en="Go home" />
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl text-foreground">
          <L kk="Бірдеңе дұрыс болмады" ru="Что-то пошло не так" en="Something went wrong" />
        </h1>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background">
          <L kk="Қайталау" ru="Повторить" en="Try again" />
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SauBol AI — Медициналық Интеллект" },
      { name: "description", content: "SauBol AI — қандық талдаулар, тамақ сканері, дауыстық триаж жəне дəрі-дəрмек қауіпсіздігі." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="kk">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const { user } = useSession();
  const navigate = useNavigate();
  const L1 = useL();
  const NAV = user ? [
    { to: "/dashboard", label: L1({ kk: "Басты", ru: "Главная", en: "Home" }) },
    { to: "/family", label: L1({ kk: "Отбасы", ru: "Семья", en: "Family" }) },
    { to: "/nutrition-scan", label: L1({ kk: "Тамақ", ru: "Питание", en: "Nutrition" }) },
    { to: "/triage-voice", label: L1({ kk: "Дауыс", ru: "Голос", en: "Voice" }) },
    { to: "/prescription-rx", label: L1({ kk: "Дәрілер", ru: "Лекарства", en: "Meds" }) },
    { to: "/profile", label: L1({ kk: "Профиль", ru: "Профиль", en: "Profile" }) },
  ] as const : [];

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success(L1({kk:"Шықтыңыз",ru:"Вы вышли",en:"Signed out"}));
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-4 z-40 mx-auto max-w-[1400px] px-6">
      <div className="flex items-center gap-4 rounded-full border border-border bg-background/70 px-4 py-2 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 pl-1 pr-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--mint)] text-[10px] font-bold text-background">S</div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-lg leading-none tracking-tight text-foreground">SauBol</span>
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">AI</span>
          </div>
        </Link>
        {NAV.length > 0 && <div className="h-4 w-px bg-border" />}
        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link key={n.to} to={n.to} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition ${active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LangSwitcher />
          <button onClick={toggle} aria-label="theme" className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-[13px] text-foreground">
            {theme === "dark" ? "☾" : "☀"}
          </button>
          {user ? (
            <button onClick={signOut} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] text-foreground">
              <L kk="Шығу" ru="Выйти" en="Sign out" />
            </button>
          ) : (
            <Link to="/auth" className="rounded-full bg-foreground px-4 py-1.5 text-[11px] font-medium text-background">
              <L kk="Кіру" ru="Войти" en="Sign in" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <div className="min-h-screen bg-background pt-4 text-foreground">
          <CustomCursor />
          <TopNav />
          <Toaster theme="system" position="top-right" toastOptions={{ style: { background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" } }} />
          <main className="mx-auto max-w-[1400px] px-6 py-8"><Outlet /></main>
          <footer className="mx-auto max-w-[1400px] border-t border-border px-6 py-8 text-[11px] text-muted-foreground">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-serif italic">
                <L kk="SauBol AI · Медициналық ақпараттандыру құралы, диагноз емес." ru="SauBol AI · Инструмент медицинской информации, не диагноз." en="SauBol AI · Medical information tool, not a diagnosis." />
              </span>
              <span className="font-mono">© 2026 · v2.0 · Almaty</span>
            </div>
          </footer>
        </div>
      </LangProvider>
    </QueryClientProvider>
  );
}
