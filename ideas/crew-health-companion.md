# Idea: Crew Health Companion

Proposal written 2026-11-06 from everything in `../research/`. It is an idea under evaluation, not a build: per the event rule, code starts on Nov 14. Thresholds and screens are examples to verify, not final values.

## In five lines

- **Problem:** On long missions the crew has to spot health changes themselves, and many important changes have no symptoms. Examples: bone loss, jugular clots, herpesvirus reactivation ([long-duration-literature.md](../research/long-duration-literature.md)). Today the ground interprets the data, and NASA asks for a "flight-based paradigm" ([existing-systems.md](../research/existing-systems.md)).
- **User:** The astronaut, in a 1–2 minute daily check-in. The Crew Medical Officer (CMO) gets an escalation view. The flight surgeon receives a store-and-forward packet.
- **Inputs:** Manual entry, an in-app vigilance test (PVT) and questionnaires. Sensors are Bluetooth Low Energy (BLE) personal devices and a Wi-Fi environment node, **all simulated** by a separate Device Simulator app. No real hardware is used.
- **Outputs:**
  - status per body system against the astronaut's own baseline and the adaptation expected for that flight day (adaptation corridor)
  - a hazard lens that shows which body systems each of the five HRP hazards affects
  - an explanation (what, why, how decided, what next)
  - an action, and who to involve (self → CMO → private medical conference → ground)
  - a check-and-act card (re-measure, contributors in your own data, what to do) and a running agenda for the next medical conference
- **2-minute demo:**
  Two screens side by side: the crew app and the Device Simulator.
  1. Morning check-in. The simulated pulse oximeter sends a reading.
  2. A 3-minute PVT that comes out slow.
  3. In the simulator, the operator triggers the "CO2 build-up" scenario, which replays real cabin CO2.
  4. The body map shows "Cognition: check", "Cabin air: check" and "Sleep: watch" (3 nights under 6 h) with the explanation and an action. The hazard lens on "Hostile/closed environment" highlights all three.
  5. Switching to "Systems" lights the path cabin CO₂ + short sleep → cognition (if the schematic is built).
  6. The Cognition detail shows the PVT outside its adaptation corridor.
  7. "Add to my next medical conference" puts the item on the agenda; the approved agenda goes into the surgeon packet, sent with the visible Mars delay.

Plain-language explanation of every feature, with a glossary and the build order: [features.md](features.md).

## Mockups

Static images to illustrate the idea. All screens were remade or added on 2026-11-13 from HTML in [mockups/src](mockups/src/), rendered with headless Chrome at 1280×800 (architecture 1600×1000), and checked for consistency: one mission, crew A1, flight days 142–146 in Mars transit; landing readiness uses ISS mode. Restyled 2026-11-14 with the team palette (dark theme, see [ux-human-factors.md](../research/ux-human-factors.md#team-palette-health-palette-prototype)); shared tokens in `mockups/src/base.css`, and `mockups/src/render.sh` re-renders the PNGs. Values, rules and dates are examples, not medical guidance or final thresholds.

| Screen | What it shows |
|---|---|
| [Body map](mockups/01-body-map.png) | Anatomical figure with brain, eyes, heart, kidneys and bone hotspots; "Body | Systems" toggle; hazard lens set to "Hostile/closed environment": affected systems marked, others dimmed, with a caption of what the hazard does and which checks watch it (updated 2026-11-13). Per-system status (quiet when nominal, icon + word + color), adaptation-timeline note, today's routine with pending-questionnaire states (done, due, rule-added, upcoming, missed), "1 due" counter, one reminder banner, data-age note for missed data, latest readings with source and data age |
| [Detail: Cognition](mockups/02-detail.png) | Whole-mission PVT trend with the pre-flight baseline band and the adaptation corridor: early-flight slow readings sit inside the corridor with no flag, and today's 312 ms is outside it. Flight-day scrubber, explanation (what / why / how decided / sources), what next, escalation tier (updated 2026-11-13; early-shift size illustrative) |
| [Surgeon packet](mockups/03-surgeon-packet.png) | Store-and-forward timeline with the Mars delay, packet contents with sources, an example FHIR `Observation` |
| [Systems schematic](mockups/07-systems-schematic.png) | The "Systems" side of the toggle: habitat readings linked to body systems, the CO₂ → cognition and sleep → cognition links lit with rule COG-02, nominal links dashed, hazard lens dimming, cause path card (added 2026-11-13) |
| [Check and act + agenda](mockups/08-check-and-act.png) | Resting HR +9 bpm for 3 days: re-measure done, contributors from own data (sleep, fluids, sore throat flagged; temperature, caffeine, exercise nominal), self-care steps, tier, "Added to next medical conference". Right panel: agenda for the next conference with send-by time for the delay, included / suggested / declined items, own note, privacy note (added 2026-11-13) |
| [Reporting is a win](mockups/09-reporting-win.png) | Symptom step of the morning check-in (one tap, "No symptoms today", privacy note), then the completion screen: neutral "Thanks for reporting", what happens next (suggested for the conference agenda), routine streak where symptom days count as done and sick/rest days pause, process counters only, and a note that no health value appears (added 2026-11-13) |
| [Landing readiness](mockups/10-landing-readiness.png) | ISS environment mode, flight day 179. Countdown to entry with 9 sourced steps (repatriation briefing, 5-day pre-landing checks, fluid and salt advice, exercise, fluid loading due now, compression and cooling garments, after-landing care, post-flight mode); fluid loading card with prescribed volume and quick log; 5-day BP/HR/symptom table; "not suggested: midodrine". Nice-to-have (added 2026-11-13) |
| [Device Simulator](mockups/04-simulator.png) | Virtual devices with GATT IDs and data source, including the wrist bracelet (live HR broadcast, "Dock & export", "Resting HR +9"), scenarios including resting HR drift, value injection, MQTT traffic (updated 2026-11-13) |
| [Questionnaire](mockups/06-questionnaire.png) | Morning check-in step (KSS): one question per screen, instrument's own anchors, progress and time left, "why you're seeing this" (scheduled vs rule-triggered), skip logged as not answered, privacy note, upcoming questionnaires with their triggers |
| [Architecture](mockups/05-architecture.png) | Device Simulator (browser page, bracelet live HR and dock batch) → device link (WebSocket relay in Spring Boot) → Personal Health Gateway (adapters incl. dock import, FHIR normalizer) → local store → rules engine (baseline + corridor, `RuleSource`, `Clock`) → crew UI (body map + hazard lens + schematic, detail + check-and-act, routine, escalation + agenda) → store-and-forward → Kotlin/Spring Boot ground station; future real devices dashed (updated 2026-11-13) |

## Idea template (from the viability checklist)

```
Name: Crew Health Companion
Problem (which HRP risk / hazard): Medical conditions and adverse cognitive/behavioral changes under distance from Earth (no real-time ground) and a hostile closed environment (CO2, radiation); risks: sleep, SANS, bone/muscle, kidney stones, cardiovascular.
User and moment of use: Astronaut, daily check-in at a set time (1–2 min) plus prompted checks per mission routine. Environment mode: ISS / Orion / lunar base / Mars transit (changes the medical kit and the delay).
Inputs: Daily — HR + SpO2 (simulated BLE oximeter or manual), BP (simulated BLE cuff or manual), temperature, sleep hours, mood 1–5, symptom checklist. Every 4th day — 3-min PVT. Weekly — Amsler grid + acuity self-test, body mass. Continuous (environment) — CO2, temperature, humidity, noise, radiation dose (simulated Wi-Fi node). All sensors come from the Device Simulator app.
Outputs: Per-system status on the 0–5 alert scale ([alert-levels.md](alert-levels.md): nominal, to do, watch, check, treat, emergency; icon + word + color), explanation, recommended action, escalation tier, store-and-forward packet for the flight surgeon.
2-minute demo: check-in → PVT → body map flag + hazard lens → corridor chart, explanation + action → CO2 cause → surgeon packet with delay.
Data for the demo: Real — OSDR RadLab radiation, OSDR EDA cabin CO2/temp/RH, Inspiration4 blood panels with reference ranges. Proxy — PhysioNet sleep/HR. Synthetic (labeled) — in-flight vital-sign drift built from published shifts.
Gates G1–G5: pass (G2 and G3 with the modifications below) — see "Gates".
```

## How it works

**Core loop:** input → compare with personal baseline + clinical guardrails → status → explanation → action → escalation.

1. **Baseline.** The first entries, or pre-flight values, set each astronaut's own reference. Earth cut-offs alone misfire in flight. For example, BP is 8–10 mmHg lower and core temperature about 1 °C higher ([health-indicators.md](../research/health-indicators.md)).
2. **Rules on board, no cloud.** Each rule is a readable row: indicator, condition, status, action, tier and source (NASA-STD-3001 requirement, clinical guideline or paper). Judges can see where every flag comes from (gate G3).
3. **Body map** (suggested in the brief; default view, with a "Systems" toggle for the systems schematic). Each system shows:
   - its status
   - where the astronaut is in the adaptation timeline (e.g. "flight day 50: jugular flow stasis was seen in 6 of 11 crew")
   - its scheduled checks
4. **Mission routine.** The app prompts the checks NASA already schedules: daily check-in, PVT every 4th day, weekly vision self-test, and pre-landing fluid loading. A "post-flight" mode extends tracking into recovery, because bone and cognition don't return to baseline quickly ([long-duration-literature.md](../research/long-duration-literature.md)).
5. **Escalation and delay.** Each action names the tier. The flight-surgeon packet is store-and-forward and shows the current one-way delay for the chosen environment mode: Moon ~1.3 s light-time, 6–10 s in practice; Mars 3–22 min.
6. **NASA display rules.** Nominal is quiet. Statuses follow the 0–5 [alert levels](alert-levels.md): mirroring NASA alert classes: blue = astronaut input due, a grey arrow = drifting, yellow = caution, red = treatment or emergency only, always with an icon and a word. Each value shows its unit, data age and trend ([ux-human-factors.md](../research/ux-human-factors.md)).
7. **Privacy and gamification.**
   - Data is private by default.
   - There are role views for self, CMO and surgeon.
   - Streaks count the process (check-ins done, exercise minutes, fluids), never health values.
   - Reporting a symptom counts as a win (see "Reporting is a win" below).
8. **Adaptation corridor and hazard lens.** Two visual features answer the brief's question "how do spaceflight hazards affect these health indicators?" on screen (next section).

## Adaptation corridor, hazard lens, systems schematic and "reporting is a win"

Added 2026-11-13. Features that make the app read as a decision aid, not another dashboard (the "Differentiation" risk in Scores). Values below are sourced examples to verify, not final thresholds.

### Adaptation corridor (detail-screen chart)

**What it shows.** The trend chart on each detail screen gets two bands on a flight-day axis:
- **Personal baseline band:** the astronaut's own pre-flight or first-entries range, as today.
- **Expected-adaptation corridor:** the baseline shifted by the in-flight change published for that flight day.

A reading inside the corridor stays quiet and the explanation says "expected for flight day N". A reading outside it is flagged, and the explanation says how far it is from what's expected.

**Why.** Earth cut-offs misfire in flight, and the personal baseline alone flags normal adaptation as a change. The corridor shows that adaptation is expected, and it makes the brief's third question visible. [long-duration-literature.md](../research/long-duration-literature.md) already says a screen "can show 'expected at flight day X' against what was observed".

**Shifts available today** (sourced):

| Indicator | Expected in-flight shift | Timing | Source |
|---|---|---|---|
| Blood pressure (24-h) | About 8–10 mmHg lower | Long-duration ISS | [health-indicators.md](../research/health-indicators.md) [S26] |
| Heart rate (24-h) | About flat (63 → 64 bpm, n = 8) | FD85–192 | [health-indicators.md](../research/health-indicators.md) [S26] |
| Core temperature (resting) | About +1.0 °C | Builds over ~2.5 months, plateaus after ~FD75 | [health-indicators.md](../research/health-indicators.md) |
| Cognition (PVT) | Slowing early in flight | Early flight | [long-duration-literature.md](../research/long-duration-literature.md) [L5] |

**Rules:**
- The corridor's center comes from the published shift. Its width comes from the astronaut's own baseline variability, not from group spread, because the studies are small (n = 8–11) and individual variability is large ([long-duration-literature.md](../research/long-duration-literature.md)).
- Clinical guardrails still win. A value past a guardrail is flagged even inside the corridor.
- An indicator with no published in-flight shift shows only the baseline band and says "no published in-flight shift".
- Each corridor cites its source in the "how decided" part of the explanation, like a rule row (gate G3).
- Events with no daily measurement (e.g. jugular stasis around FD50) stay as adaptation-timeline notes on the body map, not corridors.

**Demo:** scrubbing the flight-day axis animates the corridor moving away from the Earth baseline. A synthetic, labeled reading that sits inside the corridor but outside the Earth baseline shows why personal Earth values alone would raise a false alarm.

### Hazard lens (body-map filter)

**What it shows.** A row of five toggles above the body map, one per HRP hazard: Radiation, Isolation & confinement, Distance from Earth, Gravity fields, Hostile/closed environment. Choosing a hazard highlights the body systems it affects and dims the rest. One caption per hazard says what it does, which systems it affects and which checks in the app watch it, with its source. Built in issue #14; marking the Latest readings tiles ("indicators") is a follow-up.

**Why.** The five hazards are NASA's own framing and the first link in the challenge's Resources tab ([challenge.md](../challenge.md)). The lens shows the judges their framing working in the product.

**Mapping** (from the hazard table in [nasa-hrp.md](../research/nasa-hrp.md) §1):

| Hazard | Systems highlighted | Checks in the app |
|---|---|---|
| Radiation | Blood/immune, eyes, cardiovascular, cognition | Dose budget (RadLab replay), symptom checklist |
| Isolation & confinement | Sleep, mood, cognition | Sleep diary, KSS, mood, PVT |
| Distance from Earth | All (indirect) | Escalation tier and the visible comms delay in the surgeon packet |
| Gravity fields | Bone, muscle, eyes (fluid shift), kidney, cardiovascular, balance | BP, fluids, vision self-test, body mass, exercise minutes |
| Hostile/closed environment | Cognition, headache, immune, sleep | Cabin CO2, temperature, humidity, noise |

**App rows** (issue #14, the table above renamed to the Body systems rows):

| Hazard | Rows marked |
|---|---|
| Radiation | Radiation, Immune, Vision (SANS), Cardiovascular, Cognition (Immune and Vision (SANS) map the [V1 4031] blood-forming-organ and lens limits, [nasa-hrp.md](../research/nasa-hrp.md) §3) |
| Isolation & confinement | Sleep, Cognition (mood stays in the caption) |
| Distance from Earth | All rows |
| Gravity fields | Bone & muscle, Vision (SANS), Kidney & hydration, Cardiovascular (balance stays in the caption) |
| Hostile/closed environment | Cognition, Cabin air, Sleep, Immune (headache has no row) |

**Build:** a static table (`domain/hazards.ts`) and a lens class on the Body systems rows and the body figure. No new data.

### Systems schematic ("Body | Systems" toggle)

Added 2026-11-13. **What it shows.** A toggle at the top of the home screen switches the center view between the body map and a systems schematic. The schematic draws the habitat and the crew member as one connected system, in the style of the flow diagrams crews already read for life support and power:
- **Left column, habitat:** the environment node's readings (cabin CO₂, temperature, humidity, noise) and the dosimeter.
- **Right column, crew member:** body systems and symptoms (cognition, sleep, headache, immune, blood and eyes).
- **Links:** one per known relationship, taken from the rule table's "related signals". A link behind an active flag is drawn solid with its status icon and the rule ID, e.g. "▲ rule COG-02 · related". Nominal links are dashed and grey. Never color alone.
- **Cause path card:** under the diagram, one sentence states the path ("Cabin CO₂ above the 1-h limit + 3 short nights → Cognition check"), with how it was decided and what to do next.
- **Hazard lens:** applies to this view too; boxes and links outside the selected hazard are dimmed.

**Why.** The body map shows *where* a problem is. The schematic shows *why*, which is the brief's "how do spaceflight hazards affect these health indicators?" and the "how decided" part of every explanation. It also makes the CO₂ demo scenario readable at a glance, and it looks like flight software rather than a fitness app.

**Rules:**
- The app links readings that a rule names as related; it doesn't infer causes. The card says so ("The app links readings; it doesn't diagnose"), which fits the decision-support wording.
- Same data and statuses as the body map. Tapping a box opens its detail screen; tapping a link opens the rule row behind it.
- The body map stays the default view because the brief suggests a clickable human figure.

**Build:** an SVG with two fixed columns and links generated from the rule table. No new data. Nice-to-have, first in line after the must-haves.

### "Reporting is a win" (gamification rule)

See the [reporting-is-a-win mockup](mockups/09-reporting-win.png).

**What it does.** Logging a symptom counts as a completed check-in. It never breaks a streak and gets a short neutral acknowledgement ("Logged. Thanks for reporting."). Health values never earn or cost anything. A symptom that triggers an escalation also counts as a completed step.

**Why.** Under-reporting is documented: astronauts fear that disclosed symptoms cost them missions, and gamification can make this worse ([ux-human-factors.md](../research/ux-human-factors.md)). Most health gamification rewards good numbers. This rule rewards honesty instead, which also makes a clear pitch line.

**Rules:**
- No message ever praises a value ("great BP!").
- Sick days and rest days pause streaks; they never reset them.
- What the CMO and surgeon can see doesn't change: completion only, as in "Questionnaires and how they're triggered".

## Check-and-act card and the medical conference agenda

Added 2026-11-13. The aim is **not** to make astronauts "keep HR and SpO₂ in range". Those are signals, not targets, and some out-of-range values are emergencies that self-help tips would delay. The card helps the astronaut check the reading, see what in their own data may explain it, act on what they can change, and plan the conversation with the doctor.

### Check-and-act card (on the detail screen)

Shown only on the detail screen of a reading that is already flagged. It adds no alerts. See the [check-and-act mockup](mockups/08-check-and-act.png). Three steps:

1. **Is the reading right?** A short re-measure protocol per device, then a second reading. Example for the pulse oximeter: warm your hands, sit still for 1 minute, put the finger fully in, keep the hand at heart level. If the second reading is back in range, the card says so and the flag clears with "re-measured".
2. **Is there a contributor in your own data?** The rule's "related signals" (the same links the systems schematic draws) are listed with the values that triggered them, e.g. "Same 3 days: sleep under 6 h, fluids 1.6 L/day, sore throat logged". The app lists what the rule names; it doesn't guess other causes.
3. **What now?** One self-care step per contributor, from the action column of the rule table, then the escalation tier and a button **"Add to my next medical conference"**.

**Four cases for the hackathon:**

| Case | Step 1: check | Step 2: contributors the app looks at | Step 3: act |
|---|---|---|---|
| Resting HR above baseline for several days (heuristic, e.g. +8 bpm or more for 3 days; not a NASA rule, and the rule row says so) | Re-measure at rest, seated, 5 min after waking | Sleep, fluids (plasma volume falls ~15% in flight), caffeine or stimulant use, temperature or symptoms (illness), exercise load | Fluids to target, caffeine before 14:00, protect the sleep window; if a fever or symptoms are present → CMO today; otherwise add to the agenda |
| SpO₂ low (< 94% investigate, < 90% urgent; clinical convention) | Re-measure with the oximeter protocol above | Cabin readings: CO₂, and O₂/pressure where the environment node has them; HR at rest; breathing symptoms | **No self-care tips.** Still < 94% after re-measuring → CMO now. < 90%, or low SpO₂ with high HR at rest → warning: CMO now and notify ground (the "act now" pattern in [ux-human-factors.md](../research/ux-human-factors.md)) |
| PVT slower than the corridor (demo case) | Repeat the PVT tomorrow morning | Cabin CO₂ (1-h average), sleep, workload (Bedford) | Check CO₂ in the module, light and caffeine hygiene tonight; tell the CMO today; add to the agenda if still slow |
| Sleep loss (short sleep or high KSS for several days; trigger values come from the rule row) | Repeat the KSS tomorrow morning and check the sleep diary | Cabin CO₂ (sleep-station airflow), caffeine timing, exercise or large meals within 2 h of sleep, evening light exposure | Cool, dark, quiet sleep station with no screens; no caffeine 6–12 h before sleep; bright light 1–2 h after waking, dim light 1–2 h before bed. Not resolved → Fatigue Management Consultation Service or CMO, and add to the agenda. Medication (melatonin, hypnotics) is the CMO's call, never suggested by the app |

Sources and thresholds: HR and SpO₂ in [health-indicators.md](../research/health-indicators.md) §1 and §4; CO₂ limits in [health-indicators.md](../research/health-indicators.md) and the rule table; sleep hygiene and light timing in [countermeasures.md](../research/countermeasures.md) ("Sleep loss", "Circadian misalignment"; sources C6, C7).

**Guardrails:**
- **A warning skips steps 2 and 3.** Red goes straight to the action ("CMO now"). Tips never stand between a warning and help.
- **Every hint has a source,** like every rule row. A hint with no source isn't shipped. Writing the hint content is the real cost, not the code.
- **Decision-support wording:** "may contribute", "consider raising". Never a diagnosis.
- **No targets or scores** on HR or SpO₂; this is guidance, not gamification.

### Medical conference agenda

ISS crews have scheduled private medical conferences with the flight surgeon (weekly, per [countermeasures.md](../research/countermeasures.md)). The app keeps a running **agenda for the next one**:

- **What goes in, suggested by the app:** cautions that lasted several days; symptoms the astronaut logged; check-and-act items marked "Add to my next medical conference"; questionnaire results that suggest raising something (e.g. a positive PHQ-2).
- **What goes in, added by the astronaut:** free-text items ("knee pain after exercise").
- **The astronaut decides:** each suggested item has "Include" / "Not now". Nothing reaches the doctor without approval, except the existing exceptions (PHQ-9 item 9 and other warnings, which follow their own path).
- **Where it goes:** approved items join the store-and-forward surgeon packet, with the readings and sources behind each. The agenda shows the date of the next conference, and the one-way delay is visible, so the doctor can read it before the call.
- **Why it matters:** it tackles documented under-reporting (astronauts fear that disclosed symptoms cost them flights; [ux-human-factors.md](../research/ux-human-factors.md)), because the item is already written down when the call starts. It also adds a missing middle option between "self-care" and "CMO now": *not urgent, but the doctor should hear about it*.
- **Build:** a filtered list over existing flags and logs, an approve/decline state per item, and one more section in the surgeon packet. No new data.

## Questionnaires and how they're triggered

Instruments, timing and scoring come from [health-indicators.md](../research/health-indicators.md) ("Questionnaires and simple tests an app can administer"). NASA practice today:
- ISS: sleep and team questionnaires after waking and before sleep, a monthly team questionnaire, a private psychological conference every two weeks.
- HERA and NEK analogs: weekly mood questionnaires.

([existing-systems.md](../research/existing-systems.md), [nasa-hrp.md](../research/nasa-hrp.md)). See the [questionnaire mockup](mockups/06-questionnaire.png).

### Schedule (fits the 1–2 minute daily budget)

| When | Instruments | Time |
|---|---|---|
| Daily, morning check-in | Sleep diary (ISS Reaction Self Test items), Karolinska Sleepiness Scale (KSS), mood 1–5, symptom checklist | ~1.5 min |
| Daily, evening | Bedford Workload Scale for the hardest task of the day (NASA limit ≤ 3 nominal, ≤ 6 off-nominal [V2 5007]) | ~30 s |
| Every 4th day | PVT, 3 min (as the ISS Reaction Self Test) | 3 min |
| Weekly | PHQ-2 (PHQ-9 only if positive), GAD-7, visual acuity + Amsler grid, body mass | ~5 min |
| Flight days 1–5 and after a gravity change | Space motion sickness grading (0–3) | 30 s |

### Three kinds of trigger

1. **Scheduled (the mission routine).**
   - Each questionnaire has a time window, e.g. morning check-in 07:00–09:00, not a fixed minute, because the ISS day is planned in 5-minute blocks and crew time is scarce ([ux-human-factors.md](../research/ux-human-factors.md)).
   - Windows follow the mission clock and the crew member's sleep shift.
   - Questionnaires due in the same window are bundled into one session.
2. **Rule-triggered (event-driven).** The rules engine can add a step or a short questionnaire when data suggests it, and always says why ("Added by a rule: cabin CO₂ above 2.5 mmHg"). Examples:
   - Cabin CO₂ 1-h average > 2.5 mmHg → symptom checklist (headache) in the next session.
   - PVT slower than baseline → KSS and sleep re-check.
   - PHQ-2 positive → PHQ-9 offered at the next weekly session.
   - Gravity change (docking, landing, flight days 1–5) → motion sickness grading.
   - Rules fire from any source, including the Device Simulator's scenarios, so the demo shows a rule-triggered step live.
   - **Playbook note (concept, added 2026-11-13).** When a rule adds something that takes crew time (a PVT, a vision self-test, extra fluids, a CMO check), the app also writes a schedule note in Playbook's terms:
     - **Fields:** activity, duration, time window, constraint (e.g. "before next sleep period"), the rule that fired, and the "why" text from the explanation.
     - **Why:** NASA's self-scheduling tool Playbook runs offline and lets crews move activities themselves. Its documented lesson is that crews couldn't resolve scheduling conflicts when they didn't know *why* a constraint existed ([existing-systems.md](../research/existing-systems.md) [S47, S48], [ux-human-factors.md](../research/ux-human-factors.md)). The note carries that reason from our rule into the schedule.
     - **Honesty:** Playbook has no public interface that we know of, so we don't claim integration. The note appears as a "Suggested for Playbook" card on the rule-added routine item and in the surgeon packet, as a JSON object labeled "format proposal". In the pitch it's a future integration.
     - **Scope:** nice-to-have. It reuses the rule row and explanation that already exist, so it's one card and one JSON shape.
3. **On demand.** The astronaut can open any questionnaire or the symptom checklist at any time, e.g. when feeling unwell.

### Rendering rules

- **One question per screen,** large touch targets (NASA guidance: ≥ 9.5 mm targets with 3.2 mm gaps) and large text, because fine motor accuracy drops early in flight and many crew see less sharply ([ux-human-factors.md](../research/ux-human-factors.md)).
- **Progress and time left** are always visible; a session never surprises the crew with its length.
- **The wording and anchors** are the instrument's own (e.g. KSS 1 "extremely alert" … 9 "extremely sleepy, fighting sleep", from [S56] in health-indicators.md). They're never paraphrased, so scores stay comparable.
- **"Why you're seeing this"** shows the trigger: scheduled or added by a rule.
- **Skip is always allowed** and recorded as "not answered", never as a value. Missed sessions don't nag: at most one reminder, then the data age shows on the body map.
- **Device values are prefilled:** heart rate and SpO₂ are prefilled from the newest device reading (≤ 15 min), which the astronaut confirms or corrects; a confirmed value is saved as "manual" (#55).
- **The privacy note is per questionnaire:** mood, PHQ and GAD answers are visible to the astronaut and the flight surgeon only, never to crewmates.

### Where pending questionnaires are shown

See the [home screen mockup](mockups/01-body-map.png).

1. **"Today's routine" on the home screen is the single list.** Every pending questionnaire appears there, scheduled or rule-triggered, sorted by window.
2. **A counter in the top bar** (e.g. "● 1 due") is visible from any screen and is the only always-on signal. Following NASA's quiet-when-nominal rule, it's absent when nothing is due.
3. **Missed data shows on the body map as data age,** e.g. "Vision · self-test missed · data 8 d old". The system keeps its health status and gets no alert color. Missing data isn't a health problem, so it must not look like one.

| State | How it looks | Meaning |
|---|---|---|
| Upcoming | grey row with its window ("20:00–22:00") | not yet open |
| Due now | highlighted row + "Start" button + estimated time ("~40 s") | window open |
| Added by a rule | as "due now", plus a dashed grey "rule" tag with a one-line reason | e.g. "PVT slower than baseline" |
| Done | tick + time | completed |
| Missed | dimmed "not answered" | window closed; the data-age note appears on the body map |

**How the crew is told**
- **One reminder when a window opens:** a banner with "Start" and "Snooze", and nothing more. NASA notes that too many alerts become a nuisance and crews stop responding ([ux-human-factors.md](../research/ux-human-factors.md)).
- **Bundling:** everything due in the same window starts with one "Start" as one session.
- **Rule-triggered items join the next session** instead of interrupting, unless the rule is urgent. Even then the banner names the reason.
- **"Due" is alert level 1, never 2–5.** A due item gets the level 1 blue outline, icon and the word "to do" ([alert-levels.md](alert-levels.md)). Yellow and red stay for health status. The dashed grey "rule" tag marks why an item was added, not urgency.

**Who sees what is pending**
- The astronaut sees their own list.
- The CMO and flight surgeon views show completion only (done or missed), never the answers. The exceptions are answers the astronaut shared and questionnaires that are surgeon-visible by design (mood, PHQ, GAD).

### What happens with the answers

- **Answers feed the rules engine** like any sensor reading. Scores are compared with the personal baseline where a baseline makes sense (KSS, sleep, Bedford) and with published cut-offs where they exist (Bedford NASA limits; PHQ/GAD ≥ 10).
- **Results are worded as decision support:** a positive PHQ or GAD score says "consider raising this at your next private conference". It never gives a diagnosis.
- **PHQ-9 item 9 (self-harm):** any answer above 0 opens an immediate private path to the flight surgeon. If that path isn't designed and tested, the app uses PHQ-2 only.
- **Answers travel through the Personal Health Gateway** like sensor data. FHIR has dedicated resources (`Questionnaire` for the definition, `QuestionnaireResponse` for the answers), so they go into the surgeon packet in the same standard format.

### Implementation note

Each questionnaire is a **definition file**, not custom code. One generic renderer reads it. Adding an instrument means adding a file. Each file holds:
- items, response scale and anchors
- scoring
- schedule window
- rule triggers
- privacy level
- source

The definitions can be drafted from the research table before Nov 14, as documentation, not code.

Open check: some instruments (POMS, Epworth) may need a licence for use in software. Verify before including them; the schedule above avoids them.

## Fluid intake and hydration

**Why it matters**
- NASA provides a minimum of 2.5 L/day of water, against kidney stones and urinary problems ([countermeasures.md](../research/countermeasures.md)).
- Crews actually drink 2.0–2.3 L/day in flight ([health-indicators.md](../research/health-indicators.md) §21), so a typical astronaut sits below target.
- Kidney stones are the 2nd most likely cause of ISS emergency evacuation ([countermeasures.md](../research/countermeasures.md)), and the kidney may change directly in flight, not only through bone loss ([long-duration-literature.md](../research/long-duration-literature.md)).

### How intake is registered

All three inputs go through the Personal Health Gateway like any other reading, each with its source label.

1. **One-tap quick log (main input).** Preset buttons for the drink containers the crew uses, plus a custom volume. About 2 seconds per drink, within the crew-time budget. Manual logging has precedent in EveryWear's food diary.
2. **Barcode scan (optional).** EveryWear already logs station food by barcode ([other-agencies.md](../research/other-agencies.md)). Scanning a drink pouch logs its volume and feeds nutrition too; sodium matters because in-flight intake is high (3.8–4.7 g/day). *Open check: whether drink pouches are in that barcode database.*
3. **Simulated smart dispenser (future capability).** A virtual device in the Device Simulator publishes the volume dispensed per crew member over the device link. No evidence that such a device flies, so it's labeled "future capability" in the UI and the pitch.

### Cross-checks

Intake alone doesn't show how the body handles it.

- **Urine color chart** as a daily self-check in the morning check-in, and an **SG dipstick** weekly or when a rule triggers it. The research lists both as self-readable.
- **Hydration flags:** urine output below 2 L/day or SG persistently above 1.025. These are derived from a study, not a NASA rule ([health-indicators.md](../research/health-indicators.md) §8), so the rule row says so.
- **Flank pain or blood in urine** means immediate contact with the flight surgeon (possible stone), via the symptom checklist.

### How it shows and nudges

- **Routine row:** progress toward 2.5 L ("1.1 L so far") with a quick-add button.
- **Body map, "Kidney & hydration":** uses the trend, e.g. below target 3 days running → caution, never a single bad day.
- **One nudge at most,** e.g. under 50% of the target by mid-afternoon, following the no-nagging rule.
- **Gamification counts the process:** a streak of days at target, never a comparison between crew members.

### Pre-landing fluid loading

A documented countermeasure against fainting at landing, with its own checklist ([countermeasures.md](../research/countermeasures.md), [other-agencies.md](../research/other-agencies.md)):
- 24–48 oz of salt water before deorbit, with 1.5 L of water reserved per crew member.
- Daily fluid and salt advice from 2 days before landing.

The app prompts each step and tracks completion. The status goes into the surgeon packet. See the [landing readiness mockup](mockups/10-landing-readiness.png), which extends the checklist into a countdown with the other sourced steps: daily pre-landing checks for 5 days, compression and cooling garments before entry, after-landing care, and post-flight mode. Open check: read OCHMO-TB-019 for the volume per body weight and OCHMO-TB-051 (entry, descent and landing) before finalising the steps.

### For the demo

The quick log plus one simulated dispenser reading, with the urine color check as a rule-triggered questionnaire step.

## External sensors: Bluetooth and Wi-Fi (all simulated)

Every input has a **manual entry** fallback. NASA accepts manual entry for the BP cuff and pulse oximeter, and Orion's kit relies on it ([existing-systems.md](../research/existing-systems.md)). Sensors are an extra, never a requirement.

**All sensors are simulated.** The team uses no real hardware. A separate **Device Simulator** app (below) plays every device. The sections below describe the real devices the simulator imitates, so the design stays true to what could fly.

### Bluetooth Low Energy: personal devices

The real devices would use the standard Bluetooth SIG GATT health services. Any certified device that implements them works without vendor SDKs. The simulator produces each device's measurement characteristic in that standard byte format [P6]:

| Indicator | GATT service | Measurement characteristic | Real device imitated |
|---|---|---|---|
| Heart rate (and RR intervals for HRV) | Heart Rate `0x180D` | Heart Rate Measurement `0x2A37` | Chest strap, wrist bracelet in broadcast mode (see "Wrist bracelet") |
| SpO2 + pulse | Pulse Oximeter `0x1822` | PLX Spot-Check `0x2A5E` / Continuous `0x2A5F` | Finger oximeter |
| Blood pressure | Blood Pressure `0x1810` | Blood Pressure Measurement `0x2A35` | Arm cuff |
| Temperature | Health Thermometer `0x1809` | Temperature Measurement `0x2A1C` | Thermometer |
| Blood glucose | Glucose `0x1808` | Glucose Measurement `0x2A18` | Glucometer (manual or "future CGM module" per the checklist) |

- **Why BLE:** low power, pairs one device to one person (fits private-by-default), and has standard profiles for exactly the indicators in the brief.

### Wrist bracelet (wearable)

Added 2026-11-13. Astronauts already wear wrist devices: the Condor actigraph on Artemis II (ARCHeR: activity, sleep, light, temperature), and Apple Watch, Garmin and Oura rings on commercial flights. Each of those used its maker's own app or offloaded data in batches; none streamed into a third-party app ([existing-systems.md](../research/existing-systems.md) §4). The app takes bracelet data two ways, with manual entry as the fallback:

| Path | What comes in | How | Status in the design |
|---|---|---|---|
| **Live** | Heart rate and RR intervals | Standard Bluetooth Heart Rate service (`0x180D` / `0x2A37`), which many watches offer as a "broadcast heart rate" mode. Same decoder as the chest strap. | Must-have: the simulator's bracelet is the demo's HR source |
| **Dock and import** | Sleep hours, activity, resting HR, HRV, wrist SpO₂ | After the bracelet is synced or docked, an export file is imported in a batch, the way Bio-Monitor and ARCHeR offload data. | Nice-to-have. Per-brand export formats unverified; the app defines one JSON import shape |
| **Manual** | Anything | Typed in the check-in | Always available |

- **No maker cloud.** Vendor clouds need internet, which breaks offline-first. A web app also can't read on-device health stores. So only standard Bluetooth broadcast and file import are used.
- **Wrist SpO₂ is a hint only.** Wrist and phone SpO₂ isn't medical-grade ([health-indicators.md](../research/health-indicators.md) §4). A low wrist value never fires an SpO₂ rule; it suggests a fingertip oximeter spot check, and the check-and-act card uses the fingertip reading.
- **Sleep from the bracelet** fills the sleep-hours field of the check-in as a prefilled value the astronaut confirms or corrects.
- **Source labels:** live values are labeled "bracelet · BLE", imported ones "bracelet · dock FD 141", so data age is clear.

### Wi-Fi: environment node

- **Real device imitated:** a microcontroller with Wi-Fi (e.g. ESP32) plus a CO2/temperature/humidity sensor and optionally noise and light sensors.
- **Transport:** readings every minute over MQTT to the app. No internet is needed; the spacecraft LAN is the network.
- **Why Wi-Fi rather than BLE here:** the node is shared by the module (not personal), mains-powered, and has to reach several crew tablets at once.
- **What it measures against:** NASA limits are CO2 ≤ 3 mmHg as a 1-hour average and < 2.5 mmHg as a 7-day average for headache risk, NC-40 noise for sleep, and melanopic light targets ([health-indicators.md](../research/health-indicators.md)).
- **CO2 unit caveat:** convert ppm to mmHg using cabin pressure.
- **Radiation:** no consumer device measures it. The simulator plays a dosimeter that replays real OSDR RadLab data, labeled "replay".

### Device Simulator: a second app

A separate app pretends to be every sensor. It runs on its own laptop or browser tab, and the crew app can't tell it from real devices except by the `Device` label.

```
┌──────────── Device Simulator ────────────┐          ┌──────── Crew Health Companion ────────┐
│ Virtual devices: bracelet, oximeter,     │          │                                       │
│ BP cuff, thermometer, glucometer,        │  device  │  PHG adapters ──▶ FHIR ──▶ rules ──▶  │
│ environment node, dosimeter              │ ───────▶ │  body map / alerts / surgeon packet   │
│ Scenarios + live controls                │  link    │                                       │
└──────────────────────────────────────────┘(WebSocket)└───────────────────────────────────────┘
```

- **What it simulates:** one virtual device per row in the BLE table (the wrist bracelet plays the heart-rate row), plus the environment node, the dosimeter and a smart water dispenser (labeled future capability; see "Fluid intake and hydration"). Each can be switched on or off, set to drop out, or given a low battery, so that stale-data handling is visible.
- **Where the data comes from:**
  - *Replay of real data:* RadLab radiation and EDA cabin CO2, temperature and humidity ([data-sources.md](../research/data-sources.md)).
  - *Proxy data:* PhysioNet heart rate and sleep.
  - *Labeled synthetic drift* built from published in-flight shifts, e.g. BP 8–10 mmHg lower and core temperature about +1 °C over ~2.5 months ([health-indicators.md](../research/health-indicators.md)).
- **Scenarios** (a timeline of events, run at accelerated mission time):
  - *Nominal day:* everything in range, so the crew app stays quiet.
  - *Resting HR drift:* the bracelet's resting HR rises ~9 bpm above baseline over 3 days, with short sleep and low fluids, for the check-and-act demo.
  - *CO2 build-up:* replay of a high-CO2 window, then headache symptoms and a slower PVT.
  - *Cabin atmosphere fault* (built, issue #53): cabin CO₂ rises to 3.2–3.8 mmHg, then after 20 s SpO₂ drops to 91–93 % and heart rate rises to 105–115 bpm, until the operator unchecks it. Synthetic: the co-occurrence, the heart-rate rise and the delay are a team heuristic, not a physiological model.
  - *Orthostatic risk before landing:* BP and HR trend for pre-landing fluid loading.
  - *Solar particle event:* dosimeter rises toward the 30-day limit.
  - *Sensor dropout:* the oximeter goes silent and the data-age warning appears.
- **Live controls:** sliders and buttons to inject a value or start a scenario during the demo. A teammate "operates the spacecraft" while another presents the crew app.
- **Transport: the device link**, a WebSocket relay at `/ws/devices` in the Spring Boot app (issue #25). Both pages connect to the host that served them, so a tablet at `http://<machine IP>:8080` reaches it with no broker or Docker [P8]. That page is not a secure context, so ids fall back from `crypto.randomUUID` to `crypto.getRandomValues` and the tablet has no offline cache there [P7]. Each frame is `{"topic", "payload"}`; the relay passes it unchanged to every other open session and stores nothing. Each virtual device publishes on its own topic, e.g. `crew/a1/wrist/ble/0x2A37` (bracelet live HR), `crew/a1/wrist/dock` (bracelet export batch, JSON) or `module/hab/env`.
  - *Oximeter, until the GATT adapter exists:* JSON on `crew/a1/oximeter`, `{"id": UUID, "t": ISO 8601 time, "spo2_pct": number, "pulse_bpm"?: number, "src": "synthetic"|"replay"|"proxy"}`. The crew app shows the source as `oximeter · <src>`. The topic stays separate from `crew/a1/ble/0x2A5E`, which is kept for the GATT bytes.
  - *BLE devices:* the payload is the characteristic's **standard GATT bytes** (base64). The crew app's BLE adapter therefore decodes the real format. Swapping in a real device later only replaces the transport (Web Bluetooth instead of the device link), not the decoder.
  - *Wi-Fi node:* JSON, as a real ESP32 node would send.
  - *Simulator controls:* a separate topic, so scenario commands never mix with sensor data.
- **Honesty:** every simulated reading carries its source (replay / proxy / synthetic) into the FHIR `Device`, and the crew app shows it. The pitch says plainly that the devices are simulated (gate G4).

#### What the device link does, and what it doesn't simulate

The device link **simulates no device**. The Device Simulator simulates the devices; the link replaces only the **radio or network** the data travels over between the simulator and the crew app.

| Device | In reality | In the demo | What the device link does |
|---|---|---|---|
| BLE sensors (oximeter, BP cuff, …) | Bluetooth radio: pair, then subscribe to the GATT characteristic (*notify*) | One frame per measurement on `crew/a1/ble/0x2A5E` (the oximeter uses JSON on `crew/a1/oximeter` until the GATT adapter exists) | **Replaces the Bluetooth radio.** The payload (the GATT bytes) is identical to a real device's |
| Wi-Fi environment node | An ESP32 publishing over MQTT on the local network | The simulator publishes on `module/hab/env` | **Replaces the spacecraft LAN.** The JSON payload is what a real node would send; the real node's MQTT is not reproduced |
| Dosimeter | The dosimeter sends its reading | RadLab replay published over the device link | Transport, as for the Wi-Fi node |

- **Why a relay:** senders publish to a *topic* through an intermediary, receivers filter by topic, and neither knows the other.
  - Several crew tablets can receive the same environment reading.
  - The simulator and the crew app are built separately. The topics and payload formats are the only contract between them.
- **Why not real Bluetooth in the demo:**
  - A browser can't act as a Bluetooth device, so faking the radio would need a native app or hardware.
  - Web Bluetooth doesn't work in Safari on iPad.
  - WebSocket works in every browser.
- **What this means for the gateway:** the BLE adapter has two parts.
  - The *transport*: the device link today, Web Bluetooth with a real device.
  - The *GATT decoder*: the same in both cases. Only the transport changes, which is the decoupling the PHG is for.

### Personal Health Gateway: one interface for all sources

The app embeds a **Personal Health Gateway (PHG)**. That is the established name, from the Continua Design Guidelines (adopted as ITU-T H.810), for a hub that collects data from personal health devices, translates each device's protocol into a standard data model and passes it on [P1][P2]. Here the gateway runs inside the PWA, on the crew tablet or laptop, so no extra hardware is needed. It **decouples** the application from the hardware: adding or replacing a sensor means writing a new adapter, not changing the app.

```
 Simulated BLE devices ──┐  (device link)
 Bracelet dock file ─────┤
 Simulated Wi-Fi node ───┤                                  ┌──▶ Rules engine ──▶ Body map / alerts
 Simulated dosimeter ────┼──▶ Adapters ──▶ PHG ──▶ FHIR ────┤
 Manual entry ───────────┘    (one per     (normalize,      ├──▶ Local store (IndexedDB)
                               source)      timestamp,      └──▶ Store-and-forward packet to flight surgeon
                                            provenance)
```

- **Adapters (device side):** one per source type.
  - *BLE device:* decodes the standard GATT characteristic bytes (table above). The transport is the device link from the simulator; Web Bluetooth would be the transport for a real device.
  - *Wi-Fi node:* JSON over the device link.
  - *Dosimeter:* the device link, fed by RadLab replay.
  - *Dock import:* reads a bracelet export batch in the app's JSON import shape, from the simulator's `crew/a1/wrist/dock` topic or a file picker. Both feed the same adapter.
  - *Manual entry.*

  The production-grade path for BLE is the Bluetooth SIG **Generic Health Sensor (GHS)** profile, which carries the IEEE 11073-10206 (ACOM) data model over GATT [P4]. For the hackathon the simple per-indicator services are enough.
- **Canonical data model (app side):** every reading becomes an **HL7 FHIR `Observation`**, shaped like the HL7 FHIR Personal Health Device Implementation Guide [P3]. Following that guide, each `Observation` references:
  - the astronaut (`Patient`)
  - the measuring `Device`
  - the gateway itself (a second `Device`), with a timestamp the gateway has validated

  The same shape serves manual, replay and synthetic sources. The `Device` says "manual entry", "RadLab replay" or "synthetic", so data honesty (gate G4) is built into each record.
- **Why it matters for the crew:**
  - *Provenance and data age* travel with every value, which the NASA display rules require: show source and data age ([ux-human-factors.md](../research/ux-human-factors.md)).
  - *The surgeon packet* is a bundle of standard FHIR resources, readable by any ground medical system rather than a custom format.
  - *The rules engine* sees one format only.
- **What the PHG standards leave out, and we add:** the PHD guide explicitly does not cover privacy, consent or interpreting the data [P3]. Those are the parts this proposal designs: private by default, role-based views, on-board rules with explanations.
- **Scope for 48 h:** take the pattern and the `Observation` shape. Full IEEE 11073/GHS stacks and Continua certification are out of scope; say "Continua/H.810-style PHG with FHIR output" in the pitch, not "certified".

### Interoperability: FHIR adapter (note for the pitch)

Added 2026-11-13. **Status: not implemented.** The code syncs check-ins with its own JSON format (`CheckInRequest` → `POST /api/checkins/sync`). It has no FHIR types, mapping, endpoint or library, so another system can connect only by learning that format.

**What to say in the presentation:** the app is built so a FHIR adapter plugs in at the edges without touching the crew loop. Any hospital or space-medicine system that speaks HL7 FHIR R4 could then read the data:
1. **Crew app:** a `FhirMapper` in `infrastructure/` turns domain readings into FHIR R4 `Observation`s with standard codes, plus `Device` resources carrying the source label. The surgeon packet becomes a FHIR `Bundle`.
2. **Ground station:** a `fhir` domain folder that accepts the packet as a FHIR `Bundle` and exposes a small read API returning standard FHIR JSON, e.g. a crew member's Observations.
3. **Validation:** HAPI FHIR's model, parser and validator inside our own WebFlux controllers (its ready-made REST server is servlet-based). How well it fits WebFlux is unchecked.

**Design fit:** it's a new adapter, not a rewrite. The internal model and the existing sync stay as they are (SOLID open/closed; see "Engineering principles: SOLID").

**Wording:** without validation, say "FHIR R4-shaped", not "HL7 FHIR compliant". HL7 v2 (legacy hospital messaging) is out of scope.

**If time allows after the demo works:** a "Download FHIR Bundle" button on the surgeon packet as visible proof. The effort is mostly choosing correct codes and checking one sample against a validator, not code.

### Flight caveat

On a real spacecraft, every radio device needs approval for electromagnetic compatibility and frequency use. Say so in the pitch and present BLE/Wi-Fi as "if approved for the vehicle", with manual entry as the baseline. (Open lead: find the ISS/Artemis requirement document to cite.)

## Language and platform

Updated 2026-11-13 to match the app skeleton in `src/` (see `CLAUDE.md` for build and run commands). One Maven project builds both parts and serves the app and `/api` from one URL.

| Part | Stack | Role in the mission |
|---|---|---|
| Crew app (`src/main/frontend`) | React 19 + TypeScript PWA (Vite, `vite-plugin-pwa` service worker), IndexedDB | **The tablet on board.** Check-in, PVT, questionnaires, gateway, **rules engine**, body map, explanations. Works with no connection. |
| Ground station (`src/main/kotlin`) | Kotlin + Spring Boot 3.4 WebFlux, Java 21 | **Earth.** Receives synced check-ins (`POST /api/checkins/sync`, done) and surgeon packets (`POST /api/packets`, done), and will give the flight surgeon a read-only view (not built). Never needed for the crew loop. |
| Device Simulator | TypeScript, a second page in the same Vite project (`simulator.html`) | **The spacecraft's devices.** Runs scenario timelines in the browser and publishes readings to the device link. |
| Device link | WebSocket relay at `/ws/devices` in the Spring Boot app; stores nothing, runs no rules | **The radio link** between simulator and crew app. |
| Voice host (`voice-host/`) | Podman/Docker compose: whisper.cpp, llama.cpp with Qwen3.5-4B, Piper | **The ship-local server for F25.** Speech-to-text, voice commands and read-aloud, offline; reached through the Vite dev server (#37). |

**Why rules run on the tablet, not on the server.** Offline-first is a design constraint: the crew loop (reading → status → explanation → action) must work during loss of signal and with a 3–22 min delay to Mars. The ground station only receives what the tablet sends, through store-and-forward. Putting rules on the server would make the crew depend on Earth, which is the problem the challenge describes.

Why this stack:

1. **Judges can open it.** One URL serves the PWA on any laptop, tablet or phone with no install. Past winners were judged on a live demo (Demo strength score).
2. **It works offline.** The service worker caches the app and IndexedDB stores readings as "pending" until `SyncService` sends them. That's already built and tested (Crew autonomy score).
3. **It runs on what crews actually use.** ISS and Orion apps run on tablets and laptops (EveryWear and Dose Tracker on iPad), and a PWA runs on both.
4. **Simulated sensors reach any browser.** The crew app connects to the device link over WebSocket, which works in every browser, including Safari on iPad. Real BLE devices could later use the Web Bluetooth API.
5. **The ground station is a real backend, not a mock.** Store-and-forward lands somewhere the team can show: the packet leaves the tablet, waits out the visible delay, and appears on the ground view.
6. **Rich visuals are cheap.** SVG body map, systems schematic and charts in React.

**Cost of the split:** two languages (TypeScript and Kotlin). Keep Kotlin small: the ground station only receives, stores and shows. Anything the crew needs stays in TypeScript.

**Web Bluetooth doesn't limit the demo.** All sensors are simulated. Web Bluetooth works only in Chrome, Edge and Samsung Internet, not in Safari on iPad/iPhone or in Firefox (caniuse, checked 2026-11-06). That matters only if a real device is added later.

**Device Simulator details:**
- **Shared code:** a second Vite entry in the same project, so it imports the crew app's domain types and GATT encoders/decoders directly. Encoder and decoder are tested against each other.
- **No Node process:** the scenario timeline and the live controls run in the browser page and publish over the device link.
- **Independence:** it lives in its own folder (`src/main/frontend/src/simulator/`), so one teammate builds it in parallel. The only contract with the crew app is the topics and payload formats.

## Engineering principles: SOLID

The implementation follows SOLID, on top of the layering already in `src/` (`CLAUDE.md`, "Code architecture"). Each principle below names where it applies in this app. Guard against over-engineering: an interface is added at a boundary (storage, network, device, clock, rule source) or where a second implementation exists or is planned (e.g. the device link now, Web Bluetooth later). Pure logic with one implementation stays a plain function or class.

| Principle | What it means here | Concrete rule for the team |
|---|---|---|
| **S** · Single responsibility | One reason to change per class or module. | `CheckInRecorder` records, `SyncService` syncs (already so). The rules engine evaluates rules and returns statuses; it doesn't format text or touch storage. Explanation text comes from a separate formatter. React components render and call use cases; no business logic in components. On the backend, controllers map HTTP ↔ DTO, use cases decide, repositories store. |
| **O** · Open/closed | Add features by adding things, not editing working code. | A new rule = a new row in the rule table. A new device = a new adapter. A new questionnaire = a new definition file read by the generic renderer. A new hazard or corridor = a new table row. If adding one of these needs an `if` in existing code, the design is wrong. |
| **L** · Liskov substitution | Any implementation of a port can replace another without the caller noticing. | Every `ReadingSource` adapter (device link, manual, replay, later Web Bluetooth) emits the same FHIR-shaped `Observation` with source and timestamp. Test fakes (`src/test/fakes.ts`) honour the same contract as the real IndexedDB and HTTP adapters; where possible, one contract test suite runs against both. |
| **I** · Interface segregation | Small ports, each with only what its caller needs. | Keep ports like today's `CheckInRepository`, `CheckInGateway`, `ConnectivityMonitor`. Add `ReadingSource`, `RuleSource`, `Clock` and `PacketSender` as separate ports, never one `HealthService` that does everything. The body map reads statuses through a read-only port; it can't write readings. |
| **D** · Dependency inversion | Use cases depend on ports defined in `domain`, never on concrete classes. | Frontend: concrete classes are chosen only in `container.ts`. Backend: only in Spring configuration. The rules engine receives its rule table through `RuleSource` (a JSON file today), and time through `Clock`, so flight-day logic and the simulator's accelerated time are testable. |

**How this is checked:** the review step in the build plan includes a SOLID check on every merge into `domain`, `application` and the rules engine: one responsibility, new behaviour added without editing existing branches, and no `infrastructure` import from `domain` or `application`.

### Alternatives considered

| Option | Advantage | Why not first choice |
|---|---|---|
| Native iPad app (Swift, CoreBluetooth) | Matches flight hardware; full BLE on iPad | One platform only; judges can't open it without TestFlight; needs Mac + Xcode skills |
| Flutter or React Native | Native BLE on iPad and Android from one codebase | Native build and device setup cost hours of the 48; harder to share a live link |
| Python (Streamlit/Dash) | Fast charts, good for data analysis | Weak offline and touch UI; no direct BLE from the browser; looks like a dashboard, not a crew tool |

With all sensors simulated, native BLE no longer matters, so the case for a native or Flutter app is weaker than before.

## Gates

| Gate | Verdict | Notes |
|---|---|---|
| G1 Answers the brief | Pass | Self-assessment + guidance. Each indicator screen answers the five questions: feasible in space (device class), why the exam, how the hazard shifts it (adaptation timeline, adaptation corridor, hazard lens), when to escalate (tier), what action |
| G2 Measurable in flight | Pass with modification | Only device classes that fly (oximeter, BP cuff, thermometer, HR strap, questionnaire, on-screen test, environment sensors). Glucose = manual entry / future CGM. Radiation = replay of real data, not a consumer sensor |
| G3 Citable thresholds and actions | Pass with modification | Every rule row carries its source. Vital signs use the personal baseline plus clinical guardrails (NASA-STD-3001 only says "clinically accepted values"). Environment uses NASA-STD-3001 limits |
| G4 Honest data plan | Pass | Real: RadLab, EDA cabin air, Inspiration4 panels. Proxy: PhysioNet. Synthetic: labeled in the UI and the pitch. All devices simulated, and said so; each reading carries its source |
| G5 Buildable in 48 h by 6 people | Pass if scoped | Must-have: check-in, PVT, rules engine, body map with hazard lens, explanation with adaptation corridor for BP, temperature and PVT, "reporting is a win" rule, check-and-act card for 4 cases, medical conference agenda, surgeon packet, Device Simulator with 4 virtual devices (wrist bracelet with live HR, oximeter, environment node, dosimeter) and 2 scenarios. Nice-to-have: the bracelet dock import, the other virtual devices, more scenarios, post-flight mode, the Playbook note card, the systems schematic toggle. No hardware risk on stage |

## Scores (team's first estimate, 1–5)

| Criterion | Score | Why |
|---|---|---|
| Crew autonomy | 5 | Offline PWA, rules on the tablet, ground station only receives, visible delay, store-and-forward, escalation tiers |
| Crew-time burden | 4 | 1–2 min check-in; sensors remove typing; PVT every 4th day |
| NASA display conventions | 5 | Quiet when nominal, icon + word + color, value + unit + age + trend + next step |
| Privacy | 4 | Private by default, role views; per-item sharing still to be designed |
| Scientific grounding | 5 | Each rule cites NASA-STD-3001 or a paper; the adaptation timeline comes from peer-reviewed data |
| Differentiation | 4 | Interprets, explains and guides, which EveryWear doesn't. The adaptation corridor and hazard lens show interpretation on screen. Risk: judges may see "another dashboard" if the demo doesn't show guidance |
| Demo strength | 5 | Live PVT plus a simulator operator triggering scenarios on cue; repeatable, no hardware that can fail on stage |

## Team split (suggested, 6 people)

1. Check-in flow and manual entry
2. PVT and questionnaires
3. Rules engine and the rule table with sources
4. Body map, hazard lens, charts (adaptation corridor) and the systems schematic
5. Personal Health Gateway: device link adapters, GATT decoders and the FHIR `Observation` mapping; also the **integrator** who keeps the end-to-end flow working (see "Build plan with Claude Code")
6. Device Simulator: virtual devices, scenarios, live controls and the device link; then the pitch and the AI-use log

## Build plan with Claude Code

The team builds with Claude Code. Code writing stops being the bottleneck; decisions, integration, review and the medical content become the limits. Estimates below are the team's judgment, not measurements.

### Time budget

- **Hours available:** the event runs Sat Nov 14 09:00 to Sun Nov 15 23:59 (~39 h). Realistic working time is about 24 h per person.
- **Submission:** reserve 4–5 h of that for the demo video, slides, project page and AI-use log.
- **Build:** that leaves about 19–20 h per person, roughly 115 person-hours for 6 people.
- **Without AI assistance:** the scoped build (must-haves in gate G5) is about 110 person-hours (with the adaptation corridor, hazard lens, check-and-act card and agenda), with almost no buffer.
- **With Claude Code:** the code-heavy pieces take roughly half the time. That frees room to add back the remaining GATT decoders, the offline service worker, and maybe post-flight mode.

| Gets cheaper with Claude Code | Doesn't get cheaper |
|---|---|
| GATT decoders with tests (all 5 characteristics) | The rule table: thresholds, actions, citations need a human check |
| Device Simulator (devices, JSON scenario timelines, control page) | Integration: 6 people generating code fast make a mess faster |
| App shell, service worker, charts, SVG body map | Demo, video, pitch and judgment calls |
| FHIR-shaped JSON mapping | Reviewing generated code |

### How the team works

1. **One repo split by folders.** Each person works in their own folder, which keeps parallel Claude Code sessions from editing the same files.
   - `src/main/frontend/src/domain/`: shared types, ports, device topics, GATT codecs (the contract)
   - `src/main/frontend/src/{application,infrastructure,ui}/`: the crew app, split by layer and then by feature
   - `src/main/frontend/src/simulator/`: the Device Simulator
   - `src/main/kotlin/…/{checkin,packet}/`: the ground station, one folder per domain
2. **Contracts first, as code.** Saturday 09:00–10:00, before anyone splits off: write the shared types (reading, FHIR-shaped `Observation`), the ports, the device topic list and payload formats in `domain/`, and the packet DTO shared with the backend. Every session builds against that contract.
3. **A `CLAUDE.md` for the build repo** carrying the design constraints from this workspace's `CLAUDE.md`:
   - NASA display rules
   - no diagnosing LLM
   - private by default
   - data-source labels
   - cite sources from `research/`

   Draft its text in `ideas/` before Nov 14; that's planning, not code.
4. **Round-trip tests for the codecs.** The simulator encodes GATT bytes and the gateway decodes them with the same `domain/` code. Encode/decode tests are cheap and catch errors in the 16-bit float format the oximeter and BP characteristics use.
5. **One integrator.** One person merges often and keeps the end-to-end flow (simulator → device link → gateway → screen) working at all times.
6. **Rules are human-checked.** Claude Code may draft rules but can invent plausible citations. Every rule must cite a source already in `research/`, and a teammate verifies it before merge. Draft the rule table as a document before Nov 14 (research, not code).
7. **Review.** At least a skim of everything merged into `domain/` and the rules engine, including the SOLID check (see "Engineering principles: SOLID").

### Timeline

| When | Milestone |
|---|---|
| Sat 09:00–10:00 | Contracts in `domain/`, `CLAUDE.md` updated, roles confirmed |
| Sat ~15:00 | One reading flows end to end: simulator → device link → gateway → screen |
| Sat evening | Must-haves working roughly; rule table integrated |
| Sun ~14:00 | **Feature freeze.** After this, only fixes, demo rehearsal, video, submission |
| Sun 23:59 | Submission closes |

More features are always one prompt away; the freeze still holds.

### AI-use log

The submission must describe AI use, and with Claude Code that covers most of the code.
- Each person keeps short notes: what was generated, what was reviewed, what was changed by hand.
- Person 6 compiles them for the submission.
- Include this research phase (the workspace was compiled with Claude).

### Before Nov 14

- Everyone has Claude Code installed and working, on a plan with enough usage for a full day of heavy use. Six people hitting usage limits on Sunday afternoon is a real risk.
- Draft the build repo's `CLAUDE.md` text and the rule table in `ideas/`.
- Agree how generated code gets reviewed.

## Build plan without Claude Code

The fallback if the team codes by hand, or Claude Code is unavailable or rate-limited. The same ~115 person-hours apply, but the scoped build needs about 110 of them, so the plan **cuts harder and fakes more behind clear labels**. Estimates are the team's judgment.

### Estimated effort (scoped build, by hand)

| Piece | Person-hours | Risk |
|---|---|---|
| App shell, routing, local storage, mock crew profile | 8 | low |
| Check-in and manual entry | 8 | low |
| PVT (3-minute reaction test) | 6 | low |
| Rules engine + about 10 rules with sources | 10 | medium: writing rules and citations takes longer than the code |
| Body map (SVG) and system list | 10 | low–medium |
| Detail screen with trend chart and explanation | 10 | low |
| Adaptation corridor (3 indicators) and hazard lens (static mapping) | 5 | low: the content is already sourced |
| Gateway: device link client, 1 GATT decoder, JSON adapter, FHIR-shaped mapping | 12 | medium–high |
| Device Simulator: 3 devices, 2 scenarios, controls, device link | 14 | medium |
| Surgeon packet with delay timeline | 6 | low |
| Check-and-act card (4 cases) and conference agenda | 5 | low for the code; the hint content needs sources and a human check |
| Real data prep (RadLab/EDA replay files) | 4 | low; curl calls already exist |
| Integration, bugs, demo rehearsal | 15 | high |
| **Total** | **~113** | |

### Cuts and simplifications

- **GATT:** decode only Heart Rate `0x2A37` (simple bytes). The oximeter, BP, thermometer and glucometer send plain JSON from the simulator, or use manual entry. Keep the full GATT story on the architecture slide.
- **If fewer than 3–4 people are fluent in TypeScript/React:** drop GATT decoding entirely; the simulator sends JSON for every device.
- **FHIR:** FHIR-shaped JSON (`Observation`, `Device`, gateway reference) with no FHIR library and no validation.
- **Offline:** already built (service worker via `vite-plugin-pwa`, IndexedDB, `SyncService`); keep it, don't extend it.
- **Simulator:** 3 devices (bracelet HR or oximeter, environment node, dosimeter) and 2 scenarios (nominal, CO₂ build-up), as JSON timelines with no scenario editor.
- **Drop:** post-flight mode, role views beyond the crew view, gamification (except the one-line "reporting is a win" rule), vision self-test.
- **Corridor:** BP and PVT only if time runs short. The hazard lens stays; it's a static table.
- **One environment mode:** Mars transit, with the delay shown as a fixed number.

### What stays the same as the Claude Code plan

- Repo split by folders, contracts first on Saturday morning, one integrator.
- Rule table drafted as a document before Nov 14.
- The timeline: end-to-end reading by Saturday afternoon, **feature freeze Sunday ~14:00**.
- AI-use log, which still covers the research phase.

The `CLAUDE.md` and generated-code review steps don't apply. With no buffer, the freeze matters even more.

## Open questions

- Does the Nov 13 Resources tab change the data plan?
- Agree the device topic names and payload formats between the crew app and the simulator first, on Nov 14 morning; they are the only contract between the two apps.
- Which scenarios make the 2-minute demo? Pick two from the simulator list.
- Find the vehicle EMC/RF requirement to cite for the flight caveat.
- Do we include post-flight mode in the must-have scope? It's strong evidence-wise, but it adds screens.
- Which PHD IG profiles (vital signs, SpO2, BP) do we mirror? Pick the version (current published v2.0.0, STU 2, FHIR R4) and stick to it.

## Sources

Sensor and platform facts checked 2026-11-06, PHG facts checked 2026-11-07. Research claims cite the files in `../research/`.

- [P1] ITU-T H.810, Continua Design Guidelines, personal health systems: https://en.wikipedia.org/wiki/H.810 ; ITU tutorial: https://www.itu.int/dms_pub/itu-t/opb/tut/T-TUT-EHT-2017-H810-PDF-E.pdf
- [P2] HL7 FHIR Personal Health Device IG, Scope (PHD → PHG → FHIR upload; Continua H.812-5): https://www.hl7.org/fhir/uv/phd/Scope.html
- [P3] HL7 FHIR Personal Health Device IG, v2.0.0 STU 2 (current published): https://hl7.org/fhir/uv/phd/ ; Technical Implementation Guidance (resources, gateway reference, timestamps, out-of-scope): https://www.hl7.org/fhir/uv/phd/en/TechnicalImplementationGuidance.html
- [P4] Bluetooth SIG Generic Health Sensor Profile and Service v1.0 (IEEE 11073-10206 ACOM over GATT): https://www.bluetooth.com/specifications/specs/generic-health-sensor-profile/ ; https://www.bluetooth.com/specifications/specs/generic-health-sensor-service
- Web Bluetooth (secure context, user activation): https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API ; browser support: https://github.com/Fyrd/caniuse/blob/main/features-json/web-bluetooth.json
- GATT service UUIDs: https://nrfconnectdocs.nordicsemi.com/ncs-bm/latest/nrf-bm/doxygen/html/group__UUID__SERVICES.html
- [P6] Bluetooth SIG assigned numbers, characteristic UUIDs (0x2A18, 0x2A1C, 0x2A35, 0x2A37, 0x2A5E, 0x2A5F), checked 2026-11-07: https://bitbucket.org/bluetooth-SIG/public/src/main/assigned_numbers/uuids/characteristic_uuids.yaml
- [P7] MDN, `Crypto.randomUUID()` ("available only in secure contexts (HTTPS)") and `Crypto.getRandomValues()` ("the only member of the Crypto interface which can be used from an insecure context"), checked 2026-11-14: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID ; https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
- [P8] Spring Framework reference, WebFlux WebSockets (map a `WebSocketHandler` with `SimpleUrlHandlerMapping(map, -1)`; the WebFlux config provides the `WebSocketHandlerAdapter`), checked 2026-11-14: https://docs.spring.io/spring-framework/reference/web/webflux-websocket.html
