# SauBol AI — Cloud + AI + Family linking

Бұл қадамда сайт нағыз "толыққанды" қосымшаға айналады: Lovable Cloud (аутентификация, дерекқор, файл сақтау, realtime) + AI Gateway (тамақ фотосы, штрих-код, дауыс кеңесі).

## 1. Lovable Cloud (бэкенд)
Cloud қосамын — Supabase астында, бірақ пайдаланушыға жасырын.
- **Auth**: email + пароль, **email растау міндетті**.
- **Storage bucket** `food-photos` — тамақ суреттерін сақтау.

## 2. Дерекқор кестелері
- `profiles` — `id (auth.users)`, `username` (уник), `public_id` (қысқа код, мыс. `SB-8F3K`), `full_name`, `age`, `height`, `weight`, `blood_type`, `allergies`, `avatar_url`, `role` ('parent' | 'child' | 'user').
- `friendships` — `user_id`, `friend_id`, `status` ('pending'|'accepted').
- `family_links` — `parent_id`, `child_id`, `status`. Ата-ана баланың `public_id`-і бойынша шақырады.
- `food_logs` — `user_id`, `photo_url`, `name`, `calories`, `carbs`, `protein`, `fat`, `warning`, `created_at`.
- `medication_logs` — `user_id`, `name`, `time`, `taken`, `created_at`.
- RLS: өз деректері + ата-ана балалардың деректерін көру (family_links арқылы).
- Realtime: `food_logs` + `medication_logs` — ата-ана экраны автоматты жаңарады.

## 3. AI функциялары (server functions, `openai/gpt-5.5`)
- `analyzeFoodPhoto` — сурет → JSON `{name, calories, carbs, protein, fat, warning}`. Warning пайдаланушының аллергиясына/шектеулеріне қарай жасалады.
- `analyzeBarcode` — штрих-код нөмірі → тамақ атауы + КБЖУ (AI + жалпы білім).
- `triageChat` — стриминг чат: симптомдарға нақты жауап, кеңес береді, шұғыл жағдайда 103 ұсынады. Қазақша/орысша/ағылшынша.

## 4. Беттердегі өзгерістер

### `/nutrition-scan`
Оң жақта, Summary блогының жанында **2 шағын блок үстіңгі-астыңғы**:
1. **📷 Тамақ фотосы** — файл жүктеу немесе камерадан түсіру → AI КБЖУ анықтайды → Summary-ге қосылады.
2. **🔲 Штрих-код** — код енгізу/скан → AI анықтайды → қосылады.
Ескерту (warning) пайдаланушының нақты жеген нәрсесіне сай өзгереді.

### `/triage-voice`
Чатта AI **шын жауап береді** (стриминг, GPT-5.5). Пайдаланушының жазғанын түсінеді, симптомдарды талдап нақты кеңес береді.

### `/profile`
- **"Өңдеу" батырмасы толық жұмыс істейді**: modal ашылады, барлық өрістерді (аты, жасы, бойы, салмағы, қан тобы, аллергия) өзгертуге болады.
- **Аватар жүктеу** — Storage-қа сақталады.
- Жаңа виджеттер: **Достар тізімі** (username бойынша қосу), **Менің Public ID** (көшірмелеу), **Отбасы мүшелері** (ата-ана — балалар тізімі, шақыру Public ID арқылы).

### `/family`
Ата-ана өз шақырған балаларының нақты `food_logs` + `medication_logs` деректерін көреді (realtime жаңару). Бала бір нәрсе тіркесе — ата-ана экранында бірден пайда болады.

### Кіру беті `/auth`
- Тіркелу (email + пароль + username) — **email растау керек**.
- Кіру.
- Қорғалған беттер (`/family`, `/profile`, `/nutrition-scan`, т.б.) — `_authenticated` layout астына көшеді.
- Home (`/`) — публичный landing + Кіру CTA.

## 5. Realtime синхрондау
`food_logs` кестесіне Supabase realtime subscription. Ата-ана Family бетінде отырса, бала тамақ тіркегенде — экраны жаңарады.

## 6. Техникалық ескертпе
- Барлық AI шақырулар `createServerFn` арқылы, `LOVABLE_API_KEY` сервер жағында.
- Camera API — `<input type="file" accept="image/*" capture="environment">` (жүктеу де, түсіру де).
- Штрих-код: MVP-де қолмен код енгізу + AI іздеу; толық сканер (BarcodeDetector API) қосымша.
- Notifications (дәрі еске салу) — қазір бар күйінде қалады.

---

Бұл жұмыс шамамен **6–8 файл** құру + **8–10 файл** өзгерту қажет етеді. Ұзақтау болады, бірақ соңында сайт нағыз өнім деңгейінде болады.

**Растасаңыз — жасауды бастаймын.**
