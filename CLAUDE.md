# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

- NASA Space Apps 2026 team workspace, challenge "Create Health Monitoring Software for Astronauts on Space Missions". Hackathon Nov 14–15, 2026.
- Research and idea evaluation in markdown, plus the app skeleton for the lead idea (Spring Boot + React PWA). Git repo on `main`.
- Idea to implement: `ideas/crew-health-companion.md`. Every question and task in this repo relates to it unless stated otherwise.
- Nov 13: challenge Resources tab and Judging & Awards guide publish. Update `challenge.md` and `ideas/viability-checklist.md` (judging criteria are currently assumed from past years).

## Build and run

- Backend tests: `mvn test -DskipFrontend=true`. Full build with frontend: `mvn clean verify` (installs Node 22.13.0 under `target/`, runs `npm ci`, `npm run build` into `src/main/resources/static`, then `npm run test`).
- Run: `mvn spring-boot:run` serves the built PWA and `/api` on :8080. Frontend dev: `cd src/main/frontend && npm run dev` (:5173, proxies `/api` to :8080).
- Frontend only: `cd src/main/frontend && npm run test` / `npm run build`.

## Code architecture

- Backend: Kotlin + Spring Boot WebFlux, package `com.galagans.crewhealth`, one folder per domain with `api` (controller, DTOs), `application` (use cases behind interfaces), `domain` (models, repository ports), `infrastructure` (adapters). Public Spring libraries only, no LeoVegas/hyraco parent or libs.
- Frontend (`src/main/frontend/src`): `domain` (types, ports), `application` (use cases depending on ports), `infrastructure` (IndexedDB, HTTP, browser adapters), `ui` (React, services via `ServicesContext`), `container.ts` is the only place that picks concrete classes.
- Offline-first flow: the check-in is written to IndexedDB as pending, `SyncService` posts pending items to `POST /api/checkins/sync` when online (on start, after each save, on the `online` event) and marks the accepted ids synced. The server upsert is idempotent by client-generated id.
- Surgeon packet flow (#19): `PacketSender` snapshots the latest readings plus the crew note into a packet queued in its own IndexedDB database (`crew-health-packets`). `PacketUplink` POSTs each queued packet alone to `POST /api/packets`, oldest first, when online (on start, after each send, on the `online` event) and marks it sent; a failed POST stays queued. The timeline is computed on the tablet from `builtAt`, `sentAt` and the packet's stored one-way delay.
- PWA icons in `public/pwa-*.png` are the brand ring on `#CFCFCF`. Fonts (Inter, DM Mono) are bundled via `@fontsource` and precached, so the app looks the same offline.
- Follow SOLID as defined in `ideas/crew-health-companion.md` ("Engineering principles: SOLID"): interfaces only at boundaries or with a second implementation; new rules, devices and questionnaires are added as rows, adapters or files, not by editing existing branches.
- UI follows `ideas/ui-guidelines.md` and only uses the tokens and classes in `src/main/frontend/src/ui/theme/` (light and dark). The feature's mockup in `ideas/mockups/` gives layout and content, not colours or sizes (the mockups are dark-only and use smaller text). Fonts are bundled (`@fontsource`), never a CDN. Icons come from `src/main/frontend/src/ui/icons.tsx` by concept (Tabler outline plus canvas-drawn gaps; sheet in `ideas/mockups/icons.png`), never straight from `@tabler/icons-react`.
- The crew loop (gateway, rules engine, statuses, explanations) runs in the frontend. The backend is the ground station: it receives, stores and shows; never put crew-facing rules there.

## Issue workflow

- Skills in `.claude/skills/`: `feature-evaluate` (read-only verdict on a suggested feature: adopt, modify, merge, pitch only or reject), `issue-create` (spec an issue, checked by the `spec-skeptic` agent), `issue-implement` (test first, one AC at a time, open a PR), `issue-orchestrate` (several issues in parallel: one `issue-implementer` agent per issue in its own git worktree, in conflict-free waves), `issue-merge` (gates: build green, mergeable, no changes requested), `solid-principles` (project coding rules). Tracker and labels: `.claude/skills/issue-create/TRACKER.md`.
- No code-review agents yet; the PR review is human.

## Layout

- `README.md`: file index plus the 13 research conclusions that constrain every idea. Read it first.
- `challenge.md`: verbatim challenge text, dates, rules. The brief's five questions (feasible in space, why the exam, how the hazard shifts the value, when to escalate, what action) are the core judging lens.
- `research/*.md`: evidence by topic. Each file opens with "Key takeaways for the team" and ends with "Sources". Some have a "Second-pass findings" section and "Open leads".
- `research/Health Palette Prototype.html`: palette design (colour tokens, light/dark mockups, WCAG contrast board). It's a self-unpacking bundle, so read the summary in `research/ux-human-factors.md` "Team palette" instead of parsing it.
- `ideas/viability-checklist.md`: gates G1–G5, scoring criteria, common fixes and the idea template. Every team idea goes through it.
- `ideas/crew-health-companion.md`: lead idea (daily check-in, body map, rules engine, Device Simulator, surgeon packet), with mockups in `ideas/mockups/*.png`. Mockup sources: `ideas/mockups/src/*.html` with palette tokens in `base.css`; re-render with `ideas/mockups/src/render.sh`.
- `ideas/features.md`: every feature of the lead idea in plain words, glossary, build order. Each built feature has a `Status:` line: `Implemented.` when done, otherwise what works and `Missing: …`.
- `docs/features/<n>-<slug>.md`: one per implemented UI issue, with screenshots of each state from the running app (`docs/features/img/`), the mockup it follows and deviations. Screenshots retaken by `docs/features/<n>-<slug>.shots.mjs` using `tools/cdp.mjs`.
- `ideas/ui-guidelines.md`: UI and UX rules from the palette canvas. Tokens live in `src/main/frontend/src/ui/theme/` (`tokens.css`, `base.css`); components use tokens and classes, never hex. Run its §8 checklist on every UI change.
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
