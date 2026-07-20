import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "kk" | "ru" | "en";

type Dict = Record<string, { kk: string; ru: string; en: string }>;

export const T: Dict = {
  // Nav
  "nav.labs": { kk: "Анализдер", ru: "Анализы", en: "Lab Analysis" },
  "nav.labs.sub": { kk: "BioSign AI", ru: "BioSign AI", en: "BioSign AI" },
  "nav.nutri": { kk: "Тамақ & Калория", ru: "Еда и Калории", en: "Nutrition & Calories" },
  "nav.nutri.sub": { kk: "SmartNutri", ru: "SmartNutri", en: "SmartNutri" },
  "nav.voice": { kk: "Аудио Сұхбат", ru: "Аудио Чат", en: "Voice Triage" },
  "nav.voice.sub": { kk: "Triage Voice", ru: "Triage Voice", en: "Triage Voice" },
  "nav.rx": { kk: "Дәрілер", ru: "Лекарства", en: "Rx Clarify" },
  "nav.rx.sub": { kk: "RxClarify", ru: "RxClarify", en: "RxClarify" },
  "nav.status": { kk: "Барлық жүйе қалыпты", ru: "Все системы в норме", en: "All systems nominal" },

  // Common
  "common.showDetails": { kk: "Толығырақ көрсету", ru: "Показать подробный разбор", en: "Show full breakdown" },
  "common.hideDetails": { kk: "Жасыру", ru: "Скрыть", en: "Hide details" },
  "common.upload": { kk: "Жүктеу", ru: "Загрузить", en: "Upload" },
  "common.browse": { kk: "Таңдау", ru: "Обзор", en: "Browse" },
  "common.export": { kk: "PDF экспорт", ru: "Экспорт PDF", en: "Export PDF" },
  "common.reanalyze": { kk: "Қайта талдау", ru: "Пере-анализ", en: "Re-analyze" },
  "common.recent": { kk: "Соңғы жүктеулер", ru: "Недавние загрузки", en: "Recent uploads" },

  // Labs
  "labs.eyebrow": { kk: "BioSign AI · Панель № LP-24817", ru: "BioSign AI · Панель № LP-24817", en: "BioSign AI · Panel No. LP-24817" },
  "labs.title": { kk: "Қан талдауын түсіндіру", ru: "Разбор анализа крови", en: "Blood Panel Analysis" },
  "labs.desc": { kk: "Оқылды 20.07.2026 · Invivo Талдықорған · Пациент Айнұр Н., 32 ж.", ru: "Прочитано 20.07.2026 · Invivo Талдыкорган · Пациент Айнур Н., 32 г.", en: "Read Jul 20, 2026 · Invivo Taldykorgan · Patient Ainur N., 32 y.o." },
  "labs.drop": { kk: "Талдау есебін тастаңыз — PDF, JPG, PNG", ru: "Перетащите отчёт — PDF, JPG, PNG", en: "Drop lab report — PDF, JPG, PNG" },
  "labs.dropSub": { kk: "Invivo, Olymp, Helix, KDL форматтары · OCR + LOINC", ru: "Invivo, Olymp, Helix, KDL · OCR + LOINC", en: "Invivo, Olymp, Helix, KDL formats · OCR + LOINC" },
  "labs.key": { kk: "Негізгі көрсеткіштер", ru: "Ключевые показатели", en: "Key Indicators" },
  "labs.keySub": { kk: "4 маңызды + жалпы қорытынды", ru: "4 главных + сводка", en: "4 primary + summary" },
  "labs.summary": { kk: "AI диагностикалық қорытынды", ru: "AI диагностическое заключение", en: "AI Diagnostic Summary" },
  "labs.summarySub": { kk: "14.2M панельмен салыстырылды", ru: "Сверено с 14.2М панелей", en: "Cross-referenced with 14.2M panels" },
  "labs.diagTitle": { kk: "Анемия қаупі жоғары", ru: "Высокий риск анемии", en: "High Anemia Risk" },
  "labs.diagSub": { kk: "Темір тапшылығы, микроцитарлы гипохромды үлгі", ru: "Железодефицит, микроцитарный гипохромный паттерн", en: "Iron-deficiency, microcytic hypochromic pattern" },

  // Nutrition
  "nutri.eyebrow": { kk: "SmartNutri · Тамақ №03", ru: "SmartNutri · Приём №03", en: "SmartNutri · Meal 03" },
  "nutri.title": { kk: "Тағамды сканерлеу", ru: "Сканирование еды", en: "Nutrition Scan" },
  "nutri.desc": { kk: "«Куырылған тауық бургер + газдалған су» · 12:47", ru: "«Жареный куриный бургер + газировка» · 12:47", en: "«Fried chicken burger + soda» · scanned 12:47" },
  "nutri.hero": { kk: "Камера немесе штрих-кодты сканерлеңіз", ru: "Наведите камеру или отсканируйте штрих-код", en: "Point camera or scan barcode" },
  "nutri.heroSub": { kk: "AI макронутриенттерді, консерванттарды және медициналық қайшылықтарды анықтайды", ru: "AI распознает макронутриенты, консерванты и мед. противопоказания", en: "AI detects macros, preservatives and medical contraindications" },
  "nutri.photo": { kk: "Фото", ru: "Фото", en: "Photo" },
  "nutri.barcode": { kk: "Штрих-код", ru: "Штрих-код", en: "Barcode" },
  "nutri.log": { kk: "Күнделікке қосу", ru: "Записать", en: "Log meal" },
  "nutri.calRing": { kk: "Күнделікті калория", ru: "Дневные калории", en: "Daily Calories" },
  "nutri.restr": { kk: "Медициналық шектеу", ru: "Медицинское ограничение", en: "Medical Restriction" },
  "nutri.flagged": { kk: "Белгіленген ингредиенттер", ru: "Отмеченные ингредиенты", en: "Flagged Ingredients" },
  "nutri.restrMsg": { kk: "Қант пен натрий рұқсат етілген шектен асып тұр — 3 диагноз бойынша тыйым салынған.", ru: "Сахар и натрий превышают лимит — запрещено при 3 диагнозах.", en: "Sugar and sodium exceed limits — forbidden for 3 diagnoses." },

  // Voice
  "voice.eyebrow": { kk: "Triage Voice · Сессия #TR-4419", ru: "Triage Voice · Сессия #TR-4419", en: "Triage Voice · Session #TR-4419" },
  "voice.title": { kk: "Дауыстық жедел кеңес", ru: "Голосовая экстренная консультация", en: "Emergency Voice Consultation" },
  "voice.desc": { kk: "Тірі симптом жинау · KZ / RU / EN · v4.2 · 220 мс", ru: "Живой захват симптомов · KZ / RU / EN · v4.2 · 220 мс", en: "Live symptom capture · KZ / RU / EN · v4.2 · 220 ms" },
  "voice.tap": { kk: "Симптомды айтыңыз — басып сөйлеңіз", ru: "Скажите симптом — нажмите и говорите", en: "Tap and speak your symptom" },
  "voice.rec": { kk: "Жазу · 00:47 · қазақ тілі", ru: "Запись · 00:47 · казахский", en: "Recording · 00:47 · Kazakh detected" },
  "voice.pause": { kk: "Кідірту", ru: "Пауза", en: "Pause" },
  "voice.dialogue": { kk: "Диалог алдын ала қарау", ru: "Превью диалога", en: "Dialogue Preview" },
  "voice.emergency": { kk: "103 Жедел жәрдем", ru: "103 Скорая помощь", en: "103 Emergency" },
  "voice.dispatched": { kk: "GPS координаттар жіберілді", ru: "GPS координаты отправлены", en: "GPS dispatched" },

  // Rx
  "rx.eyebrow": { kk: "RxClarify · Рецепт № 2026-0472", ru: "RxClarify · Рецепт № 2026-0472", en: "RxClarify · Rx No. 2026-0472" },
  "rx.title": { kk: "Рецептті ашу және қауіпсіздік", ru: "Расшифровка рецепта", en: "Prescription Decoder" },
  "rx.desc": { kk: "Қолжазба оқылды · 7 дәрі · 2 өзара әсер белгісі", ru: "Почерк расшифрован · 7 препаратов · 2 флага взаимодействий", en: "Handwriting decoded · 7 drugs · 2 interaction flags" },
  "rx.drop": { kk: "Рецепт суретін тастаңыз", ru: "Перетащите фото рецепта", en: "Drop prescription photo" },
  "rx.dropSub": { kk: "Қолжазба OCR + фармацевт растайды", ru: "OCR почерка + верификация фармацевтом", en: "Handwriting OCR + pharmacist verification" },
  "rx.schedule": { kk: "24 сағаттық қабылдау кестесі", ru: "Расписание приёма 24 ч", en: "24-Hour Drug Schedule" },
  "rx.interaction": { kk: "Өзара қауіпті әсер", ru: "Опасное взаимодействие", en: "Drug Interaction Warning" },
  "rx.toxic": { kk: "УЫТТЫ КОМБИНАЦИЯ АНЫҚТАЛДЫ! Аспирин мен Ибупрофенді бірге ішпеңіз — асқазан жарасынан қан кету қаупі жоғары.", ru: "ОБНАРУЖЕНА ТОКСИЧНАЯ КОМБИНАЦИЯ! Не принимайте Аспирин и Ибупрофен одновременно — высокий риск язвенного кровотечения.", en: "TOXIC COMBINATION DETECTED! Do NOT take Aspirin with Ibuprofen simultaneously — high risk of stomach ulcer bleeding." },
};

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "kk", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("kk");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("saubol.lang") as Lang | null) : null;
    if (saved === "kk" || saved === "ru" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("saubol.lang", l); } catch { /* noop */ }
  };
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang() { return useContext(LangCtx); }
export function useT() {
  const { lang } = useLang();
  return (key: keyof typeof T | string): string => {
    const entry = T[key as string];
    return entry ? entry[lang] : (key as string);
  };
}

export function LangSwitcher() {
  const { lang, setLang } = useLang();
  const opts: { k: Lang; label: string }[] = [
    { k: "kk", label: "ҚАЗ" },
    { k: "ru", label: "РУС" },
    { k: "en", label: "ENG" },
  ];
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-surface p-0.5 text-[11px] font-medium">
      {opts.map((o) => (
        <button
          key={o.k}
          onClick={() => setLang(o.k)}
          className={`px-2 py-0.5 rounded-[5px] tracking-wider transition ${
            lang === o.k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
