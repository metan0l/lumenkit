/** Ключ выбора темы в браузере */
export const THEME_KEY = "lumenkit:theme";

/** Вставляется в <head> серверным layout — ставит тему до первой отрисовки */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
