"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionStyle } from "motion/react";
import { useRouter } from "next/navigation";
import { Gamepad2, Pause, Play, X } from "lucide-react";
import { Character, CompanionPaws, warmPetCharacter, type CharacterAction, type CharacterState } from "./character";
import { CompanionSpeech } from "./speech";
import { canIntroduce, COMPANION_HIDDEN, COMPANION_PAUSED, COMPANION_SEEN, landingPosition, railPosition, routeStory, stories } from "./story";
import { planCompanionTravel, surfacePosition, type JourneyAction, type SurfacePose, type TravelKind } from "./travel";
import "./experience.css";

type Phase = "waiting" | "peeking" | "hanging" | "climbing" | "launch" | "active";
type Playback = { stop: () => void; pause: () => void; play: () => void };
type Perch = {element:HTMLElement; fraction:number; edge:"top"|"bottom"; offset:number; pose:SurfacePose; virtual:boolean};
function read(key: string) { try { return sessionStorage.getItem(key) === "yes"; } catch { return false; } }
function save(key: string, value: boolean) { try { if(value) sessionStorage.setItem(key,"yes"); else sessionStorage.removeItem(key); } catch {} }
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(Math.max(min,max),value));
const SURFACES=".ux-explorer-window,.ux-expertise-card,.ux-work-art,.ux-insight,.ux-process-list li,.capability-card,.case-card,.detail-panel,.cta-panel,.product-card,article";

export default function CompanionExperience({ pathname }: { pathname: string }) {
  const router = useRouter();
  const reduced = !!useReducedMotion();
  const [phase, setPhase] = useState<Phase>(()=>read(COMPANION_SEEN)||pathname!=="/" ? "active" : "waiting");
  const [hidden, setHidden] = useState(()=>read(COMPANION_HIDDEN));
  const [paused, setPaused] = useState(()=>read(COMPANION_PAUSED));
  const [inputFocused, setInputFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const [sceneReady,setSceneReady]=useState(false);
  const [anchor, setAnchor] = useState<HTMLElement|null>(null);
  const [footer, setFooter] = useState<HTMLElement|null>(null);
  const [size, setSize] = useState(128);
  const [introSize, setIntroSize] = useState(148);
  const [storyKey, setStoryKey] = useState(()=>routeStory(pathname));
  const [expression, setExpression] = useState<CharacterState>("welcoming");
  const [action, setAction] = useState<CharacterAction>("idle");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [side, setSide] = useState<"left"|"right">("right");
  const [travelKind, setTravelKind] = useState<TravelKind>("idle");
  const [flightDirection, setFlightDirection] = useState<"left"|"right">("right");
  const [playMode,setPlayMode]=useState(false);
  const [reactionMessage,setReactionMessage]=useState<string|null>(null);
  const [virtualPlatform,setVirtualPlatform]=useState(false);
  const [surfacePose,setSurfacePose]=useState<SurfacePose>("stand");
  // World-space Y follows the document. Scrolling moves a settled character with its panel.
  const x = useMotionValue(0), worldY = useMotionValue(0), pageScroll = useMotionValue(0);
  const y = useTransform([worldY,pageScroll],values=>(values[0] as number)-(values[1] as number));
  const progress = useMotionValue(0);
  const speechSpace = useTransform(y, value=>`${Math.max(100,value+size*1.5-130)}px`);
  const backX = useMotionValue(0), backY = useMotionValue(30), backRotate = useMotionValue(0), paws = useMotionValue(0);
  const behind = useRef<HTMLDivElement>(null), actor = useRef<HTMLDivElement>(null);
  const actorButton = useRef<HTMLButtonElement>(null), restoreButton = useRef<HTMLButtonElement>(null);
  const playback = useRef<Playback[]>([]), travel = useRef<Playback[]>([]);
  const journey = useRef(0), visits=useRef(0), lastScroll=useRef(0);
  const perch = useRef<Perch|null>(null), pendingPerch=useRef<Perch|null>(null);
  const firstGreetingUntil = useRef(0), dodgeCooldown=useRef(0);
  const pendingFocus = useRef(false), routeFocus = useRef(false), keyboardFocus=useRef(false), routeMounted=useRef(false);
  const clicks = useRef(0), reactionTimer=useRef(0), dodgeTimer=useRef(0);
  const latest = useRef({ phase, hidden, paused, reduced, expanded, inputFocused, anchor, storyKey, pathname,playMode,travelKind,size,sceneReady });
  latest.current = { phase, hidden, paused, reduced, expanded, inputFocused, anchor, storyKey, pathname,playMode,travelKind,size,sceneReady };
  useEffect(()=>{
    if(hidden)return;
    let alive=true;
    const ready=()=>{if(alive)setSceneReady(true);};
    const fallback=window.setTimeout(ready,2500);
    warmPetCharacter().then(ready,ready);
    return()=>{alive=false;clearTimeout(fallback);};
  },[hidden]);
  const stopPlayback = useCallback(()=>{playback.current.forEach(control=>control.stop()); playback.current=[];},[]);
  const stopTravel = useCallback(()=>{
    journey.current++;
    travel.current.forEach(control=>control.stop()); travel.current=[];
    progress.set(0); setTravelKind("idle"); setAction(perch.current?.pose==="stand"?"balance":perch.current?.pose??"idle"); pendingPerch.current=null;
    setSide(x.get()<document.documentElement.clientWidth/2?"left":"right");
  },[x,progress]);

  const choosePerch=useCallback((key:string,section?:HTMLElement|null):{x:number;y:number;size:number;perch:Perch|null}=>{
    const width=document.documentElement.clientWidth,height=window.innerHeight;
    const bodySize=width<640?96:128;
    const story=stories[key]??stories[routeStory(pathname)];
    const preferredSide=story?.side??"right";
    const scope=section??document.querySelector<HTMLElement>(`[data-companion-section="${key}"]`)??document.querySelector<HTMLElement>("main");
    const candidates=scope?Array.from(scope.querySelectorAll<HTMLElement>(SURFACES)):[];
    if(scope?.matches(SURFACES))candidates.unshift(scope);
    const pose:SurfacePose=story?.perch??"balance";
    const copy=scope?Array.from(scope.querySelectorAll<HTMLElement>("h1,h2,h3,p,label,input,textarea,button,a")).map(element=>element.getBoundingClientRect()).filter(r=>r.width&&r.height&&r.bottom>80&&r.top<height):[];
    const safe=candidates.flatMap(element=>{
      const rect=element.getBoundingClientRect();
      if(rect.width<110||rect.height<30||rect.right<0||rect.left>width)return[];
      return (["top","bottom"] as const).filter(edge=>{
        const foot=rect.top+(edge==="bottom"?rect.height:0);
        const baseline=bodySize*(pose==="sit"?.92:1.39);
        if(!(foot>baseline+85 && foot<height-(bodySize*1.5-baseline)-48))return false;
        const position=surfacePosition(rect,width,height,bodySize,preferredSide,pose,edge);
        const body={left:position.x+bodySize*.3,right:position.x+bodySize*.7,top:position.y+bodySize*.08,bottom:position.y+bodySize*1.39};
        return !copy.some(r=>r.left<body.right&&r.right>body.left&&r.top<body.bottom-3&&r.bottom>body.top);
      }).map(edge=>({element,rect,edge}));
    });
    const candidate=safe.sort((a,b)=>{
      const desiredX=preferredSide==="left"&&width>640?width*.2:width*.8;
      return Math.abs(a.rect.left+a.rect.width/2-desiredX)-Math.abs(b.rect.left+b.rect.width/2-desiredX);
    })[0];
    if(candidate){
      const position=surfacePosition(candidate.rect,width,height,bodySize,preferredSide,pose,candidate.edge);
      return {...position,size:bodySize,perch:{element:candidate.element,fraction:position.fraction,edge:candidate.edge,offset:0,pose,virtual:false}};
    }
    // On text-only sections a small projected step is anchored beside that section.
    const resting=railPosition(width,height,preferredSide,scope?.getBoundingClientRect().top);
    if(!scope)return{...resting,perch:null};
    const rect=scope.getBoundingClientRect();
    const localFloor=resting.y+bodySize*1.39-rect.top;
    return {...resting,perch:{element:scope,fraction:rect.width?(resting.x+bodySize/2-rect.left)/rect.width:.8,edge:"top",offset:localFloor,pose:"balance",virtual:true}};
  },[pathname]);

  const travelTo = useCallback((endX: number, endY: number, bodySize: number, destination:Perch|null=null, requestedAction?:JourneyAction)=>{
    stopTravel(); perch.current=null; pendingPerch.current=destination;
    const token = journey.current, scroll=window.scrollY;
    const from={x:x.get(),y:worldY.get()-scroll};
    const distance=Math.hypot(endX-from.x,endY-from.y);
    visits.current++;
    const maneuver=requestedAction??(distance>110?"flight":"jump");
    const path = planCompanionTravel(from,{x:endX,y:endY},{width:document.documentElement.clientWidth,height:window.innerHeight,size:bodySize},false,maneuver,true);
    pageScroll.set(scroll); setTravelKind(path.kind); setAction(path.action); progress.set(0);
    setFlightDirection(endX<from.x?"left":"right"); setVirtualPlatform(false); setSurfacePose("stand");
    const options = {duration:path.duration,times:path.times,ease:"linear" as const};
    const horizontal = animate(x,path.x,options);
    travel.current = [horizontal,animate(worldY,path.y.map(value=>value+scroll),options),animate(progress,path.progress,options)];
    horizontal.then(()=>{
      if(journey.current!==token)return;
      travel.current=[];perch.current=destination;pendingPerch.current=null;
      const pose=destination?.pose??"stand";
      setSurfacePose(pose);setVirtualPlatform(destination?.virtual??false);setTravelKind("idle");
      setAction(destination?(pose==="stand"?"balance":pose):"hover");progress.set(0);
      setSide(x.get()<document.documentElement.clientWidth/2?"left":"right");
    });
  },[x,worldY,pageScroll,progress,stopTravel]);

  const moveToSection = useCallback((key: string, section?:HTMLElement|null, immediately = false)=>{
    const state = latest.current;
    const focused=keyboardFocus.current&&!!document.activeElement?.closest(".companion-actor");
    if(!immediately&&(state.expanded||state.inputFocused||state.hidden||focused||document.hidden))return;
    const position=choosePerch(key,section);setSize(position.size);
    if(state.reduced||state.paused||immediately){
      // Explicit placement already includes the current scroll. Consume it here
      // so a pending scroll frame cannot shift freshly restored controls twice.
      const currentScroll=window.scrollY;lastScroll.current=currentScroll;
      stopTravel();pageScroll.set(currentScroll);x.set(position.x);worldY.set(position.y+currentScroll);
      perch.current=position.perch;setSurfacePose(position.perch?.pose??"stand");setVirtualPlatform(position.perch?.virtual??false);
      setAction(position.perch?.pose==="stand"?"balance":position.perch?.pose??"idle");
    }else travelTo(position.x,position.y,position.size,position.perch);
    setSide(position.x<document.documentElement.clientWidth/2?"left":"right");
  },[choosePerch,stopTravel,travelTo,x,worldY,pageScroll]);

  const introduce = useCallback((focus = false)=>{
    stopPlayback(); paws.set(0); save(COMPANION_SEEN,true); pendingFocus.current=focus;
    setPhase("active");setStoryKey("welcome");setExpression("welcoming");setOpen(true);
    firstGreetingUntil.current=performance.now()+6500;
    moveToSection("capabilities",anchor?.closest<HTMLElement>("section"),true);
  },[moveToSection,anchor,paws,stopPlayback]);

  useLayoutEffect(()=>{
    const card=pathname==="/"?document.querySelector<HTMLElement>(".ux-explorer-window"):null;
    setAnchor(card);setFooter(document.querySelector<HTMLElement>(".footer-legal"));
    setIntroSize(window.innerWidth<640?116:148);pageScroll.set(window.scrollY);lastScroll.current=window.scrollY;
    setPlayMode(false);setReactionMessage(null);clearTimeout(reactionTimer.current);clearTimeout(dodgeTimer.current);
    if(latest.current.phase==="active"||pathname!=="/"){
      const key=routeStory(pathname);setPhase("active");setStoryKey(key);setExpression(stories[key].state);
      setExpanded(false);setOpen(!latest.current.hidden);perch.current=null;
      // Only the first mount needs immediate placement. Route journeys continue from the old location.
      if(routeMounted.current&&!latest.current.reduced&&!latest.current.paused){
        const target=choosePerch(key);setSize(target.size);travelTo(target.x,target.y,target.size,target.perch);
      }else moveToSection(key,null,true);
      routeMounted.current=true;
    }else{stopPlayback();setPhase("waiting");paws.set(0);}
    if(routeFocus.current){routeFocus.current=false;document.getElementById("main-content")?.focus({preventScroll:true});}
    return()=>{stopPlayback();stopTravel();};
  },[pathname,moveToSection,choosePerch,travelTo,paws,stopPlayback,stopTravel,pageScroll]);

  useEffect(()=>{
    let frame=0,contextTimer=0,proposed="";
    function measure(){
      frame=0;
      const state=latest.current,scroll=window.scrollY,delta=scroll-lastScroll.current;
      lastScroll.current=scroll;pageScroll.set(scroll);
      const focused=keyboardFocus.current&&!!document.activeElement?.closest(".companion-actor");
      if(state.expanded||focused){worldY.set(worldY.get()+delta);return;}
      if(state.hidden||document.hidden)return;
      const bounds=state.anchor?.getBoundingClientRect();
      if(state.phase==="waiting"&&state.sceneReady&&bounds&&canIntroduce(bounds,window.innerHeight)&&document.documentElement.dataset.brandIntro!=="on"){
        if(state.reduced||state.paused)introduce();else setPhase("peeking");
      }
      if(state.phase==="hanging"&&bounds&&bounds.top<window.innerHeight*.72)setPhase("climbing");
      if(state.phase!=="active"||state.inputFocused)return;
      const current=perch.current;
      if(current?.element.isConnected&&state.travelKind==="idle"){
        const r=current.element.getBoundingClientRect();
        const baseline=state.size*(current.pose==="sit"?.92:1.39);
        const floor=r.top+(current.edge==="bottom"?r.height:0)+current.offset;
        x.set(clamp(r.left+r.width*current.fraction-state.size/2,8,document.documentElement.clientWidth-state.size-8));
        worldY.set(floor-baseline+scroll);
      }
      const sections=Array.from(document.querySelectorAll<HTMLElement>("[data-companion-section]"));
      const section=sections.filter(element=>{const r=element.getBoundingClientRect();return r.top<window.innerHeight*.72&&r.bottom>window.innerHeight*.25;})
        .sort((a,b)=>Math.abs(a.getBoundingClientRect().top-window.innerHeight*.28)-Math.abs(b.getBoundingClientRect().top-window.innerHeight*.28))[0];
      const key=section?.dataset.companionSection??routeStory(state.pathname);
      const departed=worldY.get()-scroll<65||worldY.get()-scroll>window.innerHeight-state.size*.7;
      if(performance.now()<firstGreetingUntil.current&&!departed)return;
      if(!stories[key]||(key===state.storyKey&&!departed)){clearTimeout(contextTimer);proposed="";return;}
      if(state.travelKind!=="idle"||proposed===key)return;
      proposed=key;clearTimeout(contextTimer);
      contextTimer=window.setTimeout(()=>{
        const next=latest.current;
        if(next.phase!=="active"||next.expanded||next.inputFocused||next.playMode||document.hidden)return;
        setStoryKey(key);setExpression(stories[key].state);setReactionMessage(null);setOpen(true);
        moveToSection(key,section);proposed="";
      },260);
    }
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
    const resize=()=>{setIntroSize(window.innerWidth<640?116:148);if(latest.current.phase==="active")moveToSection(latest.current.storyKey,null,true);schedule();};
    const observer=new IntersectionObserver(schedule,{threshold:[0,.15,.4,.7]});if(anchor)observer.observe(anchor);
    window.addEventListener("scroll",schedule,{passive:true});window.addEventListener("resize",resize);
    const mutation=new MutationObserver(schedule);const main=document.querySelector("main");if(main)mutation.observe(main,{childList:true,subtree:true});
    const brandObserver=new MutationObserver(schedule);brandObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-brand-intro"]});
    schedule();
    return()=>{cancelAnimationFrame(frame);clearTimeout(contextTimer);observer.disconnect();mutation.disconnect();brandObserver.disconnect();window.removeEventListener("scroll",schedule);window.removeEventListener("resize",resize);};
  },[anchor,phase,hidden,reduced,paused,pathname,travelKind,sceneReady,introduce,moveToSection,pageScroll,worldY,x]);

  useEffect(()=>{
    if(phase!=="peeking"||!anchor)return;
    let alive=true;
    const sidePeek=anchor.offsetWidth*.34+introSize*.05;
    const times=[0,.13,.23,.3,.37,.43,.54,.63,.72,.87,1];
    backX.set(0);backY.set(24);backRotate.set(0);paws.set(0);setExpression("curious");
    const options={duration:5.2,times,ease:"easeInOut" as const};
    const vertical=animate(backY,[24,-introSize*.22,-introSize*.24,-introSize*.22,24,80,80,80,24,-introSize*.43,-introSize*.42],options);
    playback.current=[vertical,animate(backX,[0,0,-3,3,0,sidePeek-35,sidePeek,sidePeek-8,0,0,0],options),animate(backRotate,[0,0,-4,4,0,0,10,5,0,-3,0],options),animate(paws,[0,0,1,1],{duration:5.2,times:[0,.8,.88,1]})];
    vertical.then(()=>{if(alive)setPhase("hanging");});
    return()=>{alive=false;stopPlayback();};
  },[phase,anchor,introSize,backX,backY,backRotate,paws,stopPlayback]);

  useLayoutEffect(()=>{
    if(phase!=="climbing"||!anchor)return;
    let alive=true;
    progress.set(0);
    const lift=animate(backY,[-introSize*.42,-introSize*.48,-introSize*.7,-introSize*.92],{duration:.72,times:[0,.2,.65,1],ease:"easeInOut"});
    playback.current=[lift,animate(progress,[0,1],{duration:.72,ease:"linear"}),animate(paws,[1,1,0],{duration:.72,times:[0,.85,1]})];
    lift.then(()=>{if(alive)setPhase("launch");});
    return()=>{alive=false;stopPlayback();};
  },[phase,anchor,introSize,backY,progress,paws,stopPlayback]);

  useLayoutEffect(()=>{
    if(phase!=="launch"||!anchor)return;
    let alive=true;
    const r=anchor.getBoundingClientRect(),scroll=window.scrollY;
    const {startX,startY,x:endX,y:endY,perched}=landingPosition(r,document.documentElement.clientWidth,window.innerHeight,introSize);
    setSize(introSize);setSide(endX>window.innerWidth/2?"right":"left");
    const path=planCompanionTravel({x:startX,y:startY},{x:endX,y:endY},{width:document.documentElement.clientWidth,height:window.innerHeight,size:introSize},true,"flight");
    x.set(path.x[0]);worldY.set(path.y[0]+scroll);pageScroll.set(scroll);setExpression("focused");paws.set(0);
    setTravelKind(path.kind);setAction(path.action);progress.set(0);setFlightDirection(endX<startX?"left":"right");
    const options={duration:path.duration,times:path.times,ease:"linear" as const};
    const vertical=animate(worldY,path.y.map(value=>value+scroll),options);
    playback.current=[vertical,animate(x,path.x,options),animate(progress,path.progress,options)];
    vertical.then(()=>{
      if(!alive)return;
      save(COMPANION_SEEN,true);routeMounted.current=true;
      const actualX=x.get();
      perch.current=perched?{element:anchor,fraction:(actualX+introSize/2-r.left)/r.width,edge:"top",offset:0,pose:"balance",virtual:false}:null;
      firstGreetingUntil.current=performance.now()+6500;
      setTravelKind("idle");setAction("wave");setPhase("active");setStoryKey("welcome");setExpression("welcoming");setOpen(true);
    });
    return()=>{alive=false;stopPlayback();};
  },[phase,anchor,introSize,x,worldY,pageScroll,paws,progress,stopPlayback]);

  useEffect(()=>{
    const sync=()=>{
      setPageHidden(document.hidden);
      const r=anchor?.getBoundingClientRect();const offscreen=phase==="peeking"&&r&&(r.top>window.innerHeight||r.bottom<100);
      playback.current.forEach(control=>document.hidden||offscreen?control.pause():control.play());
      travel.current.forEach(control=>document.hidden?control.pause():control.play());
    };
    const observer=new IntersectionObserver(sync);if(anchor)observer.observe(anchor);
    document.addEventListener("visibilitychange",sync);
    return()=>{observer.disconnect();document.removeEventListener("visibilitychange",sync);};
  },[anchor,phase]);
  useEffect(()=>{
    if(reduced||paused||hidden||inputFocused||expanded){stopTravel();clearTimeout(dodgeTimer.current);}
    if(reduced||paused)setPlayMode(false);
    if((reduced||paused)&&["peeking","hanging","climbing","launch"].includes(phase))introduce();
  },[reduced,paused,hidden,inputFocused,expanded,phase,introduce,stopTravel]);

  useEffect(()=>{
    if(phase!=="active"||hidden)return;
    if(pendingFocus.current){pendingFocus.current=false;actorButton.current?.focus({preventScroll:true});}
    const talking=window.setTimeout(()=>{if(open&&!paused&&!latest.current.playMode)setExpression("talking");},400);
    const spoken=window.setTimeout(()=>{if(open&&!latest.current.playMode)setExpression(stories[storyKey]?.state??"happy");},2700);
    const quiet=window.setTimeout(()=>{if(!latest.current.expanded&&!latest.current.playMode){setExpression("idle");if(latest.current.travelKind==="idle")setAction(perch.current?.pose==="stand"?"balance":perch.current?.pose??"idle");}},5200);
    const rest=window.setTimeout(()=>{if(!latest.current.expanded&&!latest.current.playMode&&latest.current.travelKind==="idle")setExpression("sleepy");},24000);
    const dismiss=window.setTimeout(()=>{if(!latest.current.expanded&&!latest.current.playMode&&!document.activeElement?.closest(".companion-actor"))setOpen(false);},11000);
    return()=>{clearTimeout(talking);clearTimeout(spoken);clearTimeout(quiet);clearTimeout(rest);clearTimeout(dismiss);};
  },[phase,hidden,storyKey,open,expanded,paused]);

  useEffect(()=>{
    if(hidden)return;
    let frame=0;
    let pointer={x:0,y:0};
    const track=(event:PointerEvent)=>{
      const state=latest.current;
      if(event.pointerType!=="mouse"||state.reduced||state.paused)return;
      pointer={x:event.clientX,y:event.clientY};
      if(frame)return;
      frame=requestAnimationFrame(()=>{
        frame=0;const current=latest.current;
        const element=current.phase==="active"?actor.current:behind.current;if(!element)return;
        const r=element.getBoundingClientRect();
        element.style.setProperty("--gaze-x",`${clamp((pointer.x-r.left-r.width/2)/65,-5,5)}px`);
        element.style.setProperty("--gaze-y",`${clamp((pointer.y-r.top-r.height*.2)/65,-4,4)}px`);
        if(!current.playMode||current.expanded||current.inputFocused||current.travelKind!=="idle"||keyboardFocus.current||performance.now()<dodgeCooldown.current)return;
        const near=Math.hypot(pointer.x-r.left-r.width/2,pointer.y-r.top-r.height*.45)<100;
        if(!near||dodgeTimer.current)return;
        // A short readable anticipation window makes catching possible, without hijacking clicks.
        setExpression("scared");setAction("dodge");
        dodgeTimer.current=window.setTimeout(()=>{
          dodgeTimer.current=0;const s=latest.current;
          if(!s.playMode||s.paused||s.reduced||s.expanded||s.inputFocused||keyboardFocus.current)return;
          dodgeCooldown.current=performance.now()+2300;
          const width=document.documentElement.clientWidth;
          const direction=pointer.x<x.get()+s.size/2?1:-1;
          let endX=clamp(x.get()+direction*150,8,width-s.size-8);
          if(Math.abs(endX-x.get())<40)endX=clamp(x.get()-direction*150,8,width-s.size-8);
          const endY=clamp(worldY.get()-window.scrollY+(visits.current%2?-35:25),95,window.innerHeight-s.size*1.5-48);
          travelTo(endX,endY,s.size,null,visits.current%3===0?"flip":"dodge");
          setReactionMessage(stories.escaped.message);setOpen(true);
        },240);
      });
    };
    const hover=(event:PointerEvent)=>{
      const state=latest.current;if(state.phase!=="active"||state.paused||state.expanded||state.playMode)return;
      const target=(event.target as Element).closest("main a[href], .ux-explorer-tabs button");if(!target)return;
      setExpression(target.getAttribute("href")?.startsWith("/ai")?"thinking":"focused");
    };
    const contentClick=(event:MouseEvent)=>{
      const target=(event.target as Element).closest(".ux-explorer-tabs button, main button, main a");
      const state=latest.current;if(!target||state.phase!=="active"||state.playMode||state.inputFocused)return;
      const interaction=stories[state.storyKey]?.interaction;
      if(interaction){setExpression(interaction.state);setReactionMessage(interaction.message);setOpen(true);}
    };
    const focus=()=>{
      const editing=!!document.activeElement?.matches("input,textarea,select,[contenteditable=true]");
      if(editing||(keyboardFocus.current&&document.activeElement?.closest(".companion-actor")))stopTravel();
      setInputFocused(editing);if(editing){setOpen(false);setExpanded(false);setPlayMode(false);}
    };
    const key=(event:KeyboardEvent)=>{if(event.key==="Tab")keyboardFocus.current=true;};
    const pointerDown=()=>{keyboardFocus.current=false;};
    window.addEventListener("pointermove",track,{passive:true});document.addEventListener("pointerover",hover,{passive:true});document.addEventListener("click",contentClick);document.addEventListener("focusin",focus);document.addEventListener("focusout",focus);document.addEventListener("keydown",key);document.addEventListener("pointerdown",pointerDown,{passive:true});
    return()=>{cancelAnimationFrame(frame);clearTimeout(dodgeTimer.current);dodgeTimer.current=0;window.removeEventListener("pointermove",track);document.removeEventListener("pointerover",hover);document.removeEventListener("click",contentClick);document.removeEventListener("focusin",focus);document.removeEventListener("focusout",focus);document.removeEventListener("keydown",key);document.removeEventListener("pointerdown",pointerDown);};
  },[hidden,stopTravel,travelTo,x,worldY]);

  useEffect(()=>{
    if(!open||travelKind!=="idle"||playMode)return;
    const selector=stories[storyKey]?.highlight;if(!selector)return;
    const section=document.querySelector(`[data-companion-section="${storyKey}"]`);
    const element=section?.querySelector(selector);element?.classList.add("companion-highlight");
    const timeout=window.setTimeout(()=>element?.classList.remove("companion-highlight"),3500);
    return()=>{clearTimeout(timeout);element?.classList.remove("companion-highlight");};
  },[storyKey,open,travelKind,playMode]);
  useEffect(()=>()=>{stopPlayback();stopTravel();clearTimeout(reactionTimer.current);clearTimeout(dodgeTimer.current);},[stopPlayback,stopTravel]);

  function togglePause(){setPaused(value=>{save(COMPANION_PAUSED,!value);return!value;});}
  function hide(){save(COMPANION_HIDDEN,true);setHidden(true);setOpen(false);setExpanded(false);setPlayMode(false);restoreButton.current?.focus({preventScroll:true});}
  function dismiss(){setOpen(false);setExpanded(false);actorButton.current?.focus({preventScroll:true});}
  function expand(){stopTravel();setPlayMode(false);setExpanded(value=>!value);}
  function togglePlay(){
    if(reduced||paused){setReactionMessage("I’ll stay still while motion is paused. You can still say hello or explore with me.");setOpen(true);return;}
    stopTravel();clearTimeout(dodgeTimer.current);dodgeTimer.current=0;setExpanded(false);setOpen(true);
    const next=!playMode;setPlayMode(next);setExpression(next?"excited":"welcoming");setAction(next?"wave":"balance");
    dodgeCooldown.current=performance.now()+1400;
    setReactionMessage(next?stories.play.message:null);
    if(!next)moveToSection(storyKey);
  }
  function greet(){
    clicks.current++;clearTimeout(dodgeTimer.current);dodgeTimer.current=0;clearTimeout(reactionTimer.current);
    stopTravel();setOpen(true);setExpanded(false);
    if(playMode){
      dodgeCooldown.current=performance.now()+3200;setAction("caught");setExpression(clicks.current%2?"embarrassed":"laughing");
      setReactionMessage(stories.caught.message);
      reactionTimer.current=window.setTimeout(()=>{
        const state=latest.current;
        if(!state.playMode||state.paused||state.reduced||state.inputFocused||state.travelKind!=="idle")return;
        if(keyboardFocus.current){setAction("wave");setExpression("happy");return;}
        const width=document.documentElement.clientWidth;
        const endX=clamp(x.get()+(x.get()<width/2?130:-130),8,width-state.size-8);
        const endY=clamp(worldY.get()-window.scrollY,95,window.innerHeight-state.size*1.5-48);
        setExpression("laughing");setReactionMessage(stories.escaped.message);
        travelTo(endX,endY,state.size,null,"dodge");
      },1700);
    }else{
      const reactions:CharacterState[]=["welcoming","laughing","surprised","happy"];
      setExpression(reactions[(clicks.current-1)%reactions.length]);setAction(clicks.current%4===0?"hover":clicks.current%3===0?"caught":"wave");setReactionMessage(null);
      if(clicks.current%3===0&&!paused&&!reduced)travelTo(x.get(),worldY.get()-window.scrollY,size,perch.current,"flip");
      reactionTimer.current=window.setTimeout(()=>{if(latest.current.travelKind==="idle")setAction(perch.current?.pose==="stand"?"balance":perch.current?.pose??"idle");},2200);
    }
  }
  const visible=phase==="active"||phase==="launch",inScene=phase==="peeking"||phase==="hanging"||phase==="climbing",parent=anchor?.parentElement;
  return <>
    {parent&&!hidden&&inScene&&createPortal(<>
      <motion.div ref={behind} className="companion-behind" data-phase={phase} style={{width:introSize,left:`calc(66% - ${introSize/2}px)`,top:anchor.offsetTop,x:backX,y:backY,rotate:backRotate}}><Character state="curious" action={phase==="climbing"?"climb":phase==="hanging"?"hang":"peek"} progress={progress} reducedMotion={reduced||paused||pageHidden}/></motion.div>
      <motion.div className="companion-paws" style={{width:introSize,left:`calc(66% - ${introSize/2}px)`,top:anchor.offsetTop-7,opacity:paws}}><CompanionPaws/></motion.div>
      <div className="companion-scene-controls" style={{top:anchor.offsetTop-44}}><button type="button" onClick={()=>introduce(true)}>{phase==="hanging"?"Come on out, Nova":"Someone’s hiding…"}<span>Skip reveal ↗</span></button><button type="button" onClick={()=>{togglePause();introduce(true);}} aria-label="Pause Nova’s motion"><Pause size={13}/></button></div>
    </>,parent)}
    {visible&&!hidden&&<motion.div className="companion-actor" data-phase={phase} data-side={side} data-travel={travelKind} data-action={action} data-playing={playMode} data-pose={surfacePose} data-flight-direction={flightDirection} data-editing={inputFocused} data-suspended={paused||reduced||pageHidden} style={{x,y,width:size,"--companion-space":speechSpace} as MotionStyle}>
      <div ref={actor} className="companion-figure" data-still={paused||reduced}>
        {virtualPlatform&&travelKind==="idle"&&<span className="companion-projected-step" aria-hidden="true"/>}
        <span className="companion-contact-shadow" aria-hidden="true"/>
        <button ref={actorButton} className="companion-character-button" type="button" disabled={phase==="launch"} aria-label={playMode?"Catch Nova. Press Enter or click":"Nova, your site guide. Say hello"} aria-expanded={open&&expanded} onClick={greet} onPointerEnter={()=>{if(phase==="active"&&!paused&&!playMode)setExpression("curious");}}>
          <Character state={paused?"resting":expression} action={action} progress={progress} direction={flightDirection} reducedMotion={reduced||paused||pageHidden||inputFocused}/>
        </button>
      </div>
      {phase==="active"&&<><CompanionSpeech message={reactionMessage??stories[storyKey]?.message??stories.welcome.message} open={open&&!inputFocused&&travelKind==="idle"} expanded={expanded} reducedMotion={reduced} paused={paused} side={side} playMode={playMode} onTogglePlay={togglePlay} onToggleExpanded={expand} onDismiss={dismiss} onPause={togglePause} onHide={hide} onExplore={href=>{setOpen(false);setExpanded(false);setPlayMode(false);routeFocus.current=true;router.push(href);}}/>
      <div className="companion-tools"><button type="button" onClick={togglePlay} aria-pressed={playMode} aria-label={playMode?"Stop playing with Nova":"Play with Nova"} title={playMode?"Stop playing":"Play with Nova"}><Gamepad2 size={13}/></button><button type="button" onClick={togglePause} aria-label={paused?"Resume Nova’s motion":"Pause Nova’s motion"}>{paused?<Play size={12}/>:<Pause size={12}/>}</button><button type="button" onClick={hide} aria-label="Hide Nova"><X size={12}/></button></div></>}
    </motion.div>}
    {footer&&phase==="active"&&createPortal(<button ref={restoreButton} type="button" className="companion-restore" onClick={()=>{save(COMPANION_HIDDEN,false);setHidden(false);setOpen(true);setExpanded(true);pendingFocus.current=true;moveToSection(routeStory(pathname),null,true);}}>{hidden?"Show Nova":"Site guide"}</button>,footer)}
  </>;
}
