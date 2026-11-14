# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

- NASA Space Apps 2026 team workspace, challenge "Create Health Monitoring Software for Astronauts on Space Missions". Hackathon Nov 14–15, 2026.
- Markdown research and idea evaluation only. No code, build, lint or test commands exist yet. Git repo on `main`.
- Event rule: no project code before Nov 14. Until then, don't scaffold apps, write prototype code or pick a stack; keep work to research and idea evaluation.
- Nov 13: challenge Resources tab and Judging & Awards guide publish. Update `challenge.md` and `ideas/viability-checklist.md` (judging criteria are currently assumed from past years).
- The submission must describe AI tool use. Append a row to `ai-log.md` for every session that changes files.

## Layout

- `README.md`: file index plus the 13 research conclusions that constrain every idea. Read it first.
- `challenge.md`: verbatim challenge text, dates, rules. The brief's five questions (feasible in space, why the exam, how the hazard shifts the value, when to escalate, what action) are the core judging lens.
- `research/*.md`: evidence by topic. Each file opens with "Key takeaways for the team" and ends with "Sources". Some have a "Second-pass findings" section and "Open leads".
- `research/Health Palette Prototype.html`: palette design (colour tokens, light/dark mockups, WCAG contrast board). It's a self-unpacking bundle, so read the summary in `research/ux-human-factors.md` "Team palette" instead of parsing it.
- `ideas/viability-checklist.md`: gates G1–G5, scoring criteria, common fixes and the idea template. Every team idea goes through it.
- `ideas/crew-health-companion.md`: lead idea (daily check-in, body map, rules engine, Device Simulator, surgeon packet), with mockups in `ideas/mockups/*.png`.
- `spaceChallenges.md`: unsourced overview table with mangled journal citations. Don't cite it; trace claims to `research/` instead.

## Writing research and ideas

- Every claim needs a source in the file's Sources section. Mark checked URLs/APIs with the verification date (e.g. "verified 2026-11-06").
- Cite exact identifiers where they exist: NASA-STD-3001 requirement numbers (`[V1 3004]`), OSDR study IDs (`OSD-569`), HRP risk names.
- Data honesty: no public in-flight astronaut vitals exist. Real data = OSDR RadLab radiation, ISS cabin environment, Inspiration4 blood panels, terrestrial proxies (PhysioNet, NHANES). Label everything else synthetic.
- Cross-reference with relative links between `research/` and `ideas/` instead of duplicating content.

## Probing data sources

Tested curl calls live in `research/data-sources.md` (§1 table, §7 parsing). Reuse them, don't rebuild them. Known quirks:

- RadLab API: request columns as bare field names (`absorbed_dose_rate=`). `fields+=` from the tutorial fails, and a request with no field returns HTTP 500 "No columns specified".
- OSDR EDA cabin CO2/temperature/humidity data has no data endpoint. It's JSON embedded in `<script id="data">` on `…/eda/dashboard_{mission}` pages.
- ISS TEPC dose: use the CDAWeb HAPI CSV (`ISS_DOSANL_TEPC`), not the CDF files.

## Design constraints any idea or build must respect

Sourced in `README.md` and `ideas/viability-checklist.md`:

- Inputs only from device classes that fly (watch/actigraph, BP cuff, pulse ox, thermometer, ECG, dosimeter, questionnaire, on-screen test, camera), or labeled future capability. Glucose = manual entry or future CGM module.
- Thresholds from NASA-STD-3001, clinical guidelines or the astronaut's own in-flight baseline. Earth cut-offs alone misfire in flight. Each flag maps to a documented action.
- Offline-first, store-and-forward to the flight surgeon, visible comms delay. Escalation: self-care → CMO → private medical conference → urgent ground.
- NASA display rules: red = warning, yellow = caution, never color alone, quiet when nominal, explain what/why/how decided/what next.
- Private by default, role-based views, no leaderboards on health values. Gamify the process (check-ins, exercise minutes), not the values.
- No emotion inference from face or voice, no diagnosing LLM. On-board rules with optional AI explainer and "decision support" wording.
- Differentiate from CNES EveryWear, which already flies and logs but doesn't interpret or guide.
