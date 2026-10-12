export const setVisibleInterval = (fn: () => void, ms: number) =>
  window.setInterval(() => {
    if (!document.hidden) fn();
  }, ms);
