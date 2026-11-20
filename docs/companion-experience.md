# Pip: the public website companion

Pip is original SVG artwork with local, predefined expressions and guidance. There are no chat requests, model services, new backend routes, or database changes.

The sculpted design uses layered ceramic and metal gradients, a reflective inset visor, optical irises, a translucent crest, articulated hands and feet, and an emissive chest core. Flight deploys translucent fins and paired ion exhausts; the original silhouette and card-edge eye/paw anchors remain consistent. All materials are inline vectors, with no raster downloads, SVG blur filters, WebGL engine, or additional dependencies.

## Integration

`SiteChrome` mounts a small loader outside `#site-content` and its route transforms. The experience is dynamically imported when the real `.ux-explorer-window` approaches the viewport, or when an already-introduced visitor navigates to another public page. Admin routes never mount it.

The card and its existing styles remain intact. During introduction, React portals place the body at z-index 0 inside the existing `.ux-explorer`, behind the card at z-index 1. A separate pair of paws at z-index 3 grips its actual top edge. Position calculations read the card dimensions, including the different mobile padding.

## Choreography

1. Waiting: no visible character until the card is actually on screen and the brand intro has finished.
2. Peeking: a 5.2-second Motion timeline raises the eyes, looks around, retreats, peeks around the side, and raises the head with the foreground paws.
3. Hanging: remains on the edge until the card reaches 64% of viewport height. Visitors can also skip the reveal.
4. Launch: a 1.38-second anticipation, arcing jump, squash/stretch, and landing. The viewport actor begins at the same coordinates as the behind-card actor when that position is on screen.
5. Active: short moves use a 1.12-second hop; longer crossings use an elevated flight path with a wing-over, banking, and a settled landing in up to 2.15 seconds. A compact mobile perch also gets a contained hop when the context changes. A settled card perch is retained until the visitor scrolls farther.
6. Settled: contextual typing bubbles, pointer tracking, link reactions, and a predefined navigation panel. Speech stays hidden during travel and returns after landing.

`travel.ts` samples a bounded path into synchronized position, bank, and body-scale keyframes. Motion values drive those frames without rendering React on each tick. Flight wakes are SVG strokes visible only during movement. The existing Motion dependency handles the choreography; no physics engine, canvas renderer, or additional runtime dependency is needed.

Desktop and mobile landings account for the complete body, speech bubble, and controls. The bubble scrolls internally in short viewports. Important content remains clickable; only the character and its controls accept pointer input.

## Accessibility and lifecycle

- Reduced motion skips the choreography and disables idle motion; no automatic focus changes accompany the normal reveal.
- Skip, pause/resume, hide, keyboard controls, and footer restoration are available. Escape closes the interaction panel and restores character-button focus.
- The typed copy has one complete polite announcement; individual letters are decorative and do not trigger live announcements.
- Pip gives mobile form fields space while they are focused.
- Open directions and focused companion controls remain stationary. Form focus stops travel; cancellations restore an upright, neutral body pose. Immediate route changes and viewport resizes can still relocate Pip to a safe perch.
- Introduction, hidden state, and pause preference persist only in this browser tab. Blocked session storage falls back to in-memory behavior.
- Animation controls, observers, frames, event listeners, and timers clean up on route changes or unmount. Offscreen introductions pause their timelines. Hidden tabs pause both introduction and travel; character and flight effects stop as well.
- `story.ts` holds route messages, section messages, viewport gates, and tested placement functions. Homepage sections use `data-companion-section`; new routes can be added to `routeStory`.

## Validation

Run `node --test test/brand-intro.test.cjs test/companion.test.cjs test/companion-travel.test.cjs` and the Next production build from `apps/web`. The travel tests cover body/control bounds on phones, tablets, desktops, and short landscape screens; synchronized finite keyframes; neutral landings; same-perch hops; reversed banking; interruption without a position jump; recovery after a viewport shrink; and the larger card launch.

Manually check a fresh tab at the hero (no companion), the top and side peeks, hanging, the second scroll trigger, landing, original card tabs, cross-screen travel after the greeting, directions, navigation persistence, pause, hide/restore, Escape, mobile bubble bounds, and focused form fields.
