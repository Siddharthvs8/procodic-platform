type Point = { x: number; y: number };
type Viewport = { width: number; height: number; size: number };
export type TravelKind = "idle" | "jump" | "flight";

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(Math.max(low, high), value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
const smooth = (value: number) => value * value * (3 - 2 * value);

/** A sampled analytic path stays continuous without a per-frame React render. */
export function planCompanionTravel(from: Point, to: Point, viewport: Viewport, launch = false) {
  const { width, height, size } = viewport;
  const minX = 8, maxX = Math.max(minX, width - size - 8);
  const minY = Math.min(90, Math.max(8, height - size * 1.1 - 52));
  const maxY = Math.max(minY, height - size * 1.1 - 52);
  // Keep the first card-space position when it is above the usual resting rail.
  const floorY = launch ? 8 : minY;
  const start = { x: clamp(from.x, minX, maxX), y: clamp(from.y, floorY, maxY) };
  const end = { x: clamp(to.x, minX, maxX), y: clamp(to.y, floorY, maxY) };
  const dx = end.x - start.x, dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const kind: Exclude<TravelKind, "idle"> = !launch && distance > 240 ? "flight" : "jump";
  const direction = dx < 0 ? -1 : 1;
  const lift = Math.min(kind === "flight" ? 154 : launch ? 112 : 66, Math.max(28, distance * .22 + (launch ? 65 : 28)));
  const duration = launch ? 1.38 : kind === "flight" ? Math.min(2.15, 1.55 + distance / 2200) : 1.12;
  const result = { kind, duration, times: [] as number[], x: [] as number[], y: [] as number[], rotate: [] as number[], scaleX: [] as number[], scaleY: [] as number[] };
  for (let frame = 0; frame <= 60; frame++) {
    const t = frame / 60;
    let px = start.x, py = start.y, rotation = 0, sx = 1, sy = 1;
    if (t <= .15) {
      const anticipation = Math.sin(Math.PI * t / .15);
      py += anticipation * 5;
      sx += anticipation * .09; sy -= anticipation * .085;
      rotation = -direction * anticipation * 4;
    } else if (t < .85) {
      const p = (t - .15) / .7;
      const advance = smooth(p), arc = Math.sin(Math.PI * p);
      px = mix(start.x, end.x, advance);
      py = mix(start.y, end.y, advance) - lift * arc;
      // A gentle wing-over turns a long crossing into flight, then counter-banks to land.
      if (kind === "flight") py += Math.sin(p * Math.PI * 2) * arc * 21;
      rotation = direction * (kind === "flight" ? 24 * arc - 20 * Math.sin(p * Math.PI * 2) : 12 * Math.sin(p * Math.PI * 2));
      sx -= .035 * arc; sy += .045 * arc;
      // Banking needs slightly more room than the upright silhouette, especially on phones.
      const bankRoom = Math.abs(rotation) / 45 * size * .16;
      px = clamp(px, minX + bankRoom, maxX - bankRoom);
    } else {
      const settle = (t - .85) / .15;
      const impact = Math.sin(Math.PI * settle) * (1 - settle);
      px = end.x; py = end.y - impact * 8;
      sx += impact * .12; sy -= impact * .1;
      rotation = -direction * impact * 4;
    }
    result.times.push(t);
    result.x.push(frame === 60 ? end.x : clamp(px, minX, maxX));
    result.y.push(frame === 60 ? end.y : clamp(py, floorY, maxY));
    result.rotate.push(frame === 60 ? 0 : rotation);
    result.scaleX.push(frame === 60 ? 1 : sx);
    result.scaleY.push(frame === 60 ? 1 : sy);
  }
  return result;
}
