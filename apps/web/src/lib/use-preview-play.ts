"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Когда играть превью:
 * — мышь: только при наведении/фокусе;
 * — тач: когда карточка в центральной полосе экрана (одновременно играет 1–2 штуки).
 */
export function usePreviewPlay<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [hover, setHover] = useState(false);
  const [centered, setCentered] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    setTouch(mq.matches);
    const on = () => setTouch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!touch || !ref.current) return;
    const io = new IntersectionObserver(([e]) => setCentered(e.isIntersecting), {
      rootMargin: "-42% 0px -42% 0px",
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [touch]);

  return {
    ref,
    playing: touch ? centered : hover,
    bind: {
      onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && setHover(true),
      onPointerLeave: () => setHover(false),
      onFocus: () => setHover(true),
      onBlur: () => setHover(false),
    },
  };
}
