"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./character.css";

export type CharacterState = "idle" | "curious" | "happy" | "excited" | "thinking" | "talking" | "pointing" | "surprised" | "resting" | "confused" | "laughing" | "embarrassed" | "scared" | "sleepy" | "focused" | "welcoming";
export type CharacterAction = "idle" | "peek" | "hang" | "climb" | "run" | "jump" | "flip" | "flight" | "hover" | "land" | "balance" | "sit" | "lean" | "wave" | "caught" | "dodge";
export type CharacterSnapshot = { state: CharacterState; action: CharacterAction; reducedMotion: boolean; direction: "left" | "right"; progress: number };
type Props = { state?: CharacterState; reducedMotion?: boolean; className?: string; style?: CSSProperties; action?: CharacterAction; direction?: "left" | "right"; progress?: { get(): number } };

export async function warmPetCharacter(){ await import("./pet-renderer"); }

/** The accessible button lives in the journey; this lazy canvas is purely visual. */
export function Character({ state = "idle", reducedMotion = false, className = "", style, action = "idle", direction = "right", progress }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ state, reducedMotion, action, direction, progress });
  live.current = { state, reducedMotion, action, direction, progress };
  const runtime = useRef<{ dispose(): void; invalidate(): void } | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    const abort = new AbortController();
    import("./pet-renderer").then(async ({ createPetRenderer }) => {
      if (disposed || !host.current) return;
      const renderer = await createPetRenderer(host.current, () => ({ ...live.current, progress: live.current.progress?.get() ?? 0 }), abort.signal);
      if (disposed) renderer.dispose();
      else { runtime.current = renderer; setReady(true); }
    }).catch(() => { /* A matching pet illustration remains usable without WebGL. */ });
    return () => { disposed = true; abort.abort(); runtime.current?.dispose(); runtime.current = null; };
  }, []);
  useEffect(() => { runtime.current?.invalidate(); }, [state, action, reducedMotion, direction, progress]);
  return <div ref={host} className={`pip-character nova-character ${className}`} data-character="ai-pet" data-state={state} data-still={reducedMotion} data-renderer={ready ? "webgl" : "fallback"} style={style} aria-hidden="true">
    <svg className="nova-fallback" viewBox="0 0 200 300" fill="none">
      <ellipse cx="100" cy="279" rx="43" ry="6" fill="#071f24" opacity=".22"/>
      <path d="M134 199c48 23 39-20 46-27" stroke="#87aaa1" strokeWidth="15" strokeLinecap="round"/>
      <path d="m60 72 3-48q1-15 10-4l21 42m18 0 22-42q9-11 10 4l3 48" fill="#dcece3" stroke="#6a9993" strokeWidth="3"/>
      <path d="m69 50 2-21 11 23m48 0 8-23 1 21" stroke="#65e8df" strokeWidth="5" strokeLinecap="round"/>
      <path d="m78 207-6 49m50-49 6 49" stroke="#476a68" strokeWidth="17" strokeLinecap="round"/>
      <ellipse cx="74" cy="266" rx="18" ry="13" fill="#dcece3"/><ellipse cx="126" cy="266" rx="18" ry="13" fill="#dcece3"/>
      <path d="m61 268 25 2m27 0 25-2" stroke="#71eee3" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="100" cy="179" rx="39" ry="40" fill="#dcece3" stroke="#6a9993" strokeWidth="3"/>
      <ellipse cx="100" cy="180" rx="22" ry="25" fill="#17343b"/>
      <path d="m100 169 10 6v11l-10 6-10-6v-11Z" fill="#6ef4e7"/>
      <path d="m63 176-9 27m83-27 9 27" stroke="#547c78" strokeWidth="15" strokeLinecap="round"/>
      <ellipse cx="52" cy="208" rx="12" ry="16" fill="#e4efe8"/><ellipse cx="148" cy="208" rx="12" ry="16" fill="#e4efe8"/>
      <ellipse cx="100" cy="107" rx="63" ry="52" fill="#e4efe8" stroke="#789e97" strokeWidth="3"/>
      <ellipse cx="100" cy="112" rx="55" ry="38" fill="#09242e" stroke="#89bdb5" strokeWidth="2"/>
      <path d="M68 87q15-9 30-8" stroke="#d5fff7" strokeWidth="4" strokeLinecap="round" opacity=".3"/>
      <path d="M79 101v16m42-16v16" stroke="#8ffff4" strokeWidth="12" strokeLinecap="round"/>
      <path d="m89 131 11 4 11-4" stroke="#8ffff4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>;
}

/** Small mechanical paws curl over the actual card edge. */
export function CompanionPaws() {
  return <svg viewBox="0 0 200 40" fill="none" aria-hidden="true">{[68,132].map(x=><g key={x}>
    <ellipse cx={x} cy="20" rx="12" ry="4" fill="#001619" opacity=".25"/>
    <rect x={x-11} y="3" width="22" height="19" rx="9" fill="#dcece3" stroke="#769e96"/>
    <path d={`M${x-7} 8h14`} stroke="#50dfd5" strokeWidth="2" strokeLinecap="round"/>
    <path d={`M${x-4} 15v5m8-5v5`} stroke="#789e97" strokeWidth="1.5" strokeLinecap="round"/>
  </g>)}</svg>;
}
