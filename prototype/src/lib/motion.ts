// Токены анимаций UI сайта. Длительности ≤300 мс (см. design/refs/ui-principles.md).
// Внутри Remotion-композиций это не используется — там только кадры.

export const duration = {
  instant: 0.08,
  fast: 0.15,
  normal: 0.22,
  sheet: 0.3,
} as const;

export const ease = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
} as const;

// Мягкие короткие пружины без отскока
export const springs = {
  ui: { type: "spring", visualDuration: 0.24, bounce: 0 },
  soft: { type: "spring", visualDuration: 0.3, bounce: 0.08 },
  layout: { type: "spring", visualDuration: 0.26, bounce: 0 },
} as const;

export const fadeUp = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 0 },
} as const;

/** Вход экрана: блоки появляются по очереди (заголовок → фильтры → контент), шаг 0,08 с */
export const enter = (i: number) =>
  ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { ...springs.soft, delay: i * 0.08 },
  }) as const;

/** Карточки сетки: короткий каскад после блоков экрана; дальше 8-й карточки не ждём */
export const enterItem = (i: number, after = 2) =>
  ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { ...springs.soft, delay: after * 0.08 + Math.min(i, 8) * 0.035 },
  }) as const;
