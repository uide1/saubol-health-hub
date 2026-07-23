import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "@/lib/theme";
import { CustomCursor } from "@/components/cursor";
import { Toaster } from "sonner";
import { LangProvider, LangSwitcher, useL, L } from "@/lib/i18n";
import { NotificationBell } from "@/components/notification-bell";
import { UserAvatar } from "@/components/user-avatar";
import { useMyProfile } from "@/lib/auth";

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
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl text-foreground">
          <L kk="Бірдеңе дұрыс болмады" ru="Что-то пошло не так" en="Something went wrong" />
        </h1>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
        >
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
      { name: "description", content: "SauBol AI — қандық талдаулар, тамақ сканері, дауыстық триаж және дәрі-дәрмек қауіпсіздігі. Қазақстанға арналған AI денсаулық экожүйесі." },
      { property: "og:title", content: "SauBol AI — Медициналық Интеллект" },
      { property: "og:description", content: "SauBol AI — қандық талдаулар, тамақ сканері, дауыстық триаж және дәрі-дәрмек қауіпсіздігі. Қазақстанға арналған AI денсаулық экожүйесі." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SauBol AI — Медициналық Интеллект" },
      { name: "twitter:description", content: "SauBol AI — қандық талдаулар, тамақ сканері, дауыстық триаж және дәрі-дәрмек қауіпсіздігі. Қазақстанға арналған AI денсаулық экожүйесі." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cdd9a193-673b-40b7-ae47-7d1a45f1142b/id-preview-0d7c1247--dc11a746-f314-43cb-827e-cdad9a4c3318.lovable.app-1784805302405.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cdd9a193-673b-40b7-ae47-7d1a45f1142b/id-preview-0d7c1247--dc11a746-f314-43cb-827e-cdad9a4c3318.lovable.app-1784805302405.png" },
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
  const L1 = useL();
  const NAV = [
    { to: "/", label: L1({ kk: "Басты", ru: "Главная", en: "Home" }), icon: "◉" },
    { to: "/triage-voice", label: L1({ kk: "Дауыс", ru: "Чат", en: "Chat" }), icon: "◐" },
    { to: "/prescription-rx", label: L1({ kk: "Дәрілер", ru: "Лекарства", en: "Meds" }), icon: "◈" },
    { to: "/connections", label: L1({ kk: "Отбасы", ru: "Семья", en: "Family" }), icon: "◇" },
    { to: "/profile", label: L1({ kk: "Профиль", ru: "Профиль", en: "Profile" }), icon: "◎" },
  ] as const;

  return (
    <header className="sticky top-2 z-40 mx-auto max-w-[1400px] px-3 sm:top-4 sm:px-6">
      <div className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-2.5 py-2 backdrop-blur-xl sm:gap-4 sm:px-4">
        <Link to="/" className="flex items-center gap-2 pl-1 pr-1 sm:pr-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--mint)] text-[10px] font-bold text-background">S</div>
          <div className="hidden items-baseline gap-1 sm:flex">
            <span className="font-serif text-lg leading-none tracking-tight text-foreground">SauBol</span>
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">AI</span>
          </div>
        </Link>
        <div className="hidden h-4 w-px bg-border md:block" />
        <nav className="hidden items-center gap-0.5 overflow-x-auto md:flex">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition ${
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <NotificationBell />
          <LangSwitcher />
          <button
            onClick={toggle}
            aria-label={L1({ kk: "Тақырыпты ауыстыру", ru: "Сменить тему", en: "Toggle theme" })}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-[13px] text-foreground transition hover:border-white/20"
          >
            {theme === "dark" ? "☾" : "☀"}
          </button>
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const L1 = useL();
  const NAV = [
    { to: "/", label: L1({ kk: "Басты", ru: "Главная", en: "Home" }), icon: "🏠" },
    { to: "/triage-voice", label: L1({ kk: "Чат", ru: "Чат", en: "Chat" }), icon: "💬" },
    { to: "/prescription-rx", label: L1({ kk: "Дәрі", ru: "Лек-ва", en: "Meds" }), icon: "💊" },
    { to: "/connections", label: L1({ kk: "Отбасы", ru: "Семья", en: "Family" }), icon: "👥" },
    { to: "/profile", label: L1({ kk: "Профиль", ru: "Я", en: "Me" }), icon: "👤" },
  ] as const;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.25rem)" }}
    >
      <ul className="mx-auto grid max-w-[520px] grid-cols-5">
        {NAV.map((n) => {
          const active = pathname === n.to;
          return (
            <li key={n.to}>
              <Link
                to={n.to}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] transition ${
                  active ? "text-[color:var(--mint)]" : "text-muted-foreground"
                }`}
              >
                <span className="text-[18px] leading-none">{n.icon}</span>
                <span className="text-[10px] leading-none">{n.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function AuthMenu() {
  const { user, profile } = useMyProfile();
  if (!user) {
    return <Link to="/auth" className="rounded-full bg-foreground px-3 py-1.5 text-[12px] font-medium text-background"><L kk="Кіру" ru="Войти" en="Sign in" /></Link>;
  }
  const name = profile?.first_name ?? profile?.username ?? user.email ?? "";
  return (
    <Link to="/profile" aria-label="Profile">
      <UserAvatar url={profile?.avatar_url} name={name} size={32} />
    </Link>
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
          <main className="mx-auto max-w-[1400px] px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">
            <Outlet />
          </main>
          <footer className="mx-auto hidden max-w-[1400px] border-t border-border px-6 py-8 text-[11px] text-muted-foreground md:block">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-serif italic">
                <L
                  kk="SauBol AI · Медициналық ақпараттандыру құралы, диагноз емес."
                  ru="SauBol AI · Инструмент медицинской информации, не диагноз."
                  en="SauBol AI · Medical information tool, not a diagnosis."
                />
              </span>
              <span className="font-mono">© 2026 · v1.4.2 · Almaty</span>
            </div>
          </footer>
          <MobileBottomNav />
        </div>
      </LangProvider>
    </QueryClientProvider>
  );
}
