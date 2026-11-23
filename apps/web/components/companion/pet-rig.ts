import * as T from "three";
import type { CharacterSnapshot } from "./character";

const clamp = T.MathUtils.clamp;
const smooth = (a:number,b:number,value:number) => T.MathUtils.smoothstep(value,a,b);

/** Original articulated AI pet. Rigid shells follow real 3D joints; no model or texture download. */
export function createPetRig() {
  const group = new T.Group();
  group.name="nova-ai-pet";
  const assembly = new T.Group(); assembly.position.y=-.85; group.position.y=.85;group.add(assembly);
  const materials = new Set<T.Material>();
  const geometries = new Set<T.BufferGeometry>();
  function standard(color:string,roughness=.3,metalness=.3,emissive?:string) {
    const material = new T.MeshStandardMaterial({color,roughness,metalness,emissive:emissive??0x000000,emissiveIntensity:emissive?.length?1.1:0});
    materials.add(material);return material;
  }
  const pearl=standard("#e3efe8",.25,.35),jade=standard("#547c78",.28,.48),dark=standard("#102a30",.38,.6);
  const rim=standard("#91b7af",.22,.65),cyan=standard("#7ff9ef",.22,.3,"#35d9d6"),white=standard("#e9ffff",.1,.1,"#a9fff5");
  const glass=new T.MeshPhysicalMaterial({color:"#031b24",roughness:.12,metalness:.32,clearcoat:1,clearcoatRoughness:.08});materials.add(glass);
  const eyesMaterial=new T.MeshBasicMaterial({color:"#8ffff4",toneMapped:false});materials.add(eyesMaterial);
  const blushMaterial=new T.MeshBasicMaterial({color:"#78bab2",transparent:true,opacity:.35});materials.add(blushMaterial);
  const joints:T.Bone[]=[];
  function joint(name:string,parent:T.Object3D,x:number,y:number,z=0) {const bone=new T.Bone();bone.name=name;bone.position.set(x,y,z);parent.add(bone);joints.push(bone);return bone;}
  function mesh(parent:T.Object3D,geometry:T.BufferGeometry,material:T.Material,x=0,y=0,z=0,sx=1,sy=1,sz=1) {
    geometries.add(geometry);const object=new T.Mesh(geometry,material);object.position.set(x,y,z);object.scale.set(sx,sy,sz);parent.add(object);return object;
  }
  const sphere=new T.SphereGeometry(1,24,16);geometries.add(sphere);
  const egg=(parent:T.Object3D,material:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>mesh(parent,sphere,material,x,y,z,sx,sy,sz);
  function tube(parent:T.Object3D,material:T.Material,points:[number,number,number][],radius=.01) {
    return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,radius,6,false),material);
  }
  const body=joint("body",assembly,0,.86);
  egg(body,pearl,0,0,0,.28,.27,.23);
  egg(body,jade,0,-.025,-.08,.25,.25,.20);
  egg(body,dark,0,-.015,.205,.155,.17,.042);
  // Hexagonal power cell makes the chest readable even at the small resting size.
  const core=mesh(body,new T.CylinderGeometry(.063,.063,.014,6),cyan,0,.025,.25);core.rotation.x=Math.PI/2;
  const coreCentre=mesh(body,new T.CylinderGeometry(.029,.029,.018,6),white,0,.025,.263);coreCentre.rotation.x=Math.PI/2;
  tube(body,rim,[[-.19,.095,.16],[-.11,.15,.21],[0,.16,.225],[.11,.15,.21],[.19,.095,.16]],.009);
  tube(body,cyan,[[-.13,-.16,.16],[0,-.19,.18],[.13,-.16,.16]],.007);
  const head=joint("head",body,0,.49,.01);
  egg(head,pearl,0,0,0,.44,.36,.31);
  egg(head,jade,0,-.075,-.08,.425,.26,.28);
  // The broad convex visor, ear fins and tiny paws give an animal silhouette, not a person in a suit.
  egg(head,dark,0,.002,.206,.405,.277,.181);
  egg(head,glass,0,.012,.241,.384,.252,.16);
  tube(head,rim,[[-.34,-.15,.30],[-.38,0,.30],[-.30,.2,.30],[0,.26,.30],[.30,.2,.30],[.38,0,.30],[.34,-.15,.30]],.009);
  // A restrained reflected highlight preserves the glass shape without hiding the face.
  const reflectionMaterial=new T.MeshBasicMaterial({color:"#c5f8f4",transparent:true,opacity:.14,depthWrite:false});materials.add(reflectionMaterial);
  egg(head,reflectionMaterial,-.13,.17,.359,.13,.013,.008).rotation.z=.15;
  const ears=[-1,1].map(side=>{
    const ear=joint(`ear.${side}`,head,side*.30,.25,-.035);
    const shape=new T.Shape();shape.moveTo(-.1,0);shape.quadraticCurveTo(-.09,.12,-.035,.265);shape.quadraticCurveTo(0,.295,.035,.265);shape.quadraticCurveTo(.09,.12,.1,0);shape.closePath();
    const shell=mesh(ear,new T.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.018,curveSegments:10}),pearl,0,0,-.035);
    shell.rotation.z=-side*.16;
    const inner=mesh(ear,new T.ConeGeometry(.055,.19,3),jade,0,.12,.065);inner.rotation.y=Math.PI;
    tube(ear,cyan,[[0,.055,.07],[-side*.008,.13,.075],[-side*.02,.2,.065]],.007);
    return ear;
  });
  const eyeGroups=[-1,1].map(side=>{
    const eye=new T.Group();eye.position.set(side*.145,.045,.398);head.add(eye);
    const pupil=egg(eye,eyesMaterial,0,0,0,.047,.081,.01);
    const glint=egg(eye,white,-.015,.032,.011,.009,.015,.004);
    const happy=tube(eye,eyesMaterial,[[-.052,-.005,0],[-.035,.034,.006],[0,.048,.01],[.035,.034,.006],[.052,-.005,0]],.014);happy.visible=false;
    const brow=egg(head,eyesMaterial,side*.145,.16,.374,.055,.009,.007);brow.rotation.z=-side*.10;
    egg(head,blushMaterial,side*.245,-.068,.355,.048,.014,.008);
    return {eye,pupil,glint,happy,brow};
  });
  const nose=mesh(head,new T.ConeGeometry(.024,.026,3),jade,0,-.045,.412);nose.rotation.z=Math.PI;
  const mouth=new T.Group();mouth.position.set(0,-.10,.395);head.add(mouth);
  const smile=tube(mouth,eyesMaterial,[[-.048,.012,0],[-.025,-.012,.007],[0,-.02,.01],[.025,-.012,.007],[.048,.012,0]],.007);
  const openMouth=mesh(mouth,new T.TorusGeometry(.026,.007,6,20),eyesMaterial);openMouth.scale.set(.8,1,1);openMouth.visible=false;
  const flatMouth=egg(mouth,eyesMaterial,0,0,.005,.03,.006,.005);flatMouth.visible=false;

  const paws=[-1,1].map(side=>{
    const shoulder=joint(`paw.${side}`,body,side*.25,.035,0);
    egg(shoulder,rim,0,0,0,.07,.07,.075);
    egg(shoulder,jade,side*.035,-.09,.01,.067,.13,.065);
    const wrist=joint(`wrist.${side}`,shoulder,side*.035,-.19,.025);
    egg(wrist,pearl,0,-.014,.015,.09,.105,.09);
    for(let toe=0;toe<3;toe++)egg(wrist,rim,(toe-1)*.045,-.076,.068,.019,.025,.026);
    return {shoulder,wrist,side};
  });
  const feet=[-1,1].map(side=>{
    const hip=joint(`hip.${side}`,body,side*.15,-.17,-.015);
    egg(hip,dark,0,-.10,0,.07,.13,.065);
    mesh(hip,new T.CylinderGeometry(.045,.047,.25,12),jade,0,-.28,0);
    const ankle=joint(`ankle.${side}`,hip,0,-.44,.03);
    egg(ankle,jade,0,.025,0,.087,.13,.085);
    egg(ankle,pearl,0,-.145,.08,.114,.11,.15);
    egg(ankle,dark,0,-.223,.085,.106,.03,.138);
    tube(ankle,cyan,[[-.075,-.15,.18],[0,-.165,.217],[.075,-.15,.18]],.007);
    return {hip,ankle,side};
  });
  // Five linked segments curl upward behind the body like a curious little fox tail.
  const tail:T.Bone[]=[];let tailParent:T.Object3D=body;
  for(let index=0;index<5;index++){
    const link=joint(`tail.${index}`,tailParent,index===0?.18:.105,index===0?-.15:.035,index===0?-.16:-.015);
    egg(link,index===4?cyan:index%2?pearl:jade,.05,.01,0,.075-index*.007,.063-index*.006,.062-index*.005);
    tail.push(link);tailParent=link;
  }
  type Engine={root:T.Group;outer:T.Mesh;inner:T.Mesh;halo:T.Mesh;ring:T.Mesh;material:T.MeshBasicMaterial;scale:number};
  const engines:Engine[]=[];
  function engine(parent:T.Object3D,y:number,z:number,scale:number) {
    const root=new T.Group();root.name="thruster";root.position.set(0,y,z);root.scale.setScalar(scale);parent.add(root);
    const ring=mesh(root,new T.TorusGeometry(.052,.014,8,20),rim);ring.rotation.x=Math.PI/2;
    const chamber=mesh(root,new T.CylinderGeometry(.043,.043,.016,18),cyan);chamber.position.y=-.008;
    const material=new T.MeshBasicMaterial({color:"#30dbed",transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});materials.add(material);
    const innerMaterial=new T.MeshBasicMaterial({color:"#c5ffff",transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});materials.add(innerMaterial);
    const outer=mesh(root,new T.ConeGeometry(.058,.20,16),material,0,-.115,0);outer.rotation.z=Math.PI;
    const inner=mesh(root,new T.ConeGeometry(.028,.15,12),innerMaterial,0,-.09,0);inner.rotation.z=Math.PI;
    const halo=egg(root,material,0,-.025,0,.084,.034,.084);
    engines.push({root,outer,inner,halo,ring,material,scale});return root;
  }
  feet.forEach(({ankle})=>engine(ankle,-.238,.035,1));
  paws.forEach(({wrist})=>engine(wrist,-.10,0,.64));
  const particleMaterial=new T.MeshBasicMaterial({color:"#93fff1",transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});materials.add(particleMaterial);
  const particles=new T.InstancedMesh(new T.IcosahedronGeometry(.012,0),particleMaterial,12);geometries.add(particles.geometry);particles.frustumCulled=false;assembly.add(particles);
  const particleDummy=new T.Object3D();
  const originals=new Map(joints.map(b=>[b,b.position.clone()]));
  const targets=new Map(joints.map(b=>[b,new T.Euler()]));
  const targetRotation=new T.Quaternion();
  let lastAction="idle",actionAt=0;

  function update(snapshot:CharacterSnapshot,time:number,delta:number,gazeX:number,gazeY:number) {
    const {state,action,reducedMotion}=snapshot;
    const p=clamp(snapshot.progress,0,1),dir=snapshot.direction==="left"?-1:1;
    const t=reducedMotion?0:time;
    const blend=reducedMotion?1:1-Math.exp(-delta*16);
    if(lastAction!==action){lastAction=action;actionAt=time;}
    targets.forEach(rotation=>rotation.set(0,0,0));
    const set=(b:T.Bone,x=0,y=0,z=0)=>targets.get(b)!.set(x,y,z);
    let height=0,bank=0,pitch=0,yaw=dir*.07,thrust=0,bodyScale=1,headDrop=0,poseScale=1;
    const bounce=Math.sin(t*2.1);
    set(head,gazeY*.07,gazeX*.17,bounce*.018);
    ears.forEach((ear,i)=>set(ear,.035*Math.sin(t*1.6+i),0,(i===0?-1:1)*.04));
    tail.forEach((link,i)=>set(link,0,Math.sin(t*2.5-i*.55)*.11,.19+Math.sin(t*2-i*.5)*.06));
    paws.forEach(({shoulder,side})=>set(shoulder,-.05,0,side*.10));
    if(action==="peek"||action==="hang"){
      paws.forEach(({shoulder,wrist,side})=>{set(shoulder,-.50,0,-side*.2);set(wrist,.7);});
      set(head,-.08,gazeX*.2,bounce*.025);feet.forEach(({hip,side})=>set(hip,-.12,0,side*.06));
    }else if(action==="climb"){
      const pull=smooth(0,1,p);paws.forEach(({shoulder,wrist,side})=>{set(shoulder,-.6+pull*.45,0,-side*.25);set(wrist,.6-pull*.3);});
      feet.forEach(({hip,side})=>set(hip,-.55*(1-pull),0,side*.1));pitch=-.08;thrust=.15;
    }else if(action==="sit"){
      height=.07;headDrop=-.07;feet.forEach(({hip,side})=>set(hip,-1.35,side*.2,side*.22));
      paws.forEach(({shoulder,side})=>set(shoulder,-.25,0,side*.2));
    }else if(action==="lean"){
      bank=-dir*.12;set(paws[dir>0?0:1].shoulder,-.2,0,dir*.65);set(feet[dir>0?0:1].hip,-.25);
    }else if(action==="flight"){
      // Shared journey clock: spool → vertical boost → cruise → reverse-thrust brake → touch down.
      const spool=smooth(0,.12,p),boost=smooth(.12,.28,p),cruise=smooth(.25,.40,p)*(1-smooth(.69,.87,p));
      const braking=smooth(.72,.81,p)*(1-smooth(.87,.98,p));
      thrust=p<.12?.18+spool*.35:p<.72?.9:1-smooth(.82,1,p);
      bank=-dir*.52*cruise+dir*.15*braking;pitch=-.12*boost*(1-smooth(.8,1,p));yaw=dir*(.08+cruise*.20);
      poseScale=1-cruise*.27;bodyScale=1-Math.sin(Math.PI*clamp(p/.12,0,1))*.06;headDrop=-.10*boost*(1-smooth(.85,1,p));
      height=boost*.06*(1-smooth(.85,1,p))-Math.sin(Math.PI*clamp((p-.9)/.1,0,1))*.055;
      paws.forEach(({shoulder,wrist,side})=>{set(shoulder,.12*cruise,0,side*(.28+braking*.6));set(wrist,-.2*cruise,0,-side*.12);});
      feet.forEach(({hip,side})=>set(hip,.12*cruise,0,side*(.05+braking*.12)));
      ears.forEach((ear,i)=>set(ear,-.25*cruise,0,(i===0?1:-1)*.14*cruise));
      tail.forEach((link,i)=>set(link,0,.08,.08+Math.sin(t*4-i*.6)*.045));
    }else if(action==="hover"){
      thrust=.5;height=.06+Math.sin(t*2.8)*.025;bank=Math.sin(t*1.6)*.04;
      paws.forEach(({shoulder,side})=>set(shoulder,.05,0,side*.35));feet.forEach(({hip,side})=>set(hip,-.08,0,side*.08));
    }else if(["jump","flip","dodge","run"].includes(action)){
      const prep=Math.sin(Math.PI*clamp(p/.15,0,1)),air=smooth(.12,.28,p)*(1-smooth(.75,.9,p)),impact=Math.sin(Math.PI*clamp((p-.86)/.14,0,1));
      height=-.065*(prep+impact);bodyScale=1-.07*(prep+impact);thrust=air*(action==="dodge"?.8:.65);
      feet.forEach(({hip,side})=>set(hip,-air*.45,0,side*(.08+air*.14)));
      paws.forEach(({shoulder,side})=>set(shoulder,-air*.4,0,side*(.14+air*.55)));
      bank=action==="flip"?-dir*smooth(.22,.78,p)*Math.PI*2:-dir*air*.24;
      poseScale=1-air*(action==="flip"?.40:.12);yaw=dir*.15;
      if(action==="run"&&p<.15)feet.forEach(({hip,side})=>set(hip,side*Math.sin(t*18)*.5));
    }else if(action==="caught"){
      const wiggle=Math.sin((reducedMotion?0:time-actionAt)*11)*Math.exp(-Math.max(0,time-actionAt)*.7);bank=wiggle*.14;
      paws.forEach(({shoulder,side})=>set(shoulder,-.2,0,side*(.75+wiggle*.2)));feet.forEach(({hip,side})=>set(hip,-.2,0,side*.16));
      ears.forEach((ear,i)=>set(ear,-.2,0,(i===0?1:-1)*.3));
    }else if(action==="land"){
      const impact=1-smooth(0,1,p);height=-impact*.07;bodyScale=1-impact*.08;
    }
    const resting=["idle","sit","lean","balance","wave"].includes(action);
    if(resting){
      if(action==="wave"||state==="welcoming"){set(paws[1].shoulder,-.2,0,2.05);set(paws[1].wrist,0,0,Math.sin(t*6)*.23);}
      if(state==="pointing")set(paws[1].shoulder,-.12,0,1.12);
      if(state==="thinking"||state==="confused"){set(head,.08,gazeX*.12,-.12);set(paws[0].shoulder,-1,0,-.2);}
      if(state==="embarrassed"){set(head,.10,-.15,.08);ears.forEach((ear,i)=>set(ear,-.14,0,(i===0?1:-1)*.20));}
      if(state==="excited"||state==="laughing"){bank=Math.sin(t*6)*.04;headDrop=Math.sin(t*6)*.018;paws.forEach(({shoulder,side})=>set(shoulder,-.15,0,side*.6));}
      if(state==="sleepy"||state==="resting"){set(head,.1,.02,.1);ears.forEach((ear,i)=>set(ear,-.2,0,(i===0?1:-1)*.2));}
      if(action==="balance")bank=bounce*.018;
    }
    joints.forEach(b=>{targetRotation.setFromEuler(targets.get(b)!);b.quaternion.slerp(targetRotation,blend);b.position.copy(originals.get(b)!);});
    body.position.y+=height;body.scale.y=bodyScale;head.position.y+=headDrop;
    group.rotation.set(pitch,yaw,bank);group.scale.setScalar(poseScale);group.position.y=.85;
    // Emissive visor expressions stay legible without texture atlases or a facial mesh download.
    const happy=["happy","welcoming","excited","laughing"].includes(state);
    const surprised=state==="surprised"||state==="scared";
    const sleepy=state==="sleepy"||state==="resting";
    const blinkPhase=t%4.7,blink=!reducedMotion&&blinkPhase>4.49?Math.max(.08,Math.abs(blinkPhase-4.59)/.10):1;
    eyeGroups.forEach(({eye,pupil,glint,happy:arc,brow},index)=>{
      eye.position.x=(index===0?-.145:.145)+gazeX*.025;eye.position.y=.045-gazeY*.018;
      pupil.visible=!happy;glint.visible=!happy;arc.visible=happy;
      const eyeHeight=(sleepy?.27:surprised?1.2:state==="focused"?.78:1)*blink;
      eye.scale.y=T.MathUtils.lerp(eye.scale.y,eyeHeight,blend);
      brow.rotation.z=(index===0?1:-1)*(state==="confused"?(index===0?.4:-.10):surprised?-.13:.10);
      brow.position.y=surprised?.19:.16;
    });
    smile.visible=!surprised&&state!=="talking"&&!sleepy;
    openMouth.visible=surprised||state==="talking";flatMouth.visible=sleepy;
    openMouth.scale.y=state==="talking"?(reducedMotion?.7:.65+Math.sin(t*12)*.22):1;
    blushMaterial.opacity=state==="embarrassed"?.8:happy?.45:.2;
    thrust=reducedMotion?0:thrust;
    engines.forEach(({outer,inner,halo,material},index)=>{
      const flicker=1+Math.sin(t*31+index*2)*.065;
      material.opacity=thrust*.65;(inner.material as T.MeshBasicMaterial).opacity=thrust*.9;
      outer.scale.y=(.35+thrust*.9)*flicker;inner.scale.y=(.3+thrust)*flicker;halo.scale.x=.084*(1+thrust*.25);halo.scale.z=.084*(1+thrust*.25);
    });
    particleMaterial.opacity=thrust*.65;
    for(let i=0;i<12;i++){
      const life=(t*1.7+i/12)%1;particleDummy.position.set((i%2?-.15:.15)+Math.sin(i*3.7)*life*.08,.02-life*.25,.09);
      particleDummy.scale.setScalar((1-life)*thrust);particleDummy.updateMatrix();particles.setMatrixAt(i,particleDummy.matrix);
    }
    particles.instanceMatrix.needsUpdate=true;
    core.scale.setScalar(1+(reducedMotion?0:Math.sin(t*2)*.035));
    group.updateMatrixWorld(true);
  }
  function dispose(){geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());}
  update({state:"curious",action:"idle",progress:0,reducedMotion:true,direction:"right"},0,1,0,0);
  return {group,head,update,dispose,boneCount:joints.length};
}
