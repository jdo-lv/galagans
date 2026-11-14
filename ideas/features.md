# Crew Health Companion: features explained, and build order

Written 2026-11-13 for the team. It explains every feature of [crew-health-companion.md](crew-health-companion.md) in plain words, for people who aren't doctors or space experts, then sets the order to build them. Details, sources and thresholds stay in the idea file and `research/`; this file links to them instead of repeating them.

## The app in one paragraph

On a long mission an astronaut has to notice health changes in themselves, because the doctors on Earth answer minutes late (Mars: up to 22 min each way) and can't come to help. Crew Health Companion is a tablet app the astronaut uses for 1–2 minutes a day. It collects a few measurements, compares them with **that astronaut's own normal values**, and says in plain words: what changed, why it matters, how the app decided, and what to do next, including whether to involve the crew's medic or the doctors on Earth. It works with no connection to Earth and sends a summary when a link is available.

## Words you'll see

| Word | Meaning |
|---|---|
| Bracelet broadcast / dock | A wrist bracelet can send heart rate live over standard Bluetooth ("broadcast"); other values (sleep, HRV) come in a batch after it is synced or docked, imported as a file. |
| Flight day (FD) | Days since launch. "FD 142" = day 142 of the mission. |
| Baseline | The astronaut's own normal range, measured before flight or in the first days. |
| CMO (Crew Medical Officer) | A crew member with about 40 h of medical training. Not a doctor. The first person to involve. |
| Flight surgeon | The mission's doctor, on Earth. |
| Escalation tier | Who to involve, in order: self-care → CMO → private medical conference (a private call with the flight surgeon) → urgent ground contact. |
| HRP / five hazards | NASA's Human Research Program groups spaceflight dangers into five hazards: radiation, isolation & confinement, distance from Earth, gravity changes, hostile/closed environment. |
| NASA-STD-3001 | NASA's health standard for crews. Many of our limits come from it (e.g. cabin CO₂). |
| PVT | Psychomotor Vigilance Test: a 3-minute reaction-time game (tap when a light appears). Slower times mean tiredness or poor attention. Astronauts already do it on the ISS. |
| KSS | Karolinska Sleepiness Scale: "how sleepy are you?" from 1 to 9. |
| Bedford scale | "How hard was your hardest task today?" workload rating, with NASA limits. |
| PHQ / GAD | Short standard mood and anxiety questionnaires. |
| CO₂ (mmHg) | Carbon dioxide in cabin air. Higher than on Earth; above about 3 mmHg it can cause headaches and slow thinking. |
| SANS | Eye and brain changes caused by fluids moving toward the head in weightlessness. |
| BLE | Bluetooth Low Energy: how a pulse oximeter or BP cuff would talk to the tablet. |
| MQTT | A simple messaging system: devices "publish" readings, the app "subscribes". We use it to fake the sensors. |
| FHIR | The standard format hospitals use for health data. Every reading becomes a FHIR `Observation`. |
| Store-and-forward | Save now, send when the link to Earth is up. Like email on a plane. |

## The features

Each feature has: what it is, why it matters, how it works, an example, what it needs first, and a priority (**Must** = in the 48-h demo, **Nice** = only if time allows, **Pitch** = described, not built). "Done" means it's already in `src/`.

### Core: the daily loop

#### F1. Daily check-in · Must · partly done
- **What:** a 1–2 minute morning form: heart rate, oxygen in blood (SpO₂), blood pressure, temperature, sleep hours, mood 1–5, and a symptom checklist.
- **Why:** these are the indicators the challenge names, and devices that measure them already fly.
- **How:** one question per screen, big buttons (fingers are clumsy in weightlessness), skip always allowed. A value can be typed or come from a (simulated) device.
- **Example:** "Sleep last night: 5.5 h", "Mood: 3", "Symptoms: headache".
- **Needs:** nothing.
- **Status:** `CheckInForm` saves HR, SpO₂, sleep and mood. Missing: BP, temperature, symptom checklist, one-question-per-screen layout.
- **More:** idea file "Questionnaires and how they're triggered".

#### F2. Works offline, sends later · Must · done
- **What:** everything is saved on the tablet first, then sent to "ground" when a connection exists.
- **Why:** there's no permanent internet in deep space. NASA requires crews to manage on their own.
- **How:** check-ins go to the tablet's browser database (IndexedDB) as "pending"; `SyncService` sends them to the backend, which plays the ground station.
- **Needs:** nothing.

#### F3. Personal baseline · Must
- **What:** the app learns each astronaut's normal range and compares new values with it.
- **Why:** normal Earth values are wrong in space. In flight, blood pressure is about 8–10 mmHg lower and body temperature about 1 °C higher, so Earth limits would raise false alarms.
- **How:** pre-flight values (in the demo: a pre-loaded profile) set a band per indicator, e.g. "your PVT: 250–285 ms".
- **Example:** 108/70 BP is fine for this astronaut even if it looks low on Earth.
- **Needs:** F1.

#### F4. Rules engine and rule table · Must
- **What:** the "brain". A table of simple, readable rules: *if* this indicator does *this*, *then* status, action, who to involve, and the source that justifies it.
- **Why:** judges and doctors can read every rule and see where it comes from. No AI makes medical decisions (a design constraint).
- **How:** each rule is one row in a JSON file; the code evaluates them after every new reading. Rule example COG-02: "PVT median > corridor + 15% or ≥ 5 lapses → Cognition level 3 "check" → tell the CMO today. Source: Dev et al. 2024".
- **Needs:** F3. The rule table itself must be written and checked by a person, with sources from `research/`.
- **Status:** `rules.json` holds SPO-01 (SpO₂ < 94 % → caution) and SPO-02 (< 90 % → warning), validated on load and evaluated on the tablet after each save and every 60 s. Runs without F3 for now: thresholds are the Earth clinical convention. Missing: other indicators and rows, personal baseline.

#### F5. Explanation and next step (detail screen) · Must
- **What:** tapping a flagged item opens a screen with four answers: **what** changed, **why it matters**, **how the app decided** (the rule and its source), **what to do next**, plus the escalation tier with buttons "Share with CMO" / "Add to surgeon packet".
- **Why:** it answers the challenge's five questions on every screen. NASA display guidance says to always explain what, why and what next.
- **Needs:** F4. See mockup [02-detail.png](mockups/02-detail.png).
- **Status:** a caution or warning row on home opens the system's detail screen (`#/systems/<system>`). It shows the status, a 7-day trend chart with the rule thresholds, what / why / how decided / source, what next, and the four escalation tiers with the rule's tier selected (issue #9). Missing: the adaptation corridor (F11) and the "Share with CMO" / "Add to surgeon packet" buttons.

#### F6. Body map (home screen) · Must
- **What:** a human figure plus a list of body systems, each with a status on the 0–5 [alert scale](alert-levels.md): nominal, to do, watch, check, treat or emergency.
- **Why:** the challenge suggests a clickable human figure. One glance shows where attention is needed.
- **How:** NASA display rules: quiet when all is fine; blue = input due, yellow/orange = caution band, red = emergency, **always with an icon and a word**, never color alone. Each value shows its unit, age and source ("4 min ago · simulated"). Missing data shows as "data 8 d old", never as a health alarm.
- **Needs:** F4. See mockup [01-body-map.png](mockups/01-body-map.png).
- **Status:** the "Body systems" list on home shows Respiratory (from SpO₂) as nominal, caution, warning, "No data", or "No recent data" with the data age when the reading is older than 24 h; source label "manual". The other nine systems of mockup 01 show synthetic nominal placeholder values labelled "synthetic" (`infrastructure/mockStatuses.ts`); a system drops its placeholder once a rule covers it. The "Latest readings" tiles show the newest heart rate, SpO₂, sleep and mood from manual check-ins with unit, data age and the tag "manual". SpO₂ carries the Respiratory caution or warning badge, a value older than 24 h looks stale, and a field never entered shows "—". A seventh tile, "Reaction time", shows the latest PVT median tagged "in-app test" (F7, issue #16). Blood pressure and cabin CO₂ are synthetic tiles (`infrastructure/mockReadings.ts`). The human figure sits in the Hazard lens card (issue #14): six display-only labels (Cognition, Eyes, Lungs, Heart, Kidneys, Bone & muscle) that stay quiet when nominal and show the status badge for caution or warning. Missing: rules for the other systems, tapping a figure item to open its detail.

### Inputs for the demo

#### F7. PVT reaction test · Must
- **What:** the 3-minute reaction game, every 4th day.
- **Why:** it's the only objective, in-app measure of thinking speed, and ISS crews already do it. It's also the live moment of the demo.
- **How:** a counter appears at random intervals (2–5 s) for 3 minutes; the app records reaction times, the median, "lapses" (≥ 355 ms) and false starts (< 130 ms) ([health-indicators.md](../research/health-indicators.md) §13 [S28][S30]).
- **Needs:** F1 shell. Feeds F4.
- **Status:** "Start reaction test" on home opens the 3-minute PVT-B at `#/pvt` (issue #16). It scores the median RT, lapses and false starts, and saves the result offline as a check-in labelled "in-app test", synced like any other. A "Reaction time" tile on home shows the latest median (stale after 4 days), and the routine's PVT row turns "done HH:MM". Stop, leaving the screen or going to the background saves nothing; a failed save offers "Try again". Missing: the Cognition rule (#17), KSS rating, ground-station storage of the PVT fields.

#### F8. Device Simulator · Must (3 devices, 2 scenarios)
- **What:** a second app that pretends to be every sensor: wrist bracelet (live heart rate, plus a "dock & export" batch of sleep, resting HR and HRV), pulse oximeter, environment node (cabin CO₂, temperature, humidity, noise), dosimeter (radiation). We use no real hardware.
- **Why:** no hardware can fail on stage, and a teammate can "operate the spacecraft" live: press "CO₂ build-up" and the crew app reacts.
- **How:** the simulator publishes readings over MQTT; the crew app subscribes. Scenarios are timelines of values (nominal day, CO₂ build-up). Every reading is labeled "simulated", "replay" or "synthetic".
- **Needs:** the shared message format agreed on day 1 (F9). Can be built in parallel from hour 1.
- **More:** idea file "Device Simulator: a second app"; mockup [04-simulator.png](mockups/04-simulator.png).

#### F9. Personal Health Gateway · Must (simple version)
- **What:** the part of the app that receives readings from any source (device, manual entry, replay) and turns them into one standard format (FHIR `Observation`) with source and timestamp.
- **Why:** the rest of the app sees only one format, and swapping a fake device for a real one later only changes the connector.
- **How (48 h):** one connector for MQTT JSON, one for manual entry, and one real Bluetooth heart-rate byte decoder (used by the bracelet) to show it's genuine. Nice-to-have: a "dock import" connector for the bracelet's batch file. Full standards stay on a slide.
- **Needs:** F8's message format.

#### F10. Real data replay · Must
- **What:** the simulator replays **real** NASA data: ISS cabin CO₂/temperature/humidity (OSDR EDA) and radiation (RadLab).
- **Why:** there's no public astronaut vital-sign data, so honesty matters. Real environment data makes the CO₂ scenario credible.
- **How:** the tested download calls are in [data-sources.md](../research/data-sources.md); convert once to JSON timelines for the simulator.
- **Needs:** F8.

### What makes it different

#### F11. Adaptation corridor (chart) · Must (BP, temperature, PVT)
- **What:** on each detail chart, besides the astronaut's normal band, a second band shows what change is **expected for this flight day**.
- **Why:** some changes are normal in space. Without this, the app would flag normal adaptation. It also shows the challenge's question "how do hazards affect the indicators?" in one picture.
- **How:** the band = baseline shifted by the published average change for that flight day (e.g. temperature +1 °C, building over ~2.5 months). Its width comes from the astronaut's own variation. Inside the band = quiet; outside = flagged. Indicators with no published shift say so.
- **Example:** PVT a bit slow in week 1 = inside the corridor, no flag. PVT slow at FD 142 = outside, flagged.
- **Needs:** F3, F4, F5.
- **More:** idea file "Adaptation corridor"; mockup [02-detail.png](mockups/02-detail.png).

#### F12. Hazard lens · Must
- **What:** five buttons above the body map, one per NASA hazard. Picking one highlights the body systems it affects and dims the rest, with one line saying what the hazard does and which checks watch it.
- **Why:** the five hazards are NASA's own framing and the first link judges published. It teaches the astronaut why each check exists.
- **How:** a fixed table (hazard → systems → checks) and a highlight style on the body map. No new data.
- **Needs:** F6.
- **Status:** Implemented. A Hazard lens card on home (issue #14): five hazard toggles, a caption per hazard (what it does, the systems it affects, the checks that watch it, the source), and the body figure. The selected hazard marks its Body systems rows and figure labels and dims the rest, never dims a caution or warning, never changes a status, and is remembered on the device.

#### F13. "Reporting is a win" · Must
- **What:** logging a symptom counts as a completed check-in and never breaks a streak.
- **Why:** astronauts are known to hide symptoms because they fear losing flights. Most health apps reward "good numbers"; we reward honesty, and never reward or compare health values.
- **How:** streaks count only the process (check-ins done, exercise minutes, fluids). Sick days pause streaks, never reset them.
- **Needs:** F1. See mockup [09-reporting-win.png](mockups/09-reporting-win.png).

#### F14. Surgeon packet with comms delay · Must
- **What:** a summary for the doctor on Earth: flagged items, readings with sources, the astronaut's own notes, in standard FHIR format. A timeline shows when it leaves and when it arrives, e.g. "one-way delay 14 min 05 s".
- **Why:** it makes the distance from Earth visible and shows the escalation path working.
- **Needs:** F2, F5, F9. See mockup [03-surgeon-packet.png](mockups/03-surgeon-packet.png).
- **Status:** The ground station receives packets at `POST /api/packets` (in memory, first write per id wins). Missing: crew screen and timeline (#19), ground view, FHIR format (F24).

#### F15. Today's routine and smart questionnaires · Must (minimal)
- **What:** one list of what's due today (check-in, PVT, exercise, fluids, evening workload). Rules can add a short step, always saying why: "Added because your PVT was slower than baseline".
- **Why:** the challenge asks the app to prompt checks as part of the mission routine. Crew time is scarce, so items have time windows, get bundled, and the app sends at most one reminder.
- **How (48 h):** the morning check-in, the PVT, and one rule-triggered KSS + sleep re-check.
- **Needs:** F1, F4.
- **More:** idea file "Questionnaires and how they're triggered"; mockup [06-questionnaire.png](mockups/06-questionnaire.png).
- **Status:** The 'Today's routine' card on home shows the Morning check-in (07:00–09:00, device time) as upcoming, due with Start, done HH:MM or not answered, from the stored check-ins (a PVT result doesn't count as the morning check-in). The PVT row is real: "done HH:MM" when a PVT was done today, otherwise "every 4th day" (issue #16). Exercise, fluids and Bedford are synthetic placeholder rows (`infrastructure/mockRoutine.ts`). Missing: rule-triggered KSS + sleep re-check, windows on the mission clock and sleep shift, bundling, reminder banner, '● 1 due' counter, body-map data-age note for a missed check-in.

#### F22. Check-and-act card · Must (4 cases)
- **What:** on the detail screen of a flagged reading, three steps: (1) is the reading right? re-measure properly; (2) what in your own data may explain it (sleep, fluids, caffeine, cabin CO₂, symptoms); (3) what to do now, plus "Add to my next medical conference".
- **Why:** many odd readings are measurement errors (cold fingers on the oximeter), and the rest often have a cause the astronaut can act on. It's guidance, not a target: HR and SpO₂ are signals, never scores.
- **Safety:** a red warning skips the tips and goes straight to "CMO now". Low SpO₂ never gets self-care tips. Every hint has a source.
- **48 h:** resting HR above baseline, low SpO₂, slow PVT (the demo case), sleep loss (sleep hygiene and light timing, sourced from `research/countermeasures.md`).
- **Needs:** F4, F5. See mockup [08-check-and-act.png](mockups/08-check-and-act.png).

#### F23. Medical conference agenda · Must
- **What:** a running list of things to raise at the next private medical conference with the flight surgeon: lasting cautions, logged symptoms, items added from the check-and-act card, and the astronaut's own notes. The astronaut approves each item; approved items go into the surgeon packet.
- **Why:** astronauts are known to under-report. A written agenda means nothing depends on remembering or speaking up on the call. It adds the missing option "not urgent, but the doctor should hear about it".
- **Needs:** F14, F22. See mockup [08-check-and-act.png](mockups/08-check-and-act.png) (card and agenda on one screen).

#### F16. Systems schematic ("Body | Systems") · Nice
- **What:** a second view of the home screen that draws the cabin and the astronaut as one connected system. Lines link cabin readings to body systems; a line lights up when a rule connects them.
- **Why:** the body map shows *where* the problem is; the schematic shows *why* ("cabin CO₂ high + 3 short nights → slower thinking"). It looks like real flight software.
- **How:** an SVG with two columns; the links come from each rule's "related signals". The app never guesses causes beyond what a rule states.
- **Needs:** F4, F6, F12. See mockup [07-systems-schematic.png](mockups/07-systems-schematic.png).

### Extras

#### F17. Fluid intake and hydration · Nice
- **What:** one-tap drink logging, progress to 2.5 L/day, and a daily urine-color check.
- **Why:** crews drink less than the target, and kidney stones are the 2nd most likely reason for an emergency return from the ISS.
- **Needs:** F1, F15.

#### F18. Pre-landing fluid loading checklist · Nice
- **What:** before landing, the app guides the salt-water drinking protocol NASA uses so astronauts don't faint when gravity returns.
- **Needs:** F15, F17. See mockup [10-landing-readiness.png](mockups/10-landing-readiness.png) (full countdown: checks, garments, after-landing care).

#### F19. Playbook note · Nice
- **What:** when a rule adds a task that takes crew time, the app writes a scheduling note (task, duration, time window, reason) for NASA's crew scheduling tool, Playbook.
- **Why:** NASA learned crews can't reschedule well without knowing *why* a task exists; our note carries the reason.
- **Honesty:** Playbook has no public interface, so it's a "format proposal" card, not an integration.
- **Needs:** F4, F15.

#### F20. Role views and privacy · Nice
- **What:** the astronaut sees everything; the CMO and flight surgeon see completion and what was shared; crewmates see nothing. No leaderboards.
- **Why:** crews are 4–6 people, so any shared health data identifies someone.
- **48 h:** build the astronaut view only; show the rule on a slide.

#### F24. FHIR adapter for other systems · Pitch (build only after the demo works)
- **What:** an extra connector that exports the app's data in HL7 FHIR R4, the standard format hospitals and medical systems exchange, and a small ground-station API that serves it.
- **Why:** today data syncs in our own JSON format, so no other system can read it without custom work. With FHIR, any FHIR-capable medical system could connect.
- **Status:** not implemented; described in the pitch. The design already isolates it as an adapter, so it doesn't change the crew loop.
- **More:** idea file "Interoperability: FHIR adapter (note for the pitch)".

#### F25. Local voice assistant · Spike (time-boxed)
- **What:** the astronaut talks to the tablet: hears the status read aloud, answers the check-in questions by voice, and asks questions answered from our sourced corpus. Speech-to-text, a small quantized LLM and text-to-speech run on a ship-local server (the F9 gateway host) over the cabin LAN, so it works offline from Earth.
- **Why:** hands-free use, and it answers the "AI tool use" requirement of the submission. It must differ from CIMON, whose speech ran in the ground cloud (`research/other-agencies.md` line 10).
- **Rules:** the rules engine (F4) decides every status; the LLM never does. It only rephrases rule output, maps speech to questionnaire fields as `{question_id, value}` that the astronaut confirms, and answers from `research/` plus the action table with a cited source. Out-of-corpus questions are refused or redirected to the CMO. "Decision support" wording. No tone, stress or emotion analysis of the voice.
- **Spike scope:** voice → STT → structured questionnaire answers → confirm → save, plus read-aloud of the F5 explanation. No free-form advice.
- **Cut rule:** drop it if the spike doesn't work by Sat ~22:00, and keep it as a pitch slide.
- **Needs:** F1, F4, F5, F9. New port in `domain/ports.ts` and wiring in `container.ts` (both hot); the model runs as a separate process, not inside the Spring app.
- **Open:** host hardware and model size (not tested); offline speech support of the Web Speech API (not verified).

#### F21. Later · Pitch
- Vision self-test (eye chart + Amsler grid), post-flight recovery mode, Moon/ISS/Mars environment modes, more simulated devices and scenarios (solar storm, sensor dropout, pre-landing blood pressure), the "Landing readiness" campaign.

## Build order

**Principle:** build the core loop first (reading → compare → status → explanation), because every other feature feeds or decorates it. Then add the inputs the demo needs, then what makes us different. The Device Simulator is a separate track that starts in hour 1, because it only depends on the agreed message format.

| # | Feature | Track | When (target) | Why at this point |
|---|---|---|---|---|
| 0 | F1 check-in (partial), F2 offline sync | App | Done | Already in `src/` |
| 1 | Message format and reading model (FHIR-shaped `Observation`, MQTT topics) | All | Sat 09:00–10:00 | The contract every track builds against |
| 2 | F8 Device Simulator: environment node + oximeter, nominal scenario | Simulator | Sat from 10:00 | Independent; the demo depends on it |
| 3 | F3 baseline + F4 rules engine with ~10 sourced rules | Rules | Sat from 10:00 | The core; everything else needs a status |
| 4 | F1 complete (BP, temperature, symptoms) | App | Sat morning | Inputs for the rules |
| 5 | F9 gateway (MQTT + manual) | Gateway | Sat morning | Connects simulator and app |
| 6 | F6 body map with statuses | UI | Sat midday | First end-to-end view |
| **✓** | **Milestone: one simulated reading flows to a status on the body map** | — | **Sat ~15:00** | Integration risk retired early |
| 7 | F5 detail screen with explanation and tier | UI | Sat afternoon | Completes the core loop |
| 8 | F7 PVT | App | Sat afternoon | Live demo moment; feeds rule COG-02 |
| 9 | F10 CO₂ replay + "CO₂ build-up" scenario | Simulator | Sat afternoon | The demo story |
| 10 | F11 adaptation corridor (PVT, BP, temperature) | UI + Rules | Sat evening | Main differentiator; needs F5 |
| 11 | F12 hazard lens | UI | Sat evening | Cheap; needs F6 |
| 12 | F15 routine + rule-triggered KSS re-check | App | Sat evening | Shows "prompted checks" |
| 13 | F14 surgeon packet with delay | App | Sun morning | Last step of the demo |
| 14 | F13 reporting is a win | App | Sun morning | Small; streak logic |
| 15 | F22 check-and-act card (4 cases) + F23 conference agenda | App + Rules | Sun morning | Small code over existing flags; hint content drafted Saturday by the rules person |
| S | F25 local voice assistant spike | Spike (separate person) | Sat evening, cut at ~22:00 if not working | Optional; never blocks 1–15 |
| **✓** | **Milestone: full 2-minute demo runs end to end** | — | **Sun ~12:00** | Leaves 2 h before the freeze |
| 16 | F16 systems schematic | UI | Sun, if on time | First nice-to-have: strongest visual |
| 17 | F17 hydration, F19 Playbook card | App | Sun, if on time | Small additions |
| **■** | **Feature freeze** | — | **Sun ~14:00** | Then only fixes, rehearsal, video, submission |
| — | F18, F20, F21, F24 (FHIR adapter) | — | Pitch only | Described on slides |

**If we fall behind:** cut from the bottom. Never cut 1–9: without them there's no demo. The corridor can shrink to PVT only; the hazard lens stays (it's a table and a style). Skip the systems schematic before cutting the surgeon packet.

**Note on the stack and code rules:** the crew app is a React + TypeScript PWA and runs every rule on the tablet, so it works offline. The Kotlin/Spring Boot backend is the **ground station**: it only receives synced check-ins and surgeon packets and shows them to the flight surgeon. All code follows SOLID; the idea file's "Language and platform" and "Engineering principles: SOLID" sections give the concrete rules, e.g. a new rule, device or questionnaire is added as a new row, adapter or file, without editing existing code.
