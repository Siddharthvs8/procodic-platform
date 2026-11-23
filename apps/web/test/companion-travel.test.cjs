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

const { planCompanionTravel, surfacePosition } = loadTypeScript("../components/companion/travel.ts");
const { railPosition, landingPosition } = loadTypeScript("../components/companion/story.ts");
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 0.00001, `${message}: ${actual} versus ${expected}`);

test('a fast scroll keeps the actual offscreen origin instead of teleporting into view',()=>{
  const plan=planCompanionTravel({x:900,y:-240},{x:800,y:350},{width:1280,height:720,size:128},false,'flip',true);
  near(plan.y[0],-240,'actual departure');
  assert.ok(plan.y[1]<-230,'continuous next frame');
  near(plan.y.at(-1),350,'safe visible landing');
});

function assertPlayable(plan) {
  assert.ok(plan.duration > 0 && plan.duration <= 3, "journey stays brief");
  assert.equal(plan.times[0], 0);
  assert.equal(plan.times.at(-1), 1);
  for (let i = 1; i < plan.times.length; i++) assert.ok(plan.times[i] > plan.times[i - 1], "timeline progresses without repeated frames");
  for (const channel of ["x", "y", "rotate", "scaleX", "scaleY", "progress"]) {
    assert.equal(plan[channel].length, plan.times.length, `${channel} stays synchronized`);
    assert.ok(plan[channel].every(Number.isFinite), `${channel} contains usable values`);
  }
  near(plan.rotate.at(-1), 0, "landing is upright");
  near(plan.scaleX.at(-1), 1, "landing restores body width");
  near(plan.scaleY.at(-1), 1, "landing restores body height");
  assert.equal(plan.progress[0],0,"skeleton starts at anticipation");
  assert.equal(plan.progress.at(-1),1,"skeleton reaches recovery");
}

function assertBounds(plan, viewport) {
  for (let i = 0; i < plan.times.length; i++) {
    assert.ok(plan.x[i] >= 0 && plan.x[i] + viewport.size <= viewport.width, `frame ${i} stays horizontally visible at ${viewport.width}px`);
    assert.ok(plan.y[i] >= 0 && plan.y[i] + viewport.size * 1.5 + 30 <= viewport.height, `frame ${i} leaves space for the pet and controls at ${viewport.height}px`);
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
  const viewport = { width: 390, height: 844, size: 96 };
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
  const viewport = { width: 1280, height: 720, size: 128 };
  const left = { x: 20, y: 430 };
  const right = { x: 1134, y: 430 };
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

test("powered flight lifts before accelerating and brakes before touchdown",()=>{
  const from={x:160,y:430},to={x:900,y:430};
  const plan=planCompanionTravel(from,to,{width:1280,height:800,size:128},false,"flight");
  assert.equal(plan.kind,"flight");
  near(plan.x[10],from.x,"engines lift vertically before forward acceleration");
  assert.ok(plan.y[17]<from.y-55,"boost clears the departure surface");
  assert.ok(plan.x[17]-from.x<(to.x-from.x)*.05,"takeoff stays close to its surface before banking");
  const speed=plan.x.slice(1).map((x,i)=>Math.abs(x-plan.x[i]));
  assert.ok(speed[48]<Math.max(...speed)*.4,"counter-thrust slows the final approach");
  assert.ok(speed[52]<speed[48],"braking keeps reducing horizontal speed");
  assert.ok(plan.rotate.some(value=>value< -3),"body counter-banks to brake");
  for(let i=54;i<plan.x.length;i++)near(plan.x[i],to.x,"landing settles without horizontal drift");
  assertPlayable(plan);
});

test("short powered flights and takeoffs keep phone controls reachable",()=>{
  const viewport={width:320,height:568,size:96};
  for(const [from,to] of [[{x:8,y:300},{x:216,y:220}],[{x:216,y:300},{x:216,y:190}]]){
    const plan=planCompanionTravel(from,to,viewport,false,"flight");
    assert.equal(plan.kind,"flight","explicit powered moves retain the flight posture even across short distances");
    assertPlayable(plan);assertBounds(plan,viewport);
    near(plan.x[0],from.x,"short launch preserves departure x");
    near(plan.y[0],from.y,"short launch preserves departure y");
    near(plan.x.at(-1),to.x,"short flight settles at requested x");
    near(plan.y.at(-1),to.y,"short flight settles at requested y");
  }
});

test("retargeting a flight begins from the current position without a teleport", () => {
  const viewport = { width: 1280, height: 720, size: 128 };
  const first = planCompanionTravel({ x: 20, y: 400 }, { x: 1134, y: 440 }, viewport);
  const interrupted = { x: first.x[19], y: first.y[19] };
  const next = planCompanionTravel(interrupted, { x: 20, y: 390 }, viewport);
  assertPlayable(next);
  assertBounds(next, viewport);
  near(next.x[0], interrupted.x, "new route begins at interrupted x");
  near(next.y[0], interrupted.y, "new route begins at interrupted y");
});

test("a viewport shrink recovers from an old offscreen position without continuing outside the screen", () => {
  const viewport = { width: 320, height: 568, size: 96 };
  const destination = railPosition(viewport.width, viewport.height, "right");
  const plan = planCompanionTravel({ x: 1720, y: 800 }, destination, viewport);
  assertPlayable(plan);
  assertBounds(plan, viewport);
  near(plan.x.at(-1), destination.x, "resized journey reaches the new horizontal perch");
  near(plan.y.at(-1), destination.y, "resized journey reaches the new vertical perch");
});

test("the larger card reveal character remains inside phone and desktop launch bounds", () => {
  for (const [width, height, size, top] of [[320, 740, 116, 399], [390, 844, 116, 425], [1280, 720, 148, 313]]) {
    const card = { left: width < 640 ? 20 : 650, width: width < 640 ? width - 40 : 550, top };
    const landing = landingPosition(card, width, height, size);
    const viewport = { width, height, size };
    const plan = planCompanionTravel({ x: landing.startX, y: landing.startY }, landing, viewport, true);
    assert.equal(plan.action,"flight","the pet powers out of the card with its thrusters");
    assertPlayable(plan);
    assertBounds(plan, viewport);
    assert.ok(Math.min(...plan.y) < Math.min(landing.startY, landing.y) - 10, "reveal rises above the card before settling");
    near(plan.x.at(-1), landing.x, "launch reaches its horizontal landing");
    near(plan.y.at(-1), landing.y, "launch reaches its vertical landing");
  }
});

test("surface perches meet actual card edges with the appropriate foot or seated baseline",()=>{
  const rect={left:350,top:420,width:500,height:100};
  const standing=surfacePosition(rect,1280,900,128,"right","stand");
  const sitting=surfacePosition(rect,1280,900,128,"right","sit");
  const bottom=surfacePosition(rect,1280,900,128,"left","balance","bottom");
  near(standing.y+128*1.39,rect.top,"feet meet top edge");
  near(sitting.y+128*.92,rect.top,"hips meet the seat edge");
  near(bottom.y+128*1.39,rect.top+rect.height,"feet can meet the bottom edge");
  assert.ok(sitting.y>standing.y,"seated torso lowers toward the panel");
  assert.ok(bottom.x<standing.x,"preferred sides choose separate parts of the surface");
});

test("awkward surfaces still keep the complete pet and controls within a phone viewport",()=>{
  for(const rect of [{left:-300,top:-200,width:500,height:200},{left:250,top:900,width:300,height:400}]){
    for(const pose of ["stand","sit","lean","balance"]){
      const p=surfacePosition(rect,320,568,96,"right",pose);
      assert.ok(p.x>=0&&p.x+96<=320,"body remains horizontally reachable");
      assert.ok(p.y>=0&&p.y+96*1.5+30<=568,"body and controls fit vertically");
    }
  }
});

test("requested parkour actions synchronize the skeletal phase and preserve safe landing geometry",()=>{
  const viewport={width:1280,height:720,size:128};
  const from={x:160,y:420},to={x:850,y:380};
  for(const action of ["jump","flip","flight","dodge","run"]){
    const plan=planCompanionTravel(from,to,viewport,false,action);
    assert.equal(plan.action,action,"controller keeps the requested maneuver");
    assertPlayable(plan);assertBounds(plan,viewport);
    assert.ok(plan.progress.every((value,index)=>index===0||value>=plan.progress[index-1]),"skeletal clip does not rewind during a journey");
    near(plan.x.at(-1),to.x,"all actions reach the actual destination");
    near(plan.y.at(-1),to.y,"all actions settle on the destination height");
  }
});
