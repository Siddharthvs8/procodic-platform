import type { CharacterState } from "./character";

export const COMPANION_SEEN = "procodic-pip-introduced-v1";
export const COMPANION_HIDDEN = "procodic-pip-hidden-v1";
export const COMPANION_PAUSED = "procodic-pip-paused-v1";
export type Story = { message: string; state: CharacterState; side: "left" | "right" };
export const stories: Record<string, Story> = {
  welcome: { message: "Oh, hello! I’m Pip. I was just looking around. Come on — let’s explore together!", state: "happy", side: "right" },
  capabilities: { message: "Three ways to make something great. Try the tabs — I’m curious which one you’ll choose.", state: "curious", side: "right" },
  expertise: { message: "Build, rethink, grow. Different skills, working together. Where would you like to start?", state: "pointing", side: "left" },
  process: { message: "Good things start with a good question. Here’s how the team turns yours into a working solution.", state: "thinking", side: "right" },
  products: { message: "Useful software, made for real work. Take a closer look at a product that catches your eye.", state: "pointing", side: "right" },
  industries: { message: "Every industry has its own challenges. The interesting part? Finding what works for yours.", state: "curious", side: "left" },
  testimonials: { message: "I’ll let the people who’ve worked with PROCODIC tell this part.", state: "happy", side: "right" },
  insights: { message: "A fresh perspective can be the start of something. There are a few waiting here.", state: "thinking", side: "left" },
  contact: { message: "Have an idea? The team would love to hear it. I’ll give you some room to write.", state: "happy", side: "left" },
  about: { message: "Meet the people behind the work. Thoughtful humans, plenty of curiosity.", state: "happy", side: "right" },
  ai: { message: "This is where research meets real problems. Explore how the team puts AI to practical use.", state: "excited", side: "right" },
  learning: { message: "Ready to try something new? These learning experiences are built around doing.", state: "excited", side: "left" },
  hero: { message: "Back where we started! I’ll be here if you’d like a little direction.", state: "idle", side: "right" },
};

export function routeStory(pathname: string): string {
  const first = pathname.split("/")[1];
  return ({ products: "products", "ai-research": "ai", training: "learning", about: "about", contact: "contact", testimonials: "testimonials", "case-studies": "testimonials", insights: "insights", collaborations: "about" } as Record<string,string>)[first] ?? "hero";
}

export function canIntroduce(rect: { top: number; bottom: number }, viewportHeight: number) {
  // The real card must be on screen; loading the module never introduces Pip.
  return rect.top < viewportHeight * .86 && rect.bottom > 160;
}

export function railPosition(width: number, height: number, side: "left" | "right", sectionTop = height * .55) {
  const size = width < 640 ? 76 : 106;
  const gutter = Math.max(10, (width - 1240) / 2 - size - 12);
  const x = side === "left" && width >= 900 ? gutter : width - size - gutter;
  const bottomLimit = height - size * 1.1 - 52; // Include the small pause/hide controls.
  const y = width < 640 ? Math.max(100, bottomLimit) : Math.min(bottomLimit, Math.max(170, sectionTop + 120));
  return { x: Math.max(8,x), y: Math.max(90,y), size };
}

export function landingPosition(card: { left: number; top: number; width: number }, width: number, height: number, size: number) {
  const startX=card.left+card.width*.66-size/2;
  const startY=card.top-size*.68;
  const perched=card.top>280 && card.top<height-90;
  // On narrow screens the right part of the same edge leaves room for the bubble.
  const x=perched&&width>=640?startX:Math.max(8,width-size-10);
  const y=perched?card.top-size*.92:Math.max(90,height-size*1.1-52);
  return {startX,startY,x,y,perched};
}
