import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bento, Badge, Chip, SectionEyebrow } from "@/components/ui-kit";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "SauBol AI — Health Feed · Қазақстан денсаулық жаңалықтары" },
      { name: "description", content: "Қазақстандық денсаулық сақтау жаңалықтары, эпидемия ескертулері, ҚР МЗ хабарламалары мен маусымдық ұсыныстар." },
      { property: "og:title", content: "SauBol Health Feed — Қазақстан" },
      { property: "og:description", content: "Тек тексерілген дерек көздерінен жиналған денсаулық жаңалықтары." },
    ],
  }),
  component: FeedPage,
});

type Cat = "all" | "epidemic" | "policy" | "tips" | "pharma";

const ITEMS: { cat: Exclude<Cat, "all">; icon: string; tag: string; title: string; src: string; ago: string; body: string; tone: "muted" | "warning" | "danger" | "mint" | "success" }[] = [
  { cat: "epidemic", icon: "🦠", tag: "Эпидемия", title: "Алматыда маусымдық тұмау белсенділігі 34%-ға өсті", src: "ҚР ДСМ", ago: "2 сағ", tone: "warning",
    body: "Соңғы аптада ЖРВИ жағдайлары артып келеді. Балалар мен қарттарға вакцинация ұсынылады." },
  { cat: "policy", icon: "🏛", tag: "Саясат", title: "Тегін дәрі-дәрмек тізіміне 12 жаңа препарат қосылды", src: "egov.kz", ago: "6 сағ", tone: "mint",
    body: "СҚО тізіміне жүрек-қантамыр және диабет бойынша препараттар енгізілді. Рецепт арқылы қолжетімді." },
  { cat: "tips", icon: "☀️", tag: "Маусым", title: "Күн белсенділігі жоғары — SPF 30+ және ұйық киім", src: "SauBol AI", ago: "Бүгін", tone: "success",
    body: "Шілде айында UV индексі 8-9. 11:00–16:00 аралығында тікелей күн сәулесінен қорғаныңыз." },
  { cat: "pharma", icon: "💊", tag: "Дәріхана", title: "Europharma: Ferrum Lek қоры толықтырылды", src: "europharma.kz", ago: "1 күн", tone: "muted",
    body: "Темір жетіспеушілігі бар пациенттер үшін препарат жақын дәріханаларда қайта бар." },
  { cat: "epidemic", icon: "🌾", tag: "Аллергия", title: "Полиноз маусымы: полынь мен күлте өршуі", src: "Meteo.kz", ago: "1 күн", tone: "warning",
    body: "Оңтүстікте пыльца индексі жоғары. Антигистаминдер туралы дәрігеріңізбен кеңесіңіз." },
  { cat: "tips", icon: "🥗", tag: "Тағам", title: "Қазақстандық асханадағы тұз мөлшері — 2 есе жоғары", src: "ҚазҰМУ", ago: "2 күн", tone: "danger",
    body: "Күнделікті норма 5 г, ал орташа қазақстандық 12 г тұз тұтынады. Гипертонияға тікелей қауіп." },
  { cat: "policy", icon: "📱", tag: "eGov", title: "eGov Mobile: цифрлық медициналық карта енді PDF форматта", src: "egov.kz", ago: "3 күн", tone: "mint",
    body: "Барлық анализ, вакцина және амбулаторлық жазбаларды бір басумен жүктей аласыз." },
  { cat: "pharma", icon: "⚠️", tag: "Кері шақыру", title: "Nimesulide-B: белгілі бір партия сатудан алынды", src: "ҚР ДСМ", ago: "4 күн", tone: "danger",
    body: "Партия №230412-B — сапа стандарттарынан ауытқу. Қолданушыларға дәріханаға қайтару ұсынылады." },
];

const CATS: { id: Cat; label: string }[] = [
  { id: "all", label: "Барлығы" },
  { id: "epidemic", label: "Эпидемия" },
  { id: "policy", label: "Саясат" },
  { id: "tips", label: "Кеңестер" },
  { id: "pharma", label: "Дәріхана" },
];

function FeedPage() {
  const [cat, setCat] = useState<Cat>("all");
  const items = cat === "all" ? ITEMS : ITEMS.filter((i) => i.cat === cat);
  const featured = items[0];
  const rest = items.slice(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionEyebrow>Health Feed · Қазақстан</SectionEyebrow>
          <h1 className="mt-2 font-serif text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
            Денсаулық <span className="italic text-[color:var(--mint)]">пульсі</span>. Тек тексерілген дерек.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            ҚР ДСМ, ҚазҰМУ, eGov және тексерілген дәріхана торларынан жиналған жаңалықтар.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CATS.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}>
              <Chip active={cat === c.id}>{c.label}</Chip>
            </button>
          ))}
        </div>
      </div>

      {featured && (
        <Bento className="noise relative overflow-hidden">
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone={featured.tone}>{featured.tag}</Badge>
                <span className="text-[11px] text-muted-foreground">{featured.src} · {featured.ago}</span>
              </div>
              <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
                {featured.title}
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">{featured.body}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--mint)] px-4 py-2 text-sm font-medium text-background">
                Толық оқу →
              </button>
            </div>
            <div className="relative hidden items-center justify-center rounded-2xl border border-border bg-surface p-6 md:flex">
              <div className="text-[120px] leading-none">{featured.icon}</div>
              <div className="pointer-events-none absolute -inset-8 bg-[color:var(--mint)]/10 blur-3xl" />
            </div>
          </div>
        </Bento>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((n, i) => (
          <article key={i} className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-white/15">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-xl">{n.icon}</div>
              <Badge tone={n.tone}>{n.tag}</Badge>
            </div>
            <h3 className="mt-4 font-serif text-lg leading-tight text-foreground">{n.title}</h3>
            <p className="mt-2 flex-1 text-[12px] text-muted-foreground line-clamp-3">{n.body}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
              <span>{n.src}</span>
              <span className="transition group-hover:text-[color:var(--mint)]">{n.ago} →</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
