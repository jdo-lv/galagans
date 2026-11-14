# Human factors and UX for an astronaut-facing health app

Research for the NASA Space Apps 2026 challenge "Create Health Monitoring Software for Astronauts" (researched Nov 6, 2026). Source tags like [S1] point to the Sources list at the end. "(via search)" means the claim comes from a search-result summary, not from reading the document itself. Requirement IDs are from NASA-STD-3001 Vol 2 **Rev B (2019)**. Rev D (2023) is the version newer NASA decks cite, and IDs may have been renumbered there.

## Key takeaways for the team

- **The meaning of each color is fixed by NASA.** Red is the highest alert level and yellow the second [S1 V2 10118/10119]. Critical information must never rely on color alone: add an icon, a word or a sound [S1 V2 10045]. Use color sparingly and reserve red for alerts. Use no more than 9 colors, and for color-deficient viewers do not pair red with green [S2 §10.6.19, §10.11.5.5]. A plain green/yellow/red traffic light breaks the HIDH guidance unless a shape and a label back up each color.
- **Keep the nominal screen quiet.** NASA crew displays follow a "quiet/dark" approach: a status bar of key parameters is always visible, and attention is drawn only to off-nominal items [S3]. Too many alerts become a nuisance and crews stop responding [S4]. The Shuttle had a silent "class 0" alert, an up or down arrow beside an out-of-limit value [S2 §10.9.1.1]. That pattern suits health values that are out of range but not dangerous.
- **Keep urgency separate from who gets involved.** NASA alert classes (Emergency, Warning, Caution, Advisory) measure time-criticality [S4]. Whether the crewmember, the Crew Medical Officer (CMO) or the ground should act is a different question. A slowly drifting bone or vision trend may need the flight surgeon but is not urgent. Chest pain needs the CMO now. Use color for urgency and a separate label for routing. (This split is our design inference, consistent with [S21] Table 1.)
- **Crew time is the scarcest resource.** An ISS workday has about 6.5 h of work, planned in 5-minute blocks. Exercise takes about 11% of the day (about 2.5 h) [S8][S9]. Tasks that recur daily or more than weekly are hard to schedule [S8]. The crew already have weekly private medical conferences, private psychological conferences every two weeks, monthly peer exams and monthly cognitive tests [S10][S12][S13]. A daily check-in should take about 1–2 minutes (our target) and pull from passive sensors where possible.
- **Design for autonomy and offline use.** One-way delay can exceed 20 min [S21]; the HIDH plans for delays of 30 min to 1 day or more [S2 §10.13.1.3]. The CMO is often a non-physician with about 40 h of medical training [S21]. NASA's planned decision-support tool (ExMC CDSS) says what to do now, why, how the decision was reached and what to expect next. It offers ranked treatment options the crew chooses from and filters non-critical alerts [S21]. Stale or missing data must be flagged visibly [S1 V2 10020][S2 §10.12.4].
- **Medical privacy is a hard constraint.** Medical data stays between the crewmember and flight medicine: the flight surgeon and their designees, including the CMO [S6 V1 3000/6003/7003]. Other crewmembers may not use or disclose it without consent except for immediate safety [S23]. Private psychological conferences are not recorded [S12]. Any sharing feature must be opt-in and per item.
- **Under-reporting is documented, and gamification could worsen it.** Astronauts fear that disclosed symptoms cost them missions [S24]. Never reward "good" health values, rank crewmembers or compare health data. Reward the process (check-in done, session done) and compare each person only with themselves.
- **Gamification evidence is modest and comes from Earth.** Pooled effect on physical activity is small to medium (Hedges g = 0.42) [S26]. In the STEP UP trial competition gave the most durable gains [S27]. There is no outcome data from spaceflight, and analog exergame studies are pilots or protocols [S28][S29].
- **Microgravity changes input.** Fine motor accuracy on an iPad drops in the first week on orbit [S31]. Touch targets should be at least 9.5 mm with 3.2 mm gaps, and touch suits short tasks only [S2 §10.4.2.21]. Floating crew bump touchscreens by accident [S3]. Long-duration crews often see less sharply (average hyperopic shift 0.84 D; 60% report degraded acuity) [S2 §5.4.12], so use large text (≥0.4° visual angle preferred) [S1 V2 10049].
- **Evidence for trend charts and low-friction logging.** 82.3% of Cognition users who commented liked seeing feedback with a performance-history graph [S15]. EveryWear's barcode food diary was requested for 1 week, and Thomas Pesquet logged more than 1,200 items over 6 months [S33].

## 1. NASA standards for crew displays, C&W, legibility and hardware

### 1.1 Display requirements that map directly onto a health app (NASA-STD-3001 Vol 2 Rev B [S1])
| ID | What it requires | App implication |
|---|---|---|
| V2 10001/10002 | Programs define usability criteria (effectiveness, efficiency, satisfaction per ISO 9241-11) | State measurable targets, e.g. a check-in under 90 s without errors |
| V2 10007/10010/10011 | Display standards, a labelling plan and an icon library; consistent layout and commonality | One component library and one status vocabulary on every screen |
| V2 10008/10046 | Units consistent across like items; units always shown with values | Pick mg/dL *or* mmol/L everywhere; never show a bare number |
| V2 10019/10020/10022, Table 19 | Response times: keystroke 0.1 s, menu 0.5 s, info on request 1.0 s, command feedback 2.0 s; missing or stale data must be flagged | Optimistic UI, a visible "data age" stamp, gray or hatched stale values |
| V2 10023–10026 | Electronic procedures show the current step, completed steps, prior and next steps, and allow real-time edits | Guided measurement flows as step lists with checkmarks and resume |
| V2 10037/10040/10042/10043 | Critical info visible without scrolling; show only what the task needs; group by task flow; shallow navigation | Overview first, detail on request; at most 2–3 levels deep |
| V2 10045 | Color for critical info needs a redundant cue (label, icon, speech) | Every status has icon + word + color |
| V2 10047–10050, Tables 20–21 | Legibility; character height min 0.25°, ≥0.4° preferred; Weber contrast ≥0.2; viewing angle ±45° | See 1.4 |
| V2 10114–10119 | Visual + audio annunciation for emergency/warning/caution; manual silencing; annunciator self-test; red = highest level, yellow = second | Never use red or yellow decoratively |
| V2 7045 | Medical equipment usable by non-physician crew | Instructions written for a novice, not a clinician |
| V2 7071 | Privacy for missions over 30 days, including private medical and psychological conferences | Private mode and a private-room context for sensitive questions |

### 1.2 Caution and warning philosophy and colors
- **Alert classes** [S4][S5]: *Emergency* is a time-critical event that threatens loss of crew or mission (fire, rapid depressurization, toxic atmosphere). *Warning* needs immediate action. *Caution* needs attention but not immediate action. *Advisory* is information about a safe or normal state, or for routine action. The HIDH defines Class 1–3 the same way: warning includes "exceeding a predefined safety limit", caution includes "heavier than normal consumable usage" [S2 Table 10.9-1].
- **Colors**: red is the highest alert level and yellow the second [S1]. HIDH conventional label colors [S2 §10.11.5.5]: red = emergency, warning, master alarm; yellow = caution; green = important, frequently used, non-urgent controls; sage green = first aid; blue = advisory ("not recommended for general use"); magenta = radiation hazard; white = advisory on lit indicators. One meaning per color, at most 9 colors in a coding system [S2 §10.9.2.5.1].
- **Artemis tones** (Orion, Gateway, HLS) [S4][S5]: fire = siren; pressure loss or toxic atmosphere = klaxon; warning = alternating low/high tone; caution = continuous tone; advisory = 2 self-terminating beeps (optional). Gateway and HLS add speech alerts.
- **Speech alerts** [S5]. In a 25-person study, tone plus speech was slightly slower but slightly more accurate (95% vs 92%) and gave faster understanding of the event. 20 of 25 participants preferred it. ISS crew report that tones are hard to tell apart when waking and that they must float to a panel to learn what happened [S4]. Recommended structure: tone + signal word + type and location, repeated [S5].
- **Usual alert-display features** [S4]: sort by class and time; mark acknowledged and resolved; link directly to the procedure; inhibit or suppress options.

### 1.3 Alarm fatigue and clutter
- Too few alerts leave the crew unaware; too many raise workload, become a nuisance and lead to "failure to respond" [S4].
- Using too many colors creates a "Christmas tree" effect [S2 §10.6.19]. Clutter forces serial search and raises errors under stress; the HIDH says minimizing clicks by cramming a screen is a known mistake [S2 §10.6.5].
- To reduce startle, play the first alert 6–10 dB quieter and fade tones in [S2 §10.9.2.4].
- Prefer audio for short, simple, urgent messages and for people who are moving. Prefer visual for long or complex messages, things to recall later, and people who are stationary [S2 Table 10.9-3].
- **For the app:** an out-of-range health value is normally an advisory or caution, with no tone and a silent arrow like Shuttle class 0 [S2]. Reserve sound and red for true medical emergencies, where the app should defer to the vehicle's C&W conventions.

### 1.4 Legibility, fonts, icons
- **Text size.** Minimum character height is 0.25°; 0.4° or more is preferred [S1 Table 21]. NASA's own example: 0.25° is 10-pt type at 32 in (81 cm). Our arithmetic: height ≈ distance × 0.007 at 0.4°, which is about 3.5 mm at 50 cm (tablet) and about 4.9 mm at 70 cm (laptop). Make critical values larger still: rapid reading of critical displays needs bigger fonts [S1 V2 10050]. Labels need at least 0.4° [S1 V2 10066].
- **Display quality** [S1 Table 20]: contrast ratio ≥10 in ambient light; viewing angle ±45° with color and contrast held. Displays can change color when viewed off-angle, and confusing color use nearly failed one verification task [S3].
- **Icons.** "Resist the urge" to make custom icons for common things; use a standard library or icons crews know from home and work devices [S3]. Use color sparingly and only with standard meanings [S3]. Do not make the crew do mental math or rely on memory [S3][S1 V2 10113].
- **Graphics.** Use simple graphics with no decoration. A line drawing often beats a photo because it removes clutter; grid lines should be faint and optional [S2 §10.6.18].
- A commercial provider that skipped a display standard was criticized at verification for non-standard color use, unusual icons and small fonts [S3].

### 1.5 Orion and Artemis display formats
- Orion has 3 display units (commander, shared, pilot), 2 cursor control devices, 7 switch panels and backup switches. Electronic procedures link to C&W [S7]. Press reports 60+ formats (unverified).
- Display standards: ISS Display Graphics and Commonality Standard (SSP 50313); Orion Display Format Standard (MPCV 72242); Gateway GUI Standard (GP10056); HLS-STD-002; Artemis-wide GUI Standard M2M-30040, being baselined. The lineage runs Orion → Gateway → HLS → Artemis [S3]. None of these documents was found publicly.
- Each display is verified against a checklist, and a board decides how many deviations are acceptable [S3].
- Orion gloves are touch-screen compatible [S7].

### 1.6 Hardware crews actually use
- **ISS.** Commercial laptops are the main display interface [S3]. Station Support Computers (SSCs) run Windows and do office and daily work. Separate Linux laptops command the station [S37, press]. HP says over 100 of its workstations are aboard. Press reports an upgrade to a custom HP ZBook (Fury) G9 from late 2025 [S37] (secondary sources).
- **iPads.** EveryWear runs on NASA-provided iPads [S34], as does the Cognition test [S15].
- **Browser apps.** The ExMC AMOS tool runs in "any web browser" on the ISS server and is reachable from every SSC [S22]. That deployment model fits a web-based hackathon prototype.
- **Gateway** will use commercial laptops [S3]. **Orion** uses custom avionics display units [S3].

## 2. Crew time and data-collection burden

- **The ISS day** [S8]: sleep 35%, available work 27% (about 6.5 h), exercise 11%, post-sleep 6%, pre-sleep 8%, meals and prep about 10%, daily planning conference 3%. It is planned in 5-minute blocks, and weekends are protected off-duty days.
- **Exercise.** ESA gives 2.5 h/day of mandatory exercise including days off [S9, via search]. Other NASA and academic sources say about 2 h/day [S14][S28]; the gap is probably setup and hygiene time (unverified).
- **What researchers are told is hard to fit in** [S8]:
  - activities required daily or more than once a week
  - complex sessions before flight week 2
  - single sessions of 4 h or more
  - rigid timing
- **Existing health routine:**
  - monthly Periodic Health Status exams that crewmembers perform on each other and type into the medical computer for downlink [S10]
  - weekly private medical conferences (PMCs) [S10]; another source says "regularly and on crew request" [S11]
  - private psychological conferences (PPCs) every two weeks, usually on weekends, 15–20 min [S12][S13]
  - WinSCAT cognitive test every 30 days [S13]
  - the newer Cognition battery averages about 16 min on ISS [S15, via search]
- **Burden signals:**
  - AMOS needed 30 min setup plus 70–90 min sessions. Post-flight debriefs were skipped for 2 of 3 demos because of crew time [S22]. AMOS built its surveys into the modules and ran them during the session to reduce recall bias [S22].
  - EveryWear replaced questionnaires and photos that were cumbersome for crew and scientists. Pesquet said it improved his diet without costing time [S33].
- **Self-scheduling (Playbook)** [S16][S17][S18]:
  - The tool is tablet-first, uses drag and drop, and checks constraints automatically.
  - NEEMO showed the idea was feasible, and an ISS demonstration (CAST) followed.
  - In HERA Campaign 6 the crew self-scheduled 1 of 4 flexible activities unprompted. Campaign 7 doubled self-scheduling to 8 days, about 20% of the mission.
  - In a 31-person lab study, trust (5.94/7) correlated strongly with usability.
  - **Implication:** let the crew move the app's tasks within a window rather than fixing a time.
- **Analog compliance data:** no published HERA or CHAPEA compliance rates were found. CHAPEA 1 (378 days, 22-min one-way delay) has no results paper indexed yet [S40]. One Mars Desert Research Station (MDRS) project reports "chronic survey non-compliance" in analogs but has no numbers yet (open lead).

## 3. Designing for autonomy under communication delay

- **The delay.** One-way delays can exceed 20 min [S21], and CHAPEA simulated 22 min one way [S40]. The HIDH plans for delays of 30 min to 1 day or more and says crews need searchable onboard data and simplified procedures [S2 §5.8.4.4.5, §10.13.1.3].
- **ExMC clinical decision support (CDSS)** [S19][S20][S21][S39]:
  - Purpose: help crews prevent, detect, diagnose and treat conditions. It is semi-autonomous or autonomous, includes non-clinical data such as the vehicle environment and exercise, and supports a novice if the CMO is the patient.
  - Medical Level of Care V is the target case: long delay, no evacuation.
  - CDSS functions [S21]: rapid data interpretation, triage, documentation, just-in-time training tailored to skill, inventory and storage locations, and concise interactions that say what to do now, why, how the decision was reached and what to expect next.
- **Acuity tiers in the CDSS concept** [S21 Table 1]:
  - *Emergency*: predetermined protocols (ABCDE), procedure help, feedback on whether treatment worked.
  - *Routine diagnosis*: a "next best question" engine, ranked options the crew chooses from, automatic record retrieval and allergy checks.
  - *Routine observation*: rich data analysed on board because of low bandwidth.
  - *Prevention* (e.g. kidney stones): measure "with least possible distractions", predict decrements.
- **The CDSS walk-through** [S21]:
  - The injured crewmember selects "pain" and "left chest", the same interaction as a clickable body map.
  - The CDSS asks for vitals and an ECG, then sends a 30-minute reassessment prompt to the crewmember's tablet.
  - It escalates to an emergency mode (lights to high, notifies CMO and MCC), schedules reassessments and closes the encounter into the medical record.
  - The flight surgeon then adjusts duties with the schedulers.
- **Value.** A simulation suggests raising the crew's medical scope of practice cuts deaths on a 26-month mission by at least 34%. Cognitive skills mattered more than procedural ones [S21] (preliminary).
- **Interface rules for automation** [S2 §10.13.2, after Norman]: give rich, natural signals; be predictable; provide a good conceptual model; make the output understandable; keep the crew aware without annoying them; always allow manual override; give continuous feedback when a process takes longer than 2 s.
- **Data validity.** Flag questionable, stale or missing data by color, symbol or fill. Old data can be worse than none [S2 §10.12.4].
- **Explainable thresholds** (our design inference from the above):
  - show the value, unit, data age, the reference range and where it comes from (NASA standard, personal preflight baseline, or flight-surgeon setting)
  - show the trend direction and the reason for the status
  - show one recommended next step and who to involve
- **Offline-first.** Rich datasets should "reside locally" because bandwidth is narrow [S21]. Cognition's technical problems clustered where internet access was restricted [S15].
- **Vol 1 Rev C** requires in-mission capability to assess, record, monitor and trend vital signs and behavioral signs. It also requires evidence-based asynchronous behavioral-health protocols on electronic devices, store-and-forward private conferences when delayed, and stronger glasses for vision changes from SANS (spaceflight-associated neuro-ocular syndrome) [S6 V1 3004, 6002, 6010].

**Proposed tiers** (team design; NASA vocabulary in brackets):

| Urgency (color + icon + word) | Example | Routing (a separate label) |
|---|---|---|
| Nominal (no emphasis, "quiet") | values within personal baseline | none |
| Monitor [Advisory] (neutral or white, info icon) | sleep 5.5 h two nights running | self-care tip and re-check later |
| Attention [Caution] (yellow, triangle) | BP trending up over 2 weeks | consult CMO; queue for flight surgeon (async) |
| Act now [Warning] (red, octagon) | SpO2 low and HR high at rest | CMO now; notify ground |
| Emergency (red, flashing, speech) | chest pain + dyspnea | follow the vehicle emergency protocol; app shows procedure only |

## 4. Medical privacy: who sees what

- **ISS Crew Code of Conduct** [S23]:
  - Personal information about crewmembers, including all medical information, may not be used or disclosed by other crewmembers without consent, except for immediate crew safety.
  - Biomedical telemetry, private medical communications and medical investigation data travel privately and securely.
  - Crewmembers keep full access to their own data.
- **NASA-STD-3001 Vol 1 Rev C** [S6]:
  - Private medical and psychological communications are private by requirement (V1 6003/6011).
  - Records are secured and not disclosed without consent, per the Privacy Act (V1 7003).
  - Flight medicine is the flight surgeon and designees, including CMOs (V1 3000).
- **Private psychological conferences** are not recorded and are confidential [S12]. All behavioral-medicine data are private medical records [S13]. If a PPC raises no mission impact, the crew surgeon is told only that a nominal contact took place [S12].
- **Culture.**
  - Astronauts and flight surgeons read the Privacy Act as limiting medical data to the flight surgeon and astronaut. Because so few people fly, even anonymized data can be re-identified [S24].
  - In 2024 NASA declined to name which returning crewmember had been hospitalized [S25].
  - EveryWear encrypts each data type end to end between the crewmember and its designated recipient [S34, via search: 2022 IAC paper].

| Role | Sees |
|---|---|
| Crewmember | Everything about self |
| CMO (onboard designee) | What is needed to deliver care, in a care context (our inference: an explicit, logged "care access") |
| Flight surgeon / BHP (behavioral health) provider | Full medical data via private channels |
| Other crew | Nothing medical without consent; safety alerts only |
| Mission control / schedulers | Operational effects only (duty limits, schedule changes), no diagnosis (inferred from [S21] scenario) |
| Researchers | Consented study data only |
| Public | Nothing identifiable |

**Design consequence:** the app has no shared feed or leaderboard by default. Any team view uses opt-in, non-medical metrics, and a crew of 4–6 makes even aggregates identifying [S24].

## 5. Gamification: evidence and risks

- **Earth evidence:**
  - Meta-analysis, 16 RCTs and 2,407 participants: physical-activity effect g = 0.42 (95% CI 0.14–0.69), persisting at follow-up [S26].
  - A cardiovascular meta-analysis of 6 RCTs found g = 0.32 and about +697 steps/day; feedback was the most important element [S41, via search].
  - STEP UP (602 adults, 24 weeks): competition +920 steps/day and support +689 vs control. Only competition lasted at follow-up (+569) [S27]. It was funded by Deloitte and the Penn Nudge Unit.
- **Spaceflight and analogs:**
  - No flight outcome data.
  - The SPACE protocol tests a software exercise partner, because group exercise is not possible for astronauts (ground study) [S29].
  - A VR exergame pilot (n = 5) improved restorativeness scores, but VO2max and some cognitive scores were better without VR. The authors know of no product that combines biometrics with exergaming [S28].
- **Risks for a professional crew:**
  - Institutional pressure to under-report symptoms, plus a stoic culture [S24].
  - Workplace gamification works as performance monitoring and pressure; leaderboards cause clustering and intimidation [S30, via search].
  - Rewarding zero incidents can encourage hiding injuries [practitioner commentary, via search; weak].
  - Ranking crewmembers would also fall under worker-performance monitoring, which is ethically off-limits.
- **What crews liked:** feedback and a history graph (82.3% of those who commented) [S15]. The Emotion Recognition test was the most disliked (50.6%) [S15]. CIMON's emotion analysis was described as "very limited" [S36]. **Let crews self-report mood; do not infer it.**
- **Safe pattern:** private, self-referenced goals (e.g. exercise sessions completed); streaks that pause on sick days without penalty; badges for learning modules; never score symptom reports or health values; optional cooperative crew goals about completion, never about health data.

## 6. Interaction patterns and environment constraints

- **Clickable body map.**
  - Use it as an input (symptom location) as well as an output (status by system). This mirrors the CDSS "pain + left chest" step [S21].
  - Prefer line drawings to photos [S2 §10.6.18].
  - Make regions at least 9.5 mm touch targets.
  - Also offer a list view, so the map is not the only path (redundancy, V2 10045).
- **Trend charts.**
  - Draw a band for the reference range and personal baseline.
  - Mark stale or missing points [S2 §10.12.4].
  - Write units on the axes [S1 V2 10046].
  - Keep grid lines faint and optional [S2 §10.6.18].
  - Avoid dual axes and decoration.
- **Color-blind safety.** Red-green deficiency affects about 8% of Caucasian men, 5% of Asian men and 4% of African men [S32]. Okabe-Ito principles [S32]:
  - never use color alone
  - label directly on the graph
  - swap red/green for magenta/green or vermilion/bluish-green
  - use thick lines, large symbols and enough brightness contrast
  - The HIDH likewise says consider the crew's color vision and avoid red with green [S2]. Whether astronaut selection screens out color deficiency was not checked (OCHMO-STD-100.1A).
- **Guided measurement.**
  - Show one step per screen with the current, completed and next steps [S1 V2 10023–10025].
  - Write for non-physicians [S1 V2 7045].
  - Use text plus photo plus optional video; AMOS users mostly read text and watched few clips [S22].
  - Use if-then wording at branch points; an AMOS operator ended an exam early and missed a preset [S22].
  - Embed one or two feedback questions at the point of use [S22].
  - First-time AMOS users navigated linearly with arrow keys rather than pointing and clicking [S22].
- **Microgravity and motor control:**
  - Fine motor accuracy drops in the first week on orbit and the first month after landing [S31]. Accuracy on computer interfaces is affected especially in the first week [S3].
  - Crew need a way to hold position while using displays and can bump touchscreens by accident [S3].
  - A free-floating crewmember can do only low-force, short tasks such as switches and reading displays [S2 §11.3.7, EVA restraints].
  - Touchscreens suit intuitive input but not long input sessions [S2 §10.4.2.21].
  - Add confirm-or-undo for anything consequential.
- **Gloves and suits.** Gloves reduce cursor accuracy; discrete 4-way devices beat continuous ones when gloved [S2 §10.4.11]. Orion gloves work on touchscreens [S7]. Suits must display pressure, ppO2, ppCO2 and metabolic data [S1 V2 11035/11038].
- **Noise.** Work areas are limited to NC-50 [S1 V2 6078]. Crew quarters measured about 42.6–49.7 dBA in 2017 [S38, via search]. Audio cues must be paired with visual ones because background noise is high [S2 §10.6.20.2].
- **Lighting and vision.**
  - Long missions need pre-sleep lighting with little short-wavelength light [S1 V2 8055]. Add a dim, warm night theme.
  - Hyperopic shift and SANS mean prescribed glasses and larger text [S2 §5.4.12][S6].
- **Response time and feedback.** Follow Table 19 [S1]. A laggy interface makes crews re-issue commands [S3].

## 7. Publicly shown astronaut-facing software

- **EveryWear (CNES/CADMOS with MEDES, ISS iPads, since 2016)** [S33][S34]:
  - Barcode food diary with an English/Russian database of all station food, plus nutrient reports.
  - Medication tracking, secure messaging with ground doctors, dynamic questionnaires.
  - Connects a dosimeter, pulse tonometer, skin-temperature patch (sleep), ECG shirt and glucose meter.
  - Ground nutrition experts send weekly advice. Now used by most ISS crews, with an Artemis version planned.
- **Astroskin / Bio-Monitor (CSA, Hexoskin/Carré, ISS from 2019):** a smart shirt with an iPad app. NASA reports a CSA-built iPad app that forwards vital signs to the Medical Data Architecture (MDA) prototype [S35]. Few public UI details.
- **AMOS (ExMC, ISS 2020+):** browser-based just-in-time ultrasound guidance with menus by module, section, chapter and page. Crews produced clinically adequate images without prior training or ground contact, rated usability high, and asked for wearable screens and AI guidance [S22].
- **Cognition (Penn/NASA):** 10 tests on laptop or iPad. Users valued performance feedback and history graphs [S15].
- **Playbook (NASA Ames):** tablet timeline and self-scheduling with violation markers and suggested fixes [S16][S18].
- **Orion displays:** 3 display units with electronic procedures linked to C&W [S7].
- **CIMON / CIMON-2 (DLR/Airbus/IBM):** a floating voice assistant; version 2 added tone analysis. IBM reported only initial demonstrations, not acceptance results [S36].

## UX checklist for the team

1. Follow red = highest alert, yellow = second. Never use red or yellow decoratively. Pair every color with an icon and a word.
2. Keep the nominal screen quiet: a status bar of key values and emphasis only for off-nominal items. Health out-of-range is silent or advisory unless life-threatening.
3. Encode urgency and routing separately (self / CMO / flight surgeon async / MCC).
4. Each status shows value + unit + data age + reference range and its source + trend + one next step ("what, why, how decided, what next").
5. Flag stale, missing or questionable data; never show old data as current.
6. Offline-first and delay-aware: everything decidable on board, ground messages store-and-forward.
7. Daily check-in ≤1–2 min (our target); prefer passive or sensor data; schedulable in a window, not at a fixed time.
8. Guided measurements as electronic procedures (current, completed, next), written for non-physicians, with if-then branches.
9. Touch targets ≥9.5 mm with ≥3.2 mm spacing; short touch interactions; confirm or undo; usable one-handed while holding a rail.
10. Text ≥0.4° visual angle (about 3.5 mm at 50 cm); high contrast; dim warm night theme.
11. Color-blind-safe palette (Okabe-Ito style), no red/green-only distinctions, at most 9 colors, standard icons.
12. Private by default: crewmember sees all; CMO through logged care access; ground medical through private channels; no medical data to other crew or the public.
13. Gamify the process, not the physiology: private, self-referenced, sick-day safe, no leaderboards of health values, no penalties for reporting symptoms.
14. Self-reported mood, never inferred emotion.
15. Meet the response times: 0.1 s keystroke, 0.5 s menu, 1 s data, 2 s command feedback.
16. In the pitch, cite NASA-STD-3001, ExMC CDSS, AMOS, EveryWear and Playbook to show alignment with NASA practice.

## Team palette (Health Palette Prototype)

Usage rules (semantic tokens, type, components, contrast for every allowed pair): [ui-guidelines.md](../ideas/ui-guidelines.md). The gaps listed below are resolved there.

Design source: [Health Palette Prototype.html](Health%20Palette%20Prototype.html) (open in a browser; three boards: Splash, Today, Palette contrast check). Ratios below are WCAG 2.1, recomputed from the hex values on 2026-11-14.

| Token | Light | Dark |
|---|---|---|
| Background | `#CFCFCF` | `#1B1B1B` |
| Card | `#DADADA` | `#52574E` |
| Text | `#1B1B1B` (11.1:1 on bg) | `#DADADA` (12.3:1 on bg) |
| Muted label | `#52574E` (4.8:1 on bg) | `#868375` (4.5:1 on bg) |
| Logo ring | `#726F6C` | `#868375` |
| Accents | `#C61E37` red (logo, step ring, heart), `#868375` khaki (exercise), `#52574E` olive (sleep), `#1651B6` blue (links, brain) | same |

Gaps against the checklist above:
- Red `#C61E37` is used decoratively (logo, step ring, heart arc). That breaks item 1: red must stay reserved for warnings.
- No caution yellow or nominal state colour is defined yet.
- Contrast failures: khaki as a label on the light card (2.7:1) and on the dark card (1.9:1); card edge vs background (1.1:1 light, 2.3:1 dark, below the 3:1 for UI shapes); red label text `#DADADA` on `#C61E37` (4.1:1, large text only).
- No night theme (item 10) and no colour-blind check (item 11).

Applied in the restyled mockups (`ideas/mockups/src/base.css`, 2026-11-14; all 10 screens), dark theme:
- Status set added: caution `#FFC72C` with `#1B1B1B` ink (11.0:1; 4.8:1 against the card), warning `#C61E37` reserved for warnings only, nominal = quiet muted "✓ Nominal" with no fill. Every status keeps icon + word.
- Brand arc moved from red to blue. On dark, blue needs the tint `#7FA6F0` (7.1:1 on `#1B1B1B`); `#1651B6` is 2.4:1.
- Card edge `#868375` (4.5:1 on `#1B1B1B`) fixes the 2.3:1 edge failure.
- Selected and primary states use the design's pill (`#DADADA` on `#1B1B1B`), not yellow, so yellow only means caution. Rule-triggered items get a dashed tag, not yellow.
- Simulator purple replaced by palette greys; nominal green dropped for the quiet muted style; architecture legend uses khaki / grey / blue tint / caution yellow.

## Gaps and unverified items

- The current NASA-STD-3001 Vol 2 (Rev D 2023 or later; Rev E listed as active) was not read; the Rev D PDF link returned 404. IDs above are from Rev B.
- The Orion, Gateway and Artemis GUI standards are not public; their exact color tokens are unknown.
- No published compliance or adherence rates from HERA or CHAPEA were found.
- Not checked: whether astronaut selection requires normal color vision (OCHMO-STD-100.1A).
- ISS laptop model details come from press reports only.
- PMC cadence is given as weekly [S10] and as "regularly" [S11]. Exercise time is given as 2 h [S14][S28] and as 2.5 h [S9].

## Sources

- [S1] NASA-STD-3001 Vol 2 Rev B (2019): https://standards.nasa.gov/sites/default/files/standards/NASA/C/Historical/nasa-std-3001_vol_2_rev_b.pdf
- [S2] NASA Human Integration Design Handbook Rev 1 (2014): https://www.nasa.gov/wp-content/uploads/2015/03/human_integration_design_handbook_revision_1.pdf
- [S3] Holden, CLDP HSI Workshop: Crew Interfaces (2024): https://ntrs.nasa.gov/api/citations/20240003566/downloads/CLD%20HSI%20Workshop%20Crew%20Interfaces.pdf
- [S4] Holden, CLDP HSI Workshop: Alerts (2024): https://ntrs.nasa.gov/api/citations/20240003565/downloads/CLD%20HSI%20Workshop%20Alerts.pdf
- [S5] Holden et al., Multimodal Alert Design, HRP IWS 2023: https://ntrs.nasa.gov/api/citations/20230001729/downloads/Multimodal%20Alerts%20IWS2023.pptx.pdf
- [S6] NASA-STD-3001 Vol 1 Rev C (2023): https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf
- [S7] NASA Artemis reference, Orion Crew Systems: https://www.nasa.gov/reference/crew-systems/
- [S8] Kosobud, Perry, Schwanbeck, What to Expect During In-flight Operations: https://ntrs.nasa.gov/api/citations/20170000487/downloads/20170000487.pdf
- [S9] ESA, The astronaut daily schedule (via search): https://outpost42.esa.int/blog/the-astronaut-daily-schedule/
- [S10] Roden & Ewert, Health and Fitness Evaluations for Long Duration Microgravity Exposure: https://ntrs.nasa.gov/api/citations/20060051792/downloads/20060051792.pdf
- [S11] Jones, International Space Station Medical Operations (2008): https://ntrs.nasa.gov/citations/20080010877
- [S12] NASA BHP Operations overview (2017): https://ntrs.nasa.gov/api/citations/20170003866/downloads/20170003866.pdf
- [S13] Space Psychology deck (ISU, citing Beven 2012): https://ntrs.nasa.gov/api/citations/20230010798/downloads/071622%20CSP_Space%20Psychology.pdf
- [S14] BHP for Future Space Exploration (2024): https://ntrs.nasa.gov/api/citations/20240014687/downloads/BHP%20for%20Future%20Space%20Exploration%202024.pdf
- [S15] Casario et al., Acceptability of the Cognition Test Battery, Acta Astronautica 190 (2022): https://pmc.ncbi.nlm.nih.gov/articles/PMC8601114 ; Cognition overview: https://www.med.upenn.edu/uep/cognition.html
- [S16] Marquez et al., Playbook self-scheduling (NTRS 20180000770): https://ntrs.nasa.gov/citations/20180000770
- [S17] Marquez, Crew Autonomy Through Self-Scheduling: Operational Characterization (2025): https://ntrs.nasa.gov/citations/20250000944
- [S18] Marquez, What is the role of Usability and Trust in Autonomy? (2024): https://ntrs.nasa.gov/api/citations/20240004244/downloads/Usability%20and%20Trust%20-%20Marquez%20Slides.pdf
- [S19] Krihak et al., ExMC CDSS Concept of Operations, HRP-48033 (2021): https://ntrs.nasa.gov/citations/20220017856
- [S20] Russell et al., Clinical Decision Support Concepts of Operation (2021): https://ntrs.nasa.gov/citations/20205008737
- [S21] Russell et al., The value of a spaceflight CDSS for earth-independent medical operations, npj Microgravity 9:46 (2023): https://www.nature.com/articles/s41526-023-00284-1
- [S22] Ebert et al., AMOS Software Technology Demonstrations on the ISS: https://ntrs.nasa.gov/api/citations/20240012964/downloads/Amos%20Paper%20with%20Figures%20and%20Legends.pdf
- [S23] ISS Crew Code of Conduct, 14 CFR Part 1214 (2014 edition, GPO): https://www.gpo.gov/fdsys/pkg/CFR-2014-title14-vol5/pdf/CFR-2014-title14-vol5-sec1214-501.pdf
- [S24] IOM, Safe Passage: Astronaut Care for Exploration Missions (2001), ch. 6: https://www.nationalacademies.org/read/10218/chapter/8
- [S25] AP via ClickOrlando, NASA astronauts won't say which one got sick (2024): https://www.clickorlando.com/tech/2024/11/08/nasa-astronauts-wont-say-which-one-of-them-got-sick-after-almost-eight-months-in-space/
- [S26] Mazeas et al., Gamified interventions and physical activity, JMIR 24(1):e26779 (2022): https://jmir.org/2022/1/e26779
- [S27] Patel et al., STEP UP randomized trial, JAMA Intern Med (2019): https://pmc.ncbi.nlm.nih.gov/articles/PMC6735420
- [S28] Keller et al., VR exergames for long-duration spaceflight, Front. Physiol. (2022): https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2022.932425/full
- [S29] SPACE study protocol (simulated exercise partner for astronauts): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5109642/
- [S30] Algashami et al., Gamification risks to enterprise teamwork, Systems 7(1):9 (2019) (via search): https://www.mdpi.com/2079-8954/7/1/9
- [S31] Holden et al., Effects of Long-duration Microgravity and Gravitational Transitions on Fine Motor Skills, Human Factors 65(6) (2023): https://doi.org/10.1177/00187208221084486
- [S32] Okabe & Ito, Color Universal Design: https://jfly.uni-koeln.de/color/
- [S33] ESA, Diet tracker in space (2017): https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Astronauts/Diet_tracker_in_space
- [S34] CNES, EveryWear: https://cnes.fr/projets/cadmos/everywear
- [S35] NASA, MDA and Bio-Monitor interfaces (NTRS 20190000277, via search): https://ntrs.nasa.gov/api/citations/20190000277/downloads/20190000277.pdf ; Hexoskin Astroskin: https://hexoskin.com/astroskin
- [S36] IBM, CIMON-2 announcements (2019, 2020): https://newsroom.ibm.com/2019-12-05-AI-Powered-Astronaut-Assistant-Returns-to-Space-with-Emotional-Intelligence ; https://newsroom.ibm.com/2020-04-15-CIMON-2-Masters-Its-Debut-on-the-International-Space-Station
- [S37] ISS laptops (press): https://gizmodo.com/how-astronauts-use-laptops-on-the-international-space-s-1654962539 ; https://www.pcgamer.com/hardware/gaming-laptops/theres-no-memory-crisis-in-space-as-astronauts-on-the-iss-are-getting-new-laptops-with-128-gb-of-ram-and-a-seriously-beefy-specs-sheet/
- [S38] NASA ISS crew quarters acoustics (2017, via search): https://ntrs.nasa.gov/api/citations/20170011521/downloads/20170011521.pdf
- [S39] NASA Ames, A CDSS for Earth-Independent Medical Operations: https://www.nasa.gov/centers-and-facilities/ames/ames-science/ames-space-biosciences/a-clinical-decision-support-system-for-earth-independent-medical-operations
- [S40] Universe Today, Volunteers complete a simulated year on Mars (CHAPEA 1): https://www.universetoday.com/167778/volunteers-complete-a-simulated-year-on-mars/
- [S41] Gamification and physical activity in cardiovascular populations, meta-analysis (via search): https://pubmed.ncbi.nlm.nih.gov/39854099/
