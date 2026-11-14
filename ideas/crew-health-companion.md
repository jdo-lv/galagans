# Idea: Crew Health Companion

Proposal written 2026-11-06 from everything in `../research/`. It is an idea under evaluation, not a build: per the event rule, code starts on Nov 14. Thresholds and screens are examples to verify, not final values.

## In five lines

- **Problem:** On long missions the crew has to spot health changes themselves, and many important changes have no symptoms. Examples: bone loss, jugular clots, herpesvirus reactivation ([long-duration-literature.md](../research/long-duration-literature.md)). Today the ground interprets the data, and NASA asks for a "flight-based paradigm" ([existing-systems.md](../research/existing-systems.md)).
- **User:** The astronaut, in a 1–2 minute daily check-in. The Crew Medical Officer (CMO) gets an escalation view. The flight surgeon receives a store-and-forward packet.
- **Inputs:** Manual entry, an in-app vigilance test (PVT) and questionnaires. Sensors are Bluetooth Low Energy (BLE) personal devices and a Wi-Fi environment node, **all simulated** by a separate Device Simulator app. No real hardware is used.
- **Outputs:**
  - status per body system against the astronaut's own baseline
  - an explanation (what, why, how decided, what next)
  - an action, and who to involve (self → CMO → private medical conference → ground)
- **2-minute demo:**
  Two screens side by side: the crew app and the Device Simulator.
  1. Morning check-in. The simulated pulse oximeter sends a reading.
  2. A 3-minute PVT that comes out slow.
  3. In the simulator, the operator triggers the "CO2 build-up" scenario, which replays real cabin CO2.
  4. The body map shows "Cognition: caution" and "Cabin air: caution" with the explanation and an action.
  5. The surgeon packet is prepared with the visible Mars delay.

## Mockups

Static images to illustrate the idea, made 2026-11-07, restyled 2026-11-14 with the team palette (dark theme, see [ux-human-factors.md](../research/ux-human-factors.md#team-palette-health-palette-prototype)). Sources are HTML in `mockups/src/` with shared tokens in `theme.css`; `mockups/src/render.sh` re-renders the PNGs with headless Chrome. Values, rules and dates are examples, not medical guidance or final thresholds.

| Screen | What it shows |
|---|---|
| [Body map](mockups/01-body-map.png) | Per-system status (quiet when nominal, icon + word + color), adaptation-timeline note, today's routine with pending-questionnaire states (done, due, rule-added, upcoming, missed), "1 due" counter, one reminder banner, data-age note for missed data, latest readings with source and data age |
| [Detail: Cognition](mockups/02-detail.png) | Trend against the personal baseline band, explanation (what / why / how decided / sources), what next, escalation tier |
| [Surgeon packet](mockups/03-surgeon-packet.png) | Store-and-forward timeline with the Mars delay, packet contents with sources, an example FHIR `Observation` |
| [Device Simulator](mockups/04-simulator.png) | Virtual devices with GATT IDs and data source, scenarios, value injection, MQTT traffic |
| [Questionnaire](mockups/06-questionnaire.png) | Morning check-in step (KSS): one question per screen, instrument's own anchors, progress and time left, "why you're seeing this" (scheduled vs rule-triggered), skip logged as not answered, privacy note, upcoming questionnaires with their triggers |
| [Architecture](mockups/05-architecture.png) | Device Simulator → MQTT broker → Personal Health Gateway (adapters, FHIR normalizer) → local store → rules engine → crew UI → store-and-forward queue → ground; future real BLE path dashed |

## Idea template (from the viability checklist)

```
Name: Crew Health Companion
Problem (which HRP risk / hazard): Medical conditions and adverse cognitive/behavioral changes under distance from Earth (no real-time ground) and a hostile closed environment (CO2, radiation); risks: sleep, SANS, bone/muscle, kidney stones, cardiovascular.
User and moment of use: Astronaut, daily check-in at a set time (1–2 min) plus prompted checks per mission routine. Environment mode: ISS / Orion / lunar base / Mars transit (changes the medical kit and the delay).
Inputs: Daily — HR + SpO2 (simulated BLE oximeter or manual), BP (simulated BLE cuff or manual), temperature, sleep hours, mood 1–5, symptom checklist. Every 4th day — 3-min PVT. Weekly — Amsler grid + acuity self-test, body mass. Continuous (environment) — CO2, temperature, humidity, noise, radiation dose (simulated Wi-Fi node). All sensors come from the Device Simulator app.
Outputs: Per-system status (nominal / caution / warning with icon + word + color), explanation, recommended action, escalation tier, store-and-forward packet for the flight surgeon.
2-minute demo: check-in → PVT → body map flag → explanation + action → CO2 cause → surgeon packet with delay.
Data for the demo: Real — OSDR RadLab radiation, OSDR EDA cabin CO2/temp/RH, Inspiration4 blood panels with reference ranges. Proxy — PhysioNet sleep/HR. Synthetic (labeled) — in-flight vital-sign drift built from published shifts.
Gates G1–G5: pass (G2 and G3 with the modifications below) — see "Gates".
```

## How it works

**Core loop:** input → compare with personal baseline + clinical guardrails → status → explanation → action → escalation.

1. **Baseline.** The first entries, or pre-flight values, set each astronaut's own reference. Earth cut-offs alone misfire in flight. For example, BP is 8–10 mmHg lower and core temperature about 1 °C higher ([health-indicators.md](../research/health-indicators.md)).
2. **Rules on board, no cloud.** Each rule is a readable row: indicator, condition, status, action, tier and source (NASA-STD-3001 requirement, clinical guideline or paper). Judges can see where every flag comes from (gate G3).
3. **Body map** (suggested in the brief). Each system shows:
   - its status
   - where the astronaut is in the adaptation timeline (e.g. "flight day 50: jugular flow stasis was seen in 6 of 11 crew")
   - its scheduled checks
4. **Mission routine.** The app prompts the checks NASA already schedules: daily check-in, PVT every 4th day, weekly vision self-test, and pre-landing fluid loading. A "post-flight" mode extends tracking into recovery, because bone and cognition don't return to baseline quickly ([long-duration-literature.md](../research/long-duration-literature.md)).
5. **Escalation and delay.** Each action names the tier. The flight-surgeon packet is store-and-forward and shows the current one-way delay for the chosen environment mode: Moon ~1.3 s light-time, 6–10 s in practice; Mars 3–22 min.
6. **NASA display rules.** Nominal is quiet. Caution is yellow and warning is red, always with an icon and a word. Each value shows its unit, data age and trend ([ux-human-factors.md](../research/ux-human-factors.md)).
7. **Privacy and gamification.**
   - Data is private by default.
   - There are role views for self, CMO and surgeon.
   - Streaks count the process (check-ins done, exercise minutes, fluids), never health values.

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
3. **On demand.** The astronaut can open any questionnaire or the symptom checklist at any time, e.g. when feeling unwell.

### Rendering rules

- **One question per screen,** large touch targets (NASA guidance: ≥ 9.5 mm targets with 3.2 mm gaps) and large text, because fine motor accuracy drops early in flight and many crew see less sharply ([ux-human-factors.md](../research/ux-human-factors.md)).
- **Progress and time left** are always visible; a session never surprises the crew with its length.
- **The wording and anchors** are the instrument's own (e.g. KSS 1 "extremely alert" … 9 "very sleepy, fighting sleep"). They're never paraphrased, so scores stay comparable.
- **"Why you're seeing this"** shows the trigger: scheduled or added by a rule.
- **Skip is always allowed** and recorded as "not answered", never as a value. Missed sessions don't nag: at most one reminder, then the data age shows on the body map.
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
| Added by a rule | as "due now", plus a yellow "rule" tag with a one-line reason | e.g. "PVT slower than baseline" |
| Done | tick + time | completed |
| Missed | dimmed "not answered" | window closed; the data-age note appears on the body map |

**How the crew is told**
- **One reminder when a window opens:** a banner with "Start" and "Snooze", and nothing more. NASA notes that too many alerts become a nuisance and crews stop responding ([ux-human-factors.md](../research/ux-human-factors.md)).
- **Bundling:** everything due in the same window starts with one "Start" as one session.
- **Rule-triggered items join the next session** instead of interrupting, unless the rule is urgent. Even then the banner names the reason.
- **"Due" never uses red or yellow.** Those colors are reserved for health status, so being due uses the neutral accent color. The yellow "rule" tag marks why an item was added, not urgency.

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
3. **Simulated smart dispenser (future capability).** A virtual device in the Device Simulator publishes the volume dispensed per crew member over MQTT. No evidence that such a device flies, so it's labeled "future capability" in the UI and the pitch.

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

The app prompts each step and tracks completion. The status goes into the surgeon packet.

### For the demo

The quick log plus one simulated dispenser reading, with the urine color check as a rule-triggered questionnaire step.

## External sensors: Bluetooth and Wi-Fi (all simulated)

Every input has a **manual entry** fallback. NASA accepts manual entry for the BP cuff and pulse oximeter, and Orion's kit relies on it ([existing-systems.md](../research/existing-systems.md)). Sensors are an extra, never a requirement.

**All sensors are simulated.** The team uses no real hardware. A separate **Device Simulator** app (below) plays every device. The sections below describe the real devices the simulator imitates, so the design stays true to what could fly.

### Bluetooth Low Energy: personal devices

The real devices would use the standard Bluetooth SIG GATT health services. Any certified device that implements them works without vendor SDKs. The simulator produces each device's measurement characteristic in that standard byte format [P6]:

| Indicator | GATT service | Measurement characteristic | Real device imitated |
|---|---|---|---|
| Heart rate (and RR intervals for HRV) | Heart Rate `0x180D` | Heart Rate Measurement `0x2A37` | Chest strap, watch in broadcast mode |
| SpO2 + pulse | Pulse Oximeter `0x1822` | PLX Spot-Check `0x2A5E` / Continuous `0x2A5F` | Finger oximeter |
| Blood pressure | Blood Pressure `0x1810` | Blood Pressure Measurement `0x2A35` | Arm cuff |
| Temperature | Health Thermometer `0x1809` | Temperature Measurement `0x2A1C` | Thermometer |
| Blood glucose | Glucose `0x1808` | Glucose Measurement `0x2A18` | Glucometer (manual or "future CGM module" per the checklist) |

- **Why BLE:** low power, pairs one device to one person (fits private-by-default), and has standard profiles for exactly the indicators in the brief.

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
│ Virtual devices: HR strap, oximeter,     │          │                                       │
│ BP cuff, thermometer, glucometer,        │   MQTT   │  PHG adapters ──▶ FHIR ──▶ rules ──▶  │
│ environment node, dosimeter              │ ───────▶ │  body map / alerts / surgeon packet   │
│ Scenarios + live controls                │ (local   │                                       │
└──────────────────────────────────────────┘  broker) └───────────────────────────────────────┘
```

- **What it simulates:** one virtual device per row in the BLE table, plus the environment node, the dosimeter and a smart water dispenser (labeled future capability; see "Fluid intake and hydration"). Each can be switched on or off, set to drop out, or given a low battery, so that stale-data handling is visible.
- **Where the data comes from:**
  - *Replay of real data:* RadLab radiation and EDA cabin CO2, temperature and humidity ([data-sources.md](../research/data-sources.md)).
  - *Proxy data:* PhysioNet heart rate and sleep.
  - *Labeled synthetic drift* built from published in-flight shifts, e.g. BP 8–10 mmHg lower and core temperature about +1 °C over ~2.5 months ([health-indicators.md](../research/health-indicators.md)).
- **Scenarios** (a timeline of events, run at accelerated mission time):
  - *Nominal day:* everything in range, so the crew app stays quiet.
  - *CO2 build-up:* replay of a high-CO2 window, then headache symptoms and a slower PVT.
  - *Orthostatic risk before landing:* BP and HR trend for pre-landing fluid loading.
  - *Solar particle event:* dosimeter rises toward the 30-day limit.
  - *Sensor dropout:* the oximeter goes silent and the data-age warning appears.
- **Live controls:** sliders and buttons to inject a value or start a scenario during the demo. A teammate "operates the spacecraft" while another presents the crew app.
- **Transport: one local MQTT broker** (e.g. Mosquitto, which supports MQTT over WebSocket for browsers [P5]). Each virtual device publishes on its own topic, e.g. `crew/a1/ble/0x2A37` or `module/hab/env`.
  - *BLE devices:* the payload is the characteristic's **standard GATT bytes** (base64). The crew app's BLE adapter therefore decodes the real format. Swapping in a real device later only replaces the transport (Web Bluetooth instead of MQTT), not the decoder.
  - *Wi-Fi node:* JSON, as a real ESP32 node would send.
  - *Simulator controls:* a separate topic, so scenario commands never mix with sensor data.
- **Honesty:** every simulated reading carries its source (replay / proxy / synthetic) into the FHIR `Device`, and the crew app shows it. The pitch says plainly that the devices are simulated (gate G4).

#### What MQTT does, and what it doesn't simulate

MQTT (Mosquitto) **simulates no device**. The Device Simulator simulates the devices; MQTT replaces only the **link** the data travels over between the simulator and the crew app.

| Device | In reality | In the demo | What MQTT does |
|---|---|---|---|
| BLE sensors (oximeter, BP cuff, …) | Bluetooth radio: pair, then subscribe to the GATT characteristic (*notify*) | One MQTT message per measurement on `crew/a1/ble/0x2A5E` | **Replaces the Bluetooth radio.** The payload (the GATT bytes) is identical to a real device's |
| Wi-Fi environment node | An ESP32 publishing over MQTT on the local network | The simulator publishes on `module/hab/env` | **Simulates nothing:** it's the same transport a real node would use |
| Dosimeter | The dosimeter sends its reading | RadLab replay published over MQTT | Transport, as for the Wi-Fi node |

- **Why a broker:** MQTT works through an intermediary. Senders publish to a *topic*, receivers subscribe, and neither knows the other.
  - Several crew tablets can receive the same environment reading.
  - The simulator and the crew app are built separately. The topics and payload formats are the only contract between them.
- **Why not real Bluetooth in the demo:**
  - A browser can't act as a Bluetooth device, so faking the radio would need a native app or hardware.
  - Web Bluetooth doesn't work in Safari on iPad.
  - MQTT over WebSocket works in every browser.
- **What this means for the gateway:** the BLE adapter has two parts.
  - The *transport*: MQTT today, Web Bluetooth with a real device.
  - The *GATT decoder*: the same in both cases. Only the transport changes, which is the decoupling the PHG is for.

### Personal Health Gateway: one interface for all sources

The app embeds a **Personal Health Gateway (PHG)**. That is the established name, from the Continua Design Guidelines (adopted as ITU-T H.810), for a hub that collects data from personal health devices, translates each device's protocol into a standard data model and passes it on [P1][P2]. Here the gateway runs inside the PWA, on the crew tablet or laptop, so no extra hardware is needed. It **decouples** the application from the hardware: adding or replacing a sensor means writing a new adapter, not changing the app.

```
 Simulated BLE devices ──┐  (MQTT)
 Simulated Wi-Fi node ───┤                                  ┌──▶ Rules engine ──▶ Body map / alerts
 Simulated dosimeter ────┼──▶ Adapters ──▶ PHG ──▶ FHIR ────┤
 Manual entry ───────────┘    (one per     (normalize,      ├──▶ Local store (IndexedDB)
                               source)      timestamp,      └──▶ Store-and-forward packet to flight surgeon
                                            provenance)
```

- **Adapters (device side):** one per source type.
  - *BLE device:* decodes the standard GATT characteristic bytes (table above). The transport is MQTT from the simulator; Web Bluetooth would be the transport for a real device.
  - *Wi-Fi node:* MQTT JSON.
  - *Dosimeter:* MQTT, fed by RadLab replay.
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

### Flight caveat

On a real spacecraft, every radio device needs approval for electromagnetic compatibility and frequency use. Say so in the pitch and present BLE/Wi-Fi as "if approved for the vehicle", with manual entry as the baseline. (Open lead: find the ISS/Artemis requirement document to cite.)

## Language and platform: recommendation

**Build a Progressive Web App (PWA) in TypeScript.** Use a component framework the team already knows (React or Svelte) and IndexedDB for local storage. Recommendation to confirm on Nov 14.

Why:

1. **Judges can open it.** A URL works on any laptop, tablet or phone with no install. Past winners were judged on a live demo (Demo strength score).
2. **It works offline.** A service worker caches the app and IndexedDB stores the data on the device, which covers the offline-first constraint (Crew autonomy score). The store-and-forward packet is a file or queue that syncs when a link exists.
3. **It runs on what crews actually use.** ISS and Orion apps run on tablets and laptops (EveryWear and Dose Tracker on iPad), and a PWA runs on both.
4. **Simulated sensors are reachable from any browser.** The crew app connects to the simulator's MQTT broker over WebSocket, which works in every browser, including Safari on iPad. Real BLE devices could later be added through the Web Bluetooth API.
5. **One language end to end for 6 people in 48 hours.** The UI, rules engine, adapters and charts are all TypeScript. Rules are pure functions over a JSON rule table, easy to test and to show to judges.
6. **Rich visuals are cheap.** An SVG body map, animated status and time-series charts from mature libraries.

**Web Bluetooth no longer limits the demo.** Simulating every sensor removes the browser constraint. Web Bluetooth works only in Chrome, Edge and Samsung Internet, not in Safari on iPad/iPhone or in Firefox (caniuse, checked 2026-11-06). That matters only if a real device is added later.

**Device Simulator: also TypeScript.**
- **Shared code:** it reuses the crew app's types and the GATT encoders/decoders, so the encoder and decoder are tested against each other.
- **Two parts:** a small Node.js process runs the scenario timeline and publishes to MQTT, and a web page holds the live controls.
- **The broker** (Mosquitto) runs locally, e.g. in Docker, with its WebSocket listener enabled.
- **Independence:** one teammate can build it in parallel with the crew app; the only contract between them is the MQTT topics and payload formats.

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
| G1 Answers the brief | Pass | Self-assessment + guidance. Each indicator screen answers the five questions: feasible in space (device class), why the exam, how the hazard shifts it (adaptation timeline), when to escalate (tier), what action |
| G2 Measurable in flight | Pass with modification | Only device classes that fly (oximeter, BP cuff, thermometer, HR strap, questionnaire, on-screen test, environment sensors). Glucose = manual entry / future CGM. Radiation = replay of real data, not a consumer sensor |
| G3 Citable thresholds and actions | Pass with modification | Every rule row carries its source. Vital signs use the personal baseline plus clinical guardrails (NASA-STD-3001 only says "clinically accepted values"). Environment uses NASA-STD-3001 limits |
| G4 Honest data plan | Pass | Real: RadLab, EDA cabin air, Inspiration4 panels. Proxy: PhysioNet. Synthetic: labeled in the UI and the pitch. All devices simulated, and said so; each reading carries its source |
| G5 Buildable in 48 h by 6 people | Pass if scoped | Must-have: check-in, PVT, rules engine, body map, explanation, surgeon packet, Device Simulator with 3 virtual devices (oximeter, environment node, dosimeter) and 2 scenarios. Nice-to-have: the other virtual devices, more scenarios, post-flight mode. No hardware risk on stage |

## Scores (team's first estimate, 1–5)

| Criterion | Score | Why |
|---|---|---|
| Crew autonomy | 5 | Offline PWA, on-board rules, visible delay, store-and-forward, escalation tiers |
| Crew-time burden | 4 | 1–2 min check-in; sensors remove typing; PVT every 4th day |
| NASA display conventions | 5 | Quiet when nominal, icon + word + color, value + unit + age + trend + next step |
| Privacy | 4 | Private by default, role views; per-item sharing still to be designed |
| Scientific grounding | 5 | Each rule cites NASA-STD-3001 or a paper; the adaptation timeline comes from peer-reviewed data |
| Differentiation | 4 | Interprets, explains and guides, which EveryWear doesn't. Risk: judges may see "another dashboard" if the demo doesn't show guidance |
| Demo strength | 5 | Live PVT plus a simulator operator triggering scenarios on cue; repeatable, no hardware that can fail on stage |

## Team split (suggested, 6 people)

1. Check-in flow and manual entry
2. PVT and questionnaires
3. Rules engine and the rule table with sources
4. Body map and charts
5. Personal Health Gateway: MQTT adapters, GATT decoders and the FHIR `Observation` mapping; also the **integrator** who keeps the end-to-end flow working (see "Build plan with Claude Code")
6. Device Simulator: virtual devices, scenarios, live controls and the MQTT broker; then the pitch and the AI-use log

## Build plan with Claude Code

The team builds with Claude Code. Code writing stops being the bottleneck; decisions, integration, review and the medical content become the limits. Estimates below are the team's judgment, not measurements.

### Time budget

- **Hours available:** the event runs Sat Nov 14 09:00 to Sun Nov 15 23:59 (~39 h). Realistic working time is about 24 h per person.
- **Submission:** reserve 4–5 h of that for the demo video, slides, project page and AI-use log.
- **Build:** that leaves about 19–20 h per person, roughly 115 person-hours for 6 people.
- **Without AI assistance:** the scoped build (must-haves in gate G5) is about 100 person-hours, with almost no buffer.
- **With Claude Code:** the code-heavy pieces take roughly half the time. That frees room to add back the remaining GATT decoders, the offline service worker, and maybe post-flight mode.

| Gets cheaper with Claude Code | Doesn't get cheaper |
|---|---|
| GATT decoders with tests (all 5 characteristics) | The rule table: thresholds, actions, citations need a human check |
| Device Simulator (devices, JSON scenario timelines, control page) | Integration: 6 people generating code fast make a mess faster |
| App shell, service worker, charts, SVG body map | Demo, video, pitch and judgment calls |
| FHIR-shaped JSON mapping | Reviewing generated code |

### How the team works

1. **One repo split by folders.** Each person works in their own folder, which keeps parallel Claude Code sessions from editing the same files.
   - `shared/`: types, MQTT topics, GATT codecs
   - `app/`: the crew app
   - `simulator/`: the Device Simulator
2. **Contracts first, as code.** Saturday 09:00–10:00, before anyone splits off: write the shared types (reading, FHIR-shaped `Observation`), the MQTT topic list and payload formats in `shared/`. Every session builds against that contract.
3. **A `CLAUDE.md` for the build repo** carrying the design constraints from this workspace's `CLAUDE.md`:
   - NASA display rules
   - no diagnosing LLM
   - private by default
   - data-source labels
   - cite sources from `research/`

   Draft its text in `ideas/` before Nov 14; that's planning, not code.
4. **Round-trip tests for the codecs.** The simulator encodes GATT bytes and the gateway decodes them with the same `shared/` code. Encode/decode tests are cheap and catch errors in the 16-bit float format the oximeter and BP characteristics use.
5. **One integrator.** One person merges often and keeps the end-to-end flow (simulator → broker → gateway → screen) working at all times.
6. **Rules are human-checked.** Claude Code may draft rules but can invent plausible citations. Every rule must cite a source already in `research/`, and a teammate verifies it before merge. Draft the rule table as a document before Nov 14 (research, not code).
7. **Review.** At least a skim of everything merged into `shared/` and the rules engine.

### Timeline

| When | Milestone |
|---|---|
| Sat 09:00–10:00 | Contracts in `shared/`, repo + `CLAUDE.md`, roles confirmed |
| Sat ~15:00 | One reading flows end to end: simulator → broker → gateway → screen |
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

The fallback if the team codes by hand, or Claude Code is unavailable or rate-limited. The same ~115 person-hours apply, but the scoped build needs about 100 of them, so the plan **cuts harder and fakes more behind clear labels**. Estimates are the team's judgment.

### Estimated effort (scoped build, by hand)

| Piece | Person-hours | Risk |
|---|---|---|
| App shell, routing, local storage, mock crew profile | 8 | low |
| Check-in and manual entry | 8 | low |
| PVT (3-minute reaction test) | 6 | low |
| Rules engine + about 10 rules with sources | 10 | medium: writing rules and citations takes longer than the code |
| Body map (SVG) and system list | 10 | low–medium |
| Detail screen with trend chart and explanation | 10 | low |
| Gateway: MQTT client, 1 GATT decoder, JSON adapter, FHIR-shaped mapping | 12 | medium–high |
| Device Simulator: 3 devices, 2 scenarios, controls, broker | 14 | medium |
| Surgeon packet with delay timeline | 6 | low |
| Real data prep (RadLab/EDA replay files) | 4 | low; curl calls already exist |
| Integration, bugs, demo rehearsal | 15 | high |
| **Total** | **~103** | |

### Cuts and simplifications

- **GATT:** decode only Heart Rate `0x2A37` (simple bytes). The oximeter, BP, thermometer and glucometer send plain JSON from the simulator, or use manual entry. Keep the full GATT story on the architecture slide.
- **If fewer than 3–4 people are fluent in TypeScript/React:** drop GATT decoding entirely; the simulator sends JSON for every device.
- **FHIR:** FHIR-shaped JSON (`Observation`, `Device`, gateway reference) with no FHIR library and no validation.
- **Offline:** no service worker unless there's time at the end (a plugin such as Vite PWA); state offline-first in the pitch.
- **Simulator:** 3 devices (HR or oximeter, environment node, dosimeter) and 2 scenarios (nominal, CO₂ build-up), as JSON timelines with no scenario editor.
- **Drop:** post-flight mode, role views beyond the crew view, gamification, vision self-test.
- **One environment mode:** Mars transit, with the delay shown as a fixed number.

### What stays the same as the Claude Code plan

- Repo split by folders, contracts first on Saturday morning, one integrator.
- Rule table drafted as a document before Nov 14.
- The timeline: end-to-end reading by Saturday afternoon, **feature freeze Sunday ~14:00**.
- AI-use log, which still covers the research phase.

The `CLAUDE.md` and generated-code review steps don't apply. With no buffer, the freeze matters even more.

## Open questions

- Does the Nov 13 Resources tab change the data plan?
- Agree the MQTT topic names and payload formats between the crew app and the simulator first, on Nov 14 morning; they are the only contract between the two apps.
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
- [P5] Mosquitto broker configuration (WebSocket listener: `protocol websockets`): https://mosquitto.org/man/mosquitto-conf-5.html
- [P6] Bluetooth SIG assigned numbers, characteristic UUIDs (0x2A18, 0x2A1C, 0x2A35, 0x2A37, 0x2A5E, 0x2A5F), checked 2026-11-07: https://bitbucket.org/bluetooth-SIG/public/src/main/assigned_numbers/uuids/characteristic_uuids.yaml
