"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionStyle } from "motion/react";
import { useRouter } from "next/navigation";
import { Pause, Play, X } from "lucide-react";
import { Character, CompanionPaws, type CharacterState } from "./character";
import { CompanionSpeech } from "./speech";
import { canIntroduce, COMPANION_HIDDEN, COMPANION_PAUSED, COMPANION_SEEN, landingPosition, railPosition, routeStory, stories } from "./story";
import { planCompanionTravel, type TravelKind } from "./travel";
import "./experience.css";

type Phase = "waiting" | "peeking" | "hanging" | "launch" | "active";
type Playback = { stop: () => void; pause: () => void; play: () => void };
function read(key: string) { try { return sessionStorage.getItem(key) === "yes"; } catch { return false; } }
function save(key: string, value: boolean) { try { if(value) sessionStorage.setItem(key,"yes"); else sessionStorage.removeItem(key); } catch {} }

export default function CompanionExperience({ pathname }: { pathname: string }) {
  const router = useRouter();
  const reduced = !!useReducedMotion();
  const [phase, setPhase] = useState<Phase>(()=>read(COMPANION_SEEN) ? "active" : "waiting");
  const [hidden, setHidden] = useState(()=>read(COMPANION_HIDDEN));
  const [paused, setPaused] = useState(()=>read(COMPANION_PAUSED));
  const [inputFocused, setInputFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement|null>(null);
  const [footer, setFooter] = useState<HTMLElement|null>(null);
  const [size, setSize] = useState(106);
  const [introSize, setIntroSize] = useState(128);
  const [storyKey, setStoryKey] = useState(()=>routeStory(pathname));
  const [expression, setExpression] = useState<CharacterState>("idle");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [side, setSide] = useState<"left"|"right">("right");
  const [travelKind, setTravelKind] = useState<TravelKind>("idle");
  const [flightDirection, setFlightDirection] = useState<"left"|"right">("right");
  const x = useMotionValue(0), y = useMotionValue(0);
  const bank = useMotionValue(0), stretchX = useMotionValue(1), stretchY = useMotionValue(1);
  const speechSpace = useTransform(y, value=>`${Math.max(100,value+size*1.1-130)}px`);
  const backX = useMotionValue(0), backY = useMotionValue(30), backRotate = useMotionValue(0), paws = useMotionValue(0);
  const behind = useRef<HTMLDivElement>(null);
  const actor = useRef<HTMLDivElement>(null);
  const actorButton = useRef<HTMLButtonElement>(null);
  const restoreButton = useRef<HTMLButtonElement>(null);
  const playback = useRef<Playback[]>([]);
  const travel = useRef<Playback[]>([]);
  const journey = useRef(0);
  const perch = useRef<number|null>(null);
  const firstGreetingUntil = useRef(0);
  const pendingFocus = useRef(false);
  const routeFocus = useRef(false);
  const clicks = useRef(0);
  const latest = useRef({ phase, hidden, paused, reduced, expanded, inputFocused, anchor, storyKey, pathname });
  latest.current = { phase, hidden, paused, reduced, expanded, inputFocused, anchor, storyKey, pathname };
  const stopPlayback = useCallback(()=>{playback.current.forEach(control=>control.stop()); playback.current=[];},[]);
  const stopTravel = useCallback(()=>{
    journey.current++;
    travel.current.forEach(control=>control.stop()); travel.current=[];
    bank.set(0); stretchX.set(1); stretchY.set(1); setTravelKind("idle");
    setSide(x.get()<document.documentElement.clientWidth/2?"left":"right");
  },[x,bank,stretchX,stretchY]);

  const travelTo = useCallback((endX: number, endY: number, bodySize: number)=>{
    stopTravel();
    const token = journey.current;
    const path = planCompanionTravel({x:x.get(),y:y.get()},{x:endX,y:endY},{width:document.documentElement.clientWidth,height:window.innerHeight,size:bodySize});
    setTravelKind(path.kind); setFlightDirection(endX<x.get()?"left":"right");
    const options = {duration:path.duration,times:path.times,ease:"linear" as const};
    const horizontal = animate(x,path.x,options);
    travel.current = [horizontal,animate(y,path.y,options),animate(bank,path.rotate,options),animate(stretchX,path.scaleX,options),animate(stretchY,path.scaleY,options)];
    horizontal.then(()=>{if(journey.current===token){travel.current=[];setTravelKind("idle");}});
  },[x,y,bank,stretchX,stretchY,stopTravel]);

  const moveToRail = useCallback((key: string, top?: number, immediately = false)=>{
    const state = latest.current;
    const focused = !!document.activeElement?.closest(".companion-actor");
    if(!immediately && (state.expanded || state.inputFocused || state.hidden || focused || document.hidden)) return;
    const position = railPosition(document.documentElement.clientWidth,window.innerHeight,stories[key]?.side ?? "right",top);
    setSize(position.size);
    if(state.reduced || state.paused || immediately) { stopTravel(); x.set(position.x); y.set(position.y); }
    else travelTo(position.x,position.y,position.size);
    setSide(position.x < document.documentElement.clientWidth/2 ? "left" : "right");
  },[x,y,stopTravel,travelTo]);

  const introduce = useCallback((focus = false)=>{
    stopPlayback(); paws.set(0); save(COMPANION_SEEN,true); pendingFocus.current=focus;
    setPhase("active"); setStoryKey("welcome"); setExpression("happy"); setOpen(true);
    firstGreetingUntil.current=performance.now()+8000;
    moveToRail("welcome",undefined,true);
  },[moveToRail,paws,stopPlayback]);

  // Resolve the actual card after route changes. No replacement card or layout wrapper.
  useLayoutEffect(()=>{
    setAnchor(pathname === "/" ? document.querySelector<HTMLElement>(".ux-explorer-window") : null);
    setFooter(document.querySelector<HTMLElement>(".footer-legal"));
    setIntroSize(window.innerWidth < 640 ? 108 : 128);
    if(latest.current.phase === "active") {
      const key=routeStory(pathname); setStoryKey(key); setExpression(stories[key].state);
      setExpanded(false); setOpen(!latest.current.hidden); perch.current=null;
      moveToRail(key,undefined,true);
    } else { stopPlayback(); setPhase("waiting"); paws.set(0); }
    if(routeFocus.current) { routeFocus.current=false; document.getElementById("main-content")?.focus({preventScroll:true}); }
    return ()=>{stopPlayback();stopTravel();};
  },[pathname,moveToRail,paws,stopPlayback,stopTravel]);

  useEffect(()=>{
    let frame=0, contextTimer=0;
    let proposed="";
    function measure() {
      frame=0;
      const state=latest.current;
      if(state.hidden || document.hidden) return;
      const bounds=state.anchor?.getBoundingClientRect();
      if(state.phase === "waiting" && bounds && canIntroduce(bounds,window.innerHeight) && document.documentElement.dataset.brandIntro !== "on") {
        if(state.reduced || state.paused) introduce(); else setPhase("peeking");
      }
      if(state.phase === "hanging" && bounds && bounds.top < window.innerHeight*.64) setPhase("launch");
      if(state.phase !== "active" || state.expanded || state.inputFocused || document.activeElement?.closest(".companion-actor")) return;
      if(perch.current !== null) {
        if(Math.abs(window.scrollY-perch.current)<70) return;
        perch.current=null; moveToRail(state.storyKey);
      }
      if(state.pathname !== "/" || performance.now()<firstGreetingUntil.current) return;
      const sections=Array.from(document.querySelectorAll<HTMLElement>("[data-companion-section]"));
      const section=sections.find(element=>{const r=element.getBoundingClientRect();return r.top<window.innerHeight*.55 && r.bottom>window.innerHeight*.35;});
      const key=section?.dataset.companionSection;
      if(!key || !stories[key] || key===state.storyKey) {clearTimeout(contextTimer); proposed=""; return;}
      if(proposed===key) return;
      proposed=key; clearTimeout(contextTimer);
      contextTimer=window.setTimeout(()=>{
        if(latest.current.phase!=="active" || latest.current.expanded || latest.current.inputFocused || document.hidden || document.activeElement?.closest(".companion-actor")) return;
        setStoryKey(key); setExpression(stories[key].state); setOpen(true);
        moveToRail(key,section?.getBoundingClientRect().top);
      },350);
    }
    function schedule() {if(!frame) frame=requestAnimationFrame(measure);}
    function resize() {perch.current=null;setIntroSize(window.innerWidth<640?108:128);if(latest.current.phase==="active")moveToRail(latest.current.storyKey,undefined,true);schedule();}
    const observer=new IntersectionObserver(schedule,{threshold:[0,.15,.4,.7]});
    if(anchor) observer.observe(anchor);
    window.addEventListener("scroll",schedule,{passive:true}); window.addEventListener("resize",resize);
    // Streaming content can add sections; querying at each scheduled observation includes them.
    const mutation=new MutationObserver(schedule);
    const main=document.querySelector("main"); if(main) mutation.observe(main,{childList:true,subtree:true});
    const brandObserver=new MutationObserver(schedule);
    brandObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-brand-intro"]});
    schedule();
    return ()=>{cancelAnimationFrame(frame);clearTimeout(contextTimer);observer.disconnect();mutation.disconnect();brandObserver.disconnect();window.removeEventListener("scroll",schedule);window.removeEventListener("resize",resize);};
  },[anchor,phase,hidden,reduced,paused,pathname,introduce,moveToRail]);

  // A continuous, pausable timeline: eyes -> retreat -> side peek -> two-handed hang.
  useEffect(()=>{
    if(phase!=="peeking" || !anchor) return;
    let alive=true;
    const width=anchor.offsetWidth, sidePeek=width*.34+introSize*.05;
    const times=[0,.13,.23,.3,.37,.43,.54,.63,.72,.87,1];
    backX.set(0); backY.set(24); backRotate.set(0); paws.set(0); setExpression("curious");
    const options={duration:5.2,times,ease:"easeInOut" as const};
    const vertical=animate(backY,[24,-introSize*.54,-introSize*.56,-introSize*.54,24,80,80,80,24,-introSize*.7,-introSize*.68],options);
    playback.current=[vertical,
      animate(backX,[0,0,-3,3,0,sidePeek-35,sidePeek,sidePeek-8,0,0,0],options),
      animate(backRotate,[0,0,-6,6,0,0,15,8,0,-5,0],options),
      animate(paws,[0,0,1,1],{duration:5.2,times:[0,.8,.88,1]})];
    vertical.then(()=>{if(alive)setPhase("hanging");});
    return ()=>{alive=false;stopPlayback();};
  },[phase,anchor,introSize,backX,backY,backRotate,paws,stopPlayback]);

  // Match the card-space position before moving to the viewport layer, then spring out.
  useLayoutEffect(()=>{
    if(phase!=="launch" || !anchor) return;
    let alive=true;
    const r=anchor.getBoundingClientRect();
    const {startX,startY,x:endX,y:endY,perched:safePerch}=landingPosition(r,document.documentElement.clientWidth,window.innerHeight,introSize);
    setSize(introSize); setSide(endX>window.innerWidth/2?"right":"left");
    const path=planCompanionTravel({x:startX,y:startY},{x:endX,y:endY},{width:document.documentElement.clientWidth,height:window.innerHeight,size:introSize},true);
    x.set(path.x[0]); y.set(path.y[0]); setExpression("excited"); paws.set(0);
    setTravelKind("jump"); setFlightDirection(endX<startX?"left":"right");
    const options={duration:path.duration,times:path.times,ease:"linear" as const};
    const vertical=animate(y,path.y,options);
    playback.current=[vertical,animate(x,path.x,options),animate(bank,path.rotate,options),animate(stretchX,path.scaleX,options),animate(stretchY,path.scaleY,options)];
    vertical.then(()=>{
      if(!alive)return;
      save(COMPANION_SEEN,true); perch.current=safePerch?window.scrollY:null;
      firstGreetingUntil.current=performance.now()+8000;
      setTravelKind("idle"); setPhase("active"); setStoryKey("welcome"); setExpression("happy");setOpen(true);
    });
    return ()=>{alive=false;stopPlayback();bank.set(0);stretchX.set(1);stretchY.set(1);};
  },[phase,anchor,introSize,x,y,paws,bank,stretchX,stretchY,stopPlayback]);

  // Background tabs and off-screen introductions do not keep animating.
  useEffect(()=>{
    const sync=()=>{
      setPageHidden(document.hidden);
      const r=anchor?.getBoundingClientRect();
      const offscreen=phase==="peeking" && r && (r.top>window.innerHeight || r.bottom<100);
      playback.current.forEach(control=>document.hidden||offscreen?control.pause():control.play());
      travel.current.forEach(control=>document.hidden?control.pause():control.play());
    };
    const observer=new IntersectionObserver(sync); if(anchor)observer.observe(anchor);
    document.addEventListener("visibilitychange",sync);
    return ()=>{observer.disconnect();document.removeEventListener("visibilitychange",sync);};
  },[anchor,phase]);
  useEffect(()=>{
    if(reduced||paused||hidden||inputFocused||expanded) stopTravel();
    if((reduced||paused) && ["peeking","hanging","launch"].includes(phase)) introduce();
  },[reduced,paused,hidden,inputFocused,expanded,phase,introduce,stopTravel]);

  useEffect(()=>{
    if(phase!=="active" || hidden) return;
    if(pendingFocus.current){pendingFocus.current=false;actorButton.current?.focus({preventScroll:true});}
    const talking=window.setTimeout(()=>{if(open&&!paused)setExpression("talking");},300);
    const spoken=window.setTimeout(()=>{if(open)setExpression(stories[storyKey]?.state??"happy");},2300);
    const quiet=window.setTimeout(()=>{if(!latest.current.expanded)setExpression("idle");},4500);
    const rest=window.setTimeout(()=>{if(!latest.current.expanded)setExpression("resting");},22000);
    const dismiss=window.setTimeout(()=>{if(!latest.current.expanded && !document.activeElement?.closest(".companion-actor"))setOpen(false);},9500);
    return ()=>{clearTimeout(talking);clearTimeout(spoken);clearTimeout(quiet);clearTimeout(rest);clearTimeout(dismiss);};
  },[phase,hidden,storyKey,open,expanded,paused]);

  useEffect(()=>{
    if(hidden)return;
    let frame=0, reaction=0;
    let pointer={x:0,y:0};
    const track=(event:PointerEvent)=>{
      if(event.pointerType!=="mouse" || latest.current.reduced || latest.current.paused)return;
      pointer={x:event.clientX,y:event.clientY};
      if(frame)return;
      frame=requestAnimationFrame(()=>{
        frame=0;
        const element=latest.current.phase==="active"?actor.current:behind.current;
        if(!element)return;
        const r=element.getBoundingClientRect();
        element.style.setProperty("--gaze-x",`${Math.max(-5,Math.min(5,(pointer.x-r.left-r.width/2)/65))}px`);
        element.style.setProperty("--gaze-y",`${Math.max(-4,Math.min(4,(pointer.y-r.top-r.height/2)/65))}px`);
      });
    };
    const hover=(event:PointerEvent)=>{
      if(latest.current.phase!=="active" || latest.current.paused || latest.current.expanded)return;
      const target=(event.target as Element).closest("main a[href], .ux-explorer-tabs button");
      if(!target)return;
      setExpression(target.getAttribute("href")?.startsWith("/ai")?"thinking":"pointing");
      clearTimeout(reaction);reaction=window.setTimeout(()=>setExpression("idle"),2000);
    };
    const focus=()=>{
      const editing=!!document.activeElement?.matches("input,textarea,select,[contenteditable=true]");
      if(editing || document.activeElement?.closest(".companion-actor")) stopTravel();
      setInputFocused(editing);if(editing){setOpen(false);setExpanded(false);}
    };
    window.addEventListener("pointermove",track,{passive:true});document.addEventListener("pointerover",hover,{passive:true});document.addEventListener("focusin",focus);document.addEventListener("focusout",focus);
    return ()=>{cancelAnimationFrame(frame);clearTimeout(reaction);window.removeEventListener("pointermove",track);document.removeEventListener("pointerover",hover);document.removeEventListener("focusin",focus);document.removeEventListener("focusout",focus);};
  },[hidden,stopTravel]);
  useEffect(()=>()=>{stopPlayback();stopTravel();},[stopPlayback,stopTravel]);

  function togglePause(){setPaused(value=>{save(COMPANION_PAUSED,!value);return !value;});}
  function hide(){save(COMPANION_HIDDEN,true);setHidden(true);setOpen(false);setExpanded(false);restoreButton.current?.focus({preventScroll:true});}
  function dismiss(){setOpen(false);setExpanded(false);actorButton.current?.focus({preventScroll:true});}
  function expand(){stopTravel();setExpanded(value=>!value);}
  function greet(){clicks.current++;setExpression((["happy","surprised","excited"] as CharacterState[])[clicks.current%3]);setOpen(true);expand();}
  const visible=phase==="active"||phase==="launch";
  const inScene=phase==="peeking"||phase==="hanging";
  const parent=anchor?.parentElement;
  return <>
    {parent && !hidden && inScene && createPortal(<>
      <motion.div ref={behind} className="companion-behind" data-phase={phase} style={{width:introSize,left:`calc(66% - ${introSize/2}px)`,top:anchor.offsetTop,x:backX,y:backY,rotate:backRotate}}><Character state="curious" reducedMotion={reduced||paused||pageHidden}/></motion.div>
      <motion.div className="companion-paws" style={{width:introSize,left:`calc(66% - ${introSize/2}px)`,top:anchor.offsetTop-7,opacity:paws}}><CompanionPaws/></motion.div>
      <div className="companion-scene-controls" style={{top:anchor.offsetTop-44}}><button type="button" onClick={()=>introduce(true)}>{phase==="hanging"?"Come on out, Pip":"Something’s hiding…"}<span>Skip reveal ↗</span></button><button type="button" onClick={()=>{togglePause();introduce(true);}} aria-label="Pause Pip’s motion"><Pause size={13}/></button></div>
    </>,parent)}
    {visible && !hidden && <motion.div className="companion-actor" data-phase={phase} data-side={side} data-travel={travelKind} data-flight-direction={flightDirection} data-editing={inputFocused} data-suspended={paused||reduced||pageHidden} style={{x,y,width:size,"--companion-space":speechSpace} as MotionStyle}>
      <motion.div ref={actor} className="companion-figure" data-still={paused||reduced} style={{rotate:bank,scaleX:stretchX,scaleY:stretchY}}>
        <svg className="companion-flight-wake" viewBox="0 0 200 220" fill="none" aria-hidden="true"><path d="M61 154Q41 185 47 212M139 154Q159 185 153 212"/><path d="M75 167Q67 190 72 206M125 167Q133 190 128 206"/></svg>
        <button ref={actorButton} className="companion-character-button" type="button" disabled={phase==="launch"} aria-label="Pip, your site guide. Show directions" aria-expanded={open&&expanded} onClick={greet} onPointerEnter={()=>{if(phase==="active"&&!paused)setExpression("curious");}}>
          <Character state={paused?"resting":expression} reducedMotion={reduced||paused||pageHidden}/>
        </button>
      </motion.div>
      {phase==="active" && <><CompanionSpeech message={stories[storyKey]?.message??stories.welcome.message} open={open&&!inputFocused&&travelKind==="idle"} expanded={expanded} reducedMotion={reduced} paused={paused} side={side} onToggleExpanded={expand} onDismiss={dismiss} onPause={togglePause} onHide={hide} onExplore={href=>{setOpen(false);setExpanded(false);routeFocus.current=true;router.push(href);}}/>
      <div className="companion-tools"><button type="button" onClick={togglePause} aria-label={paused?"Resume Pip’s motion":"Pause Pip’s motion"}>{paused?<Play size={12}/>:<Pause size={12}/>}</button><button type="button" onClick={hide} aria-label="Hide Pip"><X size={12}/></button></div></>}
    </motion.div>}
    {footer && phase==="active" && createPortal(<button ref={restoreButton} type="button" className="companion-restore" onClick={()=>{save(COMPANION_HIDDEN,false);setHidden(false);setOpen(true);setExpanded(true);pendingFocus.current=true;moveToRail(routeStory(pathname),undefined,true);}}> {hidden?"Show Pip":"Site guide"}</button>,footer)}
  </>;
}
