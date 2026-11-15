# #1 SpO₂ core loop: rule table → Respiratory status on home

The crew app now interprets a check-in. Each saved SpO₂ value is checked on the tablet against rules SPO-01 (< 94 % → caution) and SPO-02 (< 90 % → warning) in `src/main/frontend/src/infrastructure/rules.json`. The "Body systems" panel shows the Respiratory status with what, why, how it was decided, what to do next and who to involve. It works offline, and the list is re-read after each save and every 60 s. Features F4, F5 and F6 in [features.md](../../ideas/features.md); issue [#1](https://github.com/jdo-lv/galagans/issues/1).

**Try it:** `mvn clean verify`, then `mvn spring-boot:run`, open http://localhost:8080, click Check-in in the navigation bar, type an SpO₂ value on its step, click "Next →" through the other steps, "Save check-in" on the last ([#29](29-check-in-questionnaire.md)), then "Done" ([#40](40-reporting-win.md)). **Retake the screenshots** with the app running: `target/node/node docs/features/1-spo2-core-loop.shots.mjs` (script: [1-spo2-core-loop.shots.mjs](1-spo2-core-loop.shots.mjs)).

## Screens

### No data (nothing stored yet)
![No data](img/1-no-data.png)

Since [#9](9-detail-screen.md) the explanation is no longer inline: a caution or warning row links to the detail screen, which shows it. Since [#29](29-check-in-questionnaire.md) values are entered through the check-in steps, not a form on home. The screenshots below predate both changes.

### Nominal (SpO₂ 96)
Quiet: muted "✓ Nominal", no fill, no explanation.
![Nominal](img/1-nominal.png)

### Caution (SpO₂ 92, rule SPO-01)
![Caution](img/1-caution.png)

### Warning (SpO₂ 88, rule SPO-02)
Octagon icon plus the word, white on red (5.77:1 light, 4.85:1 dark), so it passes at body size.
![Warning](img/1-warning.png)

### Stale (SpO₂ 88 recorded 25 h ago)
Old data shows its age, never an alarm.
![Stale](img/1-stale.png)

### Offline (SpO₂ 88 saved with the network off)
The warning appears without the server; the check-in waits to sync.
![Offline warning](img/1-offline-warning.png)

"Status unavailable" (rules or storage fail to load) can't be triggered from the running app; it's covered by `SystemStatusList.test.tsx` (AC14).

## Mockup and deviations

Layout follows [01-body-map.png](../../ideas/mockups/01-body-map.png) ("Body systems" panel, rows, status pills) and the explanation rows of [02-detail.png](../../ideas/mockups/02-detail.png). Colours, type, sizes and status styles follow [ui-guidelines.md](../../ideas/ui-guidelines.md) (tokens in `src/main/frontend/src/ui/theme/`), in light and dark; the screenshots are dark because the machine that took them is set to dark mode.

| Deviation | Reason |
|---|---|
| "✓ Nominal" instead of the mockup's "● Nominal" | Issue AC2 fixes the text. |
| Red WARNING pill, not in the mockups | No mockup shows a warning; style from [ui-guidelines.md](../../ideas/ui-guidelines.md) §5 (status badge). |
| Header with brand ring, "HEALTH" wordmark and theme toggle instead of the mockup's top bar of context pills | Canvas header from the guidelines; crew, mode and flight-day pills have no data yet. |
| Text at least 16 px, inputs as field tiles, "Who to involve" as a pill and the rule id as a tag | Guidelines §3–§5 (NASA minimum text height; routing kept neutral and apart from urgency). The mockups use 11–14 px. |
| Only Respiratory has rules; no body figure, hazard lens, routine or readings panels | Out of scope for #1. The nine synthetic rows below Respiratory in these screenshots come from [#4](4-body-systems-list.md). |
| Explanation inline in the row, not a separate detail screen; tier shown as a value, not the 4-step ladder | The issue puts the texts in the row (AC4, AC6); the detail screen is out of scope. |
| Values were entered in a right-hand "Check-in" panel with all fields on one screen | Replaced by the one-question-per-screen check-in of mockup 06 in [#29](29-check-in-questionnaire.md). |
