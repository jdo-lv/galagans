# Home variants

Added 2026-11-15. Home changes its layout with what the astronaut owes, on the [alert-level](alert-levels.md) scale: To do (level 1) while an input is owed, otherwise Nominal (level 0). Watch and Check variants (levels 2–3) are not designed yet. Colours, type and component rules: [ui-guidelines.md](ui-guidelines.md) §4 "App shell" and §5.

## iPad layout (built 2026-11-15, issue #52)

From the team wireframes for the demo iPad 7 (1080 × 810 landscape). Every screen fills the same shell (`ui/ScreenLayout.tsx`): a 200 px side panel, then the main panel with one or two panes. Home uses two:

| Part | Nominal | To do |
|---|---|---|
| Side panel | Context pills, then "Latest readings": every tile in `READINGS` order | Context pills, then "Relevant readings": the owed readings first (the open item's first), each with the To do outline and badge; the other tiles follow in `READINGS` order |
| Primary pane | The Body card (see "Body pane") | The Body card, with the open item's systems marked |
| Secondary pane | Today's routine, the Reaction test card, Body systems | "To do · <n>" (see "To do items"), Body systems |

Body systems always ends the secondary pane, so the detail screens keep a way in. Home has no hazard lens: it moved to Stats with the Body systems rows it marks, and Stats has no body figure.

Neither variant shows until the routine and the readings have each been read once (or failed), so Home never flashes the wrong one.

## Choosing the variant

`application/homeVariant.ts` turns what Home has read into to-do items, one row per source in `TODO_SOURCES`, in the order shown (what closes first comes first). A new owed input is a new row.

| Source | Owed when | When-line | Readings | Body systems |
|---|---|---|---|---|
| Morning check-in | the routine's check-in row is due or missed | "Due 07:00–09:00" / "Overdue since 09:00" | heart rate, SpO₂, sleep, mood | Cardiovascular, Respiratory, Cognition |
| PVT (3 min) | the Reaction time reading has no data, or is older than 4 days (every 4th day, [health-indicators.md](../research/health-indicators.md) §13 [S28]) | "Every 4th day · no result yet" / "Every 4th day · none in 4 days" | Reaction time | Cognition |

- An overdue check-in stays level 1, never 2–5 ([alert-levels.md](alert-levels.md) "Rules" 3).
- Each source reads what it can: a failed readings read doesn't hide the owed check-in, and a failed routine read doesn't hide the owed PVT.
- A Reaction time flag (COG-01) is a Check on Cognition, not a to-do: Home stays Nominal until the Check variant exists.

## To do items

One row is open at a time: the one the astronaut chose while it is still owed, otherwise the first. An open row shows Why, Takes and Source, then its action:

- **Morning check-in:** the six check-in steps in place (#29, with the device prefill of #55), without a card, Cancel or the completion screen. Once it is saved the row leaves and the next owed item opens.
- **PVT:** "Start PVT · 3 min", a link to `#/pvt`.

## Body pane

The primary pane holds only the "Body" card: its heading, the body figure (display-only; traced outline with each system's icon as its marker, #61), then the legend. The open item's systems get their icon stroked in level 1 blue, no fill, and a To do badge under their label; a level 2–5 badge on a label outranks it.

## Legend

"Alert levels", then one badge per level in a column, as the app shows it: ✓ Nominal, To do, Watch (up arrow), Check, Treat, Emergency. As built (#61): pinned to the Body card's bottom-left corner on tablet, under the figure below 1000 px, in 19 px bold text with 18 px icons, the smallest size at which every chip passes WCAG AAA (large text, 4.5:1).

## Sizes

At 1080 × 810 (measured by `docs/features/52-app-shell-home-variants.shots.mjs`): side panel 200 × 632 px, main panel 832 px with two 407 px panes, 24 px panel radius, 8 px between panels and between cards. The figure fills the pane's width: 457 px tall (measured by `docs/features/61-body-figure.mock.mjs`, #61).
