# Course metrics

What the arcade runner (Trizen's runner with RUNOFF's tuning, `src/sim/arcade.js`) can do, measured headless with
`node tools/metrics.mjs` (keyboard, 60 frames a second, forward held). Build courses to the **Comfortable** column;
use **Max** sparingly for a hard optional line; keep anything meant to be out of reach at least the **dead band**
beyond Max (a target just past the limit reads as reachable and frustrates: Mirror's Edge's rule, as Trizen's
metrics quote it).

Heights are relative to the floor the move starts from.

## Gaps (running jump, taking off within 0.3 m of the edge)

| Landing rise | Comfortable | Max (sprint) | Max (slide-jump) |
| --- | --- | --- | --- |
| +1 m | 4.5 m | 5.5 m | 5.75 m |
| +0.5 m | 5 m | 6 m | 6.25 m |
| 0 | 5 m | 6.25 m | 6.75 m |
| −1 m | 5.5 m | 7 m | 7.5 m |
| −2 m | 6 m | 7.5 m | 8 m |
| −3 m and lower | 6 m | 7.5 m | 8.75 m |

A rise of +2 m or more is not landed on: it is a climb (below).

## Obstacles (met square-on at a run)

| Height | What gets over or onto it |
| --- | --- |
| up to 0.3 m | a step |
| 0.4–0.6 m | **avoid**: a jump clears it, but running into it stops the runner |
| 0.8–1.2 m | vaulted at a run, no press (the assist) |
| 1.4–1.8 m | a jump close to it (about 1 m out) climbs on; a jump from 2 m+ clears it |
| 2.2–2.6 m | a jump from about 3 m out catches the edge and climbs |
| 2.8–3.2 m | **avoid**: unreliable |
| 3.4–3.8 m | a jump close to it runs up the wall to the edge and climbs |
| 4.2 m and up | out of reach (the dead band starts at 4 m) |

## Walls

| | |
| --- | --- |
| Wall run | met at 15–35°: about 3 m along the wall (its take's own travel, played quicker from a sprint), rising about 0.9 m; under 10° it barely catches; from about 40° the runner plants on the wall instead |
| Kick off | Space during a wall run: 6.5 m/s out from the wall, 9.5 up. A wall run and its kick cross about 6 m |
| Wall run reach | the wall within 0.8 m of the body to the side |

## Things to take hold of (the traversal kit, `src/world/builder.js`)

| Piece | How | Size |
| --- | --- | --- |
| Pole | jump at it: slides down (a fast way down a storey or more) | 0.06 m radius, 2 m tall or more |
| Drainpipe | run into it: climbs at 2 m/s, tops out onto the roof | 0.06 m radius, 0.15 m off its wall |
| Ladder | run into it: climbs, tops out | 0.5 m wide |
| Zipline | jump up at it: rides from the high end, thrown off at the low end | the cable 2.2–2.6 m over where it is jumped at |
| Swing bar | jump at it within 50° of square: swings and launches forward | 2.2–2.4 m over the take-off |
| Balance beam | walk onto it: the arms go out, but it keeps the run's speed, so staying on is steering | 0.15 m wide; 0.3 m where it is the safe line |

## Landings (RUNOFF's rules)

| Fall | Landing |
| --- | --- |
| under about 5 m | clean |
| about 5–20 m | roll it (Space or Shift held), else a stumble |
| over about 20 m | a crash (the ragdoll) |

## Storeys and layout

- Roofs on a grid of about 3.1 m storeys read well (Trizen's courses use it): a storey up is a climb, two are a pipe or
  a ladder, down is free.
- Every climb up a storey or more gets a fast way down later (a pole, a zipline, a chute, a drop to a roll).
- A fork offers a fast hard line and a safe one; both rejoin at the next checkpoint.

## Floors that meet

- Floors that meet must be flush: a lip of even 3 mm where the runner crosses from one solid onto another (a roof onto
  a ramp) stops it dead.
- Stairs are drawn as steps but trodden as one slope (`stairs()` in the builder); about 20° going up (rise 0.15, run
  0.4) reads as stairs and keeps the runner running. Steps met as boxes, or a slope's top level with the front edge of
  the floor beyond, read to the vault scan as a ledge, and the runner vaults the last few steps: stairs going up end on
  a landing (`land`), and the floor beyond starts inside it.
- Where solids meet at one point the runner's scans take the face most against them. A convex edge at the top of a
  slope (a roof's ridge, the top of stairs) must be one solid's edge, never two solids' upright faces back to back, or
  the runner vaults it (`gableRoof()` makes each ridge one peaked solid).
- A landing right on the join between two roof slices loses some speed for a moment (the next slice's edge); landing
  mid-slice keeps it.

## Obstacles on the way

Parkour games keep the runner busy and moving: Mirror's Edge's lines never ask it to stop, Dying Light built its levels
around the moves, and every one varies the rhythm (a vault, a slide, a gap, a climb). Here, measured with
`node tools/flow.mjs` (the bot's routes, a move counted at each change into a move's state):

- The fast line makes a move every 1 to 1.5 s, and runs plain (on the ground, nothing to do) for no more than about
  2 s (17 m) at a time; a safe line can run a little plainer (its beams and ladders are slow on their own).
- Mix them: a rail or a box to vault, a bar or a duct to slide under, a gap, a step up or down. Vaults keep the run's
  speed (a speed vault), so an obstacle on the line costs nothing taken cleanly.
- A slide wants 1.8 s before the next one (the core's cooldown, about 20 m at a slide's speed): bars to slide under
  on one line at least 22 m apart, a vault between them.
- Leave the run-up clear before a jump that needs speed or timing (a wall-run, a long gap, a catch): about 6 m.
- Put an obstacle where both lines cross the same ground, or one on each line, so the safe line has its rhythm too.
