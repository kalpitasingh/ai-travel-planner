# TripMind Structural Review

## Reference takeaways

The attached reference repeatedly uses a **single dominant visual stage** rather than a standard split SaaS hero. The central object or scene is allowed to establish the composition, while the interface becomes a quiet layer around it. Navigation is minimal and top-weighted, the logo is visually important, headlines use unusually strong scale contrast, and sections feel like discrete scenes rather than a continuous dashboard. The reference’s strongest structural move is the relationship between content and the 3D object: the object owns the center and the copy frames it.

## Critical review of the current TripMind build

| Area | Current condition | Critical assessment | Redesign decision |
|---|---|---|---|
| Hero composition | Split text-left / globe-right over a photographic hero | Sophisticated, but still follows a familiar premium SaaS split layout. The globe competes with the image and the copy, so the “one main scene” feeling is weaker than the reference. | Make the globe the central stage. Place the headline as an overlapping editorial lockup in the lower-left, with the right side reserved for concise route metadata and a clear planning action. |
| Main 3D element | Large, but offset right and partially treated as a framed product graphic | It reads as a globe component inside a hero instead of the world the user is entering. | Increase the globe’s visual authority and center it across the viewport. Let routes pass behind/through the surrounding copy without becoming decorative clutter. |
| Navigation | Top-left wordmark, top-right links and CTA | Good restraint, but the wordmark is too small and the navigation is generic. | Use a centered luxury-style wordmark with utility controls at left/right; keep one clear CTA. |
| Typography hierarchy | Strong serif/sans contrast | Good foundation, but the hero copy is competing with the globe rather than framing it. | Use a larger, shorter headline with more vertical presence and less supporting copy above the fold. |
| Section flow | Alternating charcoal and ivory plates | Beautiful palette, but it behaves like a long landing page with feature sections. | Convert chapters into a scene sequence: orbit → intent → build → route → adapt → group. Repeat a single chapter index and route thread. |
| Spacing / proportions | Generous but predictable grid proportions | Desktop composition is polished but too many sections share similar horizontal rhythm. | Use distinct proportions per chapter: one immersive 100vh stage, one narrow editorial plate, one two-column working surface, one full-width route plate. |
| Visual storytelling | Strong travel editorial copy and Lisbon imagery | It sells the mood, but the story does not begin with the user’s trip strongly enough. | Move the user from “where in the world?” to a living Lisbon route, with the planner appearing as a quiet command layer on the same stage. |
| 3D / content interaction | Globe and map are separate visual moments | The globe is animated but not yet meaningfully tied to planner state. | Add a persistent “Lisbon / 05 days / 18.6 km” context label around the globe and make planner completion scroll into the same route chapter. |
| Genuine design vs AI-generated | Above average and intentionally art-directed | It avoids the worst AI SaaS tropes, but the repeated section formula and uniform card treatment can still read generated. | Reduce card repetition, vary chapter composition, create a more distinctive centered-stage hero, and use fewer component-like boxes. |
| Premium travel product feel | Strong | It feels premium, but currently “travel-tech editorial” more than “premium travel experience first.” | Let photography, atmosphere, typography, and spatial composition lead; let controls appear as a precise but quiet layer. |

## Original redesign brief

The revised TripMind experience will use a **center-stage atlas** composition inspired by the reference’s visual staging but not its branding. The hero will be a tall cinematic scene with the rendered globe centered slightly above the fold, a centered wordmark, sparse utility navigation, and a bottom-left editorial headline that feels placed inside the scene rather than in a separate content column. The planning interaction will be a horizontal command strip at the bottom of the hero, allowing the product concept to enter immediately without becoming a form card.

Below the hero, the website will flow as a sequence of distinct chapters: a narrow manifesto with an offset Lisbon image; an “assemble the day” planner surface with a large index and one focused control at a time; a route chapter pairing the itinerary and map; an adaptation chapter showing before/after change; and a final group chapter with preference lines instead of repeated cards. The existing domain logic and TripMind concept remain intact.

## What stays

The Midnight Atlas palette, Cormorant + Manrope type system, vermilion route language, canvas-rendered globe, mock itinerary model, responsive behavior, reduced-motion support, and future integration seams all stay.

## What changes materially

The hero becomes centered and scene-led rather than split. The navigation becomes smaller and more luxury-editorial. The hero copy becomes shorter and lower, with the globe owning the upper center. The planner becomes a command strip and chapter rather than a generic form panel. Section proportions will vary more deliberately, with fewer repeated boxed modules and stronger visual transitions.
