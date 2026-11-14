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

## How categories are shown

Decided 2026-11-14: **categories have no colour.** The UI is neutral (palette greys and whites), and colour appears only on the [0–5 alert levels](alert-levels.md), so any colour on screen means "action may be needed". An earlier version gave each category a hue; it was dropped so a coloured chart line can't be read as a status.

A category is told apart by its name, its icon and its place, never by colour:

1. **Name and icon on every mark.** Each chart series has a direct label (category name + icon) at the line end; legends list categories in the table's order.
2. **One category per plot.** More than one → small multiples, one per category, same axes. If two series must share a plot (e.g. a value and its habitat context), the body value is a solid line and habitat exposure is dashed.
3. **Neutral inks.** Dark theme: series `#DADADA`, secondary series and axes `#868375`, baseline band `#CFCFCF` at low opacity, plot well `#1B1B1B` inside the olive card. Light theme: series `#1B1B1B`, secondary `#52574E`.
4. **Status goes on top, not into the line.** A value that triggers a level gets the level's marker (icon + word + level colour) at that point, and the alert band behind it; the line itself stays neutral.
5. **Lines 2 px, markers ≥ 8 px** so the neutral marks keep ≥ 3:1 against the plot well.

## Sources

All figures are taken from the team's research files, which carry the primary references:

- [README.md](../README.md), conclusion 9: IMM event probabilities (insomnia, rash, motion sickness, headache) and kidney-stone evacuations.
- [research/nasa-hrp.md](../research/nasa-hrp.md): five hazards and affected systems, SANS ~70% [S13], bone loss ~1–1.5%/month [S21], IMM sample output [S7].
- [research/long-duration-literature.md](../research/long-duration-literature.md): muscle loss [L2], jugular stasis [L4], cognition [L5], viral shedding [L7], sleep in isolation [L8], kidney [L9].
- [research/health-indicators.md](../research/health-indicators.md): indicator catalog, devices, attention thresholds, orthostatic intolerance on landing, CO₂ and noise limits.
- [ideas/features.md](features.md) and [crew-health-companion.md](crew-health-companion.md): the values the app collects (F1 check-in, F7 PVT, F8 devices, F15 questionnaires, F17 fluids).
- Neutral category display and status colours: [alert-levels.md](alert-levels.md); colour-blind and display rules: [research/ux-human-factors.md](../research/ux-human-factors.md) [S1] [S2] [S32].
