# Product

## Register

product

## Users

Two audiences, in order of immediacy:

1. **Metropolis judges**, opening the dashboard on their own laptops during or after
   presentation. They are not in a task; they are forming a verdict in under two
   minutes. Their questions are "is this real?", "did money actually move?", "can I
   check it myself?" They will scroll, hover, and click one thing before deciding.
2. **The finance / AP reader** the product is ultimately sold to: reconciling what
   agents spent against what they were authorized to spend. They need density,
   precise numbers, and a table they can trust, not a summary that flatters.

The agent operator who issues mandates is the same person as (1) in practice, and
shares the same need: see at a glance what is authorized, what happened, and whether
the two agree.

## Product Purpose

MandateKey is the dashboard half of Ledgeroot: it answers "which agents are
authorized, to spend how much, until when" and "prove what actually moved". It reads
a local SQLite ledger and an on-chain anchor; there is no backend and no account.

Success is a reader who trusts the screen and can verify it without us. The engine
already produces signed, hash-chained, anchored evidence; the dashboard's job is to
present it so the evidence is legible, not to soften it. Nothing here may imply a
check that did not run.

## Brand Personality

Precise, sober, unhurried. The voice of an instrument, not a pitch: state the fact,
name the reason, show the hash. Three words: **instrumental, exacting, quiet**.

The emotional goal is *relief*: the reader stops wondering whether the agent overspent.
Never excitement, never delight for its own sake, never urgency the data does not
justify.

Copy states what happened and why in the same breath ("payTo 0xaBF4… is not bound by
the mandate", not "Blocked by policy"). A denial is a result, not an error.

## Anti-references

- **Crypto / Web3 aesthetics**: neon on black, gradient text, glassmorphism, glowing
  borders, animated gradients, token-price theatrics. Explicitly rejected by the user.
- **Card stuffing**: every fact in its own rounded box, identical card grids, nested
  cards. Explicitly rejected by the user.
- **Enterprise SaaS template**: hero KPI numbers, decorative icon/heading/body cards.
- **Monitoring console**: walls of red/amber/green lights, dense sparklines, alert noise.
- **Security theatre**: padlock iconography, "bank-grade" claims, unexplained green
  checkmarks. This product's whole claim is that trust comes from checkable evidence,
  so decoration that vouches for itself is self-defeating.
- Dark UI as a default. The choice is made from the scene, not the category.

## Design Principles

1. **Every pixel is a claim, and it has to be true.** Colour, checkmarks and labels
   assert state; they may never assert a check that did not run. Missing evidence reads
   as missing, never as passing.
2. **Show the join.** The ledger is a graph (mandate → receipt → anchor → chain). The
   interface must let a reader move along it in one click, in both directions.
3. **Density is respect.** The reader can handle a table. Prefer a dense, aligned,
   scannable row over a comfortable one that hides half the fields.
4. **Verbatim over paraphrase.** Hashes, addresses, policy reasons and amounts appear
   as the engine produced them. If it must be shortened, it is shortened visually
   (middle-elided) and never reworded.
5. **Familiarity beats flavour.** Standard navigation, standard controls, standard
   table behaviour. The tool should disappear into the task.

## Accessibility & Inclusion

- **WCAG 2.2 AA** as the floor: 4.5:1 body text, 3:1 large text and UI boundaries,
  visible focus rings on every interactive element, no colour-only signalling.
- Status is always carried by text plus colour, never colour alone (paid / 已拦截 /
  verified / tampered are words first).
- `prefers-reduced-motion` respected: no transition becomes load-bearing.
- Both English and Chinese render correctly, with `lang` set on the document so screen
  readers switch voice; numeric and hash columns stay in tabular figures in both.
- Nothing depends on hover alone: every hover affordance has a click or keyboard path.
