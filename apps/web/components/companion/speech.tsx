"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronDown, Gamepad2, Pause, Play, X } from "lucide-react";

type Props = { message: string; open: boolean; expanded: boolean; reducedMotion: boolean; paused: boolean; side: "left" | "right"; playMode?: boolean; onTogglePlay?: () => void; onToggleExpanded: () => void; onDismiss: () => void; onPause: () => void; onHide: () => void; onExplore: (href: string) => void };
export function CompanionSpeech({ message, open, expanded, reducedMotion, paused, side, playMode = false, onTogglePlay, onToggleExpanded, onDismiss, onPause, onHide, onExplore }: Props) {
  const [length, setLength] = useState(0);
  useEffect(() => {
    if (!open || reducedMotion || paused) { setLength(message.length); return; }
    setLength(0);
    const start = performance.now();
    const timer = window.setInterval(() => {
      const count = Math.floor((performance.now() - start) / 16);
      setLength(Math.min(message.length, count));
      if (count >= message.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [message, open, reducedMotion, paused]);
  return <AnimatePresence>{open && <motion.div className="companion-speech" data-side={side} role="region" aria-label="Nova’s site guide" initial={{ opacity:0, y:reducedMotion ? 0 : 8, scale:reducedMotion ? 1 : .96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:reducedMotion ? 0 : 4 }} transition={{ duration: reducedMotion ? 0 : .22 }} onKeyDown={event=>{if(event.key === "Escape") { event.stopPropagation(); onDismiss(); }}}>
    <div className="companion-speech-head"><span><i /> NOVA <b>YOUR AI COPILOT</b></span><button type="button" aria-label="Close Nova’s message" onClick={onDismiss}><X size={13}/></button></div>
    <p className="companion-message"><span className="companion-sr" role="status" aria-live="polite" aria-atomic="true">{message}</span><span className="companion-text-reserve" aria-hidden="true">{message}</span><span className="companion-text-typed" aria-hidden="true">{message.slice(0,length)}{length < message.length && <i className="companion-caret"/>}</span></p>
    <button type="button" className="companion-options-toggle" onClick={onToggleExpanded} aria-expanded={expanded} aria-controls="nova-directions">{expanded ? "A little direction" : "Show me around"}<ChevronDown size={13} style={{transform:expanded?"rotate(180deg)":undefined}}/></button>
    {onTogglePlay && <button type="button" className="companion-options-toggle companion-play-toggle" onClick={onTogglePlay} aria-pressed={playMode}>{playMode ? "Stop playing" : "Play with Nova"}<Gamepad2 size={14}/></button>}
    {expanded && <div id="nova-directions" className="companion-options"><div className="companion-destinations">{[["Products","/products"],["Applied AI","/ai-research"],["Learning","/training"],["Meet the team","/about"],["Let’s talk","/contact"]].map(([label,href])=><button type="button" key={href} onClick={()=>onExplore(href)}>{label}<ArrowUpRight size={13}/></button>)}</div><div className="companion-preferences"><button type="button" onClick={onPause}>{paused ? <Play size={12}/> : <Pause size={12}/>} {paused ? "Resume motion" : "Pause motion"}</button><button type="button" onClick={onHide}>Hide Nova</button></div><small>Your guide. Your tiny flying copilot.</small></div>}
  </motion.div>}</AnimatePresence>;
}
