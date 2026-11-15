# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

- NASA Space Apps 2026 team workspace, challenge "Create Health Monitoring Software for Astronauts on Space Missions". Hackathon Nov 14–15, 2026.
- Research and idea evaluation in markdown, plus the app skeleton for the lead idea (Spring Boot + React PWA). Git repo on `main`.
- Idea to implement: `ideas/crew-health-companion.md`. Every question and task in this repo relates to it unless stated otherwise.
- Nov 13: challenge Resources tab and Judging & Awards guide publish. Update `challenge.md` and `ideas/viability-checklist.md` (judging criteria are currently assumed from past years).

## Build and run

- One command: `./app.sh` starts the voice host (podman), the backend and the Vite dev server in the foreground; open :5173. Ctrl+C stops all three (voice containers removed, model volume kept). Voice is optional: without podman or an 8 GB Podman VM the banner says why and the app runs without it. Fails fast if :8080 or :5173 is busy.
- Backend tests: `mvn test -DskipFrontend=true`. Full build with frontend: `mvn clean verify` (installs Node 22.13.0 under `target/`, runs `npm ci`, `npm run build` into `src/main/resources/static`, `npm run check-build`, then `npm run test`).
- Run: `mvn spring-boot:run` serves the built PWA and `/api` on :8080. Frontend dev: `cd src/main/frontend && npm run dev` (:5173, proxies `/api` and `/ws` to :8080).
- Frontend only: `cd src/main/frontend && npm run test` / `npm run build`.
- F25 voice host: `podman compose -f voice-host/compose.yaml up -d --build` (or `docker compose`). LLM (llama.cpp, Qwen3.5-4B) on :8081, whisper-server on :8082, Piper read-aloud on :8084; the Vite dev server proxies them under `/voice/llm`, `/voice/stt`, `/voice/tts`, so voice works only with `npm run dev` (the built app on :8080 shows "Voice host unreachable"). Needs a Podman VM with 8 GB (`podman machine set --memory 8192`). The first start downloads the model (~2.7 GB) into a volume.
- Frontend tests need Node 22 (`target/node/node`, installed by the Maven build). On Node 25+, `localStorage` is undefined in jsdom and the theme and hazard-lens tests fail.
- Splash: after changing the `#splash` markup in `index.html` or `.splash` in `base.css`, re-render the iPad launch images and home-screen icons with `target/node/node tools/render-splash.mjs` (then rebuild). Light theme only; rules in `ideas/ui-guidelines.md` "Brand mark and splash".
- Device link (demo only, anonymous and unencrypted): the Spring Boot app relays WebSocket frames `{"topic","payload"}` at `/ws/devices`; both pages connect to `ws(s)://<page host>/ws/devices` and the crew app works without it. No broker or Docker.
- Tablet: open `http://<machine IP>:8080` (Spring Boot listens on every interface). That's not a secure context, so there's no service worker or offline cache there; ids fall back to `crypto.getRandomValues`.
- Device Simulator: `/simulator.html` (built `:8080/simulator.html`, dev `:5173/simulator.html`). Both demo machines use automatic network time: the gateway drops readings more than 60 s ahead of the tablet.
- Demo build flags (Vite env vars, fixed at build, read only by `container.ts` via `src/modes.ts`): DEMO_MODE is on unless `VITE_DEMO_MODE=false` (1-minute detail chart, device readings kept 10 min); MOCK_MODE only with `VITE_MOCK_MODE=true` (in-browser device feed, no device link; the Pages workflow sets it).
- Test publish: `target/node/node tools/publish-reading.mjs 91 61` (`DEVICE_LINK_URL` to target another host).
- Dot display firmware (`src/main/hardware/dot-display`, PlatformIO, outside the Maven build): `pio test -e native` runs the logic tests, `pio run -t upload` flashes the board. Settings live in `include/config.h`, which the first build creates from `config.example.h` and git ignores. `DEV_MODE = true` loops the 90 s scenario with no Wi-Fi; `false` joins Wi-Fi and the device link. Stand-in publisher: `node tools/publish-dot-display.mjs 72` or `--scenario`.
- Dot display in the browser (hidden, not linked from the app): `/device/simulation` loops the 90 s scenario, `/device/websocket` shows what the device link sends on `crew/a1/dot-display`. Dev `:5173/device/...` (a Vite plugin rewrites the paths to `device.html`), built `:8080/device/...` (`DeviceScreenRoutes`).

## Code architecture

- Backend: Kotlin + Spring Boot WebFlux, package `com.galagans.crewhealth`, one folder per domain with `api` (controller, DTOs), `application` (use cases behind interfaces), `domain` (models, repository ports), `infrastructure` (adapters). Public Spring libraries only, no LeoVegas/hyraco parent or libs.
- Frontend (`src/main/frontend/src`): `domain` (types, ports), `application` (use cases depending on ports), `infrastructure` (IndexedDB, HTTP, browser adapters), `ui` (React, services via `ServicesContext`), `container.ts` is the only place that picks concrete classes.
- Device readings: `domain/devices.ts` lists each device (topic, payload fields → indicators, input limits). `container.ts` creates one `PersonalHealthGateway` per device, each fed by a `WebSocketReadingSource` for its topic over one shared `DeviceLink` (infrastructure, one socket, 5 s reconnect, no queueing). A new device is a row there plus its `READINGS` tile; the gateway validates each message and stores FHIR-shaped Observations in their own IndexedDB database. The rules read `ObservationHistory` (check-ins mapped to Observations plus the device ones), and the screens re-read when the gateway stores a reading. Observations don't sync to the ground station yet. The relay (`com.galagans.crewhealth.device`) stands in for the spacecraft LAN: it stores nothing and runs no rules.
- Device Simulator (`src/main/frontend/src/simulator/`): a second Vite entry, kept out of the crew service worker, that publishes through `DeviceLink`; it imports only `READINGS`, `newId`, `DeviceLink`, theme and icons, `domain/devices.ts`, `domain/levelValues.ts`, `domain/rules.ts` types, `resolveRules` with `rules.json` and `baseline.json` from the crew app. Each device sends from page load at a health level picked per device (`SIM_CONFIG` in `simDevices.ts` holds the defaults); values are drawn inside that level's range from the rule rows only (`domain/levelValues.ts`).
- Hardware (`src/main/hardware/<device>/`): one PlatformIO project per physical device. The dot display (Waveshare ESP32-C6-Touch-LCD-1.47, env `c6`, default; the S3 version is env `s3`; mockup 13) keeps its rules in `lib/dotcore` (pure C++, native tests) and only drawing and networking in `src/`. It subscribes to the relay like the crew app and keeps one topic, `crew/a1/dot-display` (placeholder, `{id, t, pct, src}`).
- Device screen (`src/main/frontend/src/device/`): a third Vite entry (`device.html`), kept out of the crew service worker, that draws the dot display's panel as a 320 × 172 SVG scaled to the browser. `dotDisplay.ts` is a TypeScript copy of the firmware's `lib/dotcore` with the same test cases: change both together. `DotFeed` has two adapters, `ScenarioFeed` (simulation) and `LinkFeed` (`DeviceLink` + `WebSocketReadingSource`).
- Offline-first flow: the check-in is written to IndexedDB as pending, `SyncService` posts pending items to `POST /api/checkins/sync` when online (on start, after each save, on the `online` event) and marks the accepted ids synced. The server upsert is idempotent by client-generated id.
- Surgeon packet flow (#19): `PacketSender` snapshots the latest readings plus the crew note into a packet queued in its own IndexedDB database (`crew-health-packets`). `PacketUplink` POSTs each queued packet alone to `POST /api/packets`, oldest first, when online (on start, after each send, on the `online` event) and marks it sent; a failed POST stays queued. The timeline is computed on the tablet from `builtAt`, `sentAt` and the packet's stored one-way delay.
- PWA icons in `public/pwa-*.png` are the brand ring on `#CFCFCF`. Fonts (Inter, DM Mono) are bundled via `@fontsource` and precached, so the app looks the same offline.
- Follow SOLID as defined in `ideas/crew-health-companion.md` ("Engineering principles: SOLID"): interfaces only at boundaries or with a second implementation; new rules, devices and questionnaires are added as rows, adapters or files, not by editing existing branches.
- UI follows `ideas/ui-guidelines.md` and only uses the tokens and classes in `src/main/frontend/src/ui/theme/` (light and dark). The feature's mockup in `ideas/mockups/` gives layout and content, not colours or sizes (the mockups are dark-only and use smaller text). Fonts are bundled (`@fontsource`), never a CDN. Icons come from `src/main/frontend/src/ui/icons.tsx` by concept (Tabler outline plus canvas-drawn gaps; sheet in `ideas/mockups/icons.png`), never straight from `@tabler/icons-react`.
- The crew loop (gateway, rules engine, statuses, explanations) runs in the frontend. The backend is the ground station: it receives, stores and shows; never put crew-facing rules there.

## Issue workflow

- Skills in `.claude/skills/`: `feature-evaluate` (read-only verdict on a suggested feature: adopt, modify, merge, pitch only or reject), `issue-create` (spec an issue, checked by the `spec-skeptic` agent; two or more requests run in parallel, one `issue-creator` agent per request in its own git worktree, questions relayed by the main session), `issue-implement` (test first, one AC at a time, open a PR), `issue-orchestrate` (several issues in parallel: one `issue-implementer` agent per issue in its own git worktree, in conflict-free waves), `issue-merge` (gates: build green, mergeable, no changes requested), `solid-principles` (project coding rules). Tracker and labels: `.claude/skills/issue-create/TRACKER.md`.
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
- Colour only for the 0–5 alert levels (`ideas/alert-levels.md`): the rest of the UI, including health categories, charts, selection and links, uses palette greys and whites.
- Private by default, role-based views, no leaderboards on health values. Gamify the process (check-ins, exercise minutes), not the values.
- No emotion inference from face or voice, no diagnosing LLM. On-board rules with optional AI explainer and "decision support" wording.
- Differentiate from CNES EveryWear, which already flies and logs but doesn't interpret or guide.
