"use client";

import { useEffect, useState } from "react";

/** true, когда прелоадер ушёл — момент для входных анимаций экрана */
export function useAppReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if ((window as Window & { __lkReady?: boolean }).__lkReady) return setReady(true);
    const on = () => setReady(true);
    window.addEventListener("lumenkit:ready", on, { once: true });
    return () => window.removeEventListener("lumenkit:ready", on);
  }, []);
  return ready;
}
