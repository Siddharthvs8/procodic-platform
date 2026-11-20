"use client";

import { useId, type CSSProperties } from "react";
import "./character.css";

export type CharacterState = "idle" | "curious" | "happy" | "excited" | "thinking" | "talking" | "pointing" | "surprised" | "resting";

const shell = "M46 58C57 44 79 40 88 27c5-8 4-15 3-21 21 10 33 24 35 41 31 10 43 35 42 64-1 42-24 75-66 75-43 0-70-29-70-68 0-25 3-45 14-60Z";
const visor = "M57 76c20-11 65-10 85 1 15 9 15 36 3 49-18 19-65 20-87 3-16-12-17-43-1-53Z";

/** Original folded-light creature. Layered vector materials keep Pip crisp without a 3D runtime. */
export function Character({ state = "idle", reducedMotion = false, className = "", style }: { state?: CharacterState; reducedMotion?: boolean; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const paint = (name: string) => `url(#${id}-${name})`;
  return <svg viewBox="0 0 200 220" className={`pip-character ${className}`} data-state={state} data-still={reducedMotion} style={style} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-shell`} x1="42" y1="51" x2="151" y2="172" gradientUnits="userSpaceOnUse"><stop stopColor="#f5ffff"/><stop offset=".2" stopColor="#d5f4ff"/><stop offset=".44" stopColor="#7fcce5"/><stop offset=".62" stopColor="#3b8daf"/><stop offset=".82" stopColor="#163d64"/><stop offset="1" stopColor="#081d39"/></linearGradient>
      <radialGradient id={`${id}-volume`} cx=".28" cy=".25" r=".8"><stop stopColor="#fff" stopOpacity=".8"/><stop offset=".4" stopColor="#c8ffff" stopOpacity="0"/><stop offset=".77" stopColor="#00245d" stopOpacity=".1"/><stop offset="1" stopColor="#020d24" stopOpacity=".85"/></radialGradient>
      <linearGradient id={`${id}-crest`} x1="86" y1="10" x2="126" y2="66" gradientUnits="userSpaceOnUse"><stop stopColor="#ebffff"/><stop offset=".3" stopColor="#84f4ff"/><stop offset=".65" stopColor="#10bfee"/><stop offset="1" stopColor="#1742a0"/></linearGradient>
      <linearGradient id={`${id}-ceramic`} x1="0" y1="0" x2="90%" y2="100%"><stop stopColor="#f2ffff"/><stop offset=".28" stopColor="#c2eaf6"/><stop offset=".55" stopColor="#6daac2"/><stop offset=".72" stopColor="#285776"/><stop offset="1" stopColor="#0b2747"/></linearGradient>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="90%" y2="100%"><stop stopColor="#193953"/><stop offset=".25" stopColor="#648fa5"/><stop offset=".38" stopColor="#b6e5ef"/><stop offset=".5" stopColor="#385c76"/><stop offset=".82" stopColor="#09213b"/><stop offset="1" stopColor="#5c8c9c"/></linearGradient>
      <linearGradient id={`${id}-glass`} x1="64" y1="72" x2="136" y2="136" gradientUnits="userSpaceOnUse"><stop stopColor="#20506a"/><stop offset=".28" stopColor="#0c293f"/><stop offset=".58" stopColor="#03101e"/><stop offset="1" stopColor="#061d32"/></linearGradient>
      <linearGradient id={`${id}-reflection`} x1="63" y1="72" x2="94" y2="117" gradientUnits="userSpaceOnUse"><stop stopColor="#d4ffff" stopOpacity=".38"/><stop offset="1" stopColor="#9eefff" stopOpacity="0"/></linearGradient>
      <radialGradient id={`${id}-iris`} cx=".35" cy=".28" r=".8"><stop stopColor="#eaffff"/><stop offset=".4" stopColor="#76f9ff"/><stop offset=".68" stopColor="#09b9e9"/><stop offset="1" stopColor="#15579f"/></radialGradient>
      <radialGradient id={`${id}-core`}><stop stopColor="#fff"/><stop offset=".25" stopColor="#cfffff"/><stop offset=".6" stopColor="#38e5ff"/><stop offset="1" stopColor="#1387cb"/></radialGradient>
      <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="100%" y2="100%"><stop stopColor="#d3ffff" stopOpacity=".9"/><stop offset=".35" stopColor="#58ddff" stopOpacity=".5"/><stop offset="1" stopColor="#006aff" stopOpacity=".04"/></linearGradient>
      <linearGradient id={`${id}-exhaust`} x1="0" y1="0" x2="0" y2="100%"><stop stopColor="#e5ffff" stopOpacity=".95"/><stop offset=".2" stopColor="#45ddff" stopOpacity=".7"/><stop offset="1" stopColor="#197bff" stopOpacity="0"/></linearGradient>
      <radialGradient id={`${id}-shadow`}><stop stopColor="#011328" stopOpacity=".4"/><stop offset="1" stopColor="#011328" stopOpacity="0"/></radialGradient>
      <clipPath id={`${id}-visor-clip`}><path d={visor}/></clipPath>
    </defs>
    <ellipse className="pip-shadow" cx="100" cy="202" rx="53" ry="10" fill={paint("shadow")}/>
    <g className="pip-thrust" fill={paint("exhaust")}>
      <path d="M49 176Q65 171 78 178L66 218Z"/><path d="M123 177Q140 171 154 180L139 218Z"/>
      <path d="M58 178h13l-6 30Z" fill="#d2ffff" opacity=".65"/><path d="M133 179h12l-6 29Z" fill="#d2ffff" opacity=".65"/>
    </g>
    <g className="pip-body">
      <g className="pip-wing pip-wing-left"><path d="M48 84C25 81 9 66 3 58c1 29 10 55 33 62l18-16Z" fill={paint("wing")} stroke="#87efff" strokeOpacity=".65" strokeWidth=".8"/><path d="M9 70l29 32M16 91l19 16" stroke="#b8ffff" strokeOpacity=".55" strokeWidth="1.2"/></g>
      <g className="pip-wing pip-wing-right"><path d="M152 84c23-3 39-18 45-26-1 29-10 55-33 62l-18-16Z" fill={paint("wing")} stroke="#87efff" strokeOpacity=".65" strokeWidth=".8"/><path d="M191 70l-29 32m22-11-19 16" stroke="#b8ffff" strokeOpacity=".55" strokeWidth="1.2"/></g>
      <g className="pip-foot pip-foot-left"><path d="M65 164l-4 14 15 3 8-13" fill={paint("metal")}/><path d="M62 173c-12 0-20 9-16 15 6 10 30 8 41-9l-6-8Z" fill={paint("ceramic")} stroke="#9be8f7" strokeOpacity=".35"/><path d="M50 187q14 6 29-6" stroke="#061e39" strokeWidth="4" strokeLinecap="round"/><path d="M53 186q11 3 23-5" stroke="#63f1ff" strokeWidth="1.5" strokeLinecap="round"/></g>
      <g className="pip-foot pip-foot-right"><path d="M131 164l7 14-16 5-6-15" fill={paint("metal")}/><path d="M137 173c12 0 22 10 17 16-7 10-28 5-39-10l5-8Z" fill={paint("ceramic")} stroke="#9be8f7" strokeOpacity=".35"/><path d="M123 181q14 10 26 6" stroke="#061e39" strokeWidth="4" strokeLinecap="round"/><path d="M126 182q10 6 20 5" stroke="#63f1ff" strokeWidth="1.5" strokeLinecap="round"/></g>
      <g className="pip-hand pip-hand-left"><ellipse cx="40" cy="114" rx="12" ry="15" fill={paint("metal")}/><path d="M35 101c-15-3-22 8-19 20 3 15 13 22 24 16l7-12-4-19Z" fill={paint("ceramic")} stroke="#c3faff" strokeOpacity=".5"/><path d="M22 109c-3 7 1 17 5 20" stroke="#efffff" strokeOpacity=".7" strokeWidth="2.5" strokeLinecap="round"/><path d="m31 112-3 10 7 7" stroke="#123f5c" strokeOpacity=".6" strokeWidth="2"/><path d="m23 134 9 3" stroke="#56ebff" strokeWidth="2" strokeLinecap="round"/></g>
      <g className="pip-hand pip-hand-right"><ellipse cx="160" cy="114" rx="12" ry="15" fill={paint("metal")}/><path d="M165 101c15-3 22 8 19 20-3 15-13 22-24 16l-7-12 4-19Z" fill={paint("ceramic")} stroke="#c3faff" strokeOpacity=".5"/><path d="M178 109c3 7-1 17-5 20" stroke="#efffff" strokeOpacity=".7" strokeWidth="2.5" strokeLinecap="round"/><path d="m169 112 3 10-7 7" stroke="#123f5c" strokeOpacity=".6" strokeWidth="2"/><path d="m177 134-9 3" stroke="#56ebff" strokeWidth="2" strokeLinecap="round"/></g>
      <g className="pip-head">
        <path d={shell} fill={paint("shell")} stroke="#bdedff" strokeOpacity=".6" strokeWidth="1.2"/>
        <path d={shell} fill={paint("volume")}/>
        <path d="M90 10c4 16-3 27-18 36 13 2 29 8 42 17l12-16C124 31 111 17 90 10Z" fill={paint("crest")}/>
        <path d="M96 16c15 15 19 27 16 39" stroke="#ddffff" strokeOpacity=".75" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M90 36q8 9 22 13" stroke="#0753a9" strokeOpacity=".5" strokeWidth="1.5"/>
        <path d="M43 82c2-18 15-29 29-31" stroke="#f4ffff" strokeOpacity=".75" strokeWidth="3" strokeLinecap="round"/>
        <path d="M150 70c11 13 16 31 13 49" stroke="#57dfff" strokeOpacity=".75" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M44 139c9 27 26 36 53 39 29 3 49-12 58-35-18 15-29 17-52 16-24 1-38-7-59-20Z" fill={paint("ceramic")} opacity=".78"/>
        <path d="M48 146q11 27 43 31m22-1q23-5 34-23" stroke="#9ce5fa" strokeOpacity=".35" strokeWidth="1"/>
        <path d="M53 73c23-14 71-12 94 1 17 11 16 42 2 57-20 21-70 22-96 1-18-15-18-47 0-59Z" fill={paint("metal")}/>
        <path d={visor} fill={paint("glass")} stroke="#02101f" strokeWidth="2"/>
        <g clipPath={paint("visor-clip")}>
          <path d="M42 68h104l-59 47H44Z" fill={paint("reflection")}/>
          <path d="M57 78c17-7 48-8 69-3" stroke="#d3ffff" strokeOpacity=".46" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M53 123q47 30 94-3" stroke="#00b0e7" strokeOpacity=".14" strokeWidth="2"/>
          <path d="m139 81 7 5m-3-1 4 8" stroke="#bdffff" strokeOpacity=".2" strokeLinecap="round"/>
          <g className="pip-gaze">
            <g className="pip-eyes">
              {[77,122].map(cx => <g key={cx}><ellipse cx={cx} cy="99" rx="11.5" ry="16" fill="#34cfee" opacity=".14"/><ellipse cx={cx} cy="99" rx="9.5" ry="14" fill={paint("iris")} stroke="#b6fbff" strokeOpacity=".8" strokeWidth=".65"/><ellipse cx={cx+1} cy="100" rx="4.5" ry="8.5" fill="#052b47"/><ellipse cx={cx-3} cy="94" rx="3.2" ry="4" fill="#f3ffff"/><circle cx={cx+4} cy="105" r="1.5" fill="#b1ffff"/></g>)}
            </g>
            <g className="pip-happy-eyes" stroke="#a8fbff" strokeWidth="5" strokeLinecap="round"><path d="M67 100q10-16 20 0M112 100q10-16 20 0"/></g>
            <g className="pip-sleep-eyes" stroke="#70cedf" strokeWidth="3.5" strokeLinecap="round"><path d="M67 102q10 8 20 0M112 102q10 8 20 0"/></g>
            <path className="pip-smile" d="M91 120q9 9 18-1" stroke="#9ceef3" strokeWidth="2.5" strokeLinecap="round"/>
            <ellipse className="pip-mouth-open" cx="101" cy="122" rx="5.5" ry="7" fill="#93f6fa"/>
          </g>
          <path d="M57 115h6m-5 3h4m75-3h6m-5 3h4" stroke="#29d7f0" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round"/>
        </g>
        <path d="M42 102v16m117-14v12" stroke="#b0fbff" strokeOpacity=".65" strokeWidth="2" strokeLinecap="round"/>
        <path d="m89 151 11-10 12 10-11 13Z" fill="#092f4c" stroke="#92e6f3" strokeOpacity=".55"/>
        <path className="pip-core" d="m94 151 6-6 7 6-6 7Z" fill={paint("core")}/>
        <path d="m67 153 8 4m-10 0 7 4m56-8-8 4m10 0-7 4" stroke="#123b57" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="82" cy="170" r="1.4" fill="#a4f8ff" opacity=".8"/><path d="M88 170h12" stroke="#b5f3ff" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round"/>
      </g>
    </g>
    <g className="pip-spark" stroke="#64dff8" strokeWidth="1.5" strokeLinecap="round"><path d="M174 48v12m-6-6h12M27 48v8m-4-4h8"/><circle cx="183" cy="39" r="2" strokeOpacity=".5"/></g>
    <g className="pip-rest" fill="#7ebfcf" fontSize="17" fontFamily="var(--sans)" fontWeight="600"><text x="148" y="48">z</text><text x="163" y="29" fontSize="12">z</text></g>
  </svg>;
}

export function CompanionPaws() {
  const id = useId().replace(/:/g, "");
  return <svg viewBox="0 0 200 40" fill="none" aria-hidden="true"><defs><linearGradient id={`${id}-paw`} x1="0" y1="0" x2="70%" y2="100%"><stop stopColor="#efffff"/><stop offset=".3" stopColor="#bcebf6"/><stop offset=".65" stopColor="#5695b4"/><stop offset="1" stopColor="#173852"/></linearGradient></defs>{[43,137].map(x=><g key={x}><ellipse cx={x+10} cy="25" rx="20" ry="6" fill="#00192c" opacity=".25"/><path d={`M${x-8} 10c0-16 35-16 36 0v11c-1 13-34 13-36 0Z`} fill={`url(#${id}-paw)`} stroke="#b9eefb" strokeOpacity=".45"/><path d={`M${x-3} 6q9-6 20-2`} stroke="#f1ffff" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round"/><path d={`M${x+2} 14v9m10-9v9`} stroke="#163c59" strokeOpacity=".7" strokeWidth="1.5" strokeLinecap="round"/><path d={`M${x-2} 26h6m6 0h6`} stroke="#73f5ff" strokeWidth="1.5" strokeLinecap="round"/></g>)}</svg>;
}
