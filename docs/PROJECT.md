# Crew Health Companion

NASA Space Apps Challenge 2026, challenge **"Create Health Monitoring Software for Astronauts on Space Missions"** ([challenge.md](../challenge.md)). Team Galagans, built Nov 14–15, 2026.

> Decision support, not diagnosis. Every status comes from a readable rule table with a cited source. No AI decides anything about the astronaut's health.

## 1. The problem

On a long mission the astronaut has to notice health changes in themselves. Doctors on Earth answer late (Mars: ~3–22 min one way, plus blackouts) and can't come to help. NASA names the gap: NASA-STD-3001 [V1 3004] already requires on-board "assessing, recording, monitoring, and trending" of vital and behavioural signs, and HRP rates "Earth Independent Human-Systems Operations" 5×5 for Mars, with "intelligent support software" as a named mitigation ([research/nasa-hrp.md](../research/nasa-hrp.md) §5).

The one crew health app that already flies, CNES EveryWear (ISS since 2016, Artemis II), logs and messages but doesn't interpret or guide ([research/existing-systems.md](../research/existing-systems.md)). That's the space Crew Health Companion fills.

## 2. The solution in one paragraph

Crew Health Companion is an offline-first tablet app the astronaut uses for 1–2 minutes a day. It collects readings from flight-class devices (wrist bracelet, pulse oximeter, BP cuff, thermometer, cabin environment node, dosimeter), a morning questionnaire and a 3-minute reaction test. It compares each value with NASA-STD-3001 limits, clinical guardrails or **the astronaut's own pre-flight baseline**, and on every flag says in plain words: what changed, why it matters, how the app decided (rule and source), what to do next and who to involve, following the real escalation ladder self-care → Crew Medical Officer → private medical conference → urgent ground. A summary packet goes to the flight surgeon store-and-forward, with the communication delay visible.

### How it answers the brief's five questions

| Brief question | Where the app answers it |
|---|---|
| Which measurements can be performed in space? | Only device classes that fly today (§4.2 devices), the PVT the ISS crew already does, standard questionnaires |
| Why is an exam needed? | Detail screen "Why it matters"; hazard lens captions (which checks watch each hazard) |
| How do spaceflight hazards affect the indicators? | Hazard lens on the five HRP hazards; rule texts note in-flight shifts (temperature +1 °C, BP lower, PVT slowing early in flight) |
| When does a result warrant attention from crew or ground? | 0–5 alert levels, each rule row carries its escalation tier |
| What actions prevent a critical condition? | "What next" per rule, re-measure guidance, "Reporting is a win" completion with next steps |

## 3. Architecture

```
 Device Simulator ──┐                                     ┌── ESP32 dot display
 (/simulator.html)  │   WebSocket relay /ws/devices       │   (crew/a1/dot-display)
 publish-*.mjs  ────┼──► Spring Boot "spacecraft LAN" ◄───┤
                    │                                     └── Backend health engine (rules.json)
                    ▼
        Crew app (React PWA, iPad, offline-first)
        gateway → FHIR-shaped Observations (IndexedDB)
        rules engine → statuses → explanations
        check-ins / PVT / packets queued locally
                    │  store-and-forward when online
                    ▼
        Ground station (Spring Boot): POST /api/checkins/sync, POST /api/packets

        Voice host (podman, optional): whisper.cpp STT · Qwen3.5-4B (llama.cpp) · Piper TTS
```

- **Crew app** (`src/main/frontend`): React + TypeScript PWA, hexagonal layout (`domain`, `application`, `infrastructure`, `ui`; `container.ts` wires concrete classes). The whole crew loop (gateway, rules engine, statuses, explanations) runs on the tablet, so it works with no link to Earth.
- **Ground station** (`src/main/kotlin`, Kotlin + Spring Boot WebFlux): receives and stores synced check-ins and surgeon packets, relays device frames. It never runs crew-facing rules, with one documented exception: the health engine that feeds the dot display.
- **Device link**: a WebSocket relay standing in for the spacecraft LAN. No broker, no Docker.
- **Hardware**: PlatformIO firmware for a Waveshare ESP32-C6 1.47" display (`src/main/hardware/dot-display`).
- **Voice host** (`voice-host/compose.yaml`): three local servers on a laptop-class host, so voice works offline from Earth.
- Engineering rules: SOLID, test first; a new rule, device or questionnaire is a new row, adapter or file, not an edit of existing branches.

Run everything with `./app.sh` (voice host, backend, dev server; open `:5173`). Details in [CLAUDE.md](../CLAUDE.md) "Build and run".

## 4. Implemented features

Feature IDs (F1…F26) come from [ideas/features.md](../ideas/features.md), which holds the full status line of each. Every built UI issue has a page with screenshots in [docs/features/](features/).

### 4.1 The daily loop

| Feature | What it does | Docs |
|---|---|---|
| **F1 Morning check-in** | Six steps, one question per screen: heart rate, SpO₂, sleep hours, Karolinska Sleepiness Scale (1–9), mood 1–5, symptom checklist (headache, congestion, rash, neck/face swelling, back pain). Progress and time left, Skip always allowed. HR and SpO₂ are prefilled from the newest device reading (≤ 15 min) for the astronaut to confirm or correct. Can be done hands-free by voice | [#29](features/29-check-in-questionnaire.md), [#55](features/55-check-in-device-prefill.md), [#64](features/64-voice-check-in.md) |
| **F2 Offline-first sync** | Check-ins saved to IndexedDB as pending; `SyncService` posts them to the ground station when online (on start, after each save, on `online`); idempotent upsert by client id | [#1](features/1-spo2-core-loop.md) |
| **F3 Personal baseline** | Pre-loaded pre-flight profile (synthetic, labelled so): PVT median 265 ms, resting HR 61 bpm. Drawn on the charts as "your pre-flight normal" | [#28](features/28-personal-baseline.md), [#35](features/35-resting-hr-drift.md) |
| **F4 Rules engine** | `rules.json`, 23 rows, validated on load, evaluated after each save, each device reading and every 60 s. A system shows its most severe match. Every row cites its source (table in §5.2) | [#1](features/1-spo2-core-loop.md), [#17](features/17-cognition-rule.md), [#43](features/43-demo-mock-modes.md) |
| **F5 Detail screen** | Level badge, trend chart with rule thresholds and baseline, smooth line with a crosshair readout (value, level, age, UTC time, source), then **what / why / how decided / source / what next** and the four escalation tiers with the rule's tier selected | [#9](features/9-detail-screen.md), [#48](features/48-smooth-trend-chart.md) |
| **F6 Body map and body systems** | Body figure traced from the team's drawings, each system marked by its app icon (brain, eye, lungs, heart, kidneys, bone), six labels that stay quiet when nominal and show the level badge at levels 2–5, icons outlined blue when an input is owed; Body systems list (Respiratory, Cognition, Cabin air, Radiation, Cardiovascular, Immune, plus labelled synthetic placeholders for Sleep, Bone & muscle, Vision, Kidney); Latest readings tiles with unit, data age and source | [#4](features/4-body-systems-list.md), [#7](features/7-latest-readings.md), [#14](features/14-hazard-lens.md), [#61](features/61-body-figure.md) |
| **Alert levels 0–5** | Nominal, To do, Watch, Check, Treat, Emergency, modelled on NASA caution and warning classes. Colour only for these levels, always with a Tabler icon and a word; the rest of the UI is neutral greys | [#33](features/33-alert-levels.md), [ideas/alert-levels.md](../ideas/alert-levels.md) |
| **App shell and Home variants** | Every screen on one iPad layout (side context panel, one or two panes). Home switches between **To do** (check-in or PVT owed, with the owed readings first) and **Nominal** (Today's routine, Latest readings) | [#52](features/52-app-shell-home-variants.md), [ideas/home-variants.md](../ideas/home-variants.md) |
| **Navigation bar** | Home, Stats, centre + (Morning check-in, Log symptoms), Rewards, Ground | [#46](features/46-nav-bar.md), [#57](features/57-nav-bar-ground.md) |

### 4.2 Inputs

| Feature | What it does | Docs |
|---|---|---|
| **F7 PVT reaction test** | 3-minute PVT-B (stimulus every 2–5 s): median RT, lapses (≥ 355 ms), false starts (< 130 ms). Saved offline as "in-app test", feeds COG-01 | [#16](features/16-pvt-test.md), [#17](features/17-cognition-rule.md) |
| **F8 Device Simulator** | `/simulator.html`: one section per device (pulse oximeter, wrist bracelet, BP cuff, thermometer, environment node, dosimeter) with a level picker, period, Stop/Start and Send now. Values are drawn inside the chosen level's range, derived from the rule rows. A **Cabin atmosphere fault** scenario raises CO₂, then SpO₂ and heart rate after a delay. Every reading is labelled `synthetic` | [#25](features/25-device-simulator.md), [#43](features/43-demo-mock-modes.md), [#53](features/53-sim-scenarios.md) |
| **F9 Personal Health Gateway** | One gateway per device validates each JSON frame and stores a FHIR-shaped `Observation` with source and timestamp. Topics: `crew/a1/oximeter`, `crew/a1/wrist/hr`, `crew/a1/bp`, `crew/a1/thermometer`, `module/hab/env`, `module/hab/dose` | [#22](features/22-phg-oximeter.md) |
| **Demo and mock modes** | DEMO_MODE (1-minute chart, 10 min of readings) and MOCK_MODE (in-browser device feed for the GitHub Pages build, with random non-nominal episodes) | [#43](features/43-demo-mock-modes.md) |

### 4.3 What makes it different

| Feature | What it does | Docs |
|---|---|---|
| **F12 Hazard lens** | Five toggles, one per NASA HRP hazard (radiation, isolation & confinement, distance from Earth, gravity fields, hostile closed environment). The selected hazard marks the body systems it affects, with a caption: what it does, which checks watch it, its source. Never hides a flag or changes a status | [#14](features/14-hazard-lens.md), [#52](features/52-app-shell-home-variants.md) |
| **F13 Reporting is a win** | Saving a check-in shows "Logged: headache (day 2). Thanks for reporting.", a next step per symptom and a routine streak that counts the process, never health values. Symptom days count as done; paused days never reset it | [#40](features/40-reporting-win.md) |
| **F14 Surgeon packet with comms delay** | Snapshot of the latest readings, flagged items (level, rule, tier) and a crew note, queued in IndexedDB and sent store-and-forward to `POST /api/packets`. Timeline shows built, sent and arrival with a demo one-way delay of 14 min 05 s (inside the Mars range). Ground tab lists every packet and its delivery state | [#19](features/19-surgeon-packet.md), [#57](features/57-nav-bar-ground.md) |
| **F15 Today's routine** | Morning check-in window (07:00–09:00) with Start / done / not answered, PVT every 4th day, synthetic exercise, fluids and Bedford rows | [#10](features/10-todays-routine.md) |
| **F25 Local voice assistant** | Mic button gives a spoken briefing worded by the app from the rules (each alert most severe first, then nominal, missing data, what's owed). Voice opens screens and runs the whole morning check-in on screen: asks each step, takes "yes" for a device-prefilled value, stores only on "save"; a tap always wins. The LLM only maps speech to commands and values; no tone or emotion analysis. ~1 s to transcribe, 1.0–1.2 s to pick a command on a laptop | [#37](features/37-voice-briefing.md), [#64](features/64-voice-check-in.md), [research/voice-assistant.md](../research/voice-assistant.md) |
| **F26 Dot display (ESP32)** | A glanceable 1–6 dot status on a Waveshare ESP32-C6, coloured by alert level, with NO CONNECTION, data age and dimming. The backend health engine judges every device frame with the same `rules.json` and publishes `{pct, level, metrics}` once a second, so it works without the tablet. Browser twin at `/device/simulation` and `/device/websocket` | [#45](features/45-dot-display-status.md) |

### 4.4 Supporting work

- **Brand and splash**: canvas splash, iPad launch images and home-screen icons; palette with WCAG contrast checks ([ideas/ui-guidelines.md](../ideas/ui-guidelines.md)).
- **Demo iPad over the LAN**: HTTPS dev server with a local CA so the iPad microphone works (`tools/dev-cert.sh`).
- **One-command run**: `./app.sh`.
- **Presentation**: [docs/presentation/six-dots-companion.pdf](presentation/six-dots-companion.pdf) (also `.pptx`).

### 4.5 Not built (pitch only)

- F11 adaptation corridor: expected change per flight day around the baseline. Designed and mocked for PVT (+9 ms on flight days 1–60 from Dev et al. 2024), see [docs/features/69-pvt-adaptation-corridor.mock.html](features/69-pvt-adaptation-corridor.mock.html). Not in the app yet.
- F10 real data replay (OSDR EDA cabin CO₂, RadLab radiation) in the simulator: the download calls are tested ([research/data-sources.md](../research/data-sources.md)), the replay isn't wired.
- F22 check-and-act card, F23 medical conference agenda, F16 systems schematic, F17 hydration, F18 pre-landing fluid loading, F19 Playbook note, F20 role views, F24 FHIR R4 export.

## 5. NASA resources used

### 5.1 Challenge Resources tab

| Resource | How we used it |
|---|---|
| [5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) | The hazard lens (F12): one toggle per hazard, effect captions quoted from it (`domain/hazards.ts`) |
| [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/) and the [Human Research Roadmap](https://humanresearchroadmap.nasa.gov/Risks/) | Which body systems and indicators to cover; likelihood × consequence per mission type ([research/nasa-hrp.md](../research/nasa-hrp.md) §2) |
| [Ongoing HRP Research in Space](https://www.nasa.gov/hrp/ongoing-hrp-research/) | Artemis II studies and devices flown, to keep inputs to flight-class devices ([research/existing-systems.md](../research/existing-systems.md)) |
| CSA, [Monitoring Radiation for Astronaut Health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) | Dosimeter as a device and the Radiation system ([research/other-agencies.md](../research/other-agencies.md) §1) |

### 5.2 Standards and briefs behind the rule table

Every rule's "How decided" text names its source; Earth cut-offs say so explicitly.

| Rules | Threshold | Source |
|---|---|---|
| CAB-01 | Cabin CO₂ 1-h average > 3 mmHg → Check | NASA-STD-3001 [V2 6004]; [OCHMO-TB-004 Carbon Dioxide](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf) |
| CAB-06 | CO₂ > 2.5 mmHg → Watch | OCHMO-TB-004 (headache risk < 1 % below 2.5 mmHg); applying it to the 1-h average is a team heuristic |
| CAB-02..05 | Cabin temperature 18–27 °C, humidity 25–75 % RH | [NASA-STD-3001 Vol 2 Rev F](https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf) |
| RAD-01/02 | 30-day blood-forming-organ dose > 125 / > 250 mGy-Eq | [NASA-STD-3001 Vol 1 Rev C](https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf) 30-day limit [V1 4031]; 50 % caution is a team heuristic |
| RAD-03 | Dose rate > 0.9 mSv/day | NASA-STD-3001 [V1 4033] surface habitat design limit; matches the ISS TEPC baseline we computed (0.90 mSv/day) |
| COG-01 | PVT median > pre-flight baseline + 15 % | PVT-B protocol (Basner, Mollicone, Dinges 2011), ISS Reaction Self Test (Jones et al. 2022), early-flight slowing in ISS crews (Dev et al. 2024, *Front Physiol*) |
| CV-03 | Daily resting HR ≥ baseline + 8 bpm on 3 days → Watch | In-flight 24-h HR barely changes (Norsk et al. 2015); [OCHMO-MTB-009 Circadian Desynchrony](https://www.nasa.gov/wp-content/uploads/2026/03/ochmo-mtb-009-circadian-desynchrony.pdf) for the countermeasure; threshold is a team heuristic |
| SPO-01/02, CV-01/02, BP-01..07, TMP-01 | SpO₂, heart rate, AHA 2017 BP bands, fever 38 °C | Earth clinical conventions, labelled "not a NASA in-flight limit"; in-flight shifts noted (BP lower, core temperature ~1 °C higher) |

Full source lists: [research/health-indicators.md](../research/health-indicators.md) (Sources), [research/nasa-hrp.md](../research/nasa-hrp.md) (Sources).

### 5.3 Display and interaction rules

| Resource | How we used it |
|---|---|
| NASA-STD-3001 Vol 2 [V2 10045, 10114–10119] | Red = warning, yellow = caution, never colour alone (icon + word on every level), stale data flagged |
| [NASA Human Integration Design Handbook](https://www.nasa.gov/wp-content/uploads/2015/03/human_integration_design_handbook_revision_1.pdf) | Caution and warning classes behind the 0–5 alert levels; quiet when nominal; colour-blind-safe palette |
| [CLDP HSI Workshop: Alerts (2024)](https://ntrs.nasa.gov/api/citations/20240003565/downloads/CLD%20HSI%20Workshop%20Alerts.pdf) | Alert classes and tones for the level model |
| ExMC clinical decision support ([Russell et al. 2023](https://doi.org/10.1038/s41526-023-00284-1)) | Every flag explains what, why, how decided and what next |
| NASA-STD-3001 Vol 1 (two CMOs per vehicle), [OCHMO-MTB-004](https://www.nasa.gov/wp-content/uploads/2025/09/ochmo-mtb-004-space-adaptation-sickness-sas.pdf) (ISS private medical conference schedule) | Escalation ladder: self-care → CMO → private medical conference → urgent ground ([research/countermeasures.md](../research/countermeasures.md)) |

### 5.4 Data, mission context and comms delay

| Resource | How we used it |
|---|---|
| [NASA OSDR](https://osdr.nasa.gov/bio/repo/search/): RadLab API, Environmental Data App, Inspiration4 (OSD-569, OSD-575) | Probed with live API calls to set realistic ranges: ISS cabin CO₂ median ≈ 2.3 mmHg, ISS dose ≈ 0.90 mSv/day, Mars surface ≈ 0.22 mGy/day ([research/data-sources.md](../research/data-sources.md)). Replay in the simulator not built |
| ISS TEPC dose via CDAWeb HAPI (`ISS_DOSANL_TEPC`) | Radiation baseline for RAD-03 |
| HRP comms delay and autonomy ([nasa-hrp.md §5](../research/nasa-hrp.md)) | Offline-first design, store-and-forward, Mars one-way delay used in the packet timeline |
| [Spaceflight Standard Measures](https://www.nasa.gov/reference/standard-measures/), Cognition battery | Why the PVT is the in-app objective test and why monitoring is scheduled, not continuous |
| [NASA Twins Study](https://www.nasa.gov/humans-in-space/nasas-twins-study-results-published-in-science-journal/), long-duration literature | Time course of changes; support for personal baselines ([research/long-duration-literature.md](../research/long-duration-literature.md)) |
| [Integrated Medical Model](https://www.nasa.gov/nasa-integrated-medical-model-imm-overview/) | Focus on likely problems (insomnia, headache, rash) in the symptom checklist |

## 6. Data honesty

- No public in-flight astronaut vital signs exist. All device readings are simulated and labelled `synthetic` on every tile, chart point and packet.
- The pre-flight baseline is a synthetic profile, labelled as such on the charts.
- Placeholder systems (Sleep, Bone & muscle, Vision, Kidney) and routine rows (exercise, fluids, Bedford) are labelled "synthetic".
- Team heuristics (CAB-06 on a 1-h average, RAD-01 at 50 %, CV-03, the dot display `pct`) say so in their rule text.

## 7. Privacy and safety

- Health data stays on the tablet and goes only to the flight surgeon in the packet. No leaderboards; streaks count the process, never values.
- No diagnosing LLM, no emotion inference from face or voice. Voice only maps speech to commands and values the astronaut confirms.
- Emergency rules (SpO₂ < 90 %, severe BP, radiation above the 30-day limit) route to "CMO now and notify ground", never to self-care tips.

## 8. Use of AI tools

Research, specs and code were produced with Claude (Anthropic) via Claude Code: research legs with cited, dated sources in `research/`, issue specs reviewed by an adversarial spec agent, implementation test first with one agent per issue in its own git worktree, human review on every PR. Claude played no part in health decisions inside the app; the on-board voice model (Qwen3.5-4B, local) only parses commands.

## 9. Repository map

| Path | Content |
|---|---|
| [README.md](../README.md) | File index and the 13 research conclusions |
| [challenge.md](../challenge.md) | Challenge text, Resources tab, rules |
| [research/](../research/) | Evidence by topic, each with Sources |
| [ideas/crew-health-companion.md](../ideas/crew-health-companion.md) | Full design of the idea |
| [ideas/features.md](../ideas/features.md) | Every feature, status and build order |
| [docs/features/](features/) | One page per implemented UI issue with screenshots |
| `src/main/frontend` | Crew app, Device Simulator, dot display twin |
| `src/main/kotlin` | Ground station, device relay, health engine |
| `src/main/hardware/dot-display` | ESP32 firmware |
| `voice-host/` | Local STT, LLM and TTS servers |
