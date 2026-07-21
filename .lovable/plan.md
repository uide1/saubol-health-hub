# SauBol AI — Заманауи қайта дизайн + жаңа функциялар

## 1. Жаңа визуалды бағыт (Modern 2026 Health-Tech)

Қазіргі "quiet luxury dark" стилінен келесі заманауи бағытқа көшеміз:

**Aesthetic:** Editorial Bento + Soft Clinical
- **Фон:** Ашық сүт-ақ (`#FAFAF7`) + терең көмір бөлімдер (`#0A0A0A`) — контрастты dual-tone
- **Accent:** Медициналық жасыл-мята (`#00D4A8`) + жылы қызғылт-сары акцент (`#FF6B4A`) сирек қолданылады
- **Типографика:** Instrument Serif (headlines, editorial сезім) + Geist Sans (UI/body) + Geist Mono (data)
- **Layout:** Bento grid карточкалары, асимметриялық, үлкен ақ орын, әр карточка өз "тынысымен"
- **Микро-детальдар:** Жұмсақ noise texture, subtle spring animations (Motion), hover-да lift эффект, animated numbers (count-up), скролл-параллакс
- **Иконкалар:** Lucide + арнайы SVG медициналық пиктограммалар
- **Radius:** Үлкен (rounded-3xl карточкалар), pill-shape батырмалар

Бұл 2026 жылғы Linear + Vercel + Arc Browser + Apple Health эстетикасына жақын, ал "SauBol" бренд-идентификациясы медициналық + жылы болып қалады.

## 2. Жаңа модульдер (4 таңдалған идея)

### A. AI Doctor Chat (`/chat`)
- Streaming чат интерфейсі (AI SDK + Lovable AI Gateway, `openai/gpt-5.5`)
- AI Elements компоненттері: Conversation, Message, PromptInput, Shimmer
- Симптом енгізу → триаж, ықтимал диагноздар, ұсыныстар (mock disclaimer-мен)
- Жылдам-старт "чипс" батырмалары ("Бас ауырады", "Дене қызуы 38", т.б.)
- Тарихсыз, бір сеанс (localStorage-те соңғы сұхбат)

### B. Dashboard / Басты панель (`/`)
- Жаңа home page — bento grid
- Виджеттер: денсаулық индексі (0-100 gauge), 4 модульге жылдам сілтеме, соңғы 3 сканер, апталық тренд-график (Recharts), келесі дәрі-дәрмек еске салуы, күнделікті ақыл-кеңес
- Animated hero: SauBol logo + "Сіздің денсаулығыңыз, жасанды интеллектпен"

### C. Профиль + Тарих (`/profile`)
- Пайдаланушы карточкасы (аватар, жас, қан тобы, аллергиялар)
- Барлық сканерлер тарихы (талдаулар, тамақ, дауыс, дәрі) — filter/tabs
- PDF экспорт батырмасы (mock)
- Ешбір auth емес — жергілікті mock профиль (тек фронтенд)

### D. Онбординг + Hero лендинг (`/welcome`)
- 3-қадамды онбординг: тіл таңдау → негізгі мәлімет → мақсат
- Editorial hero: үлкен serif headline, өнім карусель-скрин демо, "Бастау" CTA
- Соңында `/` (dashboard) бетіне бағыттайды

## 3. Навигация мен құрылым

Жаңа маршруттар (TanStack Start file-based):
```
src/routes/
  __root.tsx           → жаңа floating glass navbar + Instrument Serif logo
  index.tsx            → Dashboard (жаңа)
  welcome.tsx          → Онбординг + hero
  chat.tsx             → AI Doctor Chat
  profile.tsx          → Профиль + тарих
  nutrition-scan.tsx   → редизайн (жаңа стильге)
  triage-voice.tsx     → редизайн
  prescription-rx.tsx  → редизайн
```

Барлық 4 бар модуль жаңа дизайн-жүйеге көшіріледі (түстер, типографика, bento layout).

## 4. Техникалық детальдар

- **Lovable Cloud** іске қосылады → AI Doctor Chat серверлік маршруты үшін (`src/routes/api/chat.ts`) + `LOVABLE_API_KEY`
- **AI SDK + AI Elements** орнатылады: `bun add ai @ai-sdk/react @ai-sdk/openai-compatible zod` + `bunx ai-elements@latest add conversation message prompt-input shimmer`
- **Motion** (framer-motion) орнатылады — микро-анимация үшін
- **Recharts** орнатылады — dashboard графиктері үшін
- **Google Fonts** (Instrument Serif, Geist) `__root.tsx` head-те `<link>` арқылы
- `src/styles.css` толықтай қайта жазылады — жаңа semantic токендер (light + optional dark)
- `src/components/ui-kit.tsx` жаңа bento карточкалары, gauge, stat block, chip, timeline компоненттерімен толықтырылады
- Барлық 4 бар бет мазмұны сақталады (казак тіліндегі клиникалық mock деректер), тек презентация қабаты жаңа стильге ауыстырылады
- SEO: әр route жеке `head()` — title, description, og:title, og:description

## 5. Не өзгермейді
- Қазіргі казак тіліндегі клиникалық mock деректер (қан анализі, тамақ, дауыс, дәрі-дәрмек өзара әрекеттесуі) — сол күйде қалады
- Бренд аты "SauBol AI" — сол
- Барлық жұмыс frontend + бір AI серверлік маршрут; нағыз медициналық база жоқ

## Күтілетін нәтиже
8 бет (dashboard, welcome, chat, profile + 4 модуль), заманауи editorial-bento стиль, жұмыс істейтін AI дәрігер чаты, барлық ескі мазмұн сақталған және жаңа стильде.