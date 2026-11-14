# Health categories: grouping what we collect by the problems long missions cause

Proposal written 2026-11-14 for the [Crew Health Companion](crew-health-companion.md). It sorts every value the app collects (check-in, devices, questionnaires, on-screen tests) into six categories, one per main problem astronauts have on long-duration missions. Use them as the body-map groups, the status rows on the home screen and the `category` field of the rule table. Numbers come from `../research/`; check them there before they go into a rule.

## Why these six

On a 6-month station flight NASA's medical risk model expects insomnia (91% chance per crew member), skin rash (82%), space motion sickness (73%) and headache (59%); about 70% of long-duration crew show a SANS sign; kidney stones are among the top reasons for an emergency return ([README](../README.md) conclusion 9, [nasa-hrp.md](../research/nasa-hrp.md)). The long-term changes the literature tracks are bone, muscle, veins and heart, cognition, immune system and kidney ([long-duration-literature.md](../research/long-duration-literature.md)). Each category below covers one of these clusters, and every collected value lands in exactly one.

## The six categories

| # | Category | Main long-mission issue | Values we collect | Typical first action |
|---|---|---|---|---|
| 1 | **Sleep & alertness** | Insomnia (most likely in-flight condition), circadian drift, fatigue, slower reaction | Sleep hours (check-in or bracelet), KSS sleepiness, PVT median and lapses, light exposure | Sleep hygiene and light timing; CMO if PVT stays outside the corridor |
| 2 | **Mood & behavioral health** | Isolation and confinement: low mood, stress, workload, under-reporting | Mood 1–5, evening workload (Bedford / NASA-TLX), behavioral questionnaire items, own notes | Private: add to the medical conference agenda; never shared without consent |
| 3 | **Heart, lungs & circulation** (includes Respiratory) | Headward fluid shift, cardiac and vascular change, orthostatic intolerance after landing (>60% failed a tilt test on landing day after long missions); low oxygen in exploration atmospheres or smoke | Cardiovascular: heart rate, HRV, blood pressure, ECG rhythm (when available), lightheadedness. Respiratory: SpO₂, respiratory rate | Re-measure, compare with in-flight baseline; pre-landing fluid loading |
| 4 | **Head, eyes & balance** | SANS (eye/brain changes, ~70%), headache, space motion sickness in flight days 1–5, balance after landing | Vision self-test (acuity, Amsler grid), headache and nausea symptoms, motion sickness score, neck or face swelling | Weekly vision check; CMO for a new distortion or swelling |
| 5 | **Bone, muscle & kidney** | Bone loss ~1–1.5%/month, calf muscle −13% and power −32% in 6 months despite exercise, kidney stones | Exercise minutes, body mass, fluid intake, urine colour, nutrition, glucose (manual entry / future CGM) | Log against the exercise and 2.5 L/day targets; CMO for flank pain |
| 6 | **Immune & skin** | Immune dysregulation, latent virus reactivation (22 of 23 ISS crew shed EBV, VZV or CMV), rashes, infection | Body temperature, rash / cold sores / lesions, fever and other infection symptoms | Report symptom (counts as a win); CMO for fever above guardrail or new lesions |

Every category uses the same statuses (nominal, caution, warning, with icon and word) and the same escalation ladder (self → CMO → private medical conference → ground).

## Exposures: context, not categories

Cabin CO₂, noise, temperature, humidity and radiation dose describe the habitat, not the body, so they are not a seventh category. They stay in the habitat column of the systems schematic and feed the categories they affect through the rule table's "related signals":

| Exposure | Feeds into |
|---|---|
| Cabin CO₂ (≤ 3 mmHg 1-h, < 2.5 mmHg 7-day) | 4 Head (headache), 1 Sleep & alertness (cognition) |
| Noise (NC-40 for sleep) | 1 Sleep & alertness |
| Temperature / humidity | 6 Immune & skin (rash, dryness), 1 Sleep & alertness |
| Radiation dose (RadLab replay) | 6 Immune & skin (blood/immune), 4 Head & eyes, 3 Circulation |

This mirrors the hazard lens: the five HRP hazards highlight categories rather than single values ([crew-health-companion.md](crew-health-companion.md) "Hazard lens").

## Mapping to the current body map

The body-map mockup ([01-body-map.png](mockups/01-body-map.png)) lists nine systems. They fold into the six categories:

| Current body-map system | Category |
|---|---|
| Sleep | 1 Sleep & alertness |
| Cognition | 1 Sleep & alertness (PVT); mood items go to 2 |
| Cardiovascular | 3 Heart, lungs & circulation |
| Respiratory (MVP SpO₂ issue) | 3 Heart, lungs & circulation |
| Eyes | 4 Head, eyes & balance |
| Bone, Muscle, Kidney | 5 Bone, muscle & kidney |
| Immune, Blood | 6 Immune & skin |

**Respiratory is part of category 3** (decided 2026-11-14). It stays a named sub-system inside "Heart, lungs & circulation", next to Cardiovascular, so the rule table can keep `system: "Respiratory"` for SpO₂ rules and the category shows the worse status of its sub-systems. The first MVP issue's "Respiratory" row is that sub-system; it rolls up into category 3 once categories are built.

## Chart colours

Added 2026-11-14. One colour per category so a category reads the same in every chart, legend, body-map row and surgeon packet. Yellow, orange and red are left out: yellow `#FFC72C` = caution and red `#C61E37` = warning ([ux-human-factors.md](../research/ux-human-factors.md#team-palette-health-palette-prototype)), and orange sits between them. Green is left out too: for red-green colour-blind viewers it collapses onto warning red (ΔE 2.3 in our test).

| # | Category | Hue | Light theme | Dark theme | Why this hue |
|---|---|---|---|---|---|
| 1 | Sleep & alertness | violet | `#5814C1` | `#7444E7` | night |
| 2 | Mood & behavioral health | orchid | `#C333BC` | `#DB4DD3` | |
| 3 | Heart, lungs & circulation | berry | `#8D0466` | `#C81392` | heart, kept clear of warning red |
| 4 | Head, eyes & balance | blue | `#046BFB` | `#4087FD` | follows the palette's "brain" blue |
| 5 | Bone, muscle & kidney | teal | `#029791` | `#18A7A1` | water / fluids |
| 6 | Immune & skin | deep cyan | `#0D6891` | `#01729F` | |
| — | Habitat exposure (CO₂, noise, temperature, humidity, dose) | neutral khaki-grey | `#726F6C` | `#868375` | context, not a body category; draw dashed |

These replace the palette's decorative accents for data (khaki = exercise, olive = sleep): khaki now means habitat, and olive `#52574E` is the dark card colour, so it can't carry a series.

```css
:root {           /* light */
  --cat-sleep: #5814C1; --cat-mood: #C333BC; --cat-heart: #8D0466;
  --cat-head: #046BFB;  --cat-bone: #029791; --cat-immune: #0D6891; --cat-habitat: #726F6C;
}
[data-theme="dark"] {
  --cat-sleep: #7444E7; --cat-mood: #DB4DD3; --cat-heart: #C81392;
  --cat-head: #4087FD;  --cat-bone: #18A7A1; --cat-immune: #01729F; --cat-habitat: #868375;
}
```

**How they were checked** (OKLab ΔE×100, protan/deuteranopia simulated with Machado 2009 at severity 1.0, the method of the dataviz checklist; recomputed 2026-11-14):

- Colour-blind separation, all 21 pairs: worst 7.0 light / 6.6 dark (bone vs habitat). That's in the 6–8 band where colour alone is not enough, so the secondary encoding below is required, not optional.
- Normal vision, all pairs: worst 11.9 light (immune vs habitat) / 11.7 dark (mood vs heart). Below 15, so no more than three categories in one plot area.
- Distance from the status colours, worst of normal/protan/deutan: ≥ 21 from caution yellow, ≥ 12.6 from warning red for the six categories (habitat grey is 8.1, so it never gets a filled warning-sized mark).
- Contrast: every dark-theme colour is ≥ 3:1 on the background `#1B1B1B`, none is on the olive card `#52574E` (1.3–2.5:1). Light theme on the card `#DADADA`: all ≥ 3.3:1 except bone teal (2.6:1).

**Rules for using them**

1. Colour = category identity only. Status stays on the status set with icon + word; a category colour never means good or bad, and a value line never turns yellow or red (draw the caution or warning band behind it instead).
2. Never colour alone ([ux-human-factors.md](../research/ux-human-factors.md) checklist item 11): every series has a direct label with the category name and its icon; legends list categories in the table's order.
3. At most three categories in one plot. More → small multiples, one per category, same axes.
4. Dark theme: charts sit in a `#1B1B1B` plot well inside the card, not on the olive card.
5. Light theme: bone teal needs its direct label or the value table, because its line is under 3:1.
6. Lines 2 px, markers ≥ 8 px; habitat series dashed so it reads as context.
7. Respiratory uses the category 3 colour. A seventh body category (e.g. splitting Respiratory out of 3) needs a re-run of these checks; it can't just take a new hue, because seven cool hues can't all stay apart for colour-blind viewers.

## Sources

All figures are taken from the team's research files, which carry the primary references:

- [README.md](../README.md), conclusion 9: IMM event probabilities (insomnia, rash, motion sickness, headache) and kidney-stone evacuations.
- [research/nasa-hrp.md](../research/nasa-hrp.md): five hazards and affected systems, SANS ~70% [S13], bone loss ~1–1.5%/month [S21], IMM sample output [S7].
- [research/long-duration-literature.md](../research/long-duration-literature.md): muscle loss [L2], jugular stasis [L4], cognition [L5], viral shedding [L7], sleep in isolation [L8], kidney [L9].
- [research/health-indicators.md](../research/health-indicators.md): indicator catalog, devices, attention thresholds, orthostatic intolerance on landing, CO₂ and noise limits.
- [ideas/features.md](features.md) and [crew-health-companion.md](crew-health-companion.md): the values the app collects (F1 check-in, F7 PVT, F8 devices, F15 questionnaires, F17 fluids).
- Chart colours: validation method and thresholds from the dataviz checklist (OKLCH band, chroma ≥ 0.10, CVD ΔE target 8 / floor 6, normal-vision floor 15, WCAG 3:1 for marks); Machado, Oliveira & Fernandes (2009), "A physiologically-based model for simulation of color vision deficiency", IEEE TVCG 15(6). Colour-blind rules and status colours: [research/ux-human-factors.md](../research/ux-human-factors.md) [S1] [S2] [S32].
