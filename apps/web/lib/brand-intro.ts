/** Shared clocks for the head bootstrap, hydration, and the CSS fail-open path. */
export const BRAND_INTRO = {
  storageKey: "procodic-intro-v3",
  holdMs: 2600,
  exitMs: 900,
  deadlineMs: 4400,
  failsafeMs: 5500,
} as const;

export const introBootstrap = `try {
  if (!location.pathname.startsWith('/admin') && !sessionStorage.getItem('${BRAND_INTRO.storageKey}') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const root = document.documentElement;
    let locker;
    root.dataset.brandIntro = 'on';
    root.dataset.brandIntroStarted = String(performance.now());
    setTimeout(function () {
      if (root.dataset.brandIntro === 'on' && !root.dataset.brandIntroExit) root.dataset.brandIntroExit = 'on';
    }, ${BRAND_INTRO.deadlineMs});
    setTimeout(function () {
      delete root.dataset.brandIntro;
      delete root.dataset.brandIntroExit;
      delete root.dataset.brandIntroStarted;
      const content = document.getElementById('site-content');
      if (content) { content.inert = false; content.removeAttribute('aria-hidden'); }
      if (locker) locker.disconnect();
    }, ${BRAND_INTRO.failsafeMs});
    const lockPage = function () {
      if (root.dataset.brandIntro !== 'on') { if (locker) locker.disconnect(); return; }
      const content = document.getElementById('site-content');
      if (content) {
        content.inert = true;
        content.setAttribute('aria-hidden', 'true');
        if (locker) locker.disconnect();
      }
    };
    if (typeof MutationObserver !== 'undefined') {
      locker = new MutationObserver(lockPage);
      locker.observe(root, { childList: true, subtree: true });
    }
    lockPage();
    sessionStorage.setItem('${BRAND_INTRO.storageKey}', 'seen');
  }
} catch {}`;
