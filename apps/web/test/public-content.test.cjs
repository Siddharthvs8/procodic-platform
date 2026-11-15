const assert = require("node:assert/strict");
const { AsyncLocalStorage } = require("node:async_hooks");
const { readFileSync } = require("node:fs");
const { createRequire, Module } = require("node:module");
const { resolve } = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Exercise the installed Next cache and request context, without a database or
// deployed cache backend. Only the server-only import marker is replaced.
globalThis.AsyncLocalStorage = AsyncLocalStorage;
const { workAsyncStorage } = require("next/dist/server/app-render/work-async-storage.external");
const { workUnitAsyncStorage } = require("next/dist/server/app-render/work-unit-async-storage.external");
const filename = resolve(__dirname, "../lib/public-content.ts");
const localRequire = createRequire(filename);
const loaded = new Module(filename);
loaded.filename = filename;
loaded.require = name => name === "server-only" ? {} : localRequire(name);
loaded._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { getPublished, getPublishedBySlug } = loaded.exports;

function fixture() {
  let now = 0;
  const records = new Map();
  const incrementalCache = {
    generateCacheKey: async key => key,
    get: async (key, options) => {
      const entry = records.get(key);
      return entry ? { value: entry.value, isStale: now - entry.time >= options.revalidate * 1000 } : null;
    },
    set: async (key, value) => records.set(key, { value, time: now }),
  };
  return {
    records,
    expire: () => { now += 61_000; },
    request: async callback => {
      const workStore = { route: "/", incrementalCache, isStaticGeneration: false, isDraftMode: false };
      const requestStore = { type: "request", phase: "render", url: { pathname: "/", search: "" }, implicitTags: { tags: [] } };
      return workAsyncStorage.run(workStore, () => workUnitAsyncStorage.run(requestStore, async () => {
        const result = await callback();
        await Promise.all(Object.values(workStore.pendingRevalidates ?? {}));
        return result;
      }));
    },
  };
}

const content = { id: "p1", type: "PRODUCT", title: "Published product", slug: "product", status: "PUBLISHED", featured: false, displayOrder: 0, data: {} };
const json = (data, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { "Content-Type": "application/json" } });

test("public content cache", async t => {
  await t.test("shares successful data between requests and separates API origins", async t => {
    const state = fixture();
    let calls = 0;
    t.mock.method(globalThis, "fetch", async (_url, options) => {
      calls++;
      assert.equal(options.cache, "no-store");
      assert.ok(options.signal instanceof AbortSignal);
      return json([content]);
    });
    assert.deepEqual(await state.request(() => getPublished("products")), [content]);
    assert.deepEqual(await state.request(() => getPublished("products")), [content]);
    assert.equal(calls, 1);
    assert.equal([...state.records.values()][0].value.revalidate, 60);
    const previous = process.env.API_INTERNAL_URL;
    process.env.API_INTERNAL_URL = "https://another-api.invalid";
    try { await state.request(() => getPublished("products")); }
    finally {
      if (previous === undefined) delete process.env.API_INTERNAL_URL;
      else process.env.API_INTERNAL_URL = previous;
    }
    assert.equal(calls, 2);
  });

  await t.test("does not persist outages or malformed responses", async t => {
    for (const failing of [
      async () => json(undefined, 503),
      async () => { throw new Error("Origin unavailable"); },
      async () => new Response("invalid JSON"),
      async () => json({ unexpected: true }),
    ]) {
      const state = fixture();
      const fetchMock = t.mock.method(globalThis, "fetch", failing);
      assert.deepEqual(await state.request(() => getPublished("products")), []);
      assert.equal(state.records.size, 0);
      fetchMock.mock.mockImplementation(async () => json([content]));
      assert.deepEqual(await state.request(() => getPublished("products")), [content]);
      fetchMock.mock.restore();
    }
  });

  await t.test("removes archived details from cache and discovers newly published records", async t => {
    const state = fixture();
    const fetchMock = t.mock.method(globalThis, "fetch", async () => json(content));
    assert.deepEqual(await state.request(() => getPublishedBySlug("products", "product")), content);
    state.expire();
    fetchMock.mock.mockImplementation(async () => json(undefined, 404));
    await state.request(() => getPublishedBySlug("products", "product"));
    assert.equal(await state.request(() => getPublishedBySlug("products", "product")), null);
    state.expire();
    fetchMock.mock.mockImplementation(async () => json(content));
    await state.request(() => getPublishedBySlug("products", "product"));
    assert.deepEqual(await state.request(() => getPublishedBySlug("products", "product")), content);
  });

  await t.test("retains last good content after a failed background refresh, then recovers", async t => {
    const state = fixture();
    const fetchMock = t.mock.method(globalThis, "fetch", async () => json([content]));
    await state.request(() => getPublished("products"));
    state.expire();
    t.mock.method(console, "error", () => {});
    fetchMock.mock.mockImplementation(async () => json(undefined, 503));
    assert.deepEqual(await state.request(() => getPublished("products")), [content]);
    assert.deepEqual(JSON.parse([...state.records.values()][0].value.data.body), [content]);
    const updated = { ...content, title: "Updated product" };
    fetchMock.mock.mockImplementation(async () => json([updated]));
    assert.deepEqual(await state.request(() => getPublished("products")), [content]);
    assert.deepEqual(await state.request(() => getPublished("products")), [updated]);
  });

  await t.test("uses an eight-second deadline and retries after a timeout", async t => {
    const state = fixture();
    const timeoutMock = t.mock.method(AbortSignal, "timeout", milliseconds => {
      assert.equal(milliseconds, 8_000);
      return AbortSignal.abort(new DOMException("Timed out", "TimeoutError"));
    });
    const fetchMock = t.mock.method(globalThis, "fetch", async (_url, { signal }) => {
      signal.throwIfAborted();
    });
    assert.deepEqual(await state.request(() => getPublished("products")), []);
    assert.equal(state.records.size, 0);
    timeoutMock.mock.restore();
    fetchMock.mock.mockImplementation(async () => json([content]));
    assert.deepEqual(await state.request(() => getPublished("products")), [content]);
  });
});
