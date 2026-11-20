const assert = require("node:assert/strict");
const test = require("node:test");
const { readFileSync } = require("node:fs");
const { Module } = require("node:module");
const { resolve } = require("node:path");
const ts = require("typescript");

function loadTypeScript(relativePath) {
  const filename = resolve(__dirname, relativePath);
  const loaded = new Module(filename);
  loaded._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
  return loaded.exports;
}

const { planCompanionTravel } = loadTypeScript("../components/companion/travel.ts");
const { railPosition, landingPosition } = loadTypeScript("../components/companion/story.ts");
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 0.00001, `${message}: ${actual} versus ${expected}`);

function assertPlayable(plan) {
  assert.ok(plan.duration > 0 && plan.duration <= 3, "journey stays brief");
  assert.equal(plan.times[0], 0);
  assert.equal(plan.times.at(-1), 1);
  for (let i = 1; i < plan.times.length; i++) assert.ok(plan.times[i] > plan.times[i - 1], "timeline progresses without repeated frames");
  for (const channel of ["x", "y", "rotate", "scaleX", "scaleY"]) {
    assert.equal(plan[channel].length, plan.times.length, `${channel} stays synchronized`);
    assert.ok(plan[channel].every(Number.isFinite), `${channel} contains usable values`);
  }
  near(plan.rotate.at(-1), 0, "landing is upright");
  near(plan.scaleX.at(-1), 1, "landing restores body width");
  near(plan.scaleY.at(-1), 1, "landing restores body height");
}

function assertBounds(plan, viewport) {
  for (let i = 0; i < plan.times.length; i++) {
    assert.ok(plan.x[i] >= 0 && plan.x[i] + viewport.size <= viewport.width, `frame ${i} stays horizontally visible at ${viewport.width}px`);
    assert.ok(plan.y[i] >= 0 && plan.y[i] + viewport.size * 1.1 + 30 <= viewport.height, `frame ${i} leaves space for body and controls at ${viewport.height}px`);
  }
}

test("travel and landing poses stay visible on phone, tablet, desktop, and short landscape screens", () => {
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1280, 720], [1920, 1080], [844, 390]]) {
    const left = railPosition(width, height, "left", 100);
    const right = railPosition(width, height, "right", height);
    const viewport = { width, height, size: left.size };
    for (const [from, to] of [[left, right], [right, left]]) {
      const plan = planCompanionTravel(from, to, viewport);
      assertPlayable(plan);
      assertBounds(plan, viewport);
      near(plan.x[0], from.x, "journey starts at current horizontal position");
      near(plan.y[0], from.y, "journey starts at current vertical position");
      near(plan.x.at(-1), to.x, "journey reaches the requested horizontal perch");
      near(plan.y.at(-1), to.y, "journey reaches the requested vertical perch");
    }
  }
});

test("a same-perch mobile visit makes a contained hop with anticipation and a neutral landing", () => {
  const viewport = { width: 390, height: 844, size: 76 };
  const perch = railPosition(viewport.width, viewport.height, "right");
  const plan = planCompanionTravel(perch, perch, viewport);
  assert.equal(plan.kind, "jump");
  assertPlayable(plan);
  assertBounds(plan, viewport);
  assert.ok(Math.min(...plan.y) < perch.y - 15, "hop visibly leaves its perch");
  assert.ok(plan.scaleY.some(value => value < 1), "anticipation or landing compresses the body");
  near(plan.x.at(-1), perch.x, "hop returns to the same horizontal perch");
  near(plan.y.at(-1), perch.y, "hop returns to the same vertical perch");
});

test("long cross-screen journeys bank in the direction of flight and follow an elevated arc", () => {
  const viewport = { width: 1280, height: 720, size: 106 };
  const left = { x: 20, y: 430 };
  const right = { x: 1154, y: 430 };
  const plans = [];
  for (const [from, to] of [[left, right], [right, left]]) {
    const plan = planCompanionTravel(from, to, viewport);
    plans.push(plan);
    assert.equal(plan.kind, "flight");
    assertPlayable(plan);
    assertBounds(plan, viewport);
    assert.ok(Math.min(...plan.y) < from.y - 30, "flight clears the straight path between perches");
    assert.ok(Math.max(...plan.rotate.map(Math.abs)) > 8, "character visibly banks during flight");
    assert.ok(Math.max(...plan.rotate.map(Math.abs)) < 45, "banking keeps the face legible");
  }
  for (let i = 0; i < plans[0].times.length; i++) {
    near(plans[0].rotate[i], -plans[1].rotate[i], "banking reverses with flight direction");
  }
});

test("retargeting a flight begins from the current position without a teleport", () => {
  const viewport = { width: 1280, height: 720, size: 106 };
  const first = planCompanionTravel({ x: 20, y: 400 }, { x: 1154, y: 440 }, viewport);
  const interrupted = { x: first.x[19], y: first.y[19] };
  const next = planCompanionTravel(interrupted, { x: 20, y: 390 }, viewport);
  assertPlayable(next);
  assertBounds(next, viewport);
  near(next.x[0], interrupted.x, "new route begins at interrupted x");
  near(next.y[0], interrupted.y, "new route begins at interrupted y");
});

test("a viewport shrink recovers from an old offscreen position without continuing outside the screen", () => {
  const viewport = { width: 320, height: 568, size: 76 };
  const destination = railPosition(viewport.width, viewport.height, "right");
  const plan = planCompanionTravel({ x: 1720, y: 800 }, destination, viewport);
  assertPlayable(plan);
  assertBounds(plan, viewport);
  near(plan.x.at(-1), destination.x, "resized journey reaches the new horizontal perch");
  near(plan.y.at(-1), destination.y, "resized journey reaches the new vertical perch");
});

test("the larger card reveal character remains inside phone and desktop launch bounds", () => {
  for (const [width, height, size, top] of [[320, 740, 108, 399], [390, 844, 108, 425], [1280, 720, 128, 313]]) {
    const card = { left: width < 640 ? 20 : 650, width: width < 640 ? width - 40 : 550, top };
    const landing = landingPosition(card, width, height, size);
    const viewport = { width, height, size };
    const plan = planCompanionTravel({ x: landing.startX, y: landing.startY }, landing, viewport, true);
    assertPlayable(plan);
    assertBounds(plan, viewport);
    assert.ok(Math.min(...plan.y) < Math.min(landing.startY, landing.y) - 10, "reveal rises above the card before settling");
    near(plan.x.at(-1), landing.x, "launch reaches its horizontal landing");
    near(plan.y.at(-1), landing.y, "launch reaches its vertical landing");
  }
});
