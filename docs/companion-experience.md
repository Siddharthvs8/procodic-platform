# Pip: the public website companion

Pip is original SVG artwork with local, predefined expressions and guidance. There are no chat requests, model services, new backend routes, or database changes.

## Integration

`SiteChrome` mounts a small loader outside `#site-content` and its route transforms. The experience is dynamically imported when the real `.ux-explorer-window` approaches the viewport, or when an already-introduced visitor navigates to another public page. Admin routes never mount it.

The card and its existing styles remain intact. During introduction, React portals place the body at z-index 0 inside the existing `.ux-explorer`, behind the card at z-index 1. A separate pair of paws at z-index 3 grips its actual top edge. Position calculations read the card dimensions, including the different mobile padding.

## Choreography

1. Waiting: no visible character until the card is actually on screen and the brand intro has finished.
2. Peeking: a 5.2-second Motion timeline raises the eyes, looks around, retreats, peeks around the side, and raises the head with the foreground paws.
3. Hanging: remains on the edge until the card reaches 64% of viewport height. Visitors can also skip the reveal.
4. Launch: a 1.15-second anticipation, arcing jump, squash/stretch, and landing. The viewport actor begins at the same coordinates as the behind-card actor.
5. Active: contextual perches, typing bubbles, pointer tracking, link reactions, and a predefined navigation panel. A settled card perch is retained until the visitor scrolls farther.

Desktop and mobile landings account for the complete body, speech bubble, and controls. The bubble scrolls internally in short viewports. Important content remains clickable; only the character and its controls accept pointer input.

## Accessibility and lifecycle

- Reduced motion skips the choreography and disables idle motion; no automatic focus changes accompany the normal reveal.
- Skip, pause/resume, hide, keyboard controls, and footer restoration are available. Escape closes the interaction panel and restores character-button focus.
- The typed copy has one complete polite announcement; individual letters are decorative and do not trigger live announcements.
- Pip gives mobile form fields space while they are focused.
- Introduction, hidden state, and pause preference persist only in this browser tab. Blocked session storage falls back to in-memory behavior.
- Animation controls, observers, frames, event listeners, and timers clean up on route changes or unmount. Offscreen introductions and hidden tabs pause their timelines.
- `story.ts` holds route messages, section messages, viewport gates, and tested placement functions. Homepage sections use `data-companion-section`; new routes can be added to `routeStory`.

## Validation

Run `node --test test/companion.test.cjs` and the Next production build from `apps/web`. Manually check a fresh tab at the hero (no companion), the top and side peeks, hanging, the second scroll trigger, landing, original card tabs, directions, navigation persistence, pause, hide/restore, Escape, mobile bubble bounds, and focused form fields.
