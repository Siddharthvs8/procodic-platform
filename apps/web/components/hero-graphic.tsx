"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Pause, Play } from "lucide-react";

export function HeroGraphic() {
  const surface = useRef<HTMLDivElement>(null);
  const graphic = useRef<SVGSVGElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || reduced) graphic.current?.pauseAnimations();
    else graphic.current?.unpauseAnimations();
  }, [paused, reduced]);
  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduced || paused || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    surface.current?.style.setProperty("--hero-rotate-x", `${-y * 10}deg`);
    surface.current?.style.setProperty("--hero-rotate-y", `${x * 12}deg`);
  }
  function reset() {
    surface.current?.style.setProperty("--hero-rotate-x", "0deg");
    surface.current?.style.setProperty("--hero-rotate-y", "0deg");
  }
  return (
    <div className="hero-motion" data-paused={paused || reduced} onPointerMove={move} onPointerLeave={reset}>
    <div className="hero-motion-label" aria-hidden="true"><span/> IDEAS INTO MOTION <span className="hero-motion-label-line"/></div>
    <div ref={surface} className="hero-motion-surface">
    <svg ref={graphic} className="eh-hero-graphic" viewBox="0 0 640 520" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="hero-aura" cx="0" cy="0" r="1" gradientTransform="translate(350 260) rotate(90) scale(220)">
          <stop stopColor="var(--eh-blue)" stopOpacity=".18" />
          <stop offset="1" stopColor="var(--eh-blue)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-ribbon" x1="108" y1="168" x2="486" y2="365" gradientUnits="userSpaceOnUse">
          <stop stopColor="#155FE8" />
          <stop offset=".54" stopColor="#167BFA" />
          <stop offset="1" stopColor="#19D3D3" />
        </linearGradient>
        <linearGradient id="hero-trail" x1="74" y1="230" x2="224" y2="230" gradientUnits="userSpaceOnUse">
          <stop stopColor="#19D3D3" stopOpacity=".25" />
          <stop offset="1" stopColor="#167BFA" stopOpacity=".85" />
        </linearGradient>
        <linearGradient id="hero-gloss" x1="120" y1="150" x2="450" y2="380" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D8EDFF" stopOpacity=".75"/><stop offset=".4" stopColor="#BDF8FF" stopOpacity=".08"/><stop offset="1" stopColor="#E5FFFF" stopOpacity=".55"/>
        </linearGradient>
        <radialGradient id="hero-dot-fade">
          <stop offset=".2" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </radialGradient>
        <mask id="hero-dot-mask">
          <rect x="346" y="40" width="252" height="205" fill="url(#hero-dot-fade)" />
        </mask>
        <pattern id="hero-dot-grid" width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.1" fill="var(--eh-blue)" fillOpacity=".45" />
        </pattern>
        <filter id="hero-soft-glow" x="60" y="112" width="514" height="352" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="15" />
        </filter>
      </defs>

      <circle cx="350" cy="260" r="220" fill="url(#hero-aura)" />
      <g className="hero-constellation" fill="var(--eh-blue)">
        {[[108,95],[194,63],[390,53],[523,110],[563,330],[469,443],[226,468],[92,361]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?2.5:1.5} opacity={.25+i*.05}/>) }
      </g>
      <g className="eh-graphic-guides" stroke="var(--eh-ink)" strokeOpacity=".12">
        <circle cx="332" cy="260" r="199" />
        <circle cx="332" cy="260" r="153" strokeDasharray="1 9" />
        <path d="M44 260h553M332 34v452" strokeDasharray="2 11" />
      </g>
      <ellipse className="eh-graphic-orbit" cx="332" cy="260" rx="236" ry="105" fill="none" stroke="var(--eh-ink)" strokeOpacity=".16" />
      <g transform="rotate(38 332 260)"><ellipse className="hero-secondary-orbit" cx="332" cy="260" rx="244" ry="130" stroke="var(--eh-blue)" strokeOpacity=".16" strokeDasharray="3 9"/><circle className="hero-satellite" r="4" fill="#158EFF"><animateMotion dur="22s" repeatCount="indefinite" path="M88 260a244 130 0 1 1 488 0a244 130 0 1 1 -488 0"/></circle></g>
      <circle className="hero-radar-ring" cx="332" cy="260" r="205" stroke="var(--eh-blue)" strokeOpacity=".2" strokeWidth=".7"/>
      <rect className="eh-graphic-dot-grid" x="346" y="40" width="252" height="205" fill="url(#hero-dot-grid)" mask="url(#hero-dot-mask)" />

      <g transform="translate(-105 -70) scale(1.32)">
        <path className="eh-graphic-halo" d="M111 166h237c76 0 122 39 122 101S424 369 348 369h-75c-47 0-69 21-94 63" stroke="url(#hero-ribbon)" strokeWidth="56" strokeLinecap="round" strokeLinejoin="round" filter="url(#hero-soft-glow)" opacity=".3" />
        <path className="eh-graphic-ribbon" d="M111 166h237c76 0 122 39 122 101S424 369 348 369h-75c-47 0-69 21-94 63" stroke="url(#hero-ribbon)" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />
        <path className="hero-ribbon-depth" d="M111 174h237c73 0 114 35 114 93S421 361 348 361h-75c-47 0-69 21-94 63" stroke="#0738AA" strokeOpacity=".22" strokeWidth="5" strokeLinecap="round"/>
        <path d="M111 156h237c81 0 132 43 132 111S429 379 348 379h-75" stroke="url(#hero-gloss)" strokeWidth="1.6" strokeLinecap="round"/>
        <path className="hero-light-sweep" d="M111 166h237c76 0 122 39 122 101S424 369 348 369h-75c-47 0-69 21-94 63" stroke="#D8FEFF" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round"/>
        <path className="eh-graphic-flow" d="M111 158h237c81 0 132 42 132 109" stroke="white" strokeOpacity=".62" strokeWidth="1.5" strokeLinecap="round" />

        <g className="eh-graphic-trails" stroke="url(#hero-trail)" strokeLinecap="round">
          <path d="M72 222h147" strokeWidth="7" />
          <path d="M87 254h99" strokeWidth="7" />
          <path d="M72 286h126" strokeWidth="7" />
        </g>
        <g className="eh-graphic-streams" fill="none" stroke="#D9FBFF" strokeLinecap="round">
          <path className="eh-graphic-stream eh-graphic-stream-one" d="M72 222h147" />
          <path className="eh-graphic-stream eh-graphic-stream-two" d="M87 254h99" />
          <path className="eh-graphic-stream eh-graphic-stream-three" d="M72 286h126" />
        </g>
        <g fill="var(--eh-blue)">
          <circle cx="58" cy="222" r="4" />
          <circle cx="73" cy="254" r="4" />
          <circle cx="58" cy="286" r="4" />
        </g>
        <circle className="eh-graphic-node" cx="470" cy="267" r="7" fill="#F4F2ED" />
        <circle className="eh-graphic-node eh-graphic-node-late" cx="331" cy="369" r="5" fill="#19D3D3" />
        <circle cx="470" cy="267" r="16" stroke="#19D3D3" strokeOpacity=".45" />
        <circle className="eh-graphic-runner eh-graphic-runner-primary" r="4.5" fill="#E4FDFF">
          <animateMotion dur="12s" begin="0s" repeatCount="indefinite" rotate="auto" path="M111 166h237c76 0 122 39 122 101S424 369 348 369h-75c-47 0-69 21-94 63" />
        </circle>
        <circle className="eh-graphic-runner eh-graphic-runner-secondary" r="2.7" fill="#19D3D3">
          <animateMotion dur="18s" begin="-7s" repeatCount="indefinite" rotate="auto" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path="M111 166h237c76 0 122 39 122 101S424 369 348 369h-75c-47 0-69 21-94 63" />
        </circle>
      </g>
      <circle className="eh-graphic-orbit-runner" r="3" fill="#22D3E0">
        <animateMotion dur="41s" begin="3.5s" repeatCount="indefinite" path="M96 260a236 105 0 1 1 472 0a236 105 0 1 1 -472 0" />
      </circle>
    </svg></div>
    <div className="hero-motion-footer"><span>CODE. CREATE. ELEVATE.</span><button type="button" className="hero-motion-toggle" aria-label={reduced?"Motion reduced by your device settings":paused?"Play hero animation":"Pause hero animation"} disabled={reduced} onClick={()=>{setPaused(value=>!value);reset();}}>{paused || reduced?<Play size={12}/>:<Pause size={12}/>}<span>{reduced?"Reduced motion":paused?"Play motion":"Pause motion"}</span></button></div>
    </div>
  );
}
