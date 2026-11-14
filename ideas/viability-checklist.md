# Idea viability checklist

Use this to test each team idea before the hackathon. Write the idea in five lines (problem, user, inputs, outputs, 2-minute demo), then run it through the gates and scores below. Evidence for every line lives in `../research/`.

## Gates (an idea must pass all five, possibly after modification)

| # | Gate | Pass when | Evidence |
|---|---|---|---|
| G1 | Answers the brief | It helps the astronaut **self-assess** and gives **guidance**, and it answers the brief's five questions: which measurement is feasible in space, why the exam matters, how the hazard shifts the value, when to escalate to crew or flight surgeon, what preventive action follows. | `../challenge.md` |
| G2 | Measurable in flight | Every input comes from a class of device that flies (watch/actigraph, BP cuff, pulse oximeter, thermometer, ECG patch or shirt, dosimeter, questionnaire, on-screen test, camera), or is clearly labeled a future capability. Orion: ~30 lb medical kit, no ultrasound; manual entry of BP and SpO2 is accepted by NASA. | `health-indicators.md`, `existing-systems.md` §2 |
| G3 | Citable thresholds and actions | Each status color comes from NASA-STD-3001, a clinical guideline, or the person's own in-flight baseline — and each flag leads to a documented action. Earth cut-offs alone misfire in flight (BP −8–10 mmHg, core temp +1 °C, plasma volume −15%). | `health-indicators.md`, `nasa-hrp.md` §3, `countermeasures.md` |
| G4 | Honest data plan | Demo data is real where it exists (Inspiration4 blood panels OSD-569/575, OSDR RadLab radiation, PhysioNet/NHANES proxies) and labeled synthetic elsewhere. No public in-flight astronaut vital signs exist. | `data-sources.md` |
| G5 | Buildable in 48 h by 6 people | A working demo of the core loop (input → status → explanation → action) is possible on Nov 14–15 without hardware we don't own. | — |

## Scores (1–5 each; use to rank ideas that pass the gates)

| Criterion | 5 looks like |
|---|---|
| Crew autonomy | Works offline; shows one-way delay (Moon ~1.3 s light-time, 6–10 s in practice; Mars ~3–22 min); prepares a store-and-forward packet for the surgeon; escalation tiers self → CMO → next private medical conference → urgent ground. |
| Crew-time burden | Daily check-in ≤ 1–2 min, schedulable in a window; passive data preferred. |
| NASA display conventions | Red = highest alert, yellow = caution; never color alone (icon + word); quiet when nominal; value + unit + data age + range + trend + next step. |
| Privacy | Private by default; role-based views (self / CMO / flight surgeon / mission control status only); no health-value leaderboards. |
| Scientific grounding | Each screen maps to an HRP risk and a NASA-STD-3001 requirement (e.g. [V1 3003], [V1 3004]); hazards (RIDGE) visibly drive the content. |
| Differentiation | Does something EveryWear (CNES, flies on ISS and Artemis II), Playbook and the NASA/Google CMO assistant don't: interpret, explain and guide on board. |
| Demo strength | A judge sees it work live in under 2 minutes (e.g. 3-min PVT, camera heart rate, radiation replay, body map). |

Past Space Apps judging has scored impact, creativity, validity, relevance and presentation. Confirm in the Judging & Awards guide published Nov 13.

## Common modifications that rescue an idea

| If the idea relies on… | Change it to… | Why |
|---|---|---|
| Continuous blood glucose | Manual or point-of-care entry, with CGM as a "future module" | Glucose isn't routinely monitored in flight; CGM only tested on Ax-4 (2025). Insulin resistance in flight is real, so keep the context. |
| Emotion recognition from face or voice | Self-reported mood plus an objective test (PVT, cognition) | Facial emotion inference is scientifically weak, banned in EU workplaces, and confounded by fluid-shift facial puffiness. |
| Leaderboards or rewards for good numbers | Private streaks and goals on the **process** (exercise minutes, check-ins done, fluids before landing) | Astronauts under-report symptoms to protect missions; competing on health values makes it worse. |
| Fixed Earth thresholds | Personal in-flight baseline with clinical guardrails | Healthy adapted crew would be flagged constantly. |
| Cloud AI or an LLM that diagnoses | On-board rules that explain "what, why, how decided, what next"; AI only as optional explainer; "decision support / flag for review" wording | No published accuracy even for NASA/Google's assistant; CIMON's cloud dependence is the cautionary example. |
| Real-time ground consultation | Store-and-forward packet plus visible delay | Mars delay and conjunction blackouts. |
| Ultrasound or imaging on any vehicle | Tie to environment mode: ISS and Gateway have ultrasound, Orion does not | Medical kit differs by vehicle. |
| Radiation measured by a phone or consumer sensor | Replay real OSDR RadLab dose-rate data against 30-day / 1-year / career limits | No consumer radiation dosimetry; RadLab data is open and minute-level. |
| Diagnosing SANS with a camera | Scheduled acuity + Amsler self-tests that flag for OCT | Early disc edema needs OCT. |
| "A dataset of real astronaut vitals" | Inspiration4 blood panels, RadLab, PhysioNet proxies, labeled synthetic in-flight drift | Real crew vitals are controlled-access (LSDA, TRISH EXPAND); requests take months. |

## Idea template

```
Name:
Problem (which HRP risk / hazard):
User and moment of use (who, when, which environment: spacecraft / station / rover / lunar or Mars base):
Inputs (indicator, device class, frequency):
Outputs (status, explanation, action, escalation):
2-minute demo:
Data for the demo (real / proxy / synthetic):
Gates G1–G5: pass / modify / fail — notes:
```
