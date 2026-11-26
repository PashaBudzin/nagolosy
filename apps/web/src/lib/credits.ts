export interface CreditItem {
  name: string
  description: string
  url?: string
  license?: string
  licenseUrl?: string
  note?: string
}

export interface CreditSection {
  title: string
  items: CreditItem[]
}

const MIT = { license: "MIT", licenseUrl: "https://opensource.org/license/mit" }
const APACHE = {
  license: "Apache-2.0",
  licenseUrl: "https://www.apache.org/licenses/LICENSE-2.0",
}
const OFL = {
  license: "SIL Open Font License 1.1",
  licenseUrl: "https://openfontlicense.org/",
}

export const CREDIT_SECTIONS: CreditSection[] = [
  {
    title: "Тести НМТ і ЗНО",
    items: [
      {
        name: "Український центр оцінювання якості освіти (УЦОЯО)",
        description:
          "Офіційні тести минулих років, демонстраційні й пробні варіанти НМТ, програми та характеристики предметних тестів.",
        url: "https://testportal.gov.ua/testy-mynulyh-rokiv/",
        note: "Використання матеріалів сайту передбачає посилання на УЦОЯО.",
      },
      {
        name: "Львівський регіональний центр оцінювання якості освіти",
        description:
          "Архів завдань ЗНО 2006–2021 та НМТ 2022–2026, демотести й психометричні дані.",
        url: "https://lv.testportal.gov.ua/?page_id=229",
      },
      {
        name: "ZNO-Eval (NLPForUA)",
        description:
          "Структурована колекція реальних завдань ЗНО/НМТ із відповідями, метаданими й розміткою тем.",
        url: "https://github.com/NLPForUA/ZNO",
        license: "Анотації — CC BY 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        note: "Автори колекції не ліцензують самі завдання (третя сторона — УЦОЯО). Використання в освітніх цілях із зазначенням джерела.",
      },
      {
        name: "ЗНО-ОНЛАЙН (Освіта.ua) — англійська мова",
        description:
          "Варіанти НМТ і ЗНО з англійської мови 2009–2026 років разом із відповідями та зображеннями до завдань.",
        url: "https://zno.osvita.ua/english/",
        note: "Використовуються в некомерційних освітніх цілях.",
      },
      {
        name: "Публікація ZNO-Eval",
        description:
          "Syromiatnikov, M. V., Ruvinskaya, V. M., Troynina, A. S. ZNO-Eval: Benchmarking reasoning capabilities of large language models in Ukrainian. Informatics. Culture. Technology, 2024.",
        url: "https://doi.org/10.48550/arXiv.2501.06715",
      },
    ],
  },
  {
    title: "Навчальні матеріали",
    items: [
      {
        name: "Освіта.ua — Історія України: тренувальні матеріали",
        description:
          "Зображення історичних діячів, пам'яток і творів для режиму «Візуальні».",
        url: "https://osvita.ua/test/training/history/",
        note: "Права на зображення належать їхнім власникам.",
      },
      {
        name: "Український правопис (2019)",
        description:
          "Норми правопису, що використані в добірках слів і фразеологізмів.",
        url: "https://uk.wikipedia.org/wiki/%D0%A3%D0%BA%D1%80%D0%B0%D1%97%D0%BD%D1%81%D1%8C%D0%BA%D0%B8%D0%B9_%D0%BF%D1%80%D0%B0%D0%B2%D0%BE%D0%BF%D0%B8%D1%81",
      },
      {
        name: "Перелік слів із нормативним наголосом",
        description:
          "Додаток до програми з української мови і літератури (наказ МОН України № 696 від 26.06.2018) — основа для тренера наголосів НМТ.",
      },
      {
        name: "Словник української мови",
        description:
          "Пояснення значень слів і фразеологізмів, використані в добірці «Фразеологізми НМТ».",
        url: "https://sum20ua.com/",
      },
      {
        name: "Програма ЗНО з історії України",
        description:
          "Тематичний поділ історичних дат та перелік термінів для тренерів «Історія дати» й «Історичні терміни НМТ».",
        url: "https://testportal.gov.ua/",
      },
    ],
  },
  {
    title: "Шрифти",
    items: [
      {
        name: "Inter Variable",
        description: "Основний шрифт інтерфейсу.",
        url: "https://fontsource.org/fonts/inter",
        ...OFL,
      },
      {
        name: "Public Sans Variable",
        description: "Додатковий шрифт заголовків.",
        url: "https://fontsource.org/fonts/public-sans",
        ...OFL,
      },
      {
        name: "Noto Serif Variable",
        description: "Шрифт для завдань і навчальних текстів.",
        url: "https://fontsource.org/fonts/noto-serif",
        ...OFL,
      },
    ],
  },
  {
    title: "Технології",
    items: [
      {
        name: "React",
        description: "Бібліотека інтерфейсу.",
        url: "https://react.dev/",
        ...MIT,
      },
      {
        name: "React Router",
        description: "Маршрутизація SPA.",
        url: "https://reactrouter.com/",
        ...MIT,
      },
      {
        name: "Base UI",
        description: "Примітиви інтерфейсу (@base-ui/react).",
        url: "https://base-ui.com/",
        ...MIT,
      },
      {
        name: "Remix Icon",
        description: "Іконки (@remixicon/react).",
        url: "https://remixicon.com/",
        license: "Remix Icon License 1.0",
        licenseUrl: "https://remixicon.com/license",
      },
      {
        name: "Tailwind CSS",
        description: "Стилізація, включно з @tailwindcss/vite.",
        url: "https://tailwindcss.com/",
        ...MIT,
      },
      {
        name: "shadcn/ui",
        description: "Конвенції компонентів і теми.",
        url: "https://ui.shadcn.com/",
        ...MIT,
      },
      {
        name: "Class Variance Authority",
        description: "Варіанти стилів компонентів.",
        url: "https://cva.style/docs",
        ...APACHE,
      },
      {
        name: "clsx та tailwind-merge",
        description: "Утиліта cn() для об'єднання класів.",
        url: "https://github.com/dcastil/tailwind-merge",
        ...MIT,
      },
      {
        name: "tw-animate-css",
        description: "Анімації для Tailwind CSS.",
        url: "https://www.npmjs.com/package/tw-animate-css",
        ...MIT,
      },
      {
        name: "lucide-react",
        description: "Додаткові іконки.",
        url: "https://lucide.dev/",
        license: "ISC",
        licenseUrl: "https://opensource.org/license/isc",
      },
      {
        name: "Express",
        description: "HTTP-сервер для API та статики.",
        url: "https://expressjs.com/",
        ...MIT,
      },
      {
        name: "ws",
        description: "WebSocket-з'єднання для групових змагань.",
        url: "https://github.com/websockets/ws",
        ...MIT,
      },
      {
        name: "Vite та Vitest",
        description: "Збірка й тестування.",
        url: "https://vite.dev/",
        ...MIT,
      },
      {
        name: "TypeScript",
        description: "Мова розробки.",
        url: "https://www.typescriptlang.org/",
        ...APACHE,
      },
      {
        name: "Turborepo",
        description: "Оркестрація monorepo-завдань.",
        url: "https://turbo.build/",
        ...MIT,
      },
    ],
  },
]
