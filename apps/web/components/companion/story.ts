import type { CharacterState } from "./character";

export const COMPANION_SEEN = "procodic-nova-introduced-v1";
// Keep existing opt-out preferences when visitors meet the redesigned guide.
export const COMPANION_HIDDEN = "procodic-pip-hidden-v1";
export const COMPANION_PAUSED = "procodic-pip-paused-v1";
export type Story = {
  message: string;
  state: CharacterState;
  side: "left" | "right";
  perch: "stand" | "sit" | "lean" | "balance";
  /** Scoped to the current section. Highlights never change layout or intercept clicks. */
  highlight?: string;
  interaction?: { message: string; state: CharacterState };
};
/** Frontend editorial data: section messages, expressions, perches, and click reactions. */
export const stories: Record<string, Story> = {
  welcome: { message: "Hi, I’m Nova — your little AI copilot. Thrusters ready. Let’s explore, or see if you can catch me!", state: "welcoming", side: "right", perch: "balance" },
  hero: { message: "Software, applied AI, and the skills to use them. Pick a direction; I’ll meet you there.", state: "welcoming", side: "right", perch: "stand" },
  capabilities: { message: "Three disciplines, one connected approach. Try a tab to see how each part fits.", state: "curious", side: "right", perch: "sit", highlight: "[role=tablist]", interaction: { message: "Nice choice. Follow the steps in this panel to see how that discipline connects the work.", state: "focused" } },
  expertise: { message: "Build, rethink, grow. These cards show where each discipline can help your team.", state: "pointing", side: "left", perch: "lean", highlight: ".ux-expertise-grid" },
  process: { message: "Start with the real problem. Then design, build, and improve it together. Here’s the route.", state: "thinking", side: "right", perch: "balance", highlight: ".ux-process-list" },
  products: { message: "Software shaped around real work. Explore the products or tell the team what you need to build.", state: "pointing", side: "right", perch: "stand" },
  catalogue: { message: "Looking for a particular workflow? Use the catalogue controls, then open an entry for the details.", state: "focused", side: "left", perch: "lean", highlight: "input", interaction: { message: "That narrows the route. Open a product to explore its features and see whether it fits.", state: "happy" } },
  "product-detail": { message: "Here’s the product in context. Start with its purpose, then explore the features below.", state: "curious", side: "right", perch: "stand" },
  "product-features": { message: "The useful details are here: what the product does, who it helps, and the features that support the work.", state: "pointing", side: "left", perch: "sit", highlight: ".detail-panel" },
  "product-tour": { message: "A closer look at the actual interface. These screenshots give the features some context.", state: "excited", side: "right", perch: "balance", highlight: ".content-grid" },
  "product-enquiry": { message: "Want to see how this fits? Share your workflow and priorities when you request a demo.", state: "welcoming", side: "left", perch: "lean", highlight: ".button" },
  industries: { message: "Every industry brings different constraints. Choose your context and start a conversation about yours.", state: "curious", side: "left", perch: "balance" },
  testimonials: { message: "The people who worked with PROCODIC tell this part. Published feedback is shared with permission.", state: "happy", side: "right", perch: "sit" },
  "testimonial-stories": { message: "Client and partner feedback appears here when it’s approved to share. I’ll give you room to read.", state: "focused", side: "left", perch: "sit" },
  work: { message: "Real projects need real context. The case studies connect a challenge to the work and its outcomes.", state: "curious", side: "right", perch: "stand" },
  "work-library": { message: "Published projects appear here as their details are ready. Open a story to follow the decisions behind it.", state: "pointing", side: "left", perch: "lean" },
  "case-detail": { message: "Let’s follow this project from the original challenge to the solution and the reported outcomes.", state: "focused", side: "right", perch: "stand" },
  "case-outcomes": { message: "The challenge, the approach, and the result. This is the part where the engineering choices come together.", state: "thinking", side: "left", perch: "sit", highlight: ".detail-copy" },
  insights: { message: "Ideas for the next thing you build. Explore the latest thinking when a topic catches your attention.", state: "thinking", side: "left", perch: "stand" },
  "insight-library": { message: "Browse the published articles here. A question, a technique, or a new perspective could be your next starting point.", state: "curious", side: "right", perch: "lean" },
  article: { message: "You found a story. I’ll settle here while you read; open my directions whenever you need a new route.", state: "focused", side: "right", perch: "sit" },
  "article-reading": { message: "Take your time with the details. I’ll keep the acrobatics out of your reading space.", state: "focused", side: "left", perch: "sit" },
  contact: { message: "An idea, a challenge, or a question — that’s enough to start. The team will help work out the next step.", state: "welcoming", side: "left", perch: "stand" },
  "contact-form": { message: "A little context helps the right team respond. I’ll step aside while you write.", state: "happy", side: "right", perch: "sit" },
  about: { message: "Meet the people and principles behind PROCODIC. Thoughtful engineering starts with thoughtful humans.", state: "welcoming", side: "right", perch: "stand" },
  mission: { message: "Useful change is the aim. This is how the team connects technology with the work people actually do.", state: "thinking", side: "left", perch: "lean" },
  principles: { message: "Good decisions need shared principles. These are the ideas the team brings into each project.", state: "focused", side: "right", perch: "balance" },
  team: { message: "The humans behind the work. Their different perspectives make the team stronger.", state: "happy", side: "left", perch: "sit" },
  "about-enquiry": { message: "Have a challenge that needs a fresh pair of eyes? Bring it to the team.", state: "welcoming", side: "right", perch: "lean", highlight: ".button" },
  ai: { message: "Research meets real problems here. Explore how the team turns AI ideas into practical possibilities.", state: "excited", side: "right", perch: "stand" },
  "ai-capabilities": { message: "Different AI methods suit different problems. These areas show where the team explores and builds.", state: "pointing", side: "left", perch: "balance", highlight: ".content-grid" },
  "research-projects": { message: "Published research projects appear here with their methods and context. Open one to follow the work.", state: "curious", side: "right", perch: "lean" },
  "research-detail": { message: "Here’s the research question and the project’s focus. The methodology and objectives are just below.", state: "focused", side: "right", perch: "stand" },
  "research-methods": { message: "Start with the problem, then compare the methodology and objectives. References add context when available.", state: "thinking", side: "left", perch: "sit", highlight: ".detail-panel" },
  "research-enquiry": { message: "Have a question worth testing? Share the problem and explore a research collaboration.", state: "welcoming", side: "left", perch: "lean", highlight: ".button" },
  learning: { message: "Learn it, try it, put it to work. These experiences help teams build practical confidence with AI.", state: "excited", side: "left", perch: "stand" },
  "learning-pathways": { message: "Choose a starting point that fits your team. The pathways connect understanding with hands-on application.", state: "pointing", side: "right", perch: "balance", highlight: ".content-grid" },
  "learning-programs": { message: "Program details appear here as they’re published. Tell the team what you want to learn and apply.", state: "curious", side: "left", perch: "lean" },
  "learning-detail": { message: "A learning plan with a purpose. Check the curriculum, format, and intended audience before you enquire.", state: "focused", side: "right", perch: "stand" },
  curriculum: { message: "This is the learning journey: topics, outcomes, and practical details to help you plan a useful session.", state: "pointing", side: "left", perch: "sit", highlight: ".detail-panel" },
  "learning-enquiry": { message: "What should your team be able to do next? That’s a good place to start planning a workshop.", state: "welcoming", side: "right", perch: "lean", highlight: ".button" },
  collaborations: { message: "Good partnerships bring different strengths together. Explore how you could work with PROCODIC.", state: "welcoming", side: "right", perch: "stand" },
  "partner-network": { message: "Partner information appears here when it’s ready to share. A new collaboration can start with a conversation.", state: "curious", side: "left", perch: "sit" },
  privacy: { message: "Your information matters. This page explains how website enquiries and privacy requests are handled.", state: "focused", side: "right", perch: "stand" },
  "privacy-details": { message: "Read the details at your own pace. Use the contact route if you have a question about your information.", state: "focused", side: "left", perch: "sit" },
  terms: { message: "These are the terms for using the website and its materials. I’ll give you room to read.", state: "focused", side: "right", perch: "stand" },
  "terms-details": { message: "The details cover website information, content, and contact. The team can help with any questions.", state: "focused", side: "left", perch: "sit" },
  play: { message: "Catch me if you can! Move closer, then click me. You can also focus me and press Enter. Stop playing whenever you like.", state: "excited", side: "right", perch: "balance" },
  caught: { message: "You caught me! Paws up, thrusters down. A little happy wiggle, then we’re ready for takeoff.", state: "embarrassed", side: "right", perch: "stand" },
  escaped: { message: "Whoosh! Tiny paws, big boost. Try again — or let’s fly to something interesting.", state: "laughing", side: "left", perch: "balance" },
};

export function routeStory(pathname: string): string {
  const [first, detail] = pathname.split("/").filter(Boolean);
  const listing = { products: "products", "ai-research": "ai", training: "learning", about: "about", contact: "contact", testimonials: "testimonials", "case-studies": "work", insights: "insights", collaborations: "collaborations", privacy: "privacy", terms: "terms" } as Record<string,string>;
  const details = { products: "product-detail", "ai-research": "research-detail", training: "learning-detail", "case-studies": "case-detail", insights: "article" } as Record<string,string>;
  return (detail && details[first]) || listing[first] || "hero";
}

export function canIntroduce(rect: { top: number; bottom: number }, viewportHeight: number) {
  // The real card must be on screen; loading the module never introduces Nova.
  return rect.top < viewportHeight * .86 && rect.bottom > 160;
}

export function railPosition(width: number, height: number, side: "left" | "right", sectionTop = height * .55) {
  const size = width < 640 ? 96 : 128;
  const gutter = Math.max(10, (width - 1240) / 2 - size - 12);
  const x = side === "left" && width >= 900 ? gutter : width - size - gutter;
  const bottomLimit = height - size * 1.5 - 52; // Pet canvas ratio plus pause/hide controls.
  const y = width < 640 ? Math.max(100, bottomLimit) : Math.min(bottomLimit, Math.max(170, sectionTop + 120));
  return { x: Math.max(8,x), y: Math.max(90,y), size };
}

export function landingPosition(card: { left: number; top: number; width: number }, width: number, height: number, size: number) {
  const startX=card.left+card.width*.66-size/2;
  const startY=card.top-size*.92;
  const perched=card.top>Math.max(280,size*1.39+90) && card.top<height-90;
  // On narrow screens the right part of the same edge leaves room for the bubble.
  const x=perched&&width>=640?startX:Math.max(8,width-size-10);
  const y=perched?card.top-size*1.39:Math.max(90,height-size*1.5-52);
  return {startX,startY,x,y,perched};
}
