const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const THREE = require('three');
const filename = path.join(__dirname, '../components/companion/pet-rig.ts');
const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
const exported = {exports:{}};
new Function('require','module','exports',code)(require,exported,exported.exports);
const snapshot = (action='idle',progress=0) => ({state:'focused',action,progress,reducedMotion:false,direction:'right'});
const named = (rig,name) => rig.group.getObjectByName(name);

test('Nova has a complete articulated pet with four independently mounted thrusters',()=>{
  const rig=exported.exports.createPetRig();
  const engines=[];rig.group.traverse(o=>{if(o.name==='thruster')engines.push(o);});
  assert.equal(engines.length,4);
  assert.ok(rig.boneCount>=17);
  for(const name of ['head','ear.-1','ear.1','paw.-1','paw.1','ankle.-1','ankle.1','tail.4'])assert.ok(named(rig,name),name);
  const before=named(rig,'wrist.1').getWorldPosition(new THREE.Vector3());
  for(let i=0;i<20;i++)rig.update(snapshot('wave'),i/30,1/30,0,0);
  const after=named(rig,'wrist.1').getWorldPosition(new THREE.Vector3());
  assert.ok(before.distanceTo(after)>.25,'the paw must articulate through joints, not merely move the complete wrapper');
  rig.dispose();
});

test('Powered flight spools, banks and brakes with visible engine output',()=>{
  const rig=exported.exports.createPetRig();
  rig.update({...snapshot('flight',.06),reducedMotion:false},0,1,0,0);
  const initialBank=rig.group.rotation.z;
  rig.update(snapshot('flight',.5),1,1,0,0);
  assert.ok(Math.abs(rig.group.rotation.z)>Math.abs(initialBank)+.2);
  const engine=named(rig,'thruster');
  assert.ok(engine.children.some(o=>o.material?.transparent&&o.material.opacity>.4),'engines must illuminate during powered cruise');
  rig.update(snapshot('flight',.85),2,1,0,0);
  assert.ok(rig.group.rotation.z>0,'the body counter-banks for braking');
  rig.update(snapshot('flight',1),3,1,0,0);
  assert.ok(Math.abs(rig.group.rotation.z)<.001);
  assert.ok(engine.children.filter(o=>o.material?.transparent).every(o=>o.material.opacity===0),'exhaust stops after landing');
  rig.dispose();
});

test('Every pet pose stays finite and reduced motion reaches a stable pose without exhaust',()=>{
  const rig=exported.exports.createPetRig();
  for(const action of ['peek','hang','climb','run','jump','flip','flight','hover','land','balance','sit','lean','wave','caught','dodge']){
    for(let step=0;step<=20;step++){
      rig.update(snapshot(action,step/20),step/30,1/30,.5,-.4);
      rig.group.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),`${action} at ${step/20}`));
    }
  }
  const still={...snapshot('hover'),reducedMotion:true};
  rig.update(still,10,1,.2,0);const first=rig.head.matrixWorld.clone();
  rig.update(still,50,1,.2,0);assert.deepEqual(rig.head.matrixWorld.elements,first.elements);
  rig.group.traverse(o=>{if(o.name==='thruster')assert.ok(o.children.filter(c=>c.material?.transparent).every(c=>c.material.opacity===0));});
  rig.dispose();
});

test('Pet standing feet and seated shell keep the established page surface baselines',()=>{
  const rig=exported.exports.createPetRig();
  rig.update({...snapshot(),reducedMotion:true},0,1,0,0);
  const foot=named(rig,'ankle.1');
  const sole=foot.children.find(o=>o.isMesh&&o.position.y<-.2);
  const floor=new THREE.Box3().setFromObject(sole).min.y;
  assert.ok(Math.abs(floor)<.025,`standing floor ${floor}`);
  rig.update({...snapshot('sit'),reducedMotion:true},0,1,0,0);
  const shell=named(rig,'body').children.find(o=>o.isMesh);
  const seat=new THREE.Box3().setFromObject(shell).min.y;
  assert.ok(Math.abs(seat-.66)<.025,`seated shell ${seat}`);
  rig.dispose();
});
