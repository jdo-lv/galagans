# Alert levels (0–5)

Added 2026-11-14. One scale for every status the crew app shows: body-map rows, routine items, detail screens and the surgeon packet. It follows the shape of five-level clinical triage scales and adds a level 0 for "all good", so nominal stays quiet. It replaces the three-state nominal / caution / warning set in [crew-health-companion.md](crew-health-companion.md) and the "Proposed tiers" table in [ux-human-factors.md](../research/ux-human-factors.md#3-designing-for-autonomy-under-communication-delay).

## The levels

| Level | Word | Meaning | Icon | Typical trigger (from our rule rows) | Default routing (escalation tier) | Interrupts? |
|---|---|---|---|---|---|---|
| **0** | Nominal | All good. Nothing happens, no input needed. | ✓ check circle | Values inside the personal baseline and the adaptation corridor | None | No. Quiet: muted text, no fill |
| **1** | To do | Something to add from the astronaut. Not a health signal. | ✎ edit note | Questionnaire due, PVT due, re-measure requested, glucose or BP to enter by hand | None (the astronaut) | No. Counter badge ("1 due") |
| **2** | Watch | A value is drifting from normal. A routine change may help. | ↗ / ↘ trend arrow | Sleep under 6 h 3 nights running; hydration below target 3 days running | 1 · Self-care tip, re-check later | No. Silent arrow beside the value (Shuttle "class 0" pattern) |
| **3** | Check | A value is out of range, or the astronaut reports a symptom or concern. An extra test may help; mention it to the doctors. | ▲ triangle | COG-02 (PVT outside the corridor); SpO₂ < 94% on the first reading; logged headache; positive PHQ-2 | 2 · CMO, or 3 · add to the next private medical conference | No tone. Status chip and a suggested item for the surgeon packet |
| **4** | Treat | Out of range and needs treatment now, on board. | ✚ medical kit | SpO₂ still < 94% after the re-measure protocol | 2 · CMO now, plus 3 · conference today | Banner on Today until acknowledged. No tone |
| **5** | Emergency | Immediate danger. Get help. | ⬣ octagon | SpO₂ < 90%, or low SpO₂ with high HR at rest; chest pain with breathlessness | 2 · CMO now + 4 · urgent ground contact; vehicle emergency protocol | Full screen, flashing, tone. Defers to the vehicle caution and warning system |

Triggers are examples from the rules already in [crew-health-companion.md](crew-health-companion.md) (check-and-act, COG-02, kidney trend). Each real trigger lives in the rule table with its source; this file sets only what a level looks like and does.

### How it maps to NASA

| Our level | NASA alert class [S4] | NASA colour rule [S1 V2 10114–10119] [S2 §10.11.5.5] |
|---|---|---|
| 0 Nominal | — (quiet/dark display) [S3] | no emphasis |
| 1 To do | Advisory: routine action | blue = advisory |
| 2 Watch | Caution, low; silent class 0 arrow [S2 §10.9.1.1] | yellow outline (caution family) |
| 3 Check | Caution | yellow = caution |
| 4 Treat | Caution, high. Team addition, see open question 1 | orange, between yellow and red |
| 5 Emergency | Warning / Emergency | red = highest level |

Red stays the highest level and is used for nothing else. Yellow and orange are the caution band. Blue means "your action, not your health".

## Colours

Light theme on background `#CFCFCF` / card `#DADADA`; dark theme on background `#1B1B1B` / olive card `#52574E`.

| Level | Light: fill · ink · border | Dark: fill · ink · border | Notes |
|---|---|---|---|
| 0 Nominal | none · `#52574E` olive · none | none · `#868375` khaki on background, `#CFCFCF` on the card · none | Olive 4.8:1 on light bg, 5.3:1 on card. Khaki is 4.5:1 on the dark background but 1.9:1 on the olive card, so on the card the word uses `#CFCFCF` (4.8:1) |
| 1 To do | none · `#1651B6` blue · `#1651B6` | none · `#7FA6F0` blue tint · `#7FA6F0` | Outline chip. Blue 4.7:1 light bg; tint 7.1:1 dark bg, 3.0:1 on the card (icon and border fine, word in `#DADADA`) |
| 2 Watch | `#FFF0C2` pale yellow · `#1B1B1B` · `#1B1B1B` | none · `#FFC72C` yellow · `#FFC72C` | Light: yellow outline would be 1.0:1 on the bg, so the light theme uses a pale tint + dark border. Dark: outline only, 11.0:1 bg, 4.8:1 card |
| 3 Check | `#FFC72C` yellow · `#1B1B1B` · `#1B1B1B` | `#FFC72C` yellow · `#1B1B1B` · `#DADADA` | The existing caution yellow. Ink 11.0:1 |
| 4 Treat | `#F28C28` orange · `#1B1B1B` · `#1B1B1B` | `#F28C28` orange · `#1B1B1B` · `#DADADA` | New. Ink 7.0:1 |
| 5 Emergency | `#C61E37` red · `#FFFFFF` · `#1B1B1B` | `#C61E37` red · `#FFFFFF` · `#DADADA` | Ink moved from `#DADADA` (4.1:1, large text only) to white (5.8:1) |

**Border rule.** Filled chips carry a 1.5 px border in the theme's text colour. Yellow and orange are 1.0–1.8:1 against the light background, and red is 1.3:1 on the dark olive card, so without it the chip shape fails the 3:1 UI-component minimum.

```css
:root {            /* light */
  --lvl0-ink: #52574E;
  --lvl1-ink: #1651B6;
  --lvl2-fill: #FFF0C2; --lvl2-ink: #1B1B1B;
  --lvl3-fill: #FFC72C; --lvl3-ink: #1B1B1B;
  --lvl4-fill: #F28C28; --lvl4-ink: #1B1B1B;
  --lvl5-fill: #C61E37; --lvl5-ink: #FFFFFF;
  --lvl-border: #1B1B1B;
}
[data-theme="dark"] {
  --lvl0-ink: #868375; --lvl0-ink-on-card: #CFCFCF;
  --lvl1-ink: #7FA6F0;
  --lvl2-fill: transparent; --lvl2-ink: #FFC72C;
  --lvl3-fill: #FFC72C; --lvl3-ink: #1B1B1B;
  --lvl4-fill: #F28C28; --lvl4-ink: #1B1B1B;
  --lvl5-fill: #C61E37; --lvl5-ink: #FFFFFF;
  --lvl-border: #DADADA;
}
```

**How they were checked** (OKLab ΔE×100, Machado 2009 colour-blind simulation at severity 1.0; WCAG 2.1 contrast; computed 2026-11-14):

| Pair | Normal | Protan | Deutan | Tritan |
|---|---|---|---|---|
| 3 yellow vs 4 orange | 14.5 | 15.4 | 12.2 | 13.7 |
| 4 orange vs 5 red | 23.5 | 26.5 | 20.7 | 17.7 |
| 2 pale yellow vs 3 yellow (light) | 14.4 | 16.5 | 14.0 | — |
| 1 blue vs 5 red (light / dark, worst) | 32.9 / 33.5 | 21.0 / 35.2 | 27.3 / 26.3 | 32.0 / 35.9 |

Every adjacent pair stays above the colour-blind target of 8. Even so, colour is never the only cue: each level has its own icon shape and word.

Two other oranges were tried and dropped: `#E8661A` sits too close to red for tritan viewers (10.9) and fails 3:1 on the dark card; `#FF8F1F` sits too close to yellow for deutan viewers (9.8).

## Rules

1. **Icon + word + colour, always.** The level number is for the team and the rule table; the crew sees the word.
2. **One level per system.** A body-map row shows the highest active level among its rules. The detail screen lists each rule with its own level.
3. **Missing data is not a level.** It shows as data age ("data 8 d old"), as today. An overdue test becomes level 1, never 2–5 ([crew-health-companion.md](crew-health-companion.md), missed-data rules).
4. **Levels 4 and 5 skip the tips.** As in check-and-act: the card goes straight to the action. Tips never stand between a warning and help.
5. **Routing can differ from urgency.** The routing column is the default. A rule row may route differently: a slow vision trend is level 3 but goes to the flight surgeon, not the CMO ([ux-human-factors.md](../research/ux-human-factors.md) key takeaways).
6. **Colour only on levels 1–5.** The rest of the UI is neutral palette greys and whites: selection, links, brand mark, progress bars, chart lines and health categories have no colour ([health-categories.md](health-categories.md#how-categories-are-shown)). Any colour on screen means "your action may be needed". Selected states use the neutral pill (`#DADADA` on `#1B1B1B`).
7. **No gamification of levels.** Levels never earn or cost points. Completing a level 1 item counts as a done check-in step.

## Open questions

1. **Level 4 in orange.** NASA's rule is red = highest, yellow = second. We read orange as the top of the caution band and keep red for level 5 only. If judges read "needs treatment" as a NASA *warning*, the alternative is level 4 = red without flashing or tone and level 5 = red + flashing + tone (the earlier "Proposed tiers").
2. **Triage source.** Name and cite the five-level triage scale this follows before using it in the pitch.

## Sources

- [S1] [S2] [S3] [S4]: NASA-STD-3001 Vol 2, HIDH, CLDP crew-interface and alert workshops, as listed in [research/ux-human-factors.md](../research/ux-human-factors.md#sources).
- Escalation tiers: [research/countermeasures.md](../research/countermeasures.md), "Escalation ladder".
- SpO₂ thresholds and check-and-act: [crew-health-companion.md](crew-health-companion.md) (clinical convention, sourced there).
- Colour checks: Machado, Oliveira & Fernandes (2009), IEEE TVCG 15(6); WCAG 2.1 contrast (1.4.3 text, 1.4.11 non-text).
