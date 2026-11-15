# #17 Cognition status from the PVT (rule COG-01)

Cognition on Home is now real: rule COG-01 reads the latest PVT median (from the [#16](16-pvt-test.md) reaction test). A median above 305 ms (304.75 ms since [#28](28-personal-baseline.md)) flags Cognition as Check with its alert-triangle icon on the Body systems list, the body figure and the Reaction time tile, and the row opens the Cognition detail with the trend, explanation, next step and the CMO tier. A PVT result goes stale after 4 days (the test runs every 4th day). Features F4 and F6 in [features.md](../../ideas/features.md); issue [#17](https://github.com/jdo-lv/galagans/issues/17).

The 305 ms threshold is a synthetic 265 ms baseline (mockup 02) + 15 % (team heuristic). Research gives no absolute PVT cut-off ([health-indicators.md](../../research/health-indicators.md) §13). Since [#28](28-personal-baseline.md) the threshold comes from the pre-flight profile (F3): 265 ms + 15 % = 304.75 ms, and without the adaptation corridor (F11) an early-flight slowing is flagged too. The rule's "How decided" text says so.

**Try it:** `mvn clean verify`, then `mvn spring-boot:run`, open http://localhost:8080 and run the reaction test (tap slowly to get a median above 304.75 ms). **Retake the screenshots** with the app running: `target/node/node docs/features/17-cognition-rule.shots.mjs` ([script](17-cognition-rule.shots.mjs)), which writes PVT results straight into IndexedDB. The 7-day charts need a build with `VITE_DEMO_MODE=false` (DEMO_MODE, on by default since [#43](43-demo-mock-modes.md), shows the last minute).

## Screens

### Home, check (PVT 268 ms 4 days ago, 312 ms 10 min ago)
Cognition row with its link, the figure's Cognition label and the Reaction time tile all show Check with its alert-triangle icon.
![Home check](img/17-home-check.png)

### Home, nominal (PVT 268 ms)
![Home nominal](img/17-home-nominal.png)

### Home, no PVT yet
Cognition shows "No data"; the synthetic Cognition placeholder is gone.
![Home no data](img/17-home-no-data.png)

### Cognition detail, check
![Detail check](img/17-detail-check.png)

### Cognition detail, stale (PVT 312 ms, 4 d 2 h old)
![Detail stale](img/17-detail-stale.png)

## Mockup and deviations

The detail follows [02-detail.png](../../ideas/mockups/02-detail.png) through the #9 detail screen and the issue mock [17-mock.png](img/17-mock.png). The screenshots are dark because the machine that took them is in dark mode.

The mock HTML predates the level tokens of [#33](33-alert-levels.md), so it no longer renders as its committed PNG.

| Deviation | Reason |
|---|---|
| No adaptation corridor or baseline band; X axis is the last 7 days | F11 isn't built; the baseline line came with [#28](28-personal-baseline.md). |
| No lapses in the rule | The engine rules one indicator per system; COG-01 uses the median only. |
| The chart's Y-axis gutter is wider (72 instead of 60 viewBox units), for SpO₂ too | "400 ms" didn't fit the old gutter. |
| On the stale chart, the hollow point can overlap the threshold label | Labels sit at a fixed spot on the left; cosmetic. |
