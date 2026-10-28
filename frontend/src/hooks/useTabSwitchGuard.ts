import { useEffect, useRef } from "react";

/**
 * Calls `onLeave` once each time the student leaves the quiz: switching to another
 * browser tab, minimising the window, or moving focus to another window or app.
 *
 * Switching tabs fires both `visibilitychange` and `blur`, so leaving is counted once per
 * "away" period and the guard re-arms only after the student is back (tab visible and focused).
 */
export function useTabSwitchGuard(enabled: boolean, onLeave: () => void) {
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;

  useEffect(() => {
    if (!enabled) return;
    let away = false;

    const leave = () => {
      if (away) return;
      away = true;
      onLeaveRef.current();
    };
    const back = () => {
      if (document.visibilityState === "visible" && document.hasFocus()) away = false;
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? leave() : back());

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", leave);
    window.addEventListener("focus", back);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", leave);
      window.removeEventListener("focus", back);
    };
  }, [enabled]);
}
