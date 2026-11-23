type Point = { x: number; y: number };
type Viewport = { width: number; height: number; size: number };
export type TravelKind = "idle" | "jump" | "flight";
export type JourneyAction = "jump" | "flip" | "flight" | "dodge" | "run";
export type SurfacePose = "stand" | "sit" | "lean" | "balance";

/** Feet (or hips when seated) meet the real panel edge, with controls kept in view. */
export function surfacePosition(rect: {left:number;top:number;width:number;height:number}, width:number, height:number, size:number, side:"left"|"right", pose:SurfacePose="stand", edge:"top"|"bottom"="top") {
  const fraction=width<640?.82:side==="left"?.2:.8;
  const surfaceY=rect.top+(edge==="bottom"?rect.height:0);
  const baseline=size*(pose==="sit"?.92:1.39);
  return {x:clamp(rect.left+rect.width*fraction-size/2,8,width-size-8),y:clamp(surfaceY-baseline,80,height-size*1.5-48),fraction,surfaceY};
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(Math.max(low, high), value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
const smooth = (value: number) => value * value * (3 - 2 * value);
const smoother = (value: number) => { const p=clamp(value,0,1); return p*p*p*(p*(p*6-15)+10); };

/** A sampled analytic path stays continuous without a per-frame React render. */
export function planCompanionTravel(from: Point, to: Point, viewport: Viewport, launch = false, requestedAction?: JourneyAction, preserveOrigin = false) {
  const { width, height, size } = viewport;
  const minX = 8, maxX = Math.max(minX, width - size - 8);
  const minY = Math.min(80, Math.max(8, height - size * 1.5 - 48));
  const maxY = Math.max(minY, height - size * 1.5 - 48);
  // Keep the first card-space position when it is above the usual resting rail.
  const floorY = launch ? 8 : minY;
  const outsideX=preserveOrigin&&(from.x<minX||from.x>maxX);
  const outsideY=preserveOrigin&&(from.y<floorY||from.y>maxY);
  // A fast scroll can carry the old perch offscreen. Fly from that location;
  // clamping the first sample would visibly teleport Nova into view.
  const start = { x: outsideX?from.x:clamp(from.x, minX, maxX), y: outsideY?from.y:clamp(from.y, floorY, maxY) };
  const end = { x: clamp(to.x, minX, maxX), y: clamp(to.y, floorY, maxY) };
  const dx = end.x - start.x, dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const action:JourneyAction=requestedAction??(launch||distance>180?"flight":"jump");
  const powered=action==="flight";
  const kind: Exclude<TravelKind, "idle"> = powered||distance>240 ? "flight" : "jump";
  const direction = dx < 0 ? -1 : 1;
  const lift = Math.min(kind === "flight" ? 154 : launch ? 112 : 66, Math.max(28, distance * .22 + (launch ? 65 : 28)));
  const duration = action==="dodge"?.95:launch ? 1.85 : powered ? Math.min(2.5, 1.8 + distance / 2200) : 1.3;
  const result = { kind, action, duration, times: [] as number[], progress: [] as number[], x: [] as number[], y: [] as number[], rotate: [] as number[], scaleX: [] as number[], scaleY: [] as number[] };
  for (let frame = 0; frame <= 60; frame++) {
    const t = frame / 60;
    let px = start.x, py = start.y, rotation = 0, sx = 1, sy = 1;
    if(powered){
      // Spool → vertical boost → cruise → counter-thrust → settle. Separate
      // lift and horizontal acceleration make the pet feel engine-driven.
      const advance=smoother((t-.18)/.72);
      const liftIn=smoother((t-.12)/.18),liftOut=smoother((t-.66)/.24);
      const clearance=lift*liftIn*(1-liftOut);
      const spool=t<.12?Math.sin(Math.PI*t/.12)**2:0;
      const touchdown=t>.9?Math.sin(Math.PI*(t-.9)/.1)**2:0;
      px=mix(start.x,end.x,advance);
      py=mix(start.y,end.y,advance)-clearance+spool*3+touchdown*2;
      const cruise=smoother((t-.24)/.12)*(1-smoother((t-.67)/.15));
      const brake=Math.sin(Math.PI*clamp((t-.7)/.2,0,1))**2;
      rotation=direction*(25*cruise-12*brake);
      sx=1+.025*spool+.025*touchdown;
      sy=1-.025*spool-.025*touchdown;
    } else if (t <= .15) {
      const anticipation = Math.sin(Math.PI * t / .15);
      py += anticipation * 5;
      sx += anticipation * .09; sy -= anticipation * .085;
      rotation = -direction * anticipation * 4;
    } else if (t < .85) {
      const p = (t - .15) / .7;
      const advance = smooth(p), arc = 4*p*(1-p);
      px = mix(start.x, end.x, advance);
      py = mix(start.y, end.y, advance) - lift * arc;
      // A gentle wing-over turns a long crossing into flight, then counter-banks to land.
      if (kind === "flight") py += Math.sin(p * Math.PI * 2) * arc * 21;
      rotation = direction * (kind === "flight" ? 24 * arc - 20 * Math.sin(p * Math.PI * 2) : 12 * Math.sin(p * Math.PI * 2));
      sx -= .035 * arc; sy += .045 * arc;
      // Banking needs slightly more room than the upright silhouette, especially on phones.
      const bankRoom = Math.abs(rotation) / 45 * size * .16;
      if(!outsideX)px = clamp(px, minX + bankRoom, maxX - bankRoom);
    } else {
      const settle = (t - .85) / .15;
      const impact = Math.sin(Math.PI * settle) * (1 - settle);
      px = end.x; py = end.y - impact * 8;
      sx += impact * .12; sy -= impact * .1;
      rotation = -direction * impact * 4;
    }
    result.times.push(t);
    result.progress.push(t);
    result.x.push(frame === 60 ? end.x : outsideX?px:clamp(px, minX, maxX));
    result.y.push(frame === 60 ? end.y : outsideY?py:clamp(py, floorY, maxY));
    result.rotate.push(frame === 60 ? 0 : rotation);
    result.scaleX.push(frame === 60 ? 1 : sx);
    result.scaleY.push(frame === 60 ? 1 : sy);
  }
  return result;
}
