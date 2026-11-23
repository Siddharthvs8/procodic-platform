import * as T from "three";
import { createPetRig } from "./pet-rig";
import type { CharacterSnapshot } from "./character";

type SceneRuntime = { attach(host:HTMLDivElement,source:()=>CharacterSnapshot):void; invalidate():void; suspend():void; destroy():void; lease:number };
let retained:SceneRuntime|null=null;
let releaseTimer=0;
function lease(runtime:SceneRuntime){
  clearTimeout(releaseTimer);
  const token=++runtime.lease;
  let released=false;
  return {invalidate(){if(!released)runtime.invalidate();},dispose(){
    if(released)return;released=true;
    if(runtime.lease!==token)return;
    runtime.suspend();
    // React moves the pet from the occluded card portal into the world-space actor.
    // Reuse the canvas/rig through that handoff instead of compiling it twice.
    releaseTimer=window.setTimeout(()=>{if(runtime.lease===token){runtime.destroy();if(retained===runtime)retained=null;}},350);
  }};
}

/** Loaded only once the actual card approaches; never part of the hero's rendering path. */
export async function createPetRenderer(host:HTMLDivElement,snapshot:()=>CharacterSnapshot,signal:AbortSignal) {
  if(retained&&!signal.aborted){retained.attach(host,snapshot);return lease(retained);}
  if(signal.aborted){throw new DOMException("Aborted","AbortError");}
  let renderer:T.WebGLRenderer;
  try { renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"}); }
  catch(error){throw error;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.domElement.setAttribute("aria-hidden","true");host.appendChild(renderer.domElement);
  const scene=new T.Scene();
  const camera=new T.OrthographicCamera(-.7,.7,1.95,-.15,.1,20);camera.position.set(0,0,5);camera.lookAt(0,0,0);
  const rig=createPetRig();scene.add(rig.group);
  scene.add(new T.HemisphereLight("#b9d6da","#1c302b",2.2));
  const key=new T.DirectionalLight("#ffe1bd",3.5);key.position.set(-3,4,5);scene.add(key);
  const fill=new T.DirectionalLight("#8bbdd0",1.5);fill.position.set(3,1,4);scene.add(fill);
  const rim=new T.DirectionalLight("#53d8cd",3);rim.position.set(2,2,-3);scene.add(rim);
  const shadowCanvas=document.createElement("canvas");shadowCanvas.width=128;shadowCanvas.height=64;
  const context=shadowCanvas.getContext("2d")!;const gradient=context.createRadialGradient(64,32,1,64,32,60);gradient.addColorStop(0,"rgba(0,14,21,.45)");gradient.addColorStop(1,"rgba(0,14,21,0)");context.fillStyle=gradient;context.fillRect(0,0,128,64);
  const shadowTexture=new T.CanvasTexture(shadowCanvas);const shadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.45});const shadow=new T.Mesh(new T.PlaneGeometry(.8,.15),shadowMaterial);shadow.position.set(0,.0,-.02);scene.add(shadow);
  let disposed=false,visible=true,frame=0,last=0,clock=0,lastDraw=0;
  const resize=()=>{const width=Math.max(1,host.clientWidth);renderer.setSize(width,width*1.5,false);};
  resize();const resizeObserver=new ResizeObserver(()=>{resize();invalidate();});resizeObserver.observe(host);
  function draw(now:number,force=false){
    if(disposed)return;
    frame=0;
    if(!visible||document.hidden)return;
    const current=snapshot();
    const interval=current.action==="idle"||current.action==="sit"||current.action==="balance"?1000/30:1000/45;
    if(force||now-lastDraw>=interval){
      const delta=Math.min(.05,Math.max(.001,(now-(last||now-16))/1000));last=now;lastDraw=now;
      if(!current.reducedMotion)clock+=delta;
      const tracking=host.closest<HTMLElement>(".companion-figure,.companion-behind");
      const gazeX=Math.max(-1,Math.min(1,parseFloat(tracking?.style.getPropertyValue("--gaze-x")||"0")/5));
      const gazeY=Math.max(-1,Math.min(1,parseFloat(tracking?.style.getPropertyValue("--gaze-y")||"0")/4));
      rig.update(current,clock,current.reducedMotion?1:delta,gazeX,gazeY);
      shadowMaterial.opacity=["jump","flip","flight","hover","dodge","hang"].includes(current.action)?.10:.42;
      renderer.render(scene,camera);
      host.dataset.rigBones=String(rig.boneCount);
    }
    if(!current.reducedMotion)frame=requestAnimationFrame(draw);
  }
  function invalidate(){if(disposed)return;cancelAnimationFrame(frame);last=0;draw(performance.now(),true);}
  const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;if(visible)invalidate();else cancelAnimationFrame(frame);},{rootMargin:"120px"});intersection.observe(host);
  const visibility=()=>{if(document.hidden)cancelAnimationFrame(frame);else invalidate();};document.addEventListener("visibilitychange",visibility);
  const contextLost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(frame);host.dataset.renderer="fallback";};
  const contextRestored=()=>{host.dataset.renderer="webgl";invalidate();};
  renderer.domElement.addEventListener("webglcontextlost",contextLost);renderer.domElement.addEventListener("webglcontextrestored",contextRestored);
  invalidate();
  const runtime:SceneRuntime={lease:0,invalidate,
    attach(nextHost,nextSnapshot){resizeObserver.disconnect();intersection.disconnect();host=nextHost;snapshot=nextSnapshot;host.appendChild(renderer.domElement);visible=true;resize();resizeObserver.observe(host);intersection.observe(host);invalidate();},
    suspend(){cancelAnimationFrame(frame);},
    destroy(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();intersection.disconnect();document.removeEventListener("visibilitychange",visibility);renderer.domElement.removeEventListener("webglcontextlost",contextLost);renderer.domElement.removeEventListener("webglcontextrestored",contextRestored);rig.dispose();shadow.geometry.dispose();shadowMaterial.dispose();shadowTexture.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
  };
  retained=runtime;
  return lease(runtime);
}
