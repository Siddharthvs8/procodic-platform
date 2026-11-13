"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Code2, Database, Layers3, Sparkles, GraduationCap, Workflow } from "lucide-react";

const capabilities = [
  { label: "Software", icon: Layers3, name: "Bring your work together.", intro: "Connected systems. Clearer decisions.", steps: ["Your people & processes", "One connected platform", "A better way to work"], tag: "BUILT TO FIT", href: "/products", tags: ["Purposeful design", "Connected data", "Room to grow"] },
  { label: "Applied AI", icon: Sparkles, name: "Make intelligence useful.", intro: "From a promising idea to practical impact.", steps: ["A meaningful problem", "Research & experimentation", "AI in your workflow"], tag: "DESIGNED FOR IMPACT", href: "/ai-research", tags: ["Real context", "Human oversight", "Measurable learning"] },
  { label: "Learning", icon: GraduationCap, name: "Turn knowledge into action.", intro: "Build skills through doing.", steps: ["Your team’s learning goals", "Hands-on practice", "Confidence to create"], tag: "MADE FOR PEOPLE", href: "/training", tags: ["Practical skills", "Guided exploration", "Real application"] },
];

export function CapabilityExplorer() {
  const [selected,setSelected] = useState(0);
  const item = capabilities[selected]; const Icon = item.icon;
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index+1)%3 : event.key === "ArrowLeft" ? (index+2)%3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
    if(next === null) return; event.preventDefault(); setSelected(next); document.getElementById("capability-tab-"+next)?.focus();
  }
  return <div className="ux-explorer"><div className="ux-explorer-orbit" aria-hidden="true"/><div className="ux-explorer-window"><div className="ux-explorer-bar"><span><i/><i/><i/></span><span>THE PROCODIC APPROACH</span><Code2 size={15}/></div><div className="ux-explorer-tabs" role="tablist" aria-label="Explore our capabilities">{capabilities.map((capability,index)=><button id={"capability-tab-"+index} key={capability.label} role="tab" aria-selected={selected===index} aria-controls={"capability-panel-"+index} tabIndex={selected===index?0:-1} onClick={()=>setSelected(index)} onKeyDown={event=>navigate(event,index)}>{capability.label}</button>)}</div><div className="ux-explorer-content" id={"capability-panel-"+selected} role="tabpanel" aria-labelledby={"capability-tab-"+selected} tabIndex={0}><div className="ux-explorer-heading"><div><p>{item.tag}</p><h2>{item.name}</h2><span>{item.intro}</span></div><div className="ux-explorer-symbol"><Icon size={25}/></div></div><div className="ux-flow"><div className="ux-flow-node"><Database size={18}/><span>{item.steps[0]}</span><span className="ux-flow-dot"/></div><div className="ux-flow-connector"/><div className="ux-flow-node ux-flow-primary"><Workflow size={20}/><span>{item.steps[1]}</span><Check size={16}/></div><div className="ux-flow-connector"/><div className="ux-flow-node"><Icon size={18}/><span>{item.steps[2]}</span><ArrowUpRight size={16}/></div></div><div className="ux-explorer-tags">{item.tags.map(tag=><span key={tag}><Check size={12}/>{tag}</span>)}</div></div><Link className="ux-explorer-bottom" href={item.href}>Explore {item.label.toLowerCase()}<ArrowUpRight size={16}/></Link></div><div className="ux-explorer-caption"><span className="ux-caption-mark">P.</span><span>Complex challenges.<br/><strong>Thoughtful solutions.</strong></span></div></div>;
}

