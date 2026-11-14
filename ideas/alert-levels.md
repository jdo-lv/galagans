# Alert levels (0–5)

Added 2026-11-14. One scale for every status the crew app shows: body-map rows, routine items, detail screens and the surgeon packet. It follows NASA's caution and warning classes, so the crew reads it the way they read vehicle alerts, and adds a level 1 for the astronaut's own inputs. It replaces the three-state nominal / caution / warning set in [crew-health-companion.md](crew-health-companion.md) and the "Proposed tiers" table in [ux-human-factors.md](../research/ux-human-factors.md#3-designing-for-autonomy-under-communication-delay).

## The levels

The levels follow NASA's caution and warning classes, which astronauts already train on: quiet display, Shuttle class 0 limit sensing, advisory, caution, warning and emergency [S2 §10.9.1.1, Table 10.9-1] [S4]. Only three colours are used, as NASA does: blue (advisory), yellow (caution) and red (warning and emergency).

| Level | Word | NASA class | Meaning | Icon | Typical trigger (from our rule rows) | Default routing (escalation tier) | Interrupts? |
|---|---|---|---|---|---|---|---|
| **0** | Nominal | Quiet display [S3] | All good. Nothing happens, no input needed. | ✓ check circle | Values inside the personal baseline and the adaptation corridor | None | No. Quiet: muted text, no fill |
| **1** | To do | Advisory: routine action | Something to add from the astronaut. Not a health signal. | ✎ edit note | Questionnaire due, PVT due, re-measure requested, glucose or BP to enter by hand | None (the astronaut) | No. Counter badge ("1 to do") |
| **2** | Watch | Class 0 limit sensing [S2 §10.9.1.1] | A value is drifting from normal. A routine change may help. | ↗ / ↘ trend arrow | Sleep under 6 h 3 nights running; hydration below target 3 days running | 1 · Self-care tip, re-check later | No. Silent, no colour: arrow and word beside the value |
| **3** | Check | Caution | A value is out of range, or the astronaut reports a symptom or concern. An extra test may help; mention it to the doctors. | ▲ triangle | COG-02 (PVT outside the corridor); SpO₂ < 94% on the first reading; logged headache; positive PHQ-2 | 2 · CMO, or 3 · add to the next private medical conference | No tone. Status chip and a suggested item for the surgeon packet |
| **4** | Treat | Warning: immediate action | Out of range and needs treatment now, on board. | ✚ medical kit | SpO₂ still < 94% after the re-measure protocol | 2 · CMO now, plus 3 · conference today | Banner on Today until acknowledged. No tone, no flashing |
| **5** | Emergency | Emergency | Immediate danger. Get help. | ⬣ octagon | SpO₂ < 90%, or low SpO₂ with high HR at rest; chest pain with breathlessness | 2 · CMO now + 4 · urgent ground contact; vehicle emergency protocol | Full screen, flashing, tone. Defers to the vehicle caution and warning system |

Triggers are examples from the rules already in [crew-health-companion.md](crew-health-companion.md) (check-and-act, COG-02, kidney trend). Each real trigger lives in the rule table with its source; this file sets only what a level looks like and does.

### How it maps to NASA

| Our level | NASA alert class [S4] | NASA colour rule [S1 V2 10114–10119] [S2 §10.11.5.5] | Artemis tone [S4][S5] |
|---|---|---|---|
| 0 Nominal | — (quiet/dark display) [S3] | no emphasis | none |
| 1 To do | Advisory: routine action | blue = advisory | none (advisory beeps are optional) |
| 2 Watch | Class 0: silent arrow beside an out-of-limit value [S2 §10.9.1.1] | no colour | none |
| 3 Check | Caution: attention, not immediate action | yellow = caution | none: a health value is not a vehicle caution |
| 4 Treat | Warning: immediate action | red | none |
| 5 Emergency | Emergency: threat to the crew | red | yes, deferring to the vehicle C&W tones |

Red is used for levels 4 and 5 and nothing else; yellow only for level 3; blue only for level 1. NASA has no orange and one caution yellow, so neither do we. Like NASA's warning and emergency, levels 4 and 5 share red and differ by icon, word and how they interrupt (banner vs full screen with flashing and tone).

## Colours

Light theme on background `#CFCFCF` / card `#DADADA`; dark theme on background `#1B1B1B` / olive card `#52574E`.

| Level | Light: fill · ink · border | Dark: fill · ink · border | Notes |
|---|---|---|---|
| 0 Nominal | none · `#52574E` olive · none | none · `#868375` khaki on background, `#CFCFCF` on the card · none | Olive 4.8:1 on light bg, 5.3:1 on card. Khaki is 4.5:1 on the dark background but 1.9:1 on the olive card, so on the card the word uses `#CFCFCF` (4.8:1) |
| 1 To do | none · `#1651B6` blue · `#1651B6` | none · `#7FA6F0` blue tint · `#7FA6F0` | Outline chip. Blue 4.7:1 light bg; tint 7.1:1 dark bg, 3.0:1 on the card (icon and border fine, word in `#DADADA`) |
| 2 Watch | none · text colour · text colour | none · text colour · text colour | Neutral outline chip: no level colour (NASA class 0 is silent). Told apart from Nominal by the arrow, the word and the border |
| 3 Check | `#FFC72C` yellow · `#1B1B1B` · `#1B1B1B` | `#FFC72C` yellow · `#1B1B1B` · `#DADADA` | The existing caution yellow. Ink 11.0:1 |
| 4 Treat | `#C61E37` red · `#FFFFFF` · `#1B1B1B` | `#E4002B` bright red · `#FFFFFF` · `#DADADA` | Same chip as level 5; icon ✚ and word "Treat" |
| 5 Emergency | `#C61E37` red · `#FFFFFF` · `#1B1B1B` | `#E4002B` bright red · `#FFFFFF` · `#DADADA` | As in [ui-guidelines.md](ui-guidelines.md): white ink 5.77:1 light, 4.85:1 dark; `#E4002B` is 3.55:1 on the dark background |

**Border rule.** Filled chips carry a 1.5 px border in the theme's text colour. Yellow is 1.0:1 against the light background, and dark red is 1.53:1 on the olive card, so without it the chip shape fails the 3:1 UI-component minimum. A red outline-only chip for level 4 was tried and dropped for the same reason.

Tokens (`--color-todo`, `--color-check`, `--color-alert` and their `--color-on-*` inks) are defined in [ui-guidelines.md](ui-guidelines.md) §2.2.

**How they were checked** (OKLab ΔE×100, Machado 2009 colour-blind simulation at severity 1.0; WCAG 2.1 contrast; computed 2026-11-14):

| Pair | Normal | Protan | Deutan | Tritan |
|---|---|---|---|---|
| 3 yellow vs 4–5 red (light `#C61E37` / dark `#E4002B`) | 37.9 / 35.1 | 41.8 / 39.0 | 32.8 / 27.4 | 31.0 / 27.2 |
| 1 blue vs 3 yellow (light / dark) | 51.8 / 31.0 | 46.7 / 29.0 | 53.1 / 32.3 | 39.6 / 21.8 |
| 1 blue vs 4–5 red (light / dark) | 32.9 / 34.4 | 21.0 / 34.4 | 27.3 / 25.9 | 32.0 / 36.2 |

Every pair stays well above the colour-blind target of 8, more than twice the closest pair of the earlier six-colour set (yellow vs orange, 12.2 deutan). Even so, colour is never the only cue: each level has its own icon shape and word.

**Dropped 2026-11-14:** an orange level 4 (`#F28C28`) and a pale-yellow level 2 (`#FFF0C2`). Neither has a NASA counterpart, and the team found 2/3 and 3/4 too alike.

## Rules

1. **Icon + word + colour, always.** The level number is for the team and the rule table; the crew sees the word.
2. **One level per system.** A body-map row shows the highest active level among its rules. The detail screen lists each rule with its own level.
3. **Missing data is not a level.** It shows as data age ("data 8 d old"), as today. An overdue test becomes level 1, never 2–5 ([crew-health-companion.md](crew-health-companion.md), missed-data rules).
4. **Levels 4 and 5 skip the tips.** As in check-and-act: the card goes straight to the action. Tips never stand between a warning and help.
5. **Routing can differ from urgency.** The routing column is the default. A rule row may route differently: a slow vision trend is level 3 but goes to the flight surgeon, not the CMO ([ux-human-factors.md](../research/ux-human-factors.md) key takeaways).
6. **Colour only on levels 1, 3, 4 and 5.** Level 2 Watch is neutral, like NASA's silent class 0 arrow. The rest of the UI is neutral palette greys and whites: selection, links, brand mark, progress bars, chart lines and health categories have no colour ([health-categories.md](health-categories.md#how-categories-are-shown)). Any colour on screen means "your action may be needed". Selected states use the neutral pill (`#DADADA` on `#1B1B1B`).
7. **No gamification of levels.** Levels never earn or cost points. Completing a level 1 item counts as a done check-in step.

## Open questions

1. **Triage source.** NASA publishes no medical triage scale for crew; a National Academies report lists one as a need [IOM]. These levels borrow NASA's alert classes instead. Name any clinical five-level scale before citing it in the pitch.

## Sources

- [S1] [S2] [S3] [S4]: NASA-STD-3001 Vol 2, HIDH, CLDP crew-interface and alert workshops, as listed in [research/ux-human-factors.md](../research/ux-human-factors.md#sources).
- Escalation tiers: [research/countermeasures.md](../research/countermeasures.md), "Escalation ladder".
- SpO₂ thresholds and check-and-act: [crew-health-companion.md](crew-health-companion.md) (clinical convention, sourced there).
- [IOM] Institute of Medicine, *Safe Passage: Astronaut Care for Exploration Missions* (2001), ch. 4 "Emergency and Continuing Care", Health Care Opportunity 15: "Developing a resource-based medical triage system that contains guidelines for the management of individual and multiple casualties during space travel": https://nap.nationalacademies.org/read/10218/chapter/6 (verified 2026-11-14).
- Shuttle class names (Class 1 Emergency, Class 2 Caution and Warning, Class 3 Alert, Class 0 Limit Sensing; section titles only, the body was not machine-readable) in the Shuttle Caution and Warning training manual C&W 21002: https://ibiblio.org/apollo/Shuttle/TD0402B%20-%20C&W%2021002%20-%20Caution%20and%20Warning.pdf (verified 2026-11-14).
- Colour checks: Machado, Oliveira & Fernandes (2009), IEEE TVCG 15(6); WCAG 2.1 contrast (1.4.3 text, 1.4.11 non-text).
