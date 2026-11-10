export function HeroGraphic() {
  return (
    <svg className="eh-hero-graphic" viewBox="0 0 640 520" fill="none" aria-hidden="true">
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
      <g className="eh-graphic-guides" stroke="var(--eh-ink)" strokeOpacity=".12">
        <circle cx="332" cy="260" r="199" />
        <circle cx="332" cy="260" r="153" strokeDasharray="1 9" />
        <path d="M44 260h553M332 34v452" strokeDasharray="2 11" />
      </g>
      <ellipse className="eh-graphic-orbit" cx="332" cy="260" rx="236" ry="105" fill="none" stroke="var(--eh-ink)" strokeOpacity=".16" />
      <rect className="eh-graphic-dot-grid" x="346" y="40" width="252" height="205" fill="url(#hero-dot-grid)" mask="url(#hero-dot-mask)" />

      <g transform="translate(-105 -70) scale(1.32)">
        <path className="eh-graphic-halo" d="M111 166h237c76 0 122 39 122 101S424 369 348 369h-75c-47 0-69 21-94 63" stroke="url(#hero-ribbon)" strokeWidth="56" strokeLinecap="round" strokeLinejoin="round" filter="url(#hero-soft-glow)" opacity=".3" />
        <path className="eh-graphic-ribbon" d="M111 166h237c76 0 122 39 122 101S424 369 348 369h-75c-47 0-69 21-94 63" stroke="url(#hero-ribbon)" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />
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
          <animateMotion dur="29s" begin="1.1s" repeatCount="indefinite" rotate="auto" path="M111 166h237c76 0 122 39 122 101S424 369 348 369h-75c-47 0-69 21-94 63" />
        </circle>
        <circle className="eh-graphic-runner eh-graphic-runner-secondary" r="2.7" fill="#19D3D3">
          <animateMotion dur="39s" begin="8s" repeatCount="indefinite" rotate="auto" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path="M111 166h237c76 0 122 39 122 101S424 369 348 369h-75c-47 0-69 21-94 63" />
        </circle>
      </g>
      <circle className="eh-graphic-orbit-runner" r="3" fill="#22D3E0">
        <animateMotion dur="41s" begin="3.5s" repeatCount="indefinite" path="M96 260a236 105 0 1 1 472 0a236 105 0 1 1 -472 0" />
      </circle>
    </svg>
  );
}
