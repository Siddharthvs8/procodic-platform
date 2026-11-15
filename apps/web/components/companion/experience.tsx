"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionStyle } from "motion/react";
import { useRouter } from "next/navigation";
import { Pause, Play, X } from "lucide-react";
import { Character, CompanionPaws, type CharacterState } from "./character";
import { CompanionSpeech } from "./speech";
import { canIntroduce, COMPANION_HIDDEN, COMPANION_PAUSED, COMPANION_SEEN, landingPosition, railPosition, routeStory, stories } from "./story";
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
  const x = useMotionValue(0), y = useMotionValue(0);
  const speechSpace = useTransform(y, value=>`${Math.max(100,value+size*1.1-130)}px`);
  const backX = useMotionValue(0), backY = useMotionValue(30), backRotate = useMotionValue(0), paws = useMotionValue(0);
  const behind = useRef<HTMLDivElement>(null);
  const actor = useRef<HTMLDivElement>(null);
  const actorButton = useRef<HTMLButtonElement>(null);
  const restoreButton = useRef<HTMLButtonElement>(null);
  const playback = useRef<Playback[]>([]);
  const travel = useRef<Playback[]>([]);
  const perch = useRef<number|null>(null);
  const firstGreetingUntil = useRef(0);
  const pendingFocus = useRef(false);
  const routeFocus = useRef(false);
  const clicks = useRef(0);
  const latest = useRef({ phase, hidden, paused, reduced, expanded, anchor, storyKey, pathname });
  latest.current = { phase, hidden, paused, reduced, expanded, anchor, storyKey, pathname };
  const stopPlayback = useCallback(()=>{playback.current.forEach(control=>control.stop()); playback.current=[];},[]);

  const moveToRail = useCallback((key: string, top?: number, immediately = false)=>{
    const state = latest.current;
    if(state.expanded) return;
    const position = railPosition(document.documentElement.clientWidth,window.innerHeight,stories[key]?.side ?? "right",top);
    setSize(position.size); setSide(position.x < window.innerWidth/2 ? "left" : "right");
    travel.current.forEach(control=>control.stop());
    if(state.reduced || state.paused || immediately) { x.set(position.x); y.set(position.y); }
    else travel.current = [animate(x,position.x,{type:"spring",stiffness:95,damping:22,mass:1.1}),animate(y,position.y,{type:"spring",stiffness:95,damping:22,mass:1.1})];
  },[x,y]);

  const introduce = useCallback((focus = false)=>{
    stopPlayback(); paws.set(0); save(COMPANION_SEEN,true); pendingFocus.current=focus;
    setPhase("active"); setStoryKey("welcome"); setExpression("happy"); setOpen(true);
    firstGreetingUntil.current=performance.now()+8000;
    moveToRail("welcome",undefined,true);
  },[moveToRail,paws,stopPlayback]);

  // Resolve the actual card after route changes. No replacement card or layout wrapper.
  useEffect(()=>{
    setAnchor(pathname === "/" ? document.querySelector<HTMLElement>(".ux-explorer-window") : null);
    setFooter(document.querySelector<HTMLElement>(".footer-legal"));
    setIntroSize(window.innerWidth < 640 ? 108 : 128);
    if(latest.current.phase === "active") {
      const key=routeStory(pathname); setStoryKey(key); setExpression(stories[key].state);
      setExpanded(false); setOpen(!latest.current.hidden); perch.current=null;
      moveToRail(key,undefined,true);
    } else { stopPlayback(); setPhase("waiting"); paws.set(0); }
    if(routeFocus.current) { routeFocus.current=false; document.getElementById("main-content")?.focus({preventScroll:true}); }
    return ()=>stopPlayback();
  },[pathname,moveToRail,paws,stopPlayback]);

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
      if(state.phase !== "active" || state.expanded) return;
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
        if(latest.current.phase!=="active" || latest.current.expanded) return;
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
    x.set(startX); y.set(startY); setExpression("excited"); paws.set(0);
    const vertical=animate(y,[startY,startY+10,Math.max(80,startY-125),endY-10,endY],{duration:1.15,times:[0,.14,.48,.82,1],ease:"easeInOut"});
    playback.current=[vertical,animate(x,[startX,startX,endX+12,endX],{duration:1.15,times:[0,.14,.7,1],ease:"easeInOut"})];
    if(actor.current) playback.current.push(animate(actor.current,{scaleX:[1,1.14,.87,1.12,1],scaleY:[1,.85,1.13,.88,1],rotate:[0,-5,9,-3,0]},{duration:1.15,times:[0,.14,.48,.82,1]}));
    vertical.then(()=>{
      if(!alive)return;
      save(COMPANION_SEEN,true); perch.current=safePerch?window.scrollY:null;
      firstGreetingUntil.current=performance.now()+8000;
      setPhase("active"); setStoryKey("welcome"); setExpression("happy");setOpen(true);
    });
    return ()=>{alive=false;stopPlayback();};
  },[phase,anchor,introSize,x,y,paws,stopPlayback]);

  // Background tabs and off-screen introductions do not keep animating.
  useEffect(()=>{
    const sync=()=>{
      setPageHidden(document.hidden);
      const r=anchor?.getBoundingClientRect();
      const offscreen=phase==="peeking" && r && (r.top>window.innerHeight || r.bottom<100);
      playback.current.forEach(control=>document.hidden||offscreen?control.pause():control.play());
    };
    const observer=new IntersectionObserver(sync); if(anchor)observer.observe(anchor);
    document.addEventListener("visibilitychange",sync);
    return ()=>{observer.disconnect();document.removeEventListener("visibilitychange",sync);};
  },[anchor,phase]);
  useEffect(()=>{
    if(reduced||paused||hidden) travel.current.forEach(control=>control.stop());
    if((reduced||paused) && ["peeking","hanging","launch"].includes(phase)) introduce();
  },[reduced,paused,hidden,phase,introduce]);

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
      setInputFocused(editing);if(editing){setOpen(false);setExpanded(false);}
    };
    window.addEventListener("pointermove",track,{passive:true});document.addEventListener("pointerover",hover,{passive:true});document.addEventListener("focusin",focus);document.addEventListener("focusout",focus);
    return ()=>{cancelAnimationFrame(frame);clearTimeout(reaction);window.removeEventListener("pointermove",track);document.removeEventListener("pointerover",hover);document.removeEventListener("focusin",focus);document.removeEventListener("focusout",focus);};
  },[hidden]);
  useEffect(()=>()=>{stopPlayback();travel.current.forEach(control=>control.stop());},[stopPlayback]);

  function togglePause(){setPaused(value=>{save(COMPANION_PAUSED,!value);return !value;});}
  function hide(){save(COMPANION_HIDDEN,true);setHidden(true);setOpen(false);setExpanded(false);restoreButton.current?.focus({preventScroll:true});}
  function dismiss(){setOpen(false);setExpanded(false);actorButton.current?.focus({preventScroll:true});}
  function expand(){if(!expanded){perch.current=null;moveToRail(storyKey);}setExpanded(value=>!value);}
  function greet(){clicks.current++;setExpression((["happy","surprised","excited"] as CharacterState[])[clicks.current%3]);setOpen(true);expand();}
  const visible=phase==="active"||phase==="launch";
  const inScene=phase==="peeking"||phase==="hanging";
  const parent=anchor?.parentElement;
  return <>
    {parent && !hidden && inScene && createPortal(<>
      <motion.div ref={behind} className="companion-behind" data-phase={phase} style={{width:introSize,left:`calc(66% - ${introSize/2}px)`,top:anchor.offsetTop,x:backX,y:backY,rotate:backRotate}}><Character state="curious" reducedMotion={reduced||paused}/></motion.div>
      <motion.div className="companion-paws" style={{width:introSize,left:`calc(66% - ${introSize/2}px)`,top:anchor.offsetTop-7,opacity:paws}}><CompanionPaws/></motion.div>
      <div className="companion-scene-controls" style={{top:anchor.offsetTop-44}}><button type="button" onClick={()=>introduce(true)}>{phase==="hanging"?"Come on out, Pip":"Something’s hiding…"}<span>Skip reveal ↗</span></button><button type="button" onClick={()=>{togglePause();introduce(true);}} aria-label="Pause Pip’s motion"><Pause size={13}/></button></div>
    </>,parent)}
    {visible && !hidden && <motion.div className="companion-actor" data-phase={phase} data-side={side} data-editing={inputFocused} style={{x,y,width:size,"--companion-space":speechSpace} as MotionStyle}>
      <div ref={actor} className="companion-figure" data-still={paused||reduced}>
        <button ref={actorButton} className="companion-character-button" type="button" aria-label="Pip, your site guide. Show directions" aria-expanded={open&&expanded} onClick={greet} onPointerEnter={()=>{if(phase==="active"&&!paused)setExpression("curious");}}>
          <Character state={paused?"resting":expression} reducedMotion={reduced||paused||pageHidden}/>
        </button>
      </div>
      {phase==="active" && <><CompanionSpeech message={stories[storyKey]?.message??stories.welcome.message} open={open&&!inputFocused} expanded={expanded} reducedMotion={reduced} paused={paused} side={side} onToggleExpanded={expand} onDismiss={dismiss} onPause={togglePause} onHide={hide} onExplore={href=>{setOpen(false);setExpanded(false);routeFocus.current=true;router.push(href);}}/>
      <div className="companion-tools"><button type="button" onClick={togglePause} aria-label={paused?"Resume Pip’s motion":"Pause Pip’s motion"}>{paused?<Play size={12}/>:<Pause size={12}/>}</button><button type="button" onClick={hide} aria-label="Hide Pip"><X size={12}/></button></div></>}
    </motion.div>}
    {footer && phase==="active" && createPortal(<button ref={restoreButton} type="button" className="companion-restore" onClick={()=>{save(COMPANION_HIDDEN,false);setHidden(false);setOpen(true);setExpanded(true);pendingFocus.current=true;moveToRail(routeStory(pathname),undefined,true);}}> {hidden?"Show Pip":"Site guide"}</button>,footer)}
  </>;
}
