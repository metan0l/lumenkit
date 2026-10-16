# Принципы UI Montage (исследование 2026-10-12)

Пометки: **[проверено]** — по первоисточнику, **[вторично]** — по пересказам, **[оценка]** — наше решение.

## Ориентиры

| Что | Откуда берём |
|---|---|
| Оболочка: сворачиваемый сайдбар, плавающий нижний бар на мобиле | Vercel Dashboard (редизайн 02.2026) [проверено] |
| Приглушённый сайдбар, тёплый нейтральный серый, меньше рамок и иконок | Linear (03.2026) [проверено] |
| Живые индикаторы задач в сайдбаре, цена/скорость у моделей, мобилка как отдельный продукт, без задержек переходов | Krea (03.2026) [проверено] |
| Редактор в три панели, сворачиваемых | Frame.io V4 [проверено] |
| Разделы по задачам: Создать / Проекты / Пресеты | Midjourney web [вторично] |
| Правила анимаций | Emil Kowalski, Rauno Freiberg, Vercel Web Interface Guidelines [проверено] |

## Правила

### Навигация
1. Десктоп: сайдбар сворачивается до иконок и приглушён относительно рабочей области. Мобильная версия: плавающий нижний бар (Проекты · Библиотека · Создать · Вставки · Профиль) с safe-area.
1a. Сценарий prompt-first: пользователь прикрепляет свой готовый ролик и пишет промпт. Пресеты из библиотеки — это **примеры**: их перетаскивают в промпт (на таче — кнопка «+»), они становятся чипами. Без ролика промпт создаёт вставку.
2. Мобильная раскладка проектируется отдельно, а не сжимается из десктопа. Настройки пресета, экспорт и чат открываются в нижних шторках (sheet), закрываются свайпом.
3. ⌘K / Ctrl+K (shadcn `Command` / `cmdk`) для навигации и действий. **Открывается без анимации.**
4. Живой индикатор очереди (рендер, генерации) и баланс кредитов всегда на виду. Прогресс приходит через SSE.
5. Состояние хранится в URL: табы, фильтры галереи, выбранный блок.
6. Редактор: чат/промпт | Player 9:16 | параметры. Панели сворачиваются, второстепенное скрыто, пока не нужно.

### Анимации (UI сайта, `motion/react`)
7. Микроинтеракции 120–200 мс, модалки и шторки ≤300 мс. Дольше 300 мс в UI не бывает, исключение — лендинг.
8. Кривые: `--ease-out: cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out: cubic-bezier(0.65,0,0.35,1)`, `--ease-drawer` (Vaul) для шторок.
9. Пружины без отскока: `{ type: "spring", visualDuration: 0.24, bounce: 0 }` (токены `springs.*` в `lib/motion.ts`).
10. Анимируем только `transform` и `opacity`. Никогда `transition: all`. Масштаб не ниже `scale ≥ 0.9`. `transform-origin` ставим от источника.
11. Нажатие: `scale(0.97)`. Частые и клавиатурные действия не анимируем. Тултип с задержкой только первый.
12. `prefers-reduced-motion` → fade вместо сдвигов. `prefers-reduced-transparency` → сплошной фон вместо blur.
13. Скелетон повторяет разметку, появляется через 150–300 мс и держится минимум 300–500 мс. Переименование, замена пресета и удаление — оптимистичные, с Undo.
14. View Transitions (переход карточка → редактор) только за флагом: в Next 16.2 это ещё experimental.
15. `layout`/`layoutId` — для таймлайна и индикатора активного таба, но не для больших сеток.

### Производительность
16. Сетки проектов и пресетов: постер (WebP/AVIF), `<video preload="none">`, `aspect-ratio: 9/16`. От 50 элементов — виртуализация или `content-visibility: auto`.
17. Превью при наведении (hover-scrub) — по спрайт-листу, который генерируется при транскоде. На таче превью включается долгим нажатием или когда карточка в центре экрана. Одновременно играют не больше 1–2 видео.
18. Remotion Player и тяжёлые панели грузятся лениво (`next/dynamic`). Waveform и расчёты таймлайна — в Web Worker.
19. INP ≤ 200 мс на среднем Android: `startTransition`, `scheduler.yield()`, `useDeferredValue` для поиска. Поле мерим через web-vitals → Sentry.
20. Blur только на маленьких закреплённых поверхностях (шапка, нижний бар). На `(hover: none)` уменьшаем или отключаем.

### Визуал
21. **Дизайн-система — тёмный минимализм** по референсам владельца (`design/refs/editor-dark-ref.jpg`, `design/refs/playground-minimal-ref.png`, решение 2026-10-14; Factory отклонён): почти чёрный холст `#0a0a0b`, мягкие нейтральные панели `#141416` / `#1c1c1f` / `#26262a`, крупные скругления (10 px кнопки, 14 px чипы, 20 px плавающие панели, 36 px большая рамка), много воздуха. Синий акцент `#3b7bff` — только «Экспорт», AI-действия (градиентные иконки), активный инструмент. Главная нейтральная кнопка — светлая (`#f4f4f5`), отправка промпта — круглая. Оболочка: узкая колонка иконок слева с белым «+», справа сверху — очередь, кредиты, аватар. Редактор: колонка инструментов → плавающая панель → видео → настройки, снизу тулбар (undo/redo, ножницы, таймкод чч:мм:сс:кк + Play, масштаб) и таймлайн с лентой кадров, цветными клипами и зелёной волной звука.
22. Шрифты: интерфейс — **Inter** 400/500/600; моноширинный Geist Mono — только цифры (таймкоды, кредиты, счётчики). Шрифты пресетов (Oswald/Montserrat/Unbounded/Onest) — контент роликов, не UI.
23. `color-scheme: dark`, `theme-color`. Тема ставится до первой отрисовки, без вспышки.
24. Хит-зоны ≥24 px на десктопе и ≥44 px на таче. Поля ввода на мобиле ≥16 px. Обязательны `:focus-visible` и `touch-action: manipulation`.
25. Перед сдачей экрана: скриншот, мобильная ширина, 4× CPU throttling, сверка с этим файлом и [competitors.md](competitors.md).

## Галереи для визуальной сверки
- Mobbin (есть записи анимаций): CapCut, Captions, VN, InShot, Runway, Krea, Higgsfield, Linear, Vercel. Паттерны: Bottom sheet, Timeline, Onboarding, Paywall.
- Refero (refero.design): video editor, AI generation, upload, credits.
- screensdesign.com/explore/flows/creating-videos/ — invideo AI, Filmit AI.
- nicelydone.club/apps/runway/components
- godly.website (AI/Dark/Video), land-book.com, saasinterface.com (Billing, Upload, Empty state), darkmodedesign.com

## Источники
- https://emilkowal.ski/ui/great-animations · https://emilkowal.ski/ui/you-dont-need-animations · https://emilkowal.ski/ui/7-practical-animation-tips
- https://rauno.me/craft/interaction-design
- https://vercel.com/design/guidelines · https://vercel.com/changelog/dashboard-navigation-redesign-rollout
- https://linear.app/now/behind-the-latest-design-refresh · https://linear.app/now/how-we-redesigned-the-linear-ui
- https://www.krea.ai/blog/redesign
- https://blog.frame.io/2024/05/21/frame-io-v4-web-app-beta-feature-focus-new-design-smooth-navigation/
- https://motion.dev/docs/react-transitions · https://nextjs.org/docs/app/guides/view-transitions
- https://web.dev/case-studies/trendyol-inp · https://web.dev/case-studies/quintoandar-inp
- https://openclip.app/learn/sprite-sheet · https://imagekit.io/blog/lazy-loading-html-videos
- https://bugzilla.mozilla.org/show_bug.cgi?id=1732817
- https://fontsource.org/fonts/geist/about · https://pimpmytype.com/font/golos/ · https://fonts.google.com/specimen/Unbounded/about
