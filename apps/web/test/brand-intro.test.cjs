const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const filename = resolve(__dirname, "../lib/brand-intro.ts");
const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { BRAND_INTRO, introBootstrap } = vm.runInNewContext(`${compiled}\nexports;`, { exports: {} }, { filename });

function browser({ pathname = "/", seen = false, reduced = false, storageReadThrows = false, storageWriteThrows = false, contentPresent = true } = {}) {
  const started = 173.5;
  let now = started;
  const timers = [];
  const observers = [];
  const root = { dataset: {} };
  const stored = new Map(seen ? [[BRAND_INTRO.storageKey, "seen"]] : []);
  const attributes = new Map();
  const content = {
    inert: false,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name),
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; this.connected = false; observers.push(this); }
    observe(target, options) { this.target = target; this.options = options; this.connected = true; }
    disconnect() { this.connected = false; }
  }
  const context = vm.createContext({
    location: { pathname },
    document: { documentElement: root, getElementById: id => contentPresent && id === "site-content" ? content : null },
    performance: { now: () => now },
    matchMedia: () => ({ matches: reduced }),
    MutationObserver,
    sessionStorage: {
      getItem: key => {
        if (storageReadThrows) throw new Error("Storage access blocked");
        return stored.get(key) ?? null;
      },
      setItem: (key, value) => {
        if (storageWriteThrows) throw new Error("Storage quota exceeded");
        stored.set(key, value);
      },
    },
    setTimeout: (callback, delay) => {
      timers.push({ callback, at: now + delay });
      return timers.length;
    },
  });
  vm.runInContext(introBootstrap, context, { filename: "brand-intro-bootstrap.js" });
  return {
    started, root, content, attributes, stored, timers, observers,
    mountContent: () => {
      contentPresent = true;
      for (const observer of observers) {
        if (observer.connected) observer.callback([{ type: "childList", target: root }], observer);
      }
    },
    advanceTo: elapsed => {
      const target = started + elapsed;
      timers.sort((a, b) => a.at - b.at);
      while (timers.length && timers[0].at <= target) {
        const timer = timers.shift();
        now = timer.at;
        timer.callback();
      }
      now = target;
    },
  };
}

test("first visit records the shared clock and starts a bounded crossfade without revealing Pip early", () => {
  const page = browser();
  assert.equal(page.root.dataset.brandIntro, "on");
  assert.equal(page.root.dataset.brandIntroStarted, String(page.started));
  assert.equal(page.stored.get(BRAND_INTRO.storageKey), "seen");
  assert.equal(page.content.inert, true);
  assert.equal(page.attributes.get("aria-hidden"), "true");
  assert.equal(page.observers[0].connected, false);
  assert.equal(BRAND_INTRO.holdMs + BRAND_INTRO.exitMs, 3_500);
  assert.deepEqual(page.timers.map(timer => timer.at - page.started), [BRAND_INTRO.deadlineMs, BRAND_INTRO.failsafeMs]);
  page.advanceTo(BRAND_INTRO.deadlineMs - 1);
  assert.equal(page.root.dataset.brandIntroExit, undefined);
  page.advanceTo(BRAND_INTRO.deadlineMs);
  assert.equal(page.root.dataset.brandIntroExit, "on");
  assert.equal(page.root.dataset.brandIntro, "on");
  assert.equal(page.root.dataset.brandIntroStarted, String(page.started));
});

test("hard fallback clears the overlay and releases content even without hydration completing", () => {
  const page = browser();
  assert.equal(page.content.inert, true);
  assert.equal(page.attributes.get("aria-hidden"), "true");
  page.advanceTo(BRAND_INTRO.failsafeMs - 1);
  assert.equal(page.root.dataset.brandIntro, "on");
  assert.equal(page.content.inert, true);
  page.advanceTo(BRAND_INTRO.failsafeMs);
  assert.deepEqual(page.root.dataset, {});
  assert.equal(page.content.inert, false);
  assert.equal(page.attributes.has("aria-hidden"), false);
  assert.equal(page.timers.length, 0);
});

test("late streamed content is locked before hydration and released by the hard fallback", () => {
  const page = browser({ contentPresent: false });
  assert.equal(page.content.inert, false);
  assert.equal(page.observers[0].connected, true);
  assert.equal(page.observers[0].target, page.root);
  assert.equal(page.observers[0].options.childList, true);
  assert.equal(page.observers[0].options.subtree, true);
  page.advanceTo(1_000);
  page.mountContent();
  assert.equal(page.content.inert, true);
  assert.equal(page.attributes.get("aria-hidden"), "true");
  assert.equal(page.observers[0].connected, false);
  page.advanceTo(BRAND_INTRO.failsafeMs);
  assert.equal(page.content.inert, false);
  assert.equal(page.attributes.has("aria-hidden"), false);
});

test("content arriving during the deadline crossfade remains locked until the failsafe", () => {
  const page = browser({ contentPresent: false });
  page.advanceTo(BRAND_INTRO.deadlineMs + 1);
  assert.equal(page.root.dataset.brandIntroExit, "on");
  assert.equal(page.observers[0].connected, true);
  page.mountContent();
  assert.equal(page.content.inert, true);
  assert.equal(page.attributes.get("aria-hidden"), "true");
  page.advanceTo(BRAND_INTRO.failsafeMs);
  assert.equal(page.content.inert, false);
  assert.equal(page.attributes.has("aria-hidden"), false);
});

test("content arriving after Skip is not locked by a pending observer", () => {
  const page = browser({ contentPresent: false });
  // Simulate the attribute cleanup performed by the hydrated Skip handler.
  delete page.root.dataset.brandIntro;
  delete page.root.dataset.brandIntroStarted;
  page.mountContent();
  assert.equal(page.content.inert, false);
  assert.equal(page.attributes.has("aria-hidden"), false);
  assert.equal(page.observers[0].connected, false);
  page.advanceTo(BRAND_INTRO.failsafeMs);
  assert.deepEqual(page.root.dataset, {});
});

test("repeat visits, admin routes, and reduced-motion visits leave the page immediately available", () => {
  for (const settings of [{ seen: true }, { pathname: "/admin" }, { pathname: "/admin/login" }, { reduced: true }]) {
    const page = browser(settings);
    assert.deepEqual(page.root.dataset, {}, JSON.stringify(settings));
    assert.equal(page.content.inert, false);
    assert.equal(page.timers.length, 0);
  }
});

test("blocked storage reads fail open instead of hiding the page", () => {
  const page = browser({ storageReadThrows: true });
  assert.deepEqual(page.root.dataset, {});
  assert.equal(page.timers.length, 0);
  assert.equal(page.content.inert, false);
});

test("storage write failures still retain both independent cleanup deadlines", () => {
  const page = browser({ storageWriteThrows: true });
  assert.equal(page.root.dataset.brandIntro, "on");
  assert.equal(page.timers.length, 2);
  assert.equal(page.stored.size, 0);
  assert.equal(page.content.inert, true);
  assert.equal(page.attributes.get("aria-hidden"), "true");
  page.advanceTo(BRAND_INTRO.deadlineMs);
  assert.equal(page.root.dataset.brandIntroExit, "on");
  assert.equal(page.root.dataset.brandIntro, "on");
  page.advanceTo(BRAND_INTRO.failsafeMs);
  assert.deepEqual(page.root.dataset, {});
  assert.equal(page.content.inert, false);
  assert.equal(page.attributes.has("aria-hidden"), false);
});

test("a delayed bootstrap timer cannot restart an intro already skipped", () => {
  const page = browser();
  delete page.root.dataset.brandIntro;
  delete page.root.dataset.brandIntroStarted;
  page.advanceTo(BRAND_INTRO.deadlineMs);
  assert.equal(page.root.dataset.brandIntroExit, undefined);
  page.advanceTo(BRAND_INTRO.failsafeMs);
  assert.deepEqual(page.root.dataset, {});
});

test("fallback remains safe if content never mounts", () => {
  const page = browser({ contentPresent: false });
  page.advanceTo(BRAND_INTRO.failsafeMs);
  assert.deepEqual(page.root.dataset, {});
  assert.equal(page.observers[0].connected, false);
  page.mountContent();
  assert.equal(page.content.inert, false);
  assert.equal(page.attributes.has("aria-hidden"), false);
});
