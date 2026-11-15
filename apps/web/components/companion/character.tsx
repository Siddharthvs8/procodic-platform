"use client";

import { useId, type CSSProperties } from "react";
import "./character.css";

export type CharacterState = "idle" | "curious" | "happy" | "excited" | "thinking" | "talking" | "pointing" | "surprised" | "resting";

/** Pip is an original folded-light creature, drawn as a small, resolution-independent asset. */
export function Character({ state = "idle", reducedMotion = false, className = "", style }: { state?: CharacterState; reducedMotion?: boolean; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const paint = (name: string) => `url(#${id}-${name})`;
  return <svg viewBox="0 0 200 220" className={`pip-character ${className}`} data-state={state} data-still={reducedMotion} style={style} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-body`} x1="51" y1="40" x2="144" y2="182" gradientUnits="userSpaceOnUse"><stop stopColor="#d8ffff"/><stop offset=".24" stopColor="#7feaf0"/><stop offset=".55" stopColor="#25b8df"/><stop offset=".82" stopColor="#2876d4"/><stop offset="1" stopColor="#15449b"/></linearGradient>
      <radialGradient id={`${id}-light`} cx=".3" cy=".2" r=".8"><stop stopColor="white" stopOpacity=".92"/><stop offset=".5" stopColor="#bdffff" stopOpacity=".1"/><stop offset="1" stopColor="#002c85" stopOpacity=".55"/></radialGradient>
      <linearGradient id={`${id}-fin`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a4ffff"/><stop offset=".5" stopColor="#25bce2"/><stop offset="1" stopColor="#205dc2"/></linearGradient>
      <linearGradient id={`${id}-face`} x1="60" y1="70" x2="132" y2="130" gradientUnits="userSpaceOnUse"><stop stopColor="#0c344b"/><stop offset="1" stopColor="#082035"/></linearGradient>
      <radialGradient id={`${id}-eye`}><stop stopColor="#fff"/><stop offset=".65" stopColor="#b9ffff"/><stop offset="1" stopColor="#65e9ff"/></radialGradient>
    </defs>
    <ellipse className="pip-shadow" cx="100" cy="202" rx="47" ry="7" fill="#081b31" opacity=".18"/>
    <g className="pip-body">
      <g className="pip-foot pip-foot-left"><path d="M62 169C44 174 44 187 55 190c12 4 27-4 32-15" fill={paint("fin")}/><path d="M56 183l13-4" stroke="#c7ffff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round"/></g>
      <g className="pip-foot pip-foot-right"><path d="M132 170c18 0 28 11 23 18-8 9-25 3-36-12" fill={paint("fin")}/><path d="M138 180l10 5" stroke="#c7ffff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round"/></g>
      <g className="pip-hand pip-hand-left"><path d="M45 101C21 95 12 110 19 128c6 17 21 22 32 5" fill={paint("fin")}/><path d="M23 112c-1 6 2 12 6 15" stroke="#dcffff" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round"/></g>
      <g className="pip-hand pip-hand-right"><path d="M154 101c25-10 35 4 29 22-5 17-20 25-33 10" fill={paint("fin")}/><path d="M178 110c2 7-1 13-6 17" stroke="#dcffff" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round"/></g>
      <g className="pip-head">
        <path d="M46 58C57 44 79 40 88 27c5-8 4-15 3-21 21 10 33 24 35 41 31 10 43 35 42 64-1 42-24 75-66 75-43 0-70-29-70-68 0-25 3-45 14-60Z" fill={paint("body")} stroke="#c5ffff" strokeOpacity=".38" strokeWidth="1.2"/>
        <path d="M46 58C57 44 79 40 88 27c5-8 4-15 3-21 21 10 33 24 35 41 31 10 43 35 42 64-1 42-24 75-66 75-43 0-70-29-70-68 0-25 3-45 14-60Z" fill={paint("light")}/>
        <path d="M95 15c18 17 20 28 6 41" stroke="#edffff" strokeOpacity=".58" strokeWidth="4" strokeLinecap="round"/>
        <path d="M48 72c5-14 16-20 29-23" stroke="#efffff" strokeOpacity=".65" strokeWidth="4" strokeLinecap="round"/>
        <path d="M58 77c19-9 62-9 82 1 16 8 15 38 4 49-17 17-64 20-87 2-14-11-14-43 1-52Z" fill={paint("face")}/>
        <path d="M61 79c15-6 48-8 65-4" stroke="#c6fbff" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round"/>
        <g className="pip-gaze">
          <g className="pip-eyes"><ellipse cx="77" cy="99" rx="10" ry="15" fill={paint("eye")}/><ellipse cx="122" cy="99" rx="10" ry="15" fill={paint("eye")}/><ellipse cx="74" cy="94" rx="3" ry="4" fill="white"/><ellipse cx="119" cy="94" rx="3" ry="4" fill="white"/></g>
          <g className="pip-happy-eyes" stroke="#baffff" strokeWidth="6" strokeLinecap="round"><path d="M67 100q10-16 20 0M112 100q10-16 20 0"/></g>
          <g className="pip-sleep-eyes" stroke="#a7edf6" strokeWidth="4" strokeLinecap="round"><path d="M67 102q10 8 20 0M112 102q10 8 20 0"/></g>
          <path className="pip-smile" d="M91 120q9 9 18-1" stroke="#9ceef3" strokeWidth="3" strokeLinecap="round"/>
          <ellipse className="pip-mouth-open" cx="101" cy="122" rx="6" ry="8" fill="#93f6fa"/>
        </g>
        <ellipse cx="61" cy="118" rx="7" ry="3" fill="#3bdcff" opacity=".22"/><ellipse cx="141" cy="118" rx="7" ry="3" fill="#3bdcff" opacity=".22"/>
        <path d="M80 157q20 9 40-1" stroke="#c4ffff" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round"/>
        <path d="M92 150l8-7 8 7-8 8Z" fill="#d9ffff" opacity=".8"/>
      </g>
    </g>
    <g className="pip-spark" stroke="#9eeef5" strokeWidth="2.5" strokeLinecap="round"><path d="M174 48v12m-6-6h12M27 48v8m-4-4h8"/></g>
    <g className="pip-rest" fill="#7ebfcf" fontSize="17" fontFamily="var(--sans)" fontWeight="600"><text x="148" y="48">z</text><text x="163" y="29" fontSize="12">z</text></g>
  </svg>;
}

export function CompanionPaws() {
  const id = useId().replace(/:/g, "");
  return <svg viewBox="0 0 200 40" fill="none" aria-hidden="true"><defs><linearGradient id={`${id}-paw`} x2="0" y2="1"><stop stopColor="#cbffff"/><stop offset=".5" stopColor="#46d0e7"/><stop offset="1" stopColor="#1a74bd"/></linearGradient></defs>{[43,137].map(x=><g key={x}><ellipse cx={x+10} cy="24" rx="19" ry="6" fill="#00192c" opacity=".2"/><path d={`M${x-8} 10c0-16 35-16 36 0v11c-1 13-34 13-36 0Z`} fill={`url(#${id}-paw)`}/><path d={`M${x+2} 15v7m10-7v7`} stroke="#0b71a4" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round"/></g>)}</svg>;
}
