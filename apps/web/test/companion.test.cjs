const assert = require("node:assert/strict");
const test = require("node:test");
const { readFileSync, readdirSync } = require("node:fs");
const { Module } = require("node:module");
const { resolve, join } = require("node:path");
const ts = require("typescript");
const filename = resolve(__dirname,"../components/companion/story.ts");
const loaded = new Module(filename);
loaded._compile(ts.transpileModule(readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const { canIntroduce, landingPosition, railPosition, routeStory, stories } = loaded.exports;

test("Nova stays hidden before the actual card reaches the viewport",()=>{
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
      assert.ok(p.y>=0 && p.y+p.size*1.5+30<=height,`${height}: pet body and control bounds`);
      if(width<640) assert.ok(p.x>width/2,"mobile stays at the compact right perch");
    }
  }
});
test("nested public routes receive the right predefined guidance",()=>{
  for(const [path,key] of [["/products","products"],["/products/payroll","product-detail"],["/ai-research","ai"],["/ai-research/automation","research-detail"],["/training","learning"],["/training/workshop","learning-detail"],["/case-studies/enterprise","case-detail"],["/insights/article","article"],["/contact","contact"],["/about","about"],["/testimonials","testimonials"],["/collaborations","collaborations"]]) {
    assert.equal(routeStory(path),key); assert.ok(stories[key].message);
  }
  assert.equal(routeStory("/privacy"),"privacy");
  assert.equal(routeStory("/terms"),"terms");
  assert.equal(routeStory("/unknown"),"hero");
});
test("mobile landings reserve room for the full introduction body and greeting",()=>{
  for(const [width,height] of [[320,568],[375,844],[414,896]]) {
    for(const top of [145,425]) {
      const p=landingPosition({left:20,top,width:width-40},width,height,116);
      assert.ok(p.x+116<=width,"full character stays inside viewport");
      const bubbleWidth=Math.min(224,width+15-140); // Allow a desktop-style scrollbar in mobile emulation.
      assert.ok(p.x-bubbleWidth+5>=0,"greeting does not cross the left viewport edge");
      assert.ok(p.y+116*1.5+30<=height,"controls stay above bottom edge");
      assert.equal(p.perched,top===425);
    }
  }
});

test("every public section is wired to editable guidance and a valid resting pose",()=>{
  const walk=directory=>readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(directory,entry.name)):[join(directory,entry.name)]);
  const publicPages=walk(resolve(__dirname,"../app")).filter(file=>file.endsWith("page.tsx")&&!file.includes(`${require("node:path").sep}admin${require("node:path").sep}`));
  let count=0;
  for(const file of publicPages){
    const source=readFileSync(file,"utf8");
    for(const match of source.matchAll(/<section\b[^>]*>/g)){
      const key=match[0].match(/data-companion-section="([^"]+)"/)?.[1];
      assert.ok(key,`${file}: section has contextual guidance`);
      const story=stories[key];
      assert.ok(story?.message,`${file}: ${key} has a message`);
      assert.ok(["stand","sit","lean","balance"].includes(story.perch),`${key}: appropriate physical perch`);
      count++;
    }
  }
  assert.ok(count>40,"coverage includes listing, detail, contact, and legal sections");
});

test("guidance remains concise and play reactions have distinct expressions",()=>{
  for(const [key,story] of Object.entries(stories)){
    assert.ok(story.message.length<=180,`${key}: message fits a compact speech bubble`);
    assert.ok(!story.message.includes("Pip"),`${key}: uses the current character identity`);
  }
  assert.equal(stories.caught.state,"embarrassed");
  assert.equal(stories.escaped.state,"laughing");
  assert.notEqual(stories.caught.message,stories.escaped.message);
  assert.ok(stories.capabilities.interaction.message);
});
