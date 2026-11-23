# Nova: the flying AI pet

Nova is an original robotic pet for PROCODIC’s public website. The rounded shell, expressive glass face, ear fins, articulated paws, tail, and cyan thrusters are built directly in Three.js. It replaces the human character. Its guidance consists of editable frontend messages, with no LLM, chatbot API, or database dependency.

## Appearance and flight

`pet-rig.ts` constructs and animates the pet in 3D. The face reacts through eyes, blinking, mouth shapes, head tilt, and ear motion. Paws and the tail provide body language; paw and foot thrusters support powered flight and hovering. The SVG fallback follows the same pet design when WebGL is unavailable.

`travel.ts` synchronizes position with the 3D pose: engine anticipation, vertical boost, acceleration, banked cruise, counter-thrust braking, and a soft touchdown. Longer section journeys use flight. Short movements can hop; flips remain occasional play/click tricks. Ordinary travel is click-through so the pet does not intercept navigation.

The existing capability card remains the reveal surface. Nova peeks from behind it, grips the edge with mechanical paws, pulls up, and boosts into view. Active perches attach to real cards/panels in document space. Where a suitable surface is unavailable, a small projected step sits beside the section. Fast scrolling preserves the actual departure position, including offscreen departures, rather than teleporting the pet into view.

## Performance and controls

- The homepage defers the companion runtime until the capability card approaches the viewport, after the logo intro. Direct public-page visits load the guide during idle time. Admin routes do not mount it.
- The pet geometry is procedural: no human mesh, skin texture, or external model download is required.
- A short renderer lease keeps one canvas through the card-to-page handoff. Device pixel ratio and animation frame rate are capped.
- Offscreen canvases and hidden tabs stop rendering. Pause, reduced motion, and form focus stop continuous animation. On narrow screens the pet hides while a form is focused.
- Hide and pause preferences persist in the current tab. The footer’s guide button restores a hidden pet. Escape closes directions, and keyboard-focused controls stay stationary.
- Cleanup releases listeners, observers, timers, geometry, materials, and the WebGL context.

## Guidance and play

`story.ts` contains predefined section messages, expressions, perch preferences, feature highlights, and playful responses. Public sections use `data-companion-section`, including product/research/course detail pages. Messages appear after arrival and expose one complete polite announcement to assistive technology.

“Play with Nova” is optional. Approaching the pet triggers a dodge or evasive maneuver. Clicking or pressing Enter/Space on the pet catches it and produces a reaction. Stop playing returns it to normal guidance. Normal clicks cycle greetings, waves, and occasional flight tricks.

## Validation

From `apps/web`, run:

```sh
node --test test/brand-intro.test.cjs test/companion.test.cjs test/companion-travel.test.cjs test/companion-rig.test.cjs
node node_modules/next/dist/bin/next build
```

The checks cover intro fail-open behavior, public section guidance, viewport and surface alignment, continuous travel, engine-driven takeoff/braking, articulated pet poses, and reduced motion. Browser checks exercise the reveal, WebGL handoff, play/catch, pause/hide/restore, narrow-screen bounds, form focus, and console errors.