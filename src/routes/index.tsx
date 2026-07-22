import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bento, Badge, SectionEyebrow } from "@/components/ui-kit";
import { HealthOrb } from "@/components/health-orb";
import { supabase } from "@/integrations/supabase/client";
import { L } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SauBol AI — Медициналық Интеллект Экожүйесі" },
      { name: "description", content: "SauBol AI — Қазақстанға арналған AI денсаулық көмекшісі. Тамақ сканері, дауыстық триаж, дәрі-дәрмек қауіпсіздігі, отбасы бақылауы." },
      { property: "og:title", content: "SauBol AI · Медициналық Интеллект" },
      { property: "og:description", content: "Тамақ, дәрі, дауыс жəне отбасы — бір экоситемада." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  return (
    <div className="space-y-10">
      <Bento className="noise relative overflow-hidden p-10 md:p-14">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <SectionEyebrow>SauBol AI · v1.4</SectionEyebrow>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-7xl">
              <L
                kk={<>Денсаулық <span className="italic text-[color:var(--mint)]">аман</span> болсын.</>}
                ru={<>Здоровье <span className="italic text-[color:var(--mint)]">под контролем</span>.</>}
                en={<>Health, <span className="italic text-[color:var(--mint)]">quietly</span> in check.</>}
              />
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              <L
                kk="Тамақ сканері, дауыстық триаж, дәрі қауіпсіздігі жəне отбасы бақылауы — Қазақстанға арналған AI денсаулық экожүйесі."
                ru="Сканер еды, голосовой триаж, безопасность лекарств и семейный мониторинг — AI-экосистема здоровья для Казахстана."
                en="Food scanner, voice triage, medication safety and family monitoring — a health AI built for Kazakhstan."
              />
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
                <L kk="Тегін бастау" ru="Начать бесплатно" en="Get started" />
              </Link>
              <Link to="/auth" className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground">
                <L kk="Кіру" ru="Войти" en="Sign in" />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <Badge tone="mint">HIPAA-aware</Badge>
              <Badge tone="muted">End-to-end encrypted</Badge>
              <span>·</span>
              <L kk="Almaty · Astana · Shymkent" ru="Almaty · Astana · Shymkent" en="Almaty · Astana · Shymkent" />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <HealthOrb value={78} />
          </div>
        </div>
      </Bento>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { e: "🍎", t: { kk: "Тамақ сканері", ru: "Сканер еды", en: "Food scanner" }, d: { kk: "Фото/штрих-код → КБЖУ.", ru: "Фото/штрих-код → КБЖУ.", en: "Photo/barcode → macros." } },
          { e: "🎙️", t: { kk: "Дауыстық триаж", ru: "Голосовой триаж", en: "Voice triage" }, d: { kk: "AI-мен симптом талдау.", ru: "AI-анализ симптомов.", en: "AI symptom analysis." } },
          { e: "💊", t: { kk: "Дәрі қауіпсіздігі", ru: "Безопасность лекарств", en: "Med safety" }, d: { kk: "Кесте + еске салу.", ru: "График + напоминания.", en: "Schedule + reminders." } },
          { e: "👨‍👩‍👧", t: { kk: "Отбасы режимі", ru: "Семейный режим", en: "Family mode" }, d: { kk: "Балалардың нақты уақыт деректері.", ru: "Данные детей в реальном времени.", en: "Kids' data in real time." } },
        ].map((f) => (
          <Bento key={f.e} className="p-6">
            <div className="text-3xl">{f.e}</div>
            <div className="mt-3 font-serif text-xl text-foreground"><L {...f.t} /></div>
            <p className="mt-1 text-sm text-muted-foreground"><L {...f.d} /></p>
          </Bento>
        ))}
      </div>
    </div>
  );
}
