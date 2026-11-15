const assert = require("node:assert/strict");
const test = require("node:test");
const { readFileSync } = require("node:fs");
const { Module } = require("node:module");
const { resolve } = require("node:path");
const ts = require("typescript");
const filename = resolve(__dirname,"../components/companion/story.ts");
const loaded = new Module(filename);
loaded._compile(ts.transpileModule(readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const { canIntroduce, landingPosition, railPosition, routeStory, stories } = loaded.exports;

test("Pip stays hidden before the actual card reaches the viewport",()=>{
  assert.equal(canIntroduce({top:910,bottom:1450},800),false);
  assert.equal(canIntroduce({top:695,bottom:1235},800),false);
  assert.equal(canIntroduce({top:600,bottom:1140},800),true);
  assert.equal(canIntroduce({top:-600,bottom:0},800),false);
});
test("both perches stay inside common desktop, tablet, mobile and landscape viewports",()=>{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1280,720],[1920,1080],[844,390]]) {
    for(const side of ["left","right"]) {
      const p=railPosition(width,height,side,900);
      assert.ok(p.x>=0 && p.x+p.size<=width,`${width}: horizontal bounds`);
      assert.ok(p.y>=0 && p.y+p.size*1.1<=height,`${height}: vertical bounds`);
      if(width<640) assert.ok(p.x>width/2,"mobile stays at the compact right perch");
    }
  }
});
test("nested public routes receive the right predefined guidance",()=>{
  for(const [path,key] of [["/products/payroll","products"],["/ai-research/automation","ai"],["/training/workshop","learning"],["/contact","contact"],["/about","about"],["/testimonials","testimonials"]]) {
    assert.equal(routeStory(path),key); assert.ok(stories[key].message);
  }
  assert.equal(routeStory("/privacy"),"hero");
});
test("mobile landings reserve room for the full introduction body and greeting",()=>{
  for(const [width,height] of [[320,568],[375,844],[414,896]]) {
    for(const top of [145,425]) {
      const p=landingPosition({left:20,top,width:width-40},width,height,108);
      assert.ok(p.x+108<=width,"full character stays inside viewport");
      const bubbleWidth=Math.min(224,width+15-140); // Allow a desktop-style scrollbar in mobile emulation.
      assert.ok(p.x-bubbleWidth+5>=0,"greeting does not cross the left viewport edge");
      assert.ok(p.y+108*1.1+30<=height,"controls stay above bottom edge");
      assert.equal(p.perched,top===425);
    }
  }
});
