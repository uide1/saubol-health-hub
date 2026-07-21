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

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-serif text-8xl text-foreground">404</div>
        <p className="mt-4 text-sm text-muted-foreground">Бұл бет табылмады.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background">
          Басты бетке
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
        <h1 className="font-serif text-2xl text-foreground">Бірдеңе дұрыс болмады</h1>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
        >
          Қайталау
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
      { property: "og:description", content: "AI-мен күшейтілген денсаулық көмекшісі: анализдер, тамақ, аудио триаж, дәрі-дәрмек." },
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

const NAV = [
  { to: "/", label: "Басты" },
  { to: "/chat", label: "AI Дәрігер" },
  { to: "/labs", label: "Анализдер" },
  { to: "/nutrition-scan", label: "Тамақ" },
  { to: "/triage-voice", label: "Дауыс" },
  { to: "/prescription-rx", label: "Дәрілер" },
  { to: "/profile", label: "Профиль" },
] as const;

function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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
        <div className="h-4 w-px bg-border" />
        <nav className="flex items-center gap-0.5 overflow-x-auto">
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
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--mint)]" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
          </div>
          <Link to="/profile" className="grid h-8 w-8 place-items-center rounded-full border border-border bg-secondary text-[11px] font-medium text-foreground">АН</Link>
        </div>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background pt-4 text-foreground">
        <TopNav />
        <main className="mx-auto max-w-[1400px] px-6 py-8">
          <Outlet />
        </main>
        <footer className="mx-auto max-w-[1400px] border-t border-border px-6 py-8 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-serif italic">SauBol AI · Медициналық ақпараттандыру құралы, диагноз емес.</span>
            <span className="font-mono">© 2026 · v1.4.2 · Almaty</span>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
