# NASA Human Research Program (HRP) and NASA health standards

Researched 2026-11-06. Scope: HRP structure and hazards, the HRP/HSRB risk list with likelihood x consequence (LxC) ratings, NASA-STD-3001 (Vol 1 Rev C, Vol 2 Rev F), OCHMO technical briefs, monitoring programs, communication delay and crew autonomy, and reusable outreach material. Numbers come from the cited primary sources. "Unverified" marks anything not confirmed in this pass.

## Key takeaways for the team

- **NASA publishes its own risk taxonomy, rated per mission type.** The Human Research Roadmap lists 21 active HRP risks plus 1 inactive "concern" [S3]. NASA's Human System Risk Board (HSRB) tracks 30 [S5]. Each risk has an LxC score (5x5 matrix) for 8 design reference missions (DRMs): LEO, lunar orbital, lunar orbital + surface, and Mars, each short or long [S3, S4]. For a Mars surface mission the worst in-mission scores are Team 5x5, Earth-independent operations 5x5, Food/nutrition 5x5, Sensorimotor 4x5, and Medical conditions, Muscle/aerobic and EVA at 5x4 each. An app can tag every indicator with the risk(s) it informs.
- **NASA-STD-3001 sets hard numbers for some indicators but not for vital signs.** Examples: in-mission VO2max ≥32.9 ml/kg/min (≥36.5 for surface EVA) and ≥80% of preflight; strength ≥80% of baseline; bone density ≥95% (hip/spine) and ≥90% (femoral neck) of preflight; CO2 ≤3 mmHg 1-h average; career radiation <600 mSv [S7, S8]. Vital signs, behavioral health and blood values are only required to be "within clinically accepted values" or "normal range", so normal and alert thresholds for BP, HR, glucose and temperature must come from clinical sources, not NASA-STD-3001 [S7].
- **The standard nearly describes the challenge's tool.** Vol 1 Rev C [V1 3004] requires in-mission capability for "assessing, recording, monitoring, and trending vital signs and additional physiological and behavioral health signs". It also requires an electronic medical record and "evidence-based asynchronous behavioral health treatment protocols available on electronic devices" [S7]. Cite these requirement IDs in the pitch.
- **ISS monitoring is scheduled and sparse, not continuous.** Examples: weekly private medical conference with the flight surgeon; monthly WinSCAT cognitive test; monthly sleep/team questionnaire; Cognition battery and blood draws at flight day (FD) 30 and return minus 30 days (R-30); "eye weeks" at FD30, FD90 and R-30; actigraphy worn continuously [S11, S12, S14, S16]. Prompting crews on such a routine is a realistic feature.
- **Distance is the driver of autonomy.** Mars means up to ~20 min one-way delay, no evacuation and no resupply [S2, S4, S10]. NASA's Exploration Medical Capability (ExMC) element is pursuing a clinical decision support system (CDSS) for "Earth-independent medical operations" (EIMO) [S18]. Radiation alarms must alert the crew even when ground communication is down [V2 6164, S8]. Private medical communications may be store-and-forward when there is delay [V1 6002, S7].
- **NASA already ranks which conditions to expect.** The Integrated Medical Model (IMM) sample output in Vol 1 App. E (mission profile not stated) gives events per mission: late insomnia 13.85, skin abrasion 9.86, skin rash 9.83, eye abrasion 7.42, headache 5.25, space motion sickness 4.37, CO2 headache 2.15, SANS (eye/brain syndrome) 2.08 [S7]. Use this to choose which conditions the tool supports.
- **Real human data is mostly gated.** Standard Measures and Life Sciences Data Archive (LSDA) data need a data request through the NASA Life Sciences Portal (NLSP) [S20]. The open options are NLSP's open-access bedrest datasets [S20], machine-readable HSRB risk DAG files [S5, S6], and published summary statistics (this file).
- **Surprises found:**
  - Vol 1 dropped the old "Levels of Care I–V" in Rev B (2022); care is now sized per mission by probabilistic risk assessment [S7].
  - The CO2 limit was cut from 3.8–7.5 mmHg to 3 mmHg; NASA says <2.5 mmHg (7-day average) keeps headache risk below 1% [S9].
  - About 70% of long-duration crew show at least one SANS sign [S13].
  - Astronauts average about 6 h of sleep per night [S15].
  - NASA-STD-3001 Vol 2 Rev F was approved 2026-07-14 [S8].

## 1. HRP structure and the five hazards (RIDGE)

**HRP** (Director David K. Baumann) funds and runs research to protect astronaut health and performance. It uses ground labs, analogs (HERA, CHAPEA, bed rest) and the ISS [S1]. Its elements:

| Element | Focus |
|---|---|
| Human Health Countermeasures (HHC) | Effects on the body and countermeasures; owns the bone, cardiovascular, muscle/aerobic, SANS, immune, nutrition, EVA, DCS and hypoxia risks [S1, S3] |
| Human Factors & Behavioral Performance (HFBP) | Behavioral health, sleep, team, Earth-independent operations, dynamic loads [S1, S3] |
| Exploration Medical Capability (ExMC) | Medical conditions, renal stones, medications, celestial dust; in-flight medical system and decision support [S3, S18] |
| Space Radiation (SR) | Radiation carcinogenesis; keeps crews within limits [S1, S3] |
| Research Operations & Integration (ROI) | Runs studies on the ISS and in analogs [S1] |

HRP studies the risks. The **HSRB** decides the official risk posture on behalf of NASA's Health and Medical Technical Authority. The Office of the Chief Health and Medical Officer (**OCHMO**) owns the standards (NASA-STD-3001) [S4, S7].

**The five hazards** are Radiation, Isolation & confinement, Distance from Earth, Gravity fields and Hostile/closed environments. Sources: official hazard pages [S2], the "Human Body in Space" explainer [S21], and HSRB risk drivers [S4].

| Hazard | Body effects (per NASA) | Numbers | Countermeasures / monitoring NASA cites |
|---|---|---|---|
| Radiation | Cancer and degenerative disease (heart disease, cataracts); possible CNS effects; acute syndrome from solar particle events (SPEs) | DRM dose ranges in §2; career limit 600 mSv | Shielding, area and personal dosimeters, storm-shelter procedures [S21, S8] |
| Isolation & confinement | Circadian/sleep disruption, fatigue, mood and motivation changes; behavioral, cognitive and psychiatric conditions | Mars day is 37 min longer than Earth's; analog symptoms rise non-linearly past 5–6 months [S3-BH] | Actigraphy, tunable LED lighting, 10-min vigilance self-test, journals, VR, meaningful work [S21] |
| Distance from Earth | Indirect: no real-time help, no evacuation, finite medical supplies | Mars ~140 M miles away on average; ~3-year mission; up to 20 min one-way delay [S2] | Medical training, crew-run ultrasound, onboard lab tests, AI decision support, long-life food and medicines [S21] |
| Gravity fields | Bone loss, muscle loss, headward fluid shift (vision), kidney stones, orthostatic intolerance after landing, balance and motion sickness | Bone mineral loss ~1–1.5%/month in weight-bearing bones [S21]; plasma volume down ~15% [S10b]; Mars gravity 3/8 g [S2] | Aerobic and resistive exercise, thigh cuffs, lower-body negative pressure, fitness self-evaluations, urine analysis, bisphosphonates [S21] |
| Hostile/closed environment | Altered microbes, raised stress hormones, immune dysregulation, CO2, noise, toxic contaminants | CO2 ≤3 mmHg; noise limits; temperature/humidity zone (§3) | Air and water monitoring, surface and body swabs, quarantine before launch, flu shots [S21, S8] |

HSRB risk drivers add mission attributes that raise risk [S4]:
- exposure time
- communication delay
- time to definitive care (evacuation)
- resupply
- habitable volume
- crew selection
- EVA count
- leaving the Van Allen belts

## 2. Human Research Roadmap risks and LxC per DRM

**Method** [S4]:
- Since the 2020 risk management plan (JSC-66705 Rev A), the HSRB scores each risk on a 5x5 likelihood x consequence (LxC) matrix. The previous matrix was 3x4.
- Each risk is scored for 8 DRMs and up to 3 impact categories: in-mission (crew health and mission objectives), flight recertification, and long-term health (LTH).
- There are 8 possible dispositions: requires characterization, requires mitigation, requires mitigation/standard refinement, accepted, accepted with monitoring, accepted with optimization, transferred, retired.
- A "concern" is an issue with too little evidence to score.
- Risks are re-reviewed every 1–2 years.
- The numeric definitions of each L and C level are in Fig. 2 of [S4], which is an image and is not transcribed here.

**DRM categories** (Table 2 of [S4]):

| DRM | Gravity | Radiation (mission dose) | Evacuation | Comms | EVAs |
|---|---|---|---|---|---|
| LEO short <30 d | µg | <5–15 mGy | ≤1 day | Real-time | 1–4 |
| LEO long 30 d–1 y (ISS) | µg | 5–150 mGy | ≤1 day | Real-time | 1–10 |
| Lunar orbital short / long | µg | 15–20 / 175–220 mGy | 3–11 days | Real-time | Contingency only |
| Lunar orbital + surface short / long | µg + 1/6 g | 15–20 / 100–120 mGy | 3–11 days | Real-time | 5 / 3–4 per week (20–24 h/wk) |
| Mars preparatory <1 y | µg | 175–220 mGy | Days–weeks | Controlled-delayed | Contingency only |
| Mars planetary 730–1224 d | µg + 3/8 g | 300–450 mGy | Mission duration | No real-time | 2 crew x 8 h x 20 EVA days |

**Active HRP risks.** Format is LxC / disposition. LOS = lunar orbital + surface. Acc = accepted, AwM = accepted with monitoring, AwO = accepted with optimization, RC = requires characterization, RM = requires mitigation, RM/SR = requires mitigation/standard refinement. The "Indicators" column lists measures NASA uses or names for that risk (sources in brackets).

| Risk (HRR id, element, HSRB approval) | LEO long, in-mission | LOS long, in-mission | Mars planetary, in-mission | Mars planetary, LTH | Indicators |
|---|---|---|---|---|---|
| Behavioral health / cognition (99, HFBP, 7/2024) | 5x2 RM | 5x2 RM | 5x3 RM | 2x5 RM | WinSCAT/Cognition battery, mood, sleep/team questionnaire, PVT, actigraphy [S12, S14] |
| Medical conditions (95, ExMC, 5/2021) | 4x2 Acc | 5x4 RM | 5x4 RM | 5x4 RC | Vital-sign trending, symptoms, physical exam, IMM condition list [S7] |
| Bone fracture (77, HHC, 5/2022) | 1x2 Acc | 3x3 RC | 4x4 RC | 5x2 RC | DXA (pre/post only), QCT, bone biomarkers and urine calcium [S11, S16] |
| Cardiovascular (179, HHC, 5/2024) | 4x3 RC | 4x3 RC | 4x4 RM/SR | 2x4 RM/SR | BP, HR, ECG, carotid IMT ultrasound, orthostatic tests [S11, S10b] |
| Muscle & aerobic fitness (180, HHC) | 5x1 RC | 5x3 RM | 5x4 RM | 5x3 RM | VO2max (direct or indirect), strength tests, periodic fitness exam [S7, S16] |
| SANS (105, HHC, 7/2022) | 4x3 AwM | 4x3 AwM | 4x4 RM | 4x5 RM | Visual acuity, Amsler grid, ocular questionnaire, OCT, fundoscopy, ocular ultrasound [S13] |
| Sleep/circadian/workload (100, HFBP, 3/2022) | 5x2 AwO | 5x2 RC | 5x2 RM | 4x2 RM | Actigraphy, sleep logs, workload scales (Bedford, NASA-TLX) [S15, S7] |
| Team (101, HFBP, 4/2024) | 4x2 AwM | 5x3 RM | 5x5 RM | n/a | Monthly team questionnaire [S14] |
| Immune (85, HHC, 11/2023) | 4x2 AwM | 4x3 RM | 4x3 RM | 4x2 RC | Rashes, infections, viral shedding in saliva, blood cell profile [S14] |
| Sensorimotor (88, HHC, 11/2024) | 1x2 Acc | 3x5 RM/SR | 4x5 RM/SR | 2x2 RC | Tandem walk, sit-to-stand, recovery from fall, motion sickness questionnaire [S14] |
| Radiation carcinogenesis (96, SR; old 3x4 matrix) | 1x1 Acc | 1x1 Acc | 1x1 Acc | 3x3 RM | Personal and area dosimetry vs. limits [S8] |
| Renal stone (81, ExMC, 4/2022) | 3x4 AwM | 3x4 AwM | 4x4 RM | 4x4 RM | Urine volume/chemistry, supersaturation, hydration; in-flight ultrasound under research [S3, S14] |
| Food & nutrition (176, HHC, 7/2022) | 5x2 AwO | 5x4 RM | 5x5 RM | 5x3 RM | Intake vs. calculated needs, body mass (Twins: -7%) [S7, S17] |
| Host-microorganism (80, HHC, 12/2024) | 2x3 AwM | 2x3 AwM | 4x3 RM | 4x3 RM | Microbiome swabs [S14] |
| Earth-independent operations "EIHSO" (175, HFBP, 2/2023) | 5x2 Acc | 5x3 RM | 5x5 RM | n/a | Critical malfunctions: 1.7/yr on ISS [S3] |
| Medications (177, ExMC, 12/2021) | 1x1 Acc | 4x2 AwO | 5x3 RM | 5x3 RM | Formulary shelf life (target ≥3 y), medication use log [S3] |
| EVA (84, HHC, 12/2023) | 4x2 Acc | 5x4 RM | 5x4 RM | 5x2 AwO | Suit biomedical data: core temperature, heart rhythm, metabolic rate [S8] |
| Decompression sickness (168, HHC, 7/2023) | 2x2 Acc | 5x3 RM | 5x3 RM | 2x1 Acc | Post-EVA symptoms; no in-flight DCS cases to date [S3] |
| Dynamic loads (167, HFBP, 12/2023) | 4x3 AwO | 4x4 RM | 4x4 RM | 4x4 RM | Acceleration logging [V2 6111] |
| Hypoxia (173, HHC, 11/2022) | 3x2 AwM | 3x3 AwM | 3x3 AwM | 2x2 RC | Cabin ppO2/PIO2 (8.2 psia/34% O2 ≈ 4,000–8,300 ft altitude) [S3] |
| Celestial dust (82, ExMC, 3/2024) | n/a | 3x3 RM | 4x4 RC | 4x4 RC | Dust monitor; lunar dust limit 0.3 mg/m³ [S3] |

Inactive: Concern of intervertebral disc damage (78).

**HSRB list vs. HRR list.** The HSRB list (30 items) also includes:
- CO2
- Hearing loss/acoustics
- Toxic substance exposure
- Urinary retention
- Electrical shock
- Crew egress
- Non-ionizing radiation
- Concern of venous thromboembolism (VTE)

It also splits Aerobic and Muscle into two risks [S5]. The CO2 page links a risk record, a DAG PDF and DAG code [S6].

**Facts from HSRB "state of knowledge" summaries** [S3]:
- **Behavioral health:**
  - ISS behavioral symptom incidence is estimated at 0.62 per person-year, "likely an underestimate".
  - Psychiatric disorders occur in ≥4.5% of Antarctic crews.
  - In-flight symptoms have never reached diagnostic threshold, but lost objectives and early returns have occurred.
- **Sleep:** about 6 h per night in flight.
- **SANS:** 70% of crew show one or more hallmark signs.
- **Immune:** dysregulation persists for the whole 6-month flight, with rashes and herpesvirus shedding.
- **Fitness:**
  - Some ISS crew fall below the fitness-for-duty standards in flight.
  - Many would not meet the standards for surface EVA.
  - Many have not recovered by the end of the 30-day reconditioning program.
- **Medical conditions:** no in-flight crew deaths; three non-US medical evacuations or early mission ends.

**DAGs (directed acyclic graphs)** [S4, S5, S6]:
- The HSRB has drawn a causal DAG for each of its 30 risks: hazard → contributing factors → countermeasures → mission-level outcome (loss of mission objectives or loss of mission).
- They are configuration-managed and updated every 1–2 years.
- Guidance: NASA/TM-20220006812. Approved DAGs: NASA/TP-20220015709.
- Per-risk DAG "code" files are downloadable (e.g. the CO2 DAG). They are JSON-like node/edge lists with node categories such as "Hazard" and "Contributing Factor", so the app could visualize them.

## 3. NASA-STD-3001 and OCHMO technical briefs

### Vol 1 Rev C (Crew Health), approved 2023-09-15 [S7]

- **Levels of care.** Rev B replaced Levels of Care I–V with "Health and Medical Care" technical requirements. Capability is now sized per vehicle and DRM using epidemiological probabilistic risk assessment (IMM or an approved equivalent) [V1 3003/3004, App. E].
- **In-mission preventive care [V1 3003]** includes periodic monitoring of:
  - general health status
  - nutrition intake
  - aerobic and strength fitness
  - flexibility, agility and balance
  - work/rest schedule and sleep/circadian rhythm
  - environmental parameters
  - hearing
  - psychosocial countermeasures
  - SANS
  - neck and leg vein patency
  - immune function
  - vitamin D supplementation
  - orthostatic and vestibular prevention around gravity transitions
- **In-mission medical care [V1 3004]** requires:
  - electronic medical records with encryption
  - medical kits
  - history and physical exam
  - "assessing, recording, monitoring, and trending vital signs and additional physiological and behavioral health signs"
  - imaging, lab tests and ECG
  - medication management
  - work/rest balancing
  - asynchronous behavioral health protocols on electronic devices
  - private two-way communication and private medical data transmission
  - "means of providing autonomous medical care and advanced life support"
  - evacuation and palliative care

**Fitness-for-duty and permissible outcome limits**

| Domain | Requirement |
|---|---|
| Aerobic | In-mission VO2max ≥32.9 ml/kg/min for microgravity EVA [V1 4001] and ≥36.5 for surface EVA [V1 4002], measured directly or indirectly. Also ≥80% of preflight [V1 4003]. Typical in-flight decline 15–25%. Preflight recommendation 38.7–43.8. |
| Muscle | Preflight deadlift ≥1.0x body weight (minimum), 1.3x (microgravity EVA), 1.6x (surface EVA), 1.3x (unaided egress). Bench press 0.7x, 0.8x, 1.0x, 0.7x. In-mission strength ≥80% of baseline [V1 4023/4024]. Post-flight losses are 10–30%. |
| Bone | Preflight DXA T-scores consistent with a matched population [V1 4026]. In-mission bone density ≥95% of preflight (hip, spine) and ≥90% (femoral neck) [V1 4027]. |
| Sensorimotor | Preflight within clinical norms. In-flight limits are task-specific and "operationally defined"; there is no universal number [V1 4005–4010]. |
| Behavioral / cognitive | "Within clinically accepted values" before, during and after the mission [V1 4011]. Workload is assessed with the Bedford scale or NASA-TLX. Work, exercise and sleep hours must have set limits [V1 4014]. |
| Hematology / immunology | In the normal range before launch. Countermeasures keep values in range and outside "critical values" [V1 4015–4017]. |
| Nutrition | Each crewmember gets 100% of calculated energy and nutrient needs (age, sex, mass, height, activity) [V1 4020]. |
| Radiation | ALARA ("as low as reasonably achievable") [V1 4029]. Career effective dose <600 mSv, all ages and sexes, i.e. ≤3% mean risk of exposure-induced cancer death [V1 4030]. 30-day organ limits: blood-forming organs 250 mGy-Eq, heart 250, lens 1,000, skin 1,500, CNS 500 mGy. Design SPE dose <250 mSv [V1 4031]. Nuclear power sources <20 mSv per mission-year [V1 4032]. |

**Medical operations** [V1 6001–6011]:
- Recommended 8.5 h sleep period.
- Avoid critical tasks during the circadian low point (about 01:00–07:00 relative to the usual sleep schedule).
- Private medical and psychological conferences are scheduled "on a routine basis". Store-and-forward is allowed when there is communication delay.
- Every EVA needs ground medical clearance [V1 6006]. This becomes hard to do under deep-space delay.

**IMM sample output** (App. E, events per mission; mission profile not stated):

| Condition | Events per mission |
|---|---|
| Late insomnia | 13.85 |
| Skin abrasion | 9.86 |
| Skin rash | 9.83 |
| Eye abrasion | 7.42 |
| Late headache | 5.25 |
| Space motion sickness | 4.37 |
| Diarrhea | 3.53 |
| Nasal congestion | 3.51 |
| Respiratory infection | 3.46 |
| Back injury | 3.41 |
| Barotrauma | 3.28 |
| Back pain (space adaptation) | 3.15 |
| Shoulder sprain | 2.43 |
| CO2 headache | 2.15 |
| SANS | 2.08 |
| UTI | 1.44 |
| Hearing loss | 0.57 |
| Lower-extremity stress fracture | 0.13 |
| Shingles | 0.11 |

Table E.2-2 lists about 150 high-likelihood or high-consequence conditions by body system. These are flagged "address on every mission":
- **Behavioral:** acute stress, anxiety, insomnia/circadian misalignment, interpersonal conflict, mood disturbance, cognitive disturbance.
- **Other:** headache, space motion sickness, urinary retention, orthostatic intolerance, skin rash, constipation, diarrhea, corneal abrasion, UTI.

### Vol 2 Rev F (Human Factors, Habitability, Environment), approved 2026-07-14 [S8]

| Parameter | Limit / requirement |
|---|---|
| CO2 | 1-h average ppCO2 ≤3 mmHg [V2 6004]. Off-nominal limits are left to each program. |
| Total pressure | 34.5–103 kPa (5–15 psia) for indefinite exposure [V2 6006] |
| Temperature / humidity | Health limits from 18 °C/75% RH to 27 °C/25% RH (ASHRAE-55 based) [V2 6012]. Performance zone about 20–25 °C and 30–60% RH [V2 6013]. Crew heat storage 4.7 to -4.1 kJ/kg [V2 6014]. |
| Noise | 24-h dose D ≤100, i.e. 75 dBA for 8 h, about 70 dBA over 24 h, 3 dB exchange rate [V2 6115]. Sleep areas NC-40 for missions >30 days [V2 6079]. Each crewmember's noise exposure monitored [V2 6088]. |
| Monitoring and alerts | Environmental and suit data must support trend analysis [V2 6001]. Example sampling rates: O2/CO2 every 5 s, temperature and humidity every 1 min, VOCs at least every 73 h. Crew alerted locally and remotely when pressure, humidity, temperature, ppO2 or ppCO2 leave safe limits [V2 6022]. |
| Radiation monitoring | Area and personal dosimetry [V2 6161/6162]. Alert crew and operations when dose rate passes a threshold, "even if ground communication is disrupted" [V2 6164]. |
| Suit | Crew can input, store, display and monitor consumables and biomedical data [V2 11023]. Derived core temperature and real-time heart rhythm are "desired" in microgravity; derived core temperature on the Moon. |

### OCHMO technical briefs (reference only; derived from NASA-STD-3001)

Index pages: [S22] (Fundamentals of Human Health), [S23] (Medical Operations & Clinical Care), [S24] (Vehicle/Environment), [S25] (Safety/Mishaps). PDF base: `https://www.nasa.gov/wp-content/uploads/`.

| No. | Title | PDF path (append to base) |
|---|---|---|
| TB-016 | Behavioral Health & Performance | 2023/12/ochmo-tb-016-behavioral-health.pdf |
| TB-030 | Bone Loss | 2023/12/ochmo-tb-030-bone-loss.pdf |
| TB-032 | Cognitive Workload | 2023/12/ochmo-tb-032-cognitive-workload.pdf |
| TB-031 | Exercise Overview | 2023/12/ochmo-tb-031-exercise-overview.pdf |
| TB-013 | Food & Nutrition | 2023/12/ochmo-tb-013-food-and-nutrition.pdf |
| TB-007 | Mission Duration | 2023/12/ochmo-tb-007-mission-duration.pdf |
| TB-019 | Orthostatic Intolerance | 2023/12/ochmo-tb-019-orthostatic-intolerance.pdf |
| TB-010 | Sensorimotor | 2023/12/ochmo-tb-010-sensorimotor.pdf |
| TB-041 | Sleep Accommodations | 2023/12/ochmo-tb-041-sleep-accommodations.pdf |
| TB-037 | Decompression Sickness | 2023/12/ochmo-tb-037-decompression-sickness.pdf |
| TB-045 | Non-Ionizing Radiation | 2024/02/ochmo-tb-045-non-ionizing-radiation.pdf |
| MTB-001 | SANS | 2024/02/ochmo-mtb-001-sans.pdf |
| MTB-003 | Urinary Health | 2025/01/ochmo-mtb-003-urinary-health.pdf |
| MTB-004 | Space Adaptation Sickness | 2025/09/ochmo-mtb-004-space-adaptation-sickness-sas.pdf |
| MTB-007 | Venous Thrombosis | 2026/01/ochmo-mtb-007-venous-thrombosis-in-spaceflight.pdf |
| MTB-009 | Circadian Desynchrony | 2026/03/ochmo-mtb-009-circadian-desynchrony.pdf |
| MTB-012 | Pharmaceuticals & Medications | 2026/01/ochmo-mtb-012-pharmaceutical-care.pdf |
| MTB-005 / MTB-006 | H. pylori / Shoulder Injury | 2025/09/ochmo-mtb-005-h-pylori.pdf, 2025/09/ochmo-mtb-006-shoulder-injury.pdf |
| TB-044 | Medical Operations | 2025/08/ochmo-tb-044-medical-operations.pdf |
| TB-043 | Longitudinal Health Surveillance | 2023/12/ochmo-tb-043-longitudinal-health-surveillance.pdf |
| TB-033 | Spaceflight Experience & Medical Care | 2023/12/ochmo-tb-033-spaceflight-experience-medical-care.pdf |
| TB-034 / TB-006 | Crew Selection / Health Stabilization | 2023/12/ochmo-tb-034-crew-selection-and-recertification.pdf, 2023/12/ochmo-tb-006-health-stabilization-program.pdf |
| TB-012 / TB-014 | Mortality / Behavioral Health Mishaps | 2023/12/ochmo-tb-012-mortality-related-to-human-spaceflight-.pdf, 2023/12/ochmo-tb-014-behavioral-health-mishaps.pdf |
| TB-015 | Spaceflight Toxicology | 2023/12/ochmo-tb-015-spaceflight-toxicology.pdf |
| TB-051 | Crew Medical Support for Entry, Descent & Landing | 2026/05/ochmo-tb-051-crew-medical-support-entry-descent-landing.pdf |
| TB-004 | Carbon Dioxide | 2023/12/ochmo-tb-004-carbon-dioxide.pdf |
| TB-003 / TB-002 | Habitable Atmosphere / ECLSS | 2023/12/ochmo-tb-003-habitable-atmosphere.pdf, 2023/12/ochmo-tb-002-eclss.pdf |
| TB-020 | Radiation Protection | 2023/12/ochmo-tb-020-radiation-protection.pdf |
| TB-035 | Acoustics | 2023/12/ochmo-tb-035-acoustics.pdf |
| TB-026 / TB-001 | Lighting Design / Artemis Lighting | 2023/12/ochmo-tb-026-lighting-design.pdf, 2023/12/ochmo-tb-001-artemis-lighting-considerations.pdf |
| TB-011 | Lunar Dust | 2023/12/ochmo-tb-011-lunar-dust-technical-brief.pdf |
| TB-046 | Microbiology | 2025/05/ochmo-tb-046-microbiology-rev-a.pdf |
| TB-005 | Usability, Workload & Error | 2023/12/ochmo-tb-005-usability.pdf |
| TB-050 | Spacesuits | 2025/09/ochmo-tb-050-spacesuits.pdf |
| (no number) | Suited CO2 bulletin | 2025/02/suited-co2-technical-bulletin-02182025.pdf |
| (no number) | Strength & Performance for Surface EVA | 2026/07/guidance-for-strength-and-human-performance-on-extraterrestrial-surface-eva-07222026.pdf |

**Facts from the briefs:**
- **CO2 [S9]:**
  - Symptoms seen in flight: headaches at 2.8–4.5 mmHg; fatigue, poor sleep and nausea above 4.5 mmHg; trigeminal nerve dysesthesia at 4.5–5.0 mmHg.
  - 19 of 49 astronauts (38.7%) reported headaches.
  - Keeping headache risk below 1% needs a 7-day average under 2.5 mmHg. ISS range has been 1–9 mmHg; it has stayed ≤3 mmHg (24-h average) since a 2016 flight rule.
  - Indoor air on Earth is 0.6–0.76 mmHg.
- **Behavioral [S12]:**
  - Cognition is tested monthly with WinSCAT against a preflight baseline.
  - For missions beyond 6 months or beyond LEO, "additional minimally obtrusive measures" should objectively evaluate psychological state.
  - Support includes private psychological and family conferences, care packages, and repatriation briefings 6 weeks before landing.
  - 2 of 7 NASA Shuttle-Mir astronauts reported depressive symptoms.
- **SANS [S13]:**
  - 70% of crew show signs; 18% are diagnosed with clinically concerning SANS; no uncorrectable vision loss to date.
  - In flight: ocular questionnaire, visual acuity, Amsler grid, fundoscopy, ultrasound, OCT, with "eye weeks" at FD30, FD90 and R-30. Ground experts guide the crew remotely during scans.
  - 29% of short-duration and 60% of long-duration crew report vision changes.
- **Sleep [S15]:** about 6–6.5 h per night; deficit about 18 min/day against preflight; sleep rises to about 7 h by 7 days after landing (sleep debt).
- **Orthostatic intolerance [S10b]:** plasma volume drops about 15%. About 50% of women in bed-rest studies became presyncopal within 10 min of a 30° tilt. Countermeasures: fluid and salt loading, compression garments.
- **Bone [S16]:**
  - DXA is done only before and after flight, then every 3 years for life.
  - A FRAX fracture-risk score is computed with each DXA.
  - QCT is supplemental.
  - No in-flight fractures to date.
- **VTE [S10c]:**
  - In-flight ultrasound has shown stagnant or reversed flow in the left internal jugular vein, and rare clots.
  - A NASA/ESA algorithm uses early in-flight ultrasound surveillance.
  - Apixaban has been used to treat past cases.
- **Medical operations [S10d]:**
  - In-flight evaluations: private medical conference, private psychological conference, hearing assessments, periodic health status, periodic fitness exam, pre- and post-EVA exams.
  - Space adaptation motion sickness lasts about 3 days on average.

## 4. Programs relevant to monitoring

**Spaceflight Standard Measures** (since 2018; 30+ ISS crew; same core set for every crew). Schedule for a 6-month mission [S14, S19]:

| Measure | Preflight | In flight | Postflight |
|---|---|---|---|
| Actigraphy (activity and light, per minute) + sleep log | 2-week blocks at L-180 and L-90 | Continuous, FD1 to landing | 2 weeks from R+0 |
| Sleep quality / team questionnaire (sleep, mood, affect, cohesion, habitability) | – | Monthly | – |
| Cognition: 10 tests (reaction time, working memory, spatial orientation, emotion recognition, risk decisions, attention…) | L-120, L-90 | FD30, R-30 | R+10, R+30 |
| Blood biochemistry (CBC, metabolic and chemistry panels, vitamin D, bone markers…) | L-180 (+24-h urine) | FD30, R-30 (blood only) | R+30 |
| Immune "cellular profile" (blood, saliva: stress hormones, viral shedding) | L-180, L-90 | ~FD30, R-30 | R+30 |
| Microbiome (body swabs, saliva, fecal) | L-90 | FD30, R-30 | R+30 |
| Carotid intima-media thickness ultrasound | L-180 | – | R+5, R+30 |
| Sensorimotor field test (sit-to-stand, tandem walk, recovery from fall, HR, BP, motion sickness questionnaire) | L-180, L-90 | – | R+0 (landing site and JSC), R+9 |

Crew time: 6.8 h preflight, 15.25 h in flight, 5.25 h postflight. The full analyte list is in [S14]. **Artemis II Standard Measures** cover blood, saliva, urine, MRI, balance, motion sickness and muscle tests, microbiome, and a post-landing capsule-egress and suited moonwalk test [S26].

**CIPHER** (Complement of Integrated Protocols for Human Exploration Research) has 14 studies across mission lengths up to 1 year [S27]:
- Bone Health and Bone Support (high-resolution peripheral QCT)
- Coronary Responses (MRI, CT, ultrasound, atrial fibrillation risk)
- Egress Fitness
- Vascular Calcium
- ISAFE (eyes, veins, brain)
- Musculoskeletal Adaptations (does loss accelerate after ~6 months?)
- Routine Ultrasound
- Standard Measures
- Space Physiology (fitness, diet, sleep)
- Spatial Cognition
- Telomere Health
- Vestibular Health
- Data Integration

**Ongoing HRP Research hub** (challenge Resources tab, verified 2026-11-13) [S32] lists 3 Artemis II studies, 11 LEO studies and 8 past ones. The ones that bear on a crew health app:
- Artemis II: ARCHeR (actigraphy, behavior), Immune Biomarkers (dry saliva), Artemis II Standard Measures. Details in [existing-systems.md §2](existing-systems.md#artemis-ii-crew-health-studies).
- Tempus Pro: a commercial telemedicine device tested as an aid for the CMO. Details in [existing-systems.md §3](existing-systems.md#3-earth-independent-medicine).
- Countermeasure trials for brain and eye changes (SANS): B-Complex (a daily B-vitamin supplement), Thigh Cuff (keeping fluid in the legs), Brain Fluid Pressure, Spinal Fluid Biomarkers.
- Zero T2: exercise without a treadmill ahead of deep-space missions (compare the Artemis II flywheel in [countermeasures.md](countermeasures.md)).
- Venous Haemostasis: blood-flow and clotting changes.

**NASA Twins Study** (Scott vs. Mark Kelly, 340-day mission; *Science* 2019, aau8650) [S17]:
- 91.3% of gene-expression changes returned to baseline after landing.
- Telomeres lengthened in flight; some changes persisted.
- Cognition was stable in flight, but speed and accuracy dropped after landing and persisted for 6 months.
- The flu vaccine worked in space.
- The gut microbiome shifted, then recovered.
- Carotid artery wall thickened and inflammation markers rose.
- Body mass fell 7%; he ate about 30% fewer calories than planned.
- Sample size is one.

**Integrated Medical Model (IMM) → IMPACT/MEDPRAT** [S28, S7, S18]:
- IMM is a Monte Carlo probabilistic risk model of 100 medical conditions. Inputs: duration, crew, EVAs. Outputs: total medical events, Crew Health Index, probability of evacuation, probability of loss of crew life, resources used. Data come from the iMED evidence database, with one Clinical Finding Form per condition.
- It is baselined to the ISS and assumes perfect diagnosis and treatment.
- Its successor is IMPACT, whose computation engine is MEDPRAT. In a 26-month simulated mission, raising crew medical "scope of practice" from ISS-level (1) to level 5 cut deaths by at least 34%, and cognitive (diagnostic) skill mattered more than procedural skill [S18].
- For a 1,195-day mission the Crew Health Index ranged 15–88% depending on the medical capability carried [S18].

**ExMC / EIMO** [S18]:
- On the ISS each crew has a console flight surgeon (weekly private conferences) and a biomedical engineer watching downlinked physiology. The onboard Crew Medical Officer is often a non-physician with about 40 h of medical training.
- EIMO proposes a CDSS that collects data passively and actively, triages by acuity (emergency / routine / preventive), suggests probable diagnoses, guides procedures, manages alerts, uses the crewmember's medical history, and reduces cognitive load.
- The paper's worked chest-pain scenario has the CDSS prompting reassessment at 30 min, asking for BP cuff and SpO2 readings, and escalating to emergency mode. This is a useful template for an app flow.

**LSAH / LSDA / NLSP** [S20, S16b]:
- The NASA Life Sciences Portal (NLSP) gives access to human research data back to 1961. It includes LSDA (de-identified research data), Standard Measures data, and LSAH (medical monitoring data used for astronaut health surveillance; the TREAT Astronauts Act of 2017 extended lifelong care).
- Most data need a data request: https://nlsp.nasa.gov/data-request.
- The UTMB bedrest campaigns 1, 3 and 11 (70-day exercise study) are open access.
- NASA's Open Science Data Repository (OSDR) is mostly cell, plant and animal data.

**TRISH** (Translational Research Institute for Space Health; HRP cooperative agreement led by Baylor College of Medicine with Caltech and MIT) [S29, S30]:
- **EXPAND:** pre-, in- and post-flight data from commercial astronauts. Requests need a hypothesis and IRB approval.
- **Hermes:** an "edge-first", vehicle-agnostic health data platform for remote, low-connectivity operations. It keeps records with the crewmember and supports AI-assisted autonomous diagnosis. This is the closest existing analog to the challenge.
- **SENTINEL:** self-reporting tissue chips and non-invasive remote biomarkers, with no sample return.
- **Catalyst grants:** include "remote crew health and performance monitoring" as a priority.

## 5. Communication delay and crew autonomy

| Location | One-way signal delay | Evacuation | Resupply | Medical model |
|---|---|---|---|---|
| ISS / LEO | Near real time, "1–1.5 s" [S10a] | ≤1 day [S4] | Strong | Earth-dependent: console flight surgeon, weekly private conferences [S18] |
| Moon | ~1.3 s light-time (computed from 384,400 km). Vol 2 Rev F cites "6 to 10 seconds" practical delay on the surface [S8] | 3–11 days [S4] | Limited | Real time, but onboard capability restricted [S10a] |
| Mars | "Up to 20 minutes one way" [S2]; ">20 min" [S18]. Light-time computed at ~3–22 min over ~55–400 M km. TB-007 says "0–40 minutes" [S10a] | None for the mission duration [S4] | None | "Autonomous medical care"; crew medical officer handles checkups and emergencies out of contact [S10a] |

**Blackouts.** The CDSS paper mentions "periodic lack of communication from planetary alignment, solar wind or equipment failure" [S18]. Mars solar conjunction (roughly every 26 months, about 2 weeks without commands to robotic missions) is common knowledge but unverified here; the NASA pages tried returned 404.

**Implications for a self-assessment tool (from the sources above):**
- Work offline-first. Store data locally and sync with the ground store-and-forward [V1 6002/6010; Hermes S30].
- Fire critical alerts without the ground [V2 6164].
- Trend each value against the individual's own preflight baseline. NASA's standards are mostly relative: ≥80% for VO2max and strength, ≥95% for bone; Cognition and WinSCAT compare against preflight.
- Triage by acuity [S18].
- Keep crew time low. Standard Measures already costs 15 h in flight. In the 105-day Mars-500 pilot, crews completed 63–94% of scheduled tests, and the study recommended cutting test burden and using brief rating scales [S3-BH].
- HRP's view [S3, S4, S10a]: "Earth Independent Human-Systems Operations" is rated 5x5 (requires mitigation) for Mars; risk shifts toward human-system failure; "intelligent support software" and greater crew autonomy are named mitigations. HERA analog missions already impose delays of up to 5 min each way [S2].

## 6. Outreach and educational material the app could reuse

| Material | URL | Notes |
|---|---|---|
| "The Human Body in Space" explainer + 508-compliant PDF | https://www.nasa.gov/hrp/bodyinspace/ ; https://www.nasa.gov/wp-content/uploads/2021/02/bodyinspace_revised_forweb-2022-updated.pdf | Per-hazard effects and "The Key" countermeasures; good for in-app explanations |
| Human Body in Space infographic (PNG) | https://www.nasa.gov/wp-content/uploads/2023/07/hbsinfographic.png | Body-map style; fits the challenge's clickable figure |
| Five hazards pages + 5 videos | https://www.nasa.gov/hrp/hazards ; playlist https://www.youtube.com/playlist?list=PLiuUQ9asub3RRA-BMh7wLsU7V6gUUSRwH | One short video per hazard |
| Risk pages, HSRB risk records, DAG PDFs and code | https://www.nasa.gov/hrp/risks/ ; https://www.nasa.gov/hhp/human-system-risks/ | DAG code is machine-readable |
| HRP videos | https://www.nasa.gov/hrp/hrp-videos/ | – |
| TRISH "How the body changes in space"; Red Risk School recordings | https://www.bcm.edu/academic-centers/space-medicine/translational-research-institute/space-health-resources/how-the-body-changes-in-space | Plain-language system-by-system explanations |
| HRP evidence reports | https://humanresearchroadmap.nasa.gov/evidence/ | Deep dives per risk |

**Usage rules** [S31]:
- NASA media is "generally not subject to copyright in the United States". Educational use is fine; credit NASA.
- The NASA insignia and logotype are not public domain, and nothing may imply NASA endorsement.
- Do not use names or likenesses of current astronauts in commercial products.

## Open leads not finished

- Exact HSRB 5x5 likelihood and consequence definitions: Fig. 2 of [S4] (image), or JSC-66705 at https://ntrs.nasa.gov/citations/20205008887.
- The full IMM 100-condition list with probabilities: "Ranking of Medical Conditions by Probability", linked from [S28]; documentation at https://www.nasa.gov/integrated-medical-model-documentation/.
- The ISS Medical Evaluation Document Volume B (MED B) in-flight schedule, cited in MTB-001.
- OCHMO TB-032 Cognitive Workload, for workload scales.
- A NASA source for Mars solar conjunction duration.
- The web search budget ran out mid-research, so the last leads were fetched by known URLs only.

## Sources

- [S1] NASA HRP home and elements — https://www.nasa.gov/hrp/
- [S2] HRP hazards pages — https://www.nasa.gov/hrp/hazards ; https://www.nasa.gov/hrp/hazard-distance-from-earth/
- [S3] Human Research Roadmap risk list and per-risk pages with LxC tables (fetched 2026-11-06) — https://humanresearchroadmap.nasa.gov/Risks/ (e.g. `?i=99` behavioral health [S3-BH], `?i=105` SANS, `?i=95` medical conditions)
- [S4] Antonsen et al. 2023, "Updates to the NASA human system risk management process for space exploration", npj Microgravity 9:72 — https://doi.org/10.1038/s41526-023-00305-z (PMC10485075)
- [S5] HSRB home and Human System Risks index — https://www.nasa.gov/hhp/hsrb ; https://www.nasa.gov/hhp/human-system-risks/ ; DAG guidance https://ntrs.nasa.gov/citations/20220006812 ; DAGs https://ntrs.nasa.gov/citations/20220015709
- [S6] CO2 risk page, risk record and DAG code — https://www.nasa.gov/directorates/esdmd/hhp/carbon-dioxide-risk/ ; https://www.nasa.gov/wp-content/uploads/2025/03/co2-dag-code.txt
- [S7] NASA-STD-3001 Vol 1 Rev C (2023-09-15) — https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf
- [S8] NASA-STD-3001 Vol 2 Rev F (2026-07-14) — https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf (temporary path; Rev D is at https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-2-rev-d-with-signature.pdf)
- [S9] OCHMO-TB-004 Carbon Dioxide — https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf
- [S10a] OCHMO-TB-007 Mission Duration; [S10b] TB-019 Orthostatic Intolerance; [S10c] MTB-007 VTE; [S10d] TB-044 Medical Operations (URLs in the §3 table)
- [S11] OCHMO-TB-030 Bone Loss; TB-031 Exercise Overview (URLs in the §3 table)
- [S12] OCHMO-TB-016 Behavioral Health & Performance — https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-016-behavioral-health.pdf
- [S13] OCHMO-MTB-001 SANS — https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf
- [S14] Spaceflight Standard Measures briefing (NTRS 20200001281) — https://ntrs.nasa.gov/api/citations/20200001281/downloads/20200001281.pdf
- [S15] OCHMO-TB-041 Sleep Accommodations; MTB-009 Circadian Desynchrony (URLs in the §3 table)
- [S16] OCHMO-TB-030 Bone Loss (DXA, FRAX); [S16b] TB-043 Longitudinal Health Surveillance
- [S17] NASA Twins Study results — https://www.nasa.gov/humans-in-space/nasas-twins-study-results-published-in-science-journal/
- [S18] Russell et al. 2023, "The value of a spaceflight clinical decision support system for earth-independent medical operations", npj Microgravity — https://doi.org/10.1038/s41526-023-00284-1 (PMC10284846)
- [S19] Standard Measures reference page — https://www.nasa.gov/reference/standard-measures/
- [S20] NASA Life Sciences Portal (LSDA, LSAH, data requests) — https://www.nasa.gov/hrp/nlsp/ ; https://nlsp.nasa.gov/data-request-guidelines
- [S21] The Human Body in Space — https://www.nasa.gov/hrp/bodyinspace/
- [S22]–[S25] OCHMO brief collections — https://www.nasa.gov/reference/fundamentals-of-human-health/ ; https://www.nasa.gov/reference/medical-operations-and-clinical-care/ ; https://www.nasa.gov/reference/vehicle-systems-interfaces-structure-environmental-design/ ; https://www.nasa.gov/reference/safety-history-contingency-mishaps/
- [S26] Artemis II Standard Measures — https://www.nasa.gov/reference/artemis-ii-standard-measures/
- [S27] CIPHER — https://www.nasa.gov/reference/cipher/
- [S28] IMM overview — https://www.nasa.gov/nasa-integrated-medical-model-imm-overview/ ; IMPACT/MEDPRAT — https://ntrs.nasa.gov/citations/20230013414 ; https://ntrs.nasa.gov/citations/20180004678
- [S29] TRISH at NASA — https://www.nasa.gov/hrp/the-translational-research-institute-for-space-health-trish/ ; Catalyst remote-monitoring call — https://www.nasa.gov/hrp/researchers-apply-now-with-your-ideas-to-advance-remote-health-monitoring-in-space/
- [S30] TRISH EXPAND / Hermes / SENTINEL — https://www.bcm.edu/academic-centers/space-medicine/translational-research-institute/research/commercial-spaceflight ; …/research/hermes ; …/research/sentinel
- [S31] NASA images and media usage guidelines — https://www.nasa.gov/nasa-brand-center/images-and-media/
- [S32] NASA HRP, Ongoing HRP Research in Space (challenge Resources tab; verified 2026-11-13) — https://www.nasa.gov/hrp/ongoing-hrp-research/
