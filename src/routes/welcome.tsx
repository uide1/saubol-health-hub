import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bento, Chip, SectionEyebrow, Badge } from "@/components/ui-kit";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "SauBol AI-ға қош келдіңіз — Онбординг" },
      { name: "description", content: "3 қадамды баптау: тіл, негізгі мәлімет, денсаулық мақсаттарыңыз." },
      { property: "og:title", content: "SauBol AI-ға қош келдіңіз" },
      { property: "og:description", content: "Жеке AI денсаулық көмекшіңізді 60 секундта баптаңыз." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("kk");
  const [goals, setGoals] = useState<string[]>([]);
  const toggle = (g: string) => setGoals((s) => s.includes(g) ? s.filter(x => x !== g) : [...s, g]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <SectionEyebrow>Онбординг · Қадам {step + 1} / 3</SectionEyebrow>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className={`h-1 w-10 rounded-full ${i <= step ? "bg-[color:var(--mint)]" : "bg-secondary"}`} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <Bento className="noise p-10 text-center">
          <h1 className="font-serif text-5xl leading-tight tracking-tight text-foreground md:text-6xl">
            Сәлем. Мен — <span className="italic text-[color:var(--mint)]">SauBol</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            Мен — сіздің қалтаңыздағы AI дәрігеріңіз. Анализдеріңізді талдаймын, тамақ пен дәрі-дәрмектің қауіпсіздігін тексеремін, симптомдарыңызды тыңдаймын.
          </p>
          <div className="mt-8">
            <div className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">Қалаған тіл</div>
            <div className="flex justify-center gap-2">
              {[["kk","Қазақша"],["ru","Русский"],["en","English"]].map(([k,v]) => (
                <button key={k} onClick={() => setLang(k)}>
                  <Chip active={lang === k}>{v}</Chip>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setStep(1)} className="mt-8 rounded-full bg-[color:var(--mint)] px-6 py-3 text-sm font-medium text-background">
            Бастау →
          </button>
        </Bento>
      )}

      {step === 1 && (
        <Bento className="p-10">
          <h2 className="font-serif text-4xl tracking-tight text-foreground">Сіз туралы қысқаша</h2>
          <p className="mt-2 text-sm text-muted-foreground">Бұл ақпарат тек сіздің құрылғыңызда сақталады.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["Аты-жөні", "Айнұр Н."],
              ["Жасы", "32"],
              ["Қан тобы", "II (A+)"],
              ["Салмағы", "58 кг"],
              ["Бойы", "165 см"],
              ["Аллергия", "Пенициллин"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                <div className="mt-1 text-sm text-foreground">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(0)} className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground">← Артқа</button>
            <button onClick={() => setStep(2)} className="rounded-full bg-[color:var(--mint)] px-6 py-2.5 text-sm font-medium text-background">Жалғастыру →</button>
          </div>
        </Bento>
      )}

      {step === 2 && (
        <Bento className="p-10">
          <h2 className="font-serif text-4xl tracking-tight text-foreground">Мақсаттарыңыз?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Бірнешеуін таңдауға болады. AI кеңестері осыған қарай икемделеді.</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {[
              "🩸 Анемиядан айығу", "💤 Ұйқы сапасы", "⚖️ Салмақ басқару",
              "🍎 Дұрыс тамақтану", "🏃 Спорт формасы", "🧘 Стрессті азайту",
              "💊 Дәрі-дәрмек кестесі", "❤️ Жүрек денсаулығы",
            ].map((g) => (
              <button key={g} onClick={() => toggle(g)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${goals.includes(g) ? "border-[color:var(--mint)] bg-[color:var(--mint-soft)] text-[color:var(--mint)]" : "border-border bg-surface text-foreground hover:border-white/15"}`}>
                {g}
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Badge tone="mint">{goals.length} таңдалды</Badge>
            <span className="text-[11px] text-muted-foreground">Кез келген уақытта өзгертуге болады</span>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(1)} className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground">← Артқа</button>
            <Link to="/" className="rounded-full bg-[color:var(--mint)] px-6 py-2.5 text-sm font-medium text-background">
              SauBol-ға кіру →
            </Link>
          </div>
        </Bento>
      )}
    </div>
  );
}
