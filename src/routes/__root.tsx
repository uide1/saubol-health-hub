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
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider, LangSwitcher, useT } from "../lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold text-foreground">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Go home
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
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
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
      { title: "SauBol AI — Medical Intelligence Ecosystem" },
      { name: "description", content: "SauBol AI: Lab diagnostics, nutrition scanning, emergency voice triage, and prescription safety — one clinical-grade AI ecosystem." },
      { property: "og:title", content: "SauBol AI — Medical Intelligence Ecosystem" },
      { property: "og:description", content: "Clinical-grade AI for labs, nutrition, emergency triage, and prescriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
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
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

const NAV = [
  { to: "/", label: "Анализдер", sub: "BioSign AI" },
  { to: "/nutrition-scan", label: "Тамақ & Калория", sub: "SmartNutri" },
  { to: "/triage-voice", label: "Аудио Сұхбат", sub: "Triage Voice" },
  { to: "/prescription-rx", label: "Дәрілер", sub: "RxClarify" },
] as const;

function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background text-[11px] font-bold tracking-tight">S</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-foreground">SauBol</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">AI</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group flex flex-col rounded-md px-3 py-1.5 text-[12px] leading-tight transition ${
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <span className="font-medium">{n.label}</span>
                <span className="text-[10px] uppercase tracking-[0.12em] opacity-60">{n.sub}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" />
            <span className="text-[11px] text-muted-foreground">All systems nominal</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
            <span>Taldykorgan · KZ</span>
          </div>
          <div className="h-7 w-7 rounded-full border border-border bg-secondary text-[11px] font-medium text-foreground grid place-items-center">АН</div>
        </div>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <TopNav />
        <main className="mx-auto max-w-[1400px] px-6 py-6">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}
