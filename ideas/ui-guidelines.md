# UI and UX guidelines

How to use the team palette and the screen patterns from the design canvas [Health Palette Prototype.html](../research/Health%20Palette%20Prototype.html) (boards: Splash, Today, Palette contrast check; decoded and checked 2026-11-14). The canvas sets the look: colours, type families, shapes, hierarchy. NASA display rules and the project's design constraints decide how each part may be used. Where the two disagree, this document says what changed and why (§9).

The tokens are code: [`tokens.css`](../src/main/frontend/src/ui/theme/tokens.css) and [`base.css`](../src/main/frontend/src/ui/theme/base.css). Components use tokens and classes, never hex values.

Requirement tags such as `[S1 V2 10045]` are the source tags of [ux-human-factors.md](../research/ux-human-factors.md); the full references are in its Sources section.

## The ten rules

1. **Colour means an alert level, and nothing else uses it.** Status follows the 0–5 scale in [alert-levels.md](alert-levels.md), which mirrors NASA's caution and warning classes: blue = level 1 "to do" (advisory), yellow = level 3 "check" (caution), red = levels 4–5 "treat" and "emergency" (warning, emergency). Level 2 "watch" has no colour, like NASA's silent class 0 arrow. Everything else (brand, links, focus, selection, categories, charts) is palette greys and whites. No red logo, heart, category colour, delete button or yellow "due" marker [S1 V2 10118/10119].
2. **Every level has an icon, a word and a colour** [S1 V2 10045]. Colour is never the only cue.
3. **Quiet when nominal.** Nominal is muted text with no fill; only off-nominal items draw the eye [S3].
4. **Every reading shows its value with the unit, its data age and its source** [S1 V2 10046, V2 10020]. Simulated, replayed and proxy data say so.
5. **Missing data shows "—" and stale data looks stale.** Never show old data as current [S2 §10.12.4].
6. **Text is at least 16 px; key values at least 28 px** (§3).
7. **Touch targets are at least 52 px, at least 18 px apart** (§4).
8. **No scores on health values, no praise of values, no inferred stress or emotion.** Gamify the process, not the physiology.
9. **Use tokens.** A new colour pairing gets its contrast computed and added to §2.4 before it ships.
10. **Check both themes** at phone (390 px) and tablet/laptop (1280 px) width.

## 1. Where the canvas applies

- **Crew device.** The crew app runs on a tablet or laptop at about 50 cm; the canvas is drawn on a 390 × 844 phone. Sizes below are set for the tablet and also work on a phone, which is held closer.
- **Taken as is:** palette, Inter + DM Mono, flat cards with 16 px radius, uppercase tracked labels, the brand ring, the header layout, metric tiles, the two featured tiles, the inverse pill for the selected item, the theme toggle, "—" for missing values, the "(i)" explainer button.
- **Changed:** see §9. In short: colour leaves the brand, links and categories, the "health score" becomes a count of systems to check, "Stress" becomes self-reported mood, the NASA logotype leaves the splash, and small text and targets grow.

## 2. Colour

### 2.1 Base palette (from the canvas)

| Hex | Name | Role in the app |
|---|---|---|
| `#CFCFCF` | Mist | Light background |
| `#DADADA` | Bone | Light surface (cards); dark-theme text |
| `#1B1B1B` | Ink | Light text; dark background; ink on yellow and khaki |
| `#726F6C` | Warm grey | Light edge and ring track |
| `#868375` | Khaki | Dark edge and ring track; dark muted text; featured tile 1 |
| `#52574E` | Olive | Light muted text; dark surface; featured tile 2 |
| `#1651B6` | Blue | Level 1 "to do", light theme only |
| `#0032A0` | Deep blue | Not used (was link hover) |
| `#C61E37` | Red | Levels 4–5 treat and emergency, light theme only |
| `#E4002B` | Bright red | Levels 4–5 treat and emergency, dark theme only |

Added for the alert levels and dark contrast (not on the canvas): `#FFC72C` caution yellow (level 3), `#FFFFFF` text on red, `#7FA6F0` blue tint (level 1 in dark; `#1651B6` is 2.37:1 on `#1B1B1B`). Colour-blind separation of the level colours: [alert-levels.md](alert-levels.md#colours).

Coding colours (colours that carry a meaning) are red, yellow and blue, as on NASA displays, well under NASA's limit of 9 [S2 §10.9.2.5.1]. No red/green pairs [S2 §10.6.19]. The greys and earth tones carry no meaning.

### 2.2 Semantic tokens

Components use these names, not the hex values.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#CFCFCF` | `#1B1B1B` | Page background |
| `--color-surface` | `#DADADA` | `#52574E` | Cards, tiles, nav bar |
| `--color-text` | `#1B1B1B` | `#DADADA` | Text and icons on background and surface |
| `--color-text-muted` | `#52574E` | `#868375` | Secondary text on the background |
| `--color-text-muted-on-surface` | `#52574E` | `#CFCFCF` | Secondary text on a surface |
| `--color-edge` | `#726F6C` | `#868375` | Boundary of anything interactive on the background: field tiles, outline buttons, pills |
| `--color-edge-on-surface` | `#726F6C` | `#CFCFCF` | The same inside a card; `.card` swaps it in for `--color-edge` |
| `--color-divider` | `#CFCFCF` | `#1B1B1B` | Row rules inside a surface (the background colour, as on the canvas contrast board) |
| `--color-inset` | `#CFCFCF` | `#1B1B1B` | Recessed areas inside a surface: field tiles in a card, explanations |
| `--color-text-muted-on-inset` | `#52574E` | `#868375` | Muted text on an inset inside a card: stale values on metric tiles (the "Muted on background" pair in §2.4) |
| `--color-ring` | `#726F6C` | `#868375` | Brand ring track, nominal ring segments |
| `--color-focus` | `#1B1B1B` | `#DADADA` | 2 px keyboard focus ring (same as `--color-text`) |
| Links | `--color-text` | `--color-text` | Always underlined, on background and surface; no link colour |
| `--color-inverse-bg` / `--color-inverse-text` | `#1B1B1B` / `#DADADA` | `#DADADA` / `#1B1B1B` | Primary button, selected nav item, selected tier on the detail screen |
| `--color-feature-1` / `--color-on-feature-1` | `#868375` / `#1B1B1B` | same | Featured tile 1 (exercise) |
| `--color-feature-2` / `--color-on-feature-2` | `#52574E` / `#DADADA` | same | Featured tile 2 (sleep) |
| `--color-todo` | `#1651B6` | `#7FA6F0` | Level 1 "to do": outline, icon and border only, never a fill (badge, to-do counter, due routine row) |
| `--color-check` / `--color-on-check` | `#FFC72C` / `#1B1B1B` | same | Level 3 "check" badge, segment and chart marker |
| `--color-alert` / `--color-on-alert` | `#C61E37` / `#FFFFFF` | `#E4002B` / `#FFFFFF` | Level 4 "treat" and level 5 "emergency" (NASA warning and emergency share red) |

### 2.3 Rules

- **Level colours** (blue, yellow, red) appear only on a level badge, a ring segment, a chart marker or a level-1 "to do" outline, and always next to the level icon and word. Exception: a chart point marker is icon + colour; its word is in the point's title and the screen's badge (§5 "Charts").
- **Neutral:** links, focus, the brand arc, selected states (inverse pill), chart lines and bands, "offline", "waiting to sync", "rule-added", form errors and destructive actions use greys and whites (§5). A missing questionnaire is data age, not a level.
- **Filled level badges** carry a 1.5 px outline in `--color-text`: yellow vanishes on the light background (1.00:1) and red on the dark surface (1.53:1).
- **Featured tiles** (khaki, olive) are category surfaces for at most two summaries per screen. They never show status and never colour anything else.
- **Khaki is never text on a surface** (2.72:1 light, 1.95:1 dark). On the dark background it is muted text (4.53:1).
- **Ink on a fill** follows the canvas rule: dark ink `#1B1B1B` when the fill's relative luminance is above 0.164, otherwise `#DADADA`. Red is the exception: `#FFFFFF`.
- **No gradients, shadows or decorative colour.** Flat surfaces, like the canvas [S2 §10.6.18].

### 2.4 Contrast (WCAG 2.1, computed from the hex values on 2026-11-14)

Text needs 4.5:1 (3:1 at 24 px, or 19 px bold). The edges of controls and graphics that carry meaning need 3:1.

| Pair | Light | Dark | Verdict |
|---|---|---|---|
| Text on background | 11.06 | 12.32 | Pass |
| Text on surface | 12.32 | 5.30 | Pass |
| Muted on background | 4.76 | 4.53 | Pass |
| Muted on surface | 5.30 | 4.76 | Pass |
| Edge on background | 3.20 | 4.53 | Pass (controls) |
| Edge on surface | 3.57 | **1.95** with khaki; 4.76 with `--color-edge-on-surface` | Dark: controls inside a card use the on-surface edge |
| Level 1 blue on background | 4.67 | 7.07 | Pass |
| Level 1 blue on surface | 5.20 | 3.04 | Dark: outline and icon only; the word stays `--color-text` |
| Focus ring on background / surface | 11.06 / 12.32 | 12.32 / 5.30 | Pass |
| Inverse text on inverse | 12.32 | 12.32 | Pass |
| Ink on yellow (level 3) | 11.04 | 11.04 | Pass |
| Yellow fill on background | **1.00** | 11.04 | Light: the fill is invisible, so level 3 badges have an ink outline |
| White on red (levels 4–5) | 5.77 | 4.85 | Pass |
| Red on background | 3.70 | 3.55 | Pass (shapes) |
| Red on surface | 4.12 | **1.53** | Dark: badge meaning is carried by its white icon and word; never a bare red shape on a dark surface |
| Ink on featured tile | 4.53 / 5.30 | same | Pass |
| Surface on background | 1.11 | 2.32 | Grouping only: static cards need no edge; interactive surfaces add `--color-edge` |

## 3. Type

Inter for words, DM Mono for numbers (the canvas pairing). Both are bundled with the app (`@fontsource`) so they work offline.

| Token | Font | Size | Use | Canvas |
|---|---|---|---|---|
| `--text-hero` | DM Mono 400, tracking −0.04em | 64 px | One number per screen: the ring centre | 64 px |
| `--text-value` | DM Mono 300 | 28 px | Reading values | 28 px |
| `--text-heading` | Inter 700 | 20 px | Section headings on tablet layouts | — |
| `--text-body` | Inter 400 / 500 / 700 | 16 px | Body, labels (700, uppercase, tracking 0.08em), units (700), nav labels (500), wordmark (500, tracking 0.08em; splash 0.32em) | 11–15 px |

- **Why 16 px minimum.** On an iPad-class screen one CSS pixel is about 0.19 mm (our assumption: 132 CSS px per inch). Inter's capital letters are 0.727 em tall, so 16 px gives 2.2 mm, about 0.25° at 50 cm, which is NASA's minimum character height [S1 Table 21]. The canvas labels at 11–13 px are below it.
- **Why 28 px values.** DM Mono at 28 px gives capitals of about 3.7 mm, over 0.4° at 50 cm: the preferred size, which NASA asks for labels and critical values [S1 V2 10049, V2 10050, V2 10066].
- **Uppercase** only for labels of three words or fewer. Sentences use sentence case. **Units keep their own case** ("HEART RATE / bpm", "WATER / mL", "SLEEP / h"): uppercasing turns h into H and mL into ML.
- **Numbers** always in DM Mono with `font-variant-numeric: tabular-nums`, so columns line up and digits don't jump. Inside running text, wrap the number in `.num` ("SpO₂ <span class=num>96</span> %"). Exception: a routine row's right-hand text sits whole in `.num`, words included ("done 08:05"), so the column lines up like a schedule (issue #10).

## 4. Layout, spacing and shape

- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32 px (`--space-1` … `--space-7`). Page gutter 20 px (canvas). Card padding 16–20 px.
- **Gaps:** 16 px between static cards (canvas 14 px, moved onto the 4 px grid); **18 px between touch targets**.
- **Touch targets:** at least 52 × 52 px. On an iPad-class screen that is 10 mm, and 18 px is 3.4 mm, meeting NASA's 9.5 mm targets with 3.2 mm gaps [S2 §10.4.2.21]. The canvas's 44 px icon buttons keep their look but get a 52 px hit area.
- **Radii:** 16 px cards and tiles, 12 px items inside a card (nav items), fully round pills and badges.
- **Grid:** phone, one or two columns (canvas). Tablet and laptop, content at most 1200 px wide; the home screen shows three columns from 1200 px: the body-systems card (300 px), the Hazard lens card, and a 380 px column that holds Today's routine, Latest readings and the Reaction test card, in that order (mockup 01). From 861 to 1199 px the Hazard lens card moves under the body-systems card, and at 860 px and below everything stacks, body systems first. Tile grids use tiles at least 150 px wide (two columns on a phone, like the canvas).
- **Critical information is visible without scrolling** [S1 V2 10037]; navigation is at most 2–3 levels deep.
- **Motion:** 0.25 s colour transitions on theme change (canvas), none with `prefers-reduced-motion`. Nothing blinks or pulses.

## 5. Components

### App header
Brand mark (28 px, not a button) on the left, wordmark "HEALTH" in the centre (below 600 px, centred in the space between the brand mark and the buttons, which don't fit beside a page-centred wordmark), icon buttons on the right, 18 px apart: voice control (microphone, inverse fill while on, disabled on the PVT screen, #37), "Add entry" (+, Home only, opens the check-in; built: issue #29) and the theme toggle (moon in light, sun in dark). Context pills sit in one wrapping row under it on every layout and screen: the connection pill, then the ground-link pill (#19), then the voice pill while voice is on ("Voice: listening", "Voice: thinking", "Voice: speaking") or after it failed, until the mic is tapped again ("Voice host unreachable", "Voice: audio not available") (#37). Crew and flight-day pills are not built.

### Brand mark and splash
- **Ring:** a 270° arc in `--color-ring` and a 60° arc in `--color-text`, round caps (canvas geometry). The arc was red on the canvas, then blue; blue now means level 1 only.
- **Splash:** an 88 px ring, the wordmark at 16 px with 0.32em tracking, on `--color-bg`, at the canvas positions (ring 23.7 % from the top). "Built for the NASA Space Apps Challenge 2026" in `--color-text-muted` sits where the canvas had the NASA logotype (80 %). Built: plain HTML in `index.html`, styled by `.splash` in `base.css`, so it shows before the app's JavaScript runs. `ui/splash.ts` fades it out once the app has drawn, but not before 1.2 s after launch. It follows the theme, including the one picked in the app.
- **iOS launch images and icons:** iOS shows a launch image only for an app added to the home screen, and only when an `apple-touch-startup-image` media query matches the screen exactly. `tools/render-splash.mjs` renders the splash above (light theme) for every 2x iPad screen in both orientations into `public/splash/`, renders the ring alone into `apple-touch-icon.png` and `pwa-192/512.png`, and rewrites the tags in `index.html`. iOS copies the launch image when the app is added, so re-add the app after a change.
- **No NASA insignia, logotype (worm) or seal:** they need NASA's explicit permission [N1]. Factual text such as "Built for the NASA Space Apps Challenge 2026" is fine.

### Body-system ring (the canvas "health score" ring)
- **Segments:** one per body system the rules engine reports on (the list on the [body map](mockups/01-body-map.png)), each identified by its icon, not by colour.
- **Colour by level:** nominal segments are `--color-ring` with an icon in `--color-text` (quiet). Levels 3–5 colour the segment with the level colour; level 2 keeps the grey segment. Every flagged segment shows its marker (↗/↘, ▲, kit, octagon "!"). Level 1 is not a body-system status.
- **Centre:** the number of systems at levels 2–5 (`--text-hero`) with "systems to check" and the (i) button that opens what / why / how decided / what next. With none, it shows "All nominal" in muted text and the time of the last update. Never a composite health score.
- **Interaction:** each segment is a button to the system's detail. A list view of the same systems is always one tap away, so the ring isn't the only path [S1 V2 10045].

### Metric tile (built: issue #7)
- **Surface:** an inset (`--color-inset`) tile in a card's tile grid, 16 px radius, no edge: it's static, not a control (§2.4).
- **Row 1:** the value in `--text-value` with its unit in bold body text, and the metric's icon on the right. Mood shows as "3 / 5". A reading too wide for the tile wraps its unit under the value and moves the icon to the next line, still on the right.
- **Row 2:** the field-tile label pattern: the label in uppercase, then "/" and the data age in muted text, in its own case: "SPO₂ / 4 min ago". The canvas used a unit or a date here; the unit moves next to the value.
- **Row 3:** a source tag on every value shown ("manual", "synthetic", "in-app test", "oximeter · synthetic", "oximeter · replay", "oximeter · proxy"). Simulated, replayed and proxy readings say so.
- **Missing:** "—" with the accessible text "No reading", and no unit, age or tag. **Stale** (older than the metric's expected interval): the value and unit in `--color-text-muted-on-inset` and the age spelled out ("8 d old"), with the icon and no status colour.
- **Placeholder tile:** a reading the app can't take yet shows synthetic text and unit with the tag "synthetic", no data age and no badge (issue #7).
- **Status:** an off-nominal tile shows a status badge in place of the icon. The tile surface itself never changes colour.

### Today's routine (built: issue #10)
- **Card:** a `card` with the uppercase `card-heading` "Today's routine"; one row per item, separated by `--color-divider`. The right-hand text, words included, is one `.num` span.
- **Upcoming and missed:** muted row with the window ("07:00–09:00") or "not answered", and no button.
- **Due:** a 1 px `--color-todo` outline in `--radius-item`, no fill, and a secondary "Start · ~<estimate>" button that opens the check-in at `#/check-in`, where "Save check-in" is the primary (issue #29). Never red or yellow.
- **Done:** "done HH:MM" with no glyph; ✓ stays Nominal.
- **Placeholder row:** the label with a "synthetic" tag under it and the muted detail on the right; no state, button or glyph, the same at every time of day.
- **PVT row** (issue #16): "done HH:MM" when a PVT was done today, otherwise muted "every 4th day"; no tag, no button (the Reaction test card starts it).

### Test screen (PVT, built: issue #16)
- **Home card:** "Reaction test" under Latest readings, with a secondary "Start reaction test" button; Home has no primary button since the check-in moved to its own screen (#29).
- **Start screen:** what to do, "use the same device each time" (device latency affects RT, health-indicators §13), a primary "Start test" and an underlined "← Home".
- **Running:** the time left ("2:41 left", `.num`) beside the heading; the target is an inset `button` at least 300 px high (`aria-label="Respond"`) with the counter in `.value` at `--text-hero`; "Too early" for a false start; a secondary "Stop". Space and a tap both respond.
- **Result:** a two-column list (muted terms, numbers right) of median, lapses, false starts and responses, then the save line and one primary button.
- **No status colour anywhere on the test:** a slow response doesn't set a level; the Cognition rule decides that (#17).

### Featured tile
- **Use:** a tall tile on `--color-feature-1` or `--color-feature-2` with title, day and up to three value + unit lines, for process summaries such as exercise minutes and sleep hours.
- **Limit:** at most two per screen, never a status.

### Navigation bar
- **Layout:** a bar on `--color-surface` at the bottom on phones (or the side on tablets) with at most four items, each with an icon and a word.
- **Selected item:** inverse pill plus `aria-current="page"`.
- **Labels:** Home · Check-in · Body (the canvas's "Manual input" renamed to the glossary word in [features.md](features.md)).

### Buttons
- **Primary:** inverse pill, at least 52 px high, verb + object ("Save check-in"). One per screen.
- **Secondary:** transparent with a 1 px `--color-edge` border.
- **Icon button:** transparent, 52 px round hit area, icon 22–30 px, `aria-label` required. A toggle that is on (`aria-pressed="true"`) gets the inverse fill; a disabled one is at 60 % opacity, like disabled buttons (#37).
- **Consequential actions** (send packet, delete entry) get confirm or undo. No red buttons: red is level 5, not "dangerous".

### Body-system list (built: issues #1, #4, #9)
- **Card:** a `card` with the uppercase `card-heading` "Body systems"; one row per system, rows separated by `--color-divider`.
- **Row:** system name (weight 500), then a muted line with label, value (`.num`), unit, data age and source ("SpO₂ 96 % · just now · manual"); the status badge on the right. No-data and stale rows mute the system name.
- **Placeholder row:** a system with no rules yet shows a synthetic value as the muted line `<detail> · synthetic` ("7.1 h last night · synthetic"), always "✓ Nominal", with no data age and no explanation.
- **Link to the detail:** a row at levels 2–5 is one link to its detail screen: the whole row, at least 52 px high, no underline, with a chevron (`ChevronIcon`) as the link cue. This is an exception to "links on a surface are always underlined" (§2.2). Quiet rows (nominal, no data, stale, placeholder) are not links.
- **Hazard lens marks (issue #14):** with a hazard selected, an affected row gets a 4 px `--color-text` bar on the left and the visually hidden text "Affected by <hazard>"; any other row is dimmed (name, sub line and badge in `--color-text-muted`; no opacity, so no new contrast pair). A row at levels 2–5 outside the hazard gets neither. While a hazard is selected the card ends with a muted note: "Lens on: affected systems marked, others dimmed. Status is unchanged by the lens." ("Lens on: all systems marked. …" for Distance from Earth).

### Hazard lens (built: issue #14)
- **Card:** a `card` headed "Hazard lens" with the muted suffix "· NASA HRP five hazards", then the five hazards as toggle chips, a caption and the body figure.
- **Chips:** `button` with `aria-pressed`, a hazard icon from `icons.tsx` and the hazard's name, at least 52 px high, 18 px apart, 1 px `--color-edge` outline pill. The pressed chip is the inverse pill (selected item). One hazard at a time; pressing it again turns the lens off. The choice is remembered on the device.
- **Caption:** an inset (`--color-inset`) with "<hazard>: <what it does>", "Affects: …", "Watched by: …" and a muted source line; `aria-live="polite"`. With nothing selected: "Pick a hazard to see which body systems it affects."
- **Lens marks are neutral** (`--color-text`), never a colour: colour stays on alert levels.

### Body figure (built: issue #14)
- **Drawing:** a decorative SVG (`aria-hidden`): silhouette in `--color-inset` with a `--color-edge` outline, organs outlined in `--color-text-muted`, dashed `--color-edge` leader lines. No status colour on shapes.
- **Labels:** an HTML list named "Body figure" with Cognition, Eyes, Lungs, Heart, Kidneys and Bone & muscle. A label is quiet muted text; levels 2–5 add the level badge under it. Labels sit beside the figure from 600 px and form a two-column grid under it below 600 px.
- **Lens:** an affected label is `--color-text`, weight 700, with a 4 px bar on the side facing the figure; its organ outline goes `--color-text` 2.5 px and its leader line solid. The figure is display-only.

### Detail screen (built: issue #9)
- **Route:** `#/systems/<system>`; "← Body systems" (underlined link) goes back and focuses the "Body systems" heading. Opening a detail focuses its heading once.
- **Header:** full width above the columns: level badge, the system name (`section-heading`), the reading line ("SpO₂ 92 % · 10 min ago · manual"), and "No caution or warning now." when not flagged.
- **Columns** (`.layout`, from 860 px): left the trend chart card and the Explanation card; right What next and Who to involve, their tops aligned with the chart card. Not flagged: only the chart card, in the left column.
- **Explanation:** an inset (`--color-inset`) list of What / Why it matters / How decided / Source, the source followed by a rule tag ("rule · SPO-01"), with uppercase muted terms. Terms sit beside their text from 600 px up and above it on phones.
- **What next:** the rule's next step on an inset.
- **Who to involve:** the four tiers (Self-care, CMO, Medical conference, Urgent ground) as outline tiles in a 2 × 2 grid; the rule's tier is the inverse fill, weight 700, with `aria-current`. Never a level colour.

### Surgeon packet (built: #19)
- **Route:** `#/packet`, opened from the ground-link pill. "← Home" (underlined link) goes back and focuses the "Body systems" heading; opening the screen focuses its heading once. Under the heading a muted line with `PrivateIcon`: "Shared with flight medicine only · Mars transit, one-way delay 14 min 05 s (demo value)".
- **Columns** (`.layout`): left the "Last packet · store-and-forward" card above the "Next packet · contents" card; right the "Crew note (optional)" card and the send buttons. On phones everything stacks in that order.
- **Timeline:** four steps (Packet built, Queued for uplink, In transit or Arrived, Earliest reply), each a 36 px dot with the step icon, the name (700; 500 when pending) and a detail with times in `.num`. Done is a solid `--color-text` ring with a filled dot, current a dashed ring with an arrow and `aria-current="step"`, pending an `--color-edge` ring with dots and muted text; each step also has its state word, visually hidden. The steps sit on one line joined by a 2 px `--color-edge` rule, and stack vertically below 600 px. The timeline is not a health status: neutral tokens only, never a level colour. A muted line under it gives the round trip and "Don't wait for the ground on anything in "What next": your on-board actions already apply."
- **Contents table:** columns Item, Status, Value, Source with uppercase muted column labels and rows divided by `--color-divider`. Status is the level badge; a flagged row (caution or warning today) stacks the badge, the dashed rule tag ("rule · SPO-01") and the tier as a neutral text-height pill ("CMO"). Value is `.num` plus unit and a muted " · 10 min ago" (" · data 1 d old" when stale). Source is the source tag. Below 600 px each row stacks: item and status, then value and source, the column labels visually hidden.
- **Not rated:** a value whose indicator has no rule rows shows "—" with the visually hidden text "Not rated", never "✓ Nominal": no rule judged it. A synthetic placeholder shows "—" "No status"; a missing value "—" "No reading" with the "No data" badge.
- **Crew note:** a textarea inset (`--color-inset`) with the 1 px control edge and 12 px radius, at most 500 characters, and a right-aligned muted `.num` counter ("79 / 500").
- **Inline confirm:** "Send packet" (primary) is replaced by "Confirm send · arrives ~07:45" (primary, focused) or "Confirm send · waits for ground link" offline, and "Cancel" (secondary), 18 px apart. Both are disabled while saving. A failed save shows "Packet not saved. Try again." (`role="alert"`, body text, no icon or colour) under the buttons.

### Field tile (forms)
- **Structure:** a tile is the field. Its `<label>` wraps the uppercase label, the "/ unit" suffix and the input. The input is transparent DM Mono at value size, so the tile reads like a metric tile being filled in.
- **Edge and focus:** a 1 px `--color-edge` border (3.20:1 light, 4.53:1 dark), and focus shows a 2 px `--color-focus` ring around the whole tile. Inside a card the tile is inset (`--color-inset`) and the edge switches to `--color-edge-on-surface` (3.57:1 light, 4.76:1 dark).
- **Errors:** an icon plus a sentence under the field in `--color-text`. Never red or yellow.
- **Questionnaires (built: issue #29):** one question per screen, the instrument's own anchors, progress and time left, and "Skip" always allowed (see [crew-health-companion.md](crew-health-companion.md), "Rendering rules"). Step tabs show progress, not navigation (current step: 2 px `--color-text` outline, bold). Number questions use the field tile; an invalid value shows an info icon and "Enter … , or skip." in `--color-text` under it. Scales and checklists are 52 px+ buttons 18 px apart; the selection is the inverse fill, never a status colour. After "Save check-in" the same screen shows the completion (issue #40): a text ✓ in a 2 px `--color-text` circle, "Check-in complete · HH:MM" at the value size, the steps answered and time taken, the acknowledgement, a "What happens next" inset box when a symptom was logged, the routine streak card (14 day cells on the inset colour, today with a 2 px `--color-text` outline, a legend, a "synthetic" caption, three counter tiles) and "Done". No level colour or badge anywhere.

### Level badge

The 0–5 scale, its meaning and routing: [alert-levels.md](alert-levels.md).

| Level | Look | Example |
|---|---|---|
| 0 Nominal | No fill, muted text, ✓ icon, weight 500 | ✓ Nominal |
| 1 To do | No fill, `--color-text` word, 1.5 px `--color-todo` outline, edit icon in `--color-todo`, weight 700 | ✎ To do |
| 2 Watch | No fill, `--color-text` word and icon, 1.5 px `--color-text` outline, trend-arrow icon, weight 700. No level colour (NASA class 0) | ↗ Watch |
| 3 Check | `--color-check` fill, ink text, 1.5 px `--color-text` outline, ▲ icon, weight 700 | ▲ Check |
| 4 Treat | `--color-alert` fill, `--color-on-alert` text, 1.5 px `--color-text` outline, first-aid-kit icon, weight 700 | ✚ Treat |
| 5 Emergency | `--color-alert` fill, `--color-on-alert` text, 1.5 px `--color-text` outline, octagon "!" icon, weight 700 | (octagon) Emergency |

"No data" and "No recent data" use `badge--quiet`: muted, no icon, no fill. Missing or stale data is not a health status.

Routing is a separate, neutral outline pill (each level has a default, a rule row may change it): "Self-care", "CMO", "Medical conference", "Urgent ground" (the escalation tiers in [features.md](features.md)). Urgency is the colour; who acts is the label [ux-human-factors.md, "Keep urgency separate from who gets involved"].

### Pills and tags
- **Context pill:** outline in `--color-edge`, the value in bold ("Flight day **142**").
- **To-do counter (level 1):** `--color-todo` outline and edit icon, "✎ 1 to do". Absent when nothing is due. Never yellow.
- **Source tag:** a small outline tag ("BLE · simulated", "manual", "EDA replay").
- **Rule tag:** a dashed outline ("rule · PVT slower than baseline"). It explains why an item was added; it is not a level.
- **Connection and sync:** a neutral pill. Online with nothing waiting is quiet muted text; offline shows a cloud-off icon and "Offline · 2 waiting to sync". Being offline is not a health status.
- **Ground link (built: #19):** a context pill that is a link (`a.pill.pill--link`) to the surgeon packet, beside the connection pill: `GroundLinkIcon` at 18 px and "Ground link: one-way delay **14 min 05 s** (demo)", the value bold and never broken across lines. At least 52 px high and not underlined: the outline is the link cue. On the packet screen it is the inverse fill with `aria-current="page"`, like a selected nav item. Its accessible name starts "Surgeon packet." so the destination is announced.
- **Voice (built: #37):** a neutral context pill after the ground link, only while voice is on or after it failed: `VoiceIcon` at 18 px and "Voice: listening", "Voice: thinking", "Voice: speaking", "Voice host unreachable" or "Voice: audio not available". The microphone header button that turns it on has the inverse fill while on.

### Icons

**Library: [Tabler Icons](https://tabler.io/icons), outline set** (`@tabler/icons-react` 3.50.0, MIT, 5,000+ icons) [I1]. It is the same rounded 24 px line style as the canvas icons, and of the line libraries it covers the most health and body concepts. The full vocabulary, rendered: [mockups/icons.png](mockups/icons.png). The sheet has no source in the repo, so icons added after it (`ChevronIcon`: chevron = "opens detail", #9; `StepDoneIcon`, `StepCurrentIcon`, `StepPendingIcon`: a timeline step done, current or pending, #19; `VoiceIcon`: Tabler's `microphone` = "voice control", #37; `PausedIcon`: Tabler's `player-pause` = "streak day paused for sickness or rest", #40) are not in it. `StepDoneIcon` is Tabler's `circle-filled`, the one filled icon in the app: a check would read as the ✓ of Nominal on the same screen. One exception, approved by the team for #40: the check-in completion draws a text ✓ in a circle beside "Check-in complete", because that screen shows no status badge.

- **Import by concept from [`src/ui/icons.tsx`](../src/main/frontend/src/ui/icons.tsx)**, never from `@tabler/icons-react` directly: `RespiratoryIcon`, `CautionIcon`, `Spo2Icon`, `GroundLinkIcon`. One concept has one icon everywhere, and one icon has one meaning [S1 V2 10010/10011]. A new concept is one export line there, plus a row in the sheet.
- **Defaults:** every icon is `aria-hidden` and 22 px. The word next to it, or the button's `aria-label`, carries the meaning. Sizes are 18 px in badges and pills, 20 px in navigation, 22 px in tiles and 30 px for the header "add".
- **Line weight:** 1.75 px for all icons, set once in CSS (`--icon-stroke` on `.tabler-icon`, canvas range 1.6–1.8). Colour is `currentColor`; status colour comes from the badge around the icon, never from the icon alone.
- **Gaps:** Tabler has no kidneys, stomach or SpO₂ icon. Those three are the canvas's own drawings, built with Tabler's `createReactComponent` so they behave identically. Blood pressure uses `gauge` for now. When a concept is missing, search Tabler first, then draw one on the 24 px grid with round caps and add it the same way. Don't mix in another library: [Healthicons](https://healthicons.org) has the organs, devices and symptoms but is drawn as thinner filled shapes on a 48 px grid, and looks out of place next to the rest [I2].
- **Metaphors:** standard ones crews know from home devices, no custom icons for common things [S3]. Sleep is `zzz`, not a moon, because the moon means "dark theme" in the header.
- **Bundle size:** only icons a screen actually uses are bundled (`/* @__PURE__ */` exports), so the vocabulary can grow without adding weight.

Why Tabler (checked 2026-11-14 against 64 concepts the app needs, from the packages themselves):

| Library | Icons (line set) | Lungs | Kidneys, stomach | BP cuff, oximeter | Symptoms (nausea, dizziness, fever) | Style next to the canvas |
|---|---|---|---|---|---|---|
| Tabler 3.51 (MIT) | 5,233 | yes | no | no (gauge) | yes | same |
| Lucide 1.73 (ISC) | 2,359 | no | no | no (gauge) | partial | same |
| Phosphor 2.1 light (MIT) | 1,512 | no | no | no (gauge) | partial | close, thinner |
| Healthicons 3.1 outline (CC0) | 776 | yes | yes | yes | yes | different: 48 px filled outlines, no UI glyphs (status, sync, theme) |

### Charts (for the detail screens)
- **Plot area:** a `--color-inset` well inside the card, so the lines and the band keep contrast.
- **Lines and bands:** data line in `--color-text`; the adaptation corridor is the only filled band (`--color-text` at about 20 % with a faint edge); the pre-flight baseline is a thin dashed `--color-text-muted` line (`.chart-baseline`) at the baseline median, labelled "your pre-flight normal" with its value and source, bottom right ("your pre-flight normal · 265 ms · synthetic") ([mockup 02](mockups/02-detail.png)). No category colours: categories are told apart by name and icon ([health-categories.md](health-categories.md#how-categories-are-shown)).
- **Points:** a point at level 2–5 takes its badge's fill and outline (a Watch point is a ring in `--color-text`), with the level icon (18 px, `--color-text`) above it as the marker; stale or missing points are hollow, and the newest point of a stale level is hollow with no marker. The line itself never takes a level colour. The marker shows icon + colour without the word (§2.3 exception); each point's title gives value, level, UTC time and source.
- **Thresholds:** one dashed `--color-text-muted` line per rule row, labelled with the rule and its level ("SPO-01 · < 94 % check"). Never a level colour.
- **Range:** a fixed Y range per indicator (SpO₂ 80–100 %, grid every 5) so the threshold lines always show; values outside it sit on the edge.
- **Axes:** units on the axes, faint optional grid lines, no dual axes [S1 V2 10046][S2 §10.6.18].

## 6. Themes

- **Light** is the default (the canvas default). **Dark** is the canvas's dark set with the fixes in §2.
- The app follows the system setting until the user taps the toggle; the choice is remembered on the device.
- **Night theme: not designed yet.** Pre-sleep use needs a dim display with little short-wavelength light [S1 V2 8055]. Dark mode is not that: its text is bright. It's a gap to close before night-time screens ship.

## 7. Words

- **Units with every value**, one unit system everywhere (SI, plus mmHg for pressure) [S1 V2 10046].
- **Write for non-physicians** [S1 V2 7045]: short sentences, the instrument's own anchors, "may contribute", "consider raising". Never a diagnosis.
- **Explanations** answer what, why, how it was decided and what next.
- **No message praises or blames a value.** Reporting is a win: "Logged: headache. Thanks for reporting."; with no symptom logged, "No symptoms logged. Thanks for checking in."
- **Mood is self-reported (1–5).** Stress or emotion is never inferred from sensors, face or voice.

## 8. Checklist for every UI pull request

- [ ] Colours come from tokens only (no hex in `ui/*.tsx`).
- [ ] Blue, yellow and red appear only on alert levels, with icon + word.
- [ ] Every new colour pair is in §2.4 and passes.
- [ ] Text ≥ 16 px; values ≥ 28 px; targets ≥ 52 px and ≥ 18 px apart.
- [ ] Values show unit, data age and source; missing shows "—"; stale looks stale.
- [ ] Icons come from `src/ui/icons.tsx` by concept; icon buttons have `aria-label`; the current nav item has `aria-current`; live sync text has `role="status"`.
- [ ] Keyboard focus is visible (2 px `--color-focus` ring).
- [ ] Checked in light and dark, at 390 px and 1280 px.

## 9. Canvas changes and why

| Canvas | Guideline | Why |
|---|---|---|
| Red arc in the logo and loading ring | `--color-text` arc (blue until 2026-11-14) | Red is reserved for level 5 [S1 V2 10118/10119]; blue for level 1 |
| Ring segments coloured red, blue, khaki and olive by category | Ring grey when nominal and at level 2; level colour only at levels 3–5; icon names the system | One meaning per colour; quiet when nominal [S2 §10.11.5.5][S3] |
| "8.8 your health score" | Count of systems to check, or "All nominal" | No scores on health values; thresholds must be sourced; scoring feeds under-reporting ([crew-health-companion.md](crew-health-companion.md), "Reporting is a win") |
| "Stress 82" tile | "Mood" tile, self-reported 1–5 | No inferred emotion ([ux-human-factors.md](../research/ux-human-factors.md) checklist item 14) |
| "Genetics" segment | Removed | No in-flight genetic monitoring; segments follow the rules engine |
| NASA logotype on the splash | Removed; factual text only | Needs NASA's explicit permission [N1] |
| 11–13 px labels, title and nav text | 16 px | NASA minimum character height [S1 Table 21] |
| 44 px icon buttons, 8 px gaps between nav items | 52 px hit areas, 18 px gaps | 9.5 mm targets with 3.2 mm gaps [S2 §10.4.2.21] |
| Khaki as label text (2.72:1, 1.95:1) | Khaki only as a fill with ink, or dark muted text on the background | Contrast |
| No card edge (1.11:1, 2.32:1) | Static cards unchanged; interactive surfaces get `--color-edge` | WCAG 1.4.11 applies to controls [W1] |
| `#DADADA` label on red (4.12:1) | White on red (5.77:1, 4.85:1) | Contrast |
| `#C61E37` and `#1651B6` in dark | `#E4002B` (3.55:1) and `#7FA6F0` (7.07:1) | 3:1 for shapes on `#1B1B1B` |
| Values with a unit or a date but no data age | Value + unit, then label / data age, then a source tag | Stale data must be flagged [S1 V2 10020]; data honesty (`CLAUDE.md`) |
| "Manual input" tab | "Check-in" | Glossary in [features.md](features.md) |
| Moon for both the Sleep tile and the dark-mode toggle | Sleep uses `zzz`; the moon stays on the toggle | One meaning per icon [S1 V2 10010/10011] |

The mockups in [mockups/](mockups/) are dark-only tablet comps with 11–14 px text and a few derived greys (`#3D403B`, `#2A3550`). Use them for layout and content; colours, sizes and status styles come from this document. Their colour use follows the rules: colour only on the alert levels, everything else grey (2026-11-14).

## Sources

- Canvas: [research/Health Palette Prototype.html](../research/Health%20Palette%20Prototype.html), boards decoded and read 2026-11-14. Contrast ratios recomputed from the hex values with the WCAG 2.1 formula the canvas itself uses.
- `[S…]` tags: NASA-STD-3001 Vol 2 Rev B, the Human Integration Design Handbook and NASA HSI workshop decks, listed in [ux-human-factors.md](../research/ux-human-factors.md#sources).
- [N1] NASA Brand Center, images and media usage: the insignia, logotype and seal may not be used without explicit permission. https://www.nasa.gov/nasa-brand-center/images-and-media/ (via search, 2026-11-14).
- [W1] WCAG 2.1, success criteria 1.4.3 (contrast minimum) and 1.4.11 (non-text contrast). https://www.w3.org/TR/WCAG21/
- [I1] Tabler Icons, MIT licence: https://tabler.io/icons; npm `@tabler/icons-react` 3.50.0 (published 2026-10-27, verified 2026-11-14). Coverage counted from the `@tabler/icons` 3.51.0 package.
- [I2] Compared packages, verified 2026-11-14: `lucide-static` 1.73.0 (https://lucide.dev), `@phosphor-icons/core` 2.1.1, `healthicons` 3.1.0 (https://healthicons.org).
