# NASA Space Apps 2026 — Astronaut Health Monitoring

Team workspace for the challenge **"Create Health Monitoring Software for Astronauts on Space Missions"**. Hackathon **Nov 14–15, 2026**. Challenge resources and the judging guide publish **Nov 13**.

> Submissions must describe how AI tools were used; this research was compiled with Claude (Anthropic). The app skeleton for the lead idea lives in `src/` (see `CLAUDE.md`).

## Files

| File | What's in it |
|---|---|
| [challenge.md](challenge.md) | Full challenge text, dates, rules, partner agencies |
| [research/nasa-hrp.md](research/nasa-hrp.md) | NASA Human Research Program: 5 hazards, 21 risks scored per mission type, NASA-STD-3001 limits, Standard Measures, IMM, comms delay |
| [research/health-indicators.md](research/health-indicators.md) | 25 indicators: in-flight device, frequency, normal range, in-flight shift, attention threshold, consumer proxy; ranked list for a prototype |
| [research/countermeasures.md](research/countermeasures.md) | What the crew should do: countermeasures, medical kits, escalation ladder |
| [research/data-sources.md](research/data-sources.md) | Real data we can use (OSDR, RadLab radiation, Inspiration4 blood panels, PhysioNet proxies) with tested API calls |
| [research/existing-systems.md](research/existing-systems.md) | How ISS and Artemis manage crew health today, wearables flown, AI assistants, past Space Apps entries, gaps |
| [research/other-agencies.md](research/other-agencies.md) | CSA, ESA, CNES, DLR, JAXA, IBMP, ISRO, CNSA, MBRSC and others: devices, apps, analogs, public resources |
| [research/long-duration-literature.md](research/long-duration-literature.md) | Peer-reviewed findings by body system: how much changes, when, and how long recovery takes (bone, muscle, brain, veins, cognition, immune, kidney, Twins Study, Mars-500) |
| [research/ux-human-factors.md](research/ux-human-factors.md) | NASA display and caution/warning rules, crew time, privacy, gamification evidence, UX checklist |
| [research/voice-assistant.md](research/voice-assistant.md) | F25 voice assistant: offline speech-to-text and read-aloud in the browser, small local LLMs and runtimes, minimal stack for the spike |
| [research/Health Palette Prototype.html](research/Health%20Palette%20Prototype.html) | Palette design: Splash and Today mockups (light/dark) plus a WCAG contrast check of every colour pairing. Summary in [ux-human-factors.md](research/ux-human-factors.md#team-palette-health-palette-prototype) |
| [ideas/viability-checklist.md](ideas/viability-checklist.md) | Gates and scores to test each idea, common fixes, idea template |
| [ideas/crew-health-companion.md](ideas/crew-health-companion.md) | Lead idea under evaluation: daily check-in, body map, rules engine, Device Simulator, surgeon packet, with mockups in `ideas/mockups/` |
| [ideas/features.md](ideas/features.md) | Every feature of the lead idea in plain words for non-experts, a glossary, and the build order |
| [ideas/ui-guidelines.md](ideas/ui-guidelines.md) | UI and UX guidelines from the palette canvas: tokens, type, components, status colours, contrast, checklist for UI pull requests |
| [ideas/health-categories.md](ideas/health-categories.md) | Six health categories grouping every collected value by the main long-mission issue, with exposures as context |
| [ideas/alert-levels.md](ideas/alert-levels.md) | Six alert levels (0 nominal → 5 emergency): meaning, icon, routing, colour tokens with contrast and colour-blind checks |
| [ideas/home-variants.md](ideas/home-variants.md) | Home's Nominal and To do variants on the iPad app shell: what each pane holds, when an input is owed, the To do items |

## What the research says (shapes every idea)

1. **The gap is real and NASA names it.** Today the ground interprets crew health; NASA says exploration needs a "flight-based paradigm". NASA-STD-3001 [V1 3004] already requires on-board "assessing, recording, monitoring, and trending" of vital and behavioral signs.
2. **A crew health app already flies** — CNES EveryWear (ISS since 2016, Artemis II). It logs and messages; it doesn't interpret or guide. That's our space.
3. **Monitoring is scheduled, not continuous**: weekly private medical conference, monthly cognition and questionnaires, eye exams and blood draws at set flight days, actigraphy worn constantly. Prompting this routine is realistic.
4. **Earth thresholds misfire in flight.** Compare against each astronaut's own in-flight baseline, with clinical guardrails.
5. **Strongest indicators for a demo**: sleep + fatigue (3-min PVT), heart rate/HRV, self-reported mood, vision self-checks (SANS affects ~70%), blood pressure with landing readiness, cabin environment (CO2, noise, light), radiation dose.
6. **Blood glucose is in the brief but not routinely measured in flight** — treat it as manual entry or a future CGM module.
7. **No public in-flight astronaut vitals exist.** Real open data: OSDR RadLab radiation time series (ISS, Mars surface, Artemis I), ISS cabin CO2/temperature/humidity (OSDR environmental dashboards), Inspiration4 blood panels with reference ranges, terrestrial proxies. Everything else is labeled synthetic.
8. **Autonomy under delay**: Moon ~1.3 s light-time (6–10 s in practice), Mars ~3–22 min one-way plus blackouts. Offline-first, store-and-forward to the flight surgeon. Mirror the real ladder: self-care → Crew Medical Officer → private medical conference → ground.
9. **Design for the likely problems, not the dramatic ones.** NASA's medical risk model: on a 6-month station flight, insomnia (91% chance per crew member), skin rash (82%), space motion sickness (73%), headache (59%). Kidney stones and urosepsis drive evacuations. Exercise (~600 min/week), hydration, light timing and pre-landing fluid loading are the everyday countermeasures an app can coach.
10. **Software decision aids are credible winners**: NASA already logs crew medication with an iPad app (Dose Tracker), and CSA's $500k Deep Space Healthcare Challenge was won by a guidance app (EZResus).
11. **NASA display rules**: red = warning, yellow = caution, never color alone; quiet when nominal; explain what, why, how decided, what next.
12. **Privacy and honesty beat gamified pressure**: medical data stays between astronaut and flight surgeon; astronauts under-report symptoms, so no leaderboards on health values.
13. **Past Space Apps winners near this topic** grounded their work in real NASA data or protocols; sensor concepts with invented hardware never got past nominee. Past health challenges' Resources tabs listed HRP pages, OSDR, LSDA and CSA pages — never a ready-made vitals dataset — so expect the same on Nov 13.

## Next steps

1. Each teammate writes their idea with the template in [ideas/viability-checklist.md](ideas/viability-checklist.md); we test them against the gates and the research.
2. Nov 13: read the challenge Resources tab and the Judging & Awards guide; update this folder.
