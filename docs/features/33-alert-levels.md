# Alert level look (#33)

Every level badge now shows a Tabler level icon and a sentence-case word: Watch (trend arrow, the rule's direction), Check (triangle), Treat (first-aid kit), Emergency (octagon). Colour means only an alert level: yellow for Check, red for Treat and Emergency, blue only for the level 1 "to do" outline; links and focus are neutral. On the trend chart, a flagged point takes its level colour and the newest point of each run of same-level points carries the level icon as its marker, above the point or below it when above would be clipped. Features F5, F6, F12, F14, F15 and F26 in [features.md](../../ideas/features.md); levels in [alert-levels.md](../../ideas/alert-levels.md); issue [#33](https://github.com/jdo-lv/galagans/issues/33).

**Try it:** `mvn clean verify`, then `mvn spring-boot:run`. Open http://localhost:8080/simulator.html and, in another tab, http://localhost:8080. Set the BP cuff to **Watch** (systolic 120–129) or **Treat**, or the pulse oximeter to **Check** or **Emergency**, then open the flagged system on Home. Manual check-in values work too: SpO₂ 92 is Check and 88 is Emergency.

**Retake the screenshots** with the app running: `target/node/node docs/features/33-alert-levels.shots.mjs` ([script](33-alert-levels.shots.mjs)); `APP_URL` points it at `npm run preview`, `CDP_PORT` picks the first DevTools port. The script writes a minute of device readings into IndexedDB, once a second: nominal first, then the level from 20 s ago with one nominal reading 8 s ago, so each chart shows two runs, each with one marker. These shots came from `npm run preview` with DEMO_MODE on (the default), so the chart spans the last minute.

## Watch (systolic 125, rule BP-01)

Outline badge with a trending-up arrow, no colour (NASA's silent class 0 arrow). Watch points are rings.

![Home, Watch, light](img/33-home-watch-light.png)
![Home, Watch, dark](img/33-home-watch-dark.png)
![Detail, Watch, light](img/33-detail-watch-light.png)
![Detail, Watch, dark](img/33-detail-watch-dark.png)

## Check (SpO₂ 92, rule SPO-01)

Yellow badge with the triangle and a 1.5 px text-colour outline (yellow alone is 1.00:1 on the light background).

![Home, Check, light](img/33-home-check-light.png)
![Home, Check, dark](img/33-home-check-dark.png)
![Detail, Check, light](img/33-detail-check-light.png)
![Detail, Check, dark](img/33-detail-check-dark.png)

## Treat (systolic 145, rule BP-04)

Red badge with the first-aid kit, white word, text-colour outline (red alone is 1.53:1 on the dark surface).

![Home, Treat, light](img/33-home-treat-light.png)
![Home, Treat, dark](img/33-home-treat-dark.png)
![Detail, Treat, light](img/33-detail-treat-light.png)
![Detail, Treat, dark](img/33-detail-treat-dark.png)

## Emergency (SpO₂ 88, rule SPO-02)

Same red as Treat; the octagon and the word tell them apart.

![Home, Emergency, light](img/33-home-emergency-light.png)
![Home, Emergency, dark](img/33-home-emergency-dark.png)
![Detail, Emergency, light](img/33-detail-emergency-light.png)
![Detail, Emergency, dark](img/33-detail-emergency-dark.png)

## Dot display twin (`/device/simulation`)

The blue, yellow and red dots now use `--color-todo`, `--color-check` and `--color-alert`, the same palette values as before. The scenario at 42 % (Check), 25 % (Treat) and 8 % (Emergency):

![Dot display, 42 %](img/33-device-42pct.png)
![Dot display, 25 %](img/33-device-25pct.png)
![Dot display, 8 %](img/33-device-8pct.png)

## Mockup and deviations

Follows the issue mock [alert-levels-mock.png](img/alert-levels-mock.png) ([source](alert-levels.mock.html)), [01-body-map.png](../../ideas/mockups/01-body-map.png) and [02-detail.png](../../ideas/mockups/02-detail.png) for badges and the neutral UI, and [ui-guidelines.md](../../ideas/ui-guidelines.md) "Level badge" and "Charts".

| Deviation | Reason |
|---|---|
| The mock marks every flagged point; the app marks the newest point of each run of same-level points | AC4: one marker per run keeps DEMO_MODE's 1-minute chart (a reading per second) readable. |
| The mock's chart sits in a `--color-inset` well; the app's chart is drawn on the card surface | The well is not an AC of this issue; the chart layout is unchanged from [#9](9-detail-screen.md). |
| The mock's Watch example is a test row "SpO₂ < 95 % watch" with a trending-down arrow; the screenshots show BP-01 with trending-up | No shipped row is a `below` watch; the trending-down badge and marker are covered by `SystemStatusList.test.tsx` and `SystemDetail.test.tsx`. |
