# Existing systems: how astronaut health is monitored and managed today

Scope: ISS and Artemis practice, Earth-independent medicine, flight wearables, behavioral health, the commercial/research ecosystem, past Space Apps projects, and the gaps a 48-hour prototype can fill. Compiled 2026-11-06 by an AI research agent (Claude); record it in the team's AI-use log. "Unverified" marks claims that only secondary sources support, or that could not be re-checked after the web-search budget ran out mid-research.

## Key takeaways for the team

- **The crew doesn't interpret their own health data today. The ground team does.** ISS medicine runs on a ground-centered loop: a lightly trained Crew Medical Officer (about 15 h of CMO training per a 2020 NASA abstract), a Medical Checklist of more than 120 procedures, and flight surgeons plus biomedical engineers on console in Houston. NASA states that exploration missions need to move "from a ground-based to a flight-based paradigm". Software that helps the crew interpret and act on their own data, as the challenge brief asks, addresses that stated gap. [S9, S10, S12]
- **Escalation already has a known shape** that the tool can mirror: symptom → CMO and checklist → private medical conference (weekly, or on request) → real-time surgeon guidance → weekly international SMOT meeting → Mission Management Team → flight director → return to Earth. In January 2026 Crew-11 made the first medical early return in ISS history, because the station lacked the imaging needed for a workup. [S8, S14, S15]
- **The Orion medical kit is small.** The whole medical hardware allocation is about 30 lb. Orion carries no ultrasound; NASA plans it for Gateway. The ECG, otoscope and augmented stethoscope need a laptop or tablet. The blood-pressure cuff and pulse oximeter work standalone, and NASA's requirement says their values may be **entered by hand**. A manual-entry-first design is therefore realistic, not a shortcut. [S16]
- **No Artemis II health results have been published yet.** Splashdown was 2026-04-10, and initial data collection ended 45 days later. NASA's June 2026 update reports no findings. The data will go to NASA's Life Sciences Data Archive (LSDA), released on request. The team must not claim Artemis II results. [S19, S20]
- **AI medical assistants are still proofs of concept.** The NASA/Google Crew Medical Officer Digital Assistant (CMO-DA, August 2025) was tested in simulated scenarios with an OSCE rubric, and Google published no accuracy numbers. CIMON-2 was a voice/navigation demonstration. Present any AI as decision support for the CMO or flight surgeon, never as a diagnosis. [S24, S27]
- **Commercial missions flew consumer wearables:** Apple Watch on Inspiration4, Garmin fēnix 7 on Polaris Dawn, Oura ring plus a continuous glucose monitor (CGM) on Fram2, an Oura ring and commercial glucose monitors on Ax-4. ISS and Artemis use research-grade actigraphs and the CSA Bio-Monitor smart shirt. Heart rate, HRV, SpO2, sleep and activity are the metrics proven in flight; glucose monitoring is being validated. No outcome data from these commercial wearable studies has been published. [S30–S36, S64–S66]
- **Real crew data is mostly behind controlled access:** LSDA, OSDR controlled tiers, and TRISH EXPAND. EXPAND first opened to proposals in March 2026, with access granted in lieu of funding and projects starting fall 2026. For a hackathon, plan on synthetic data built from published ranges and protocols. [S20, S42, S43]
- **Past Space Apps health entries rarely won.** Sensor-concept projects (2014, 2015, 2018) reached at most Global Nominee. The global winners near this space were Shelter in Space (Best Mission Concept, 2020 COVID edition: a gamified virtual analog mission) and SpaceGenes+ (Best Use of Science, 2025: a dashboard grounded in NASA biology data). Judges reward plausible concepts and real data over hypothetical hardware. [S50, S53]
- **The CSA's own deep-space health prize went to software.** The $500k grand prize of the CSA Deep Space Healthcare Challenge (2021–2024) went to EZResus by MD Applications, a mobile app that guides resuscitation from diagnosis to drug dose and equipment. It was judged on autonomy in low connectivity, use by non-physicians, and reliability. A guided, offline decision-aid app is a proven fit for this problem. [S67]
- **Behavioral health is handled through scheduled private contact plus self-report.** That means private psychological conferences every two weeks; questionnaires on sleep, mood, team and workload; and a 10-test Cognition battery that takes about 16 minutes. Tools that are self-help, private by default and explain themselves fit current practice. [S38, S39, S41]

## 1. ISS today

### Organization and components

| Element | What it is | Source |
|---|---|---|
| Crew Health Care System (CHeCS) | US-segment suite in three subsystems: **Health Maintenance System (HMS)**, which covers preventive, diagnostic and therapeutic care; **Environmental Health System (EHS)**, which covers air (gases, microbes), water, surfaces, acoustics and radiation; **Countermeasures System (CMS)**, which covers exercise hardware and fitness evaluations. Some NASA documents name the middle one "Environmental Maintenance System". | [S1, S2] |
| Medical kit | ISS Medical Kit System: >200 unique items (2011). Also an Advanced Life Support Pack, Respiratory Support Pack, Crew Medical Restraint System, AED, urine analyzer, BP/ECG monitor, ultrasound, and blood/urine sampling kits. | [S2, S3, S8] |
| Point-of-care blood | Portable Clinical Blood Analyzer (PCBA) runs a panel of analytes from one drop. The Russian segment analyzer runs one analyte at a time. | [S8] |
| Multilateral governance | Multilateral Medical Policy Board, Multilateral Medical Operations Panel (working groups include Radiation, Countermeasures, EVA, Informatics, Environmental Health, BHP, Nutrition, Clinical Medicine and Rehabilitation), and Multilateral Space Medicine Board, which certifies crew. | [S8] |
| Integrated Medical Group | Flight surgeons and biomedical engineers (BMEs) on console at MCC-Houston and TsUP-Moscow. Each expedition has a NASA lead Crew Surgeon and a Russian Crew Surgeon. | [S8] |

### Roles

| Role | Facts |
|---|---|
| Crew Medical Officer (CMO) | An astronaut who acts as a "healthcare extender" to ground flight surgeons. About 15 h of CMO training during the ~2-year pre-launch flow, plus high-fidelity simulation, onboard computer-based refresher training and live just-in-time training [S10]. Other sources say ~25 h, ~40 h or <60 h; the numbers differ by year and source. Former CMOs interviewed in 2023 felt prepared for ISS. For exploration missions they wanted a physician CMO and more rigorous training [S11]. |
| Flight surgeon ("Surgeon" console) | Board-certified in aerospace medicine. Holds **weekly** private medical conferences (PMCs) and does not report PMC content to Mission Control; informs the flight director only when the mission could be affected [S13]. A Crew Surgeon trains with 204 h of classes, 100 h of on-the-job training and over 100 h of console simulation, and is assigned 18–24 months before flight [S8]. |
| Biomedical engineer (BME) | Console partner of the surgeon. Handles medical hardware and data flow [S8]. |
| Astronaut Strength, Conditioning and Rehabilitation specialist (ASCR) | Assigned about 2 years before launch. Writes individual, periodized pre-flight and in-flight exercise prescriptions [S5]. |
| Behavioral Health and Performance (BHP) | Each crew member has a psychiatrist or flight surgeon plus an operational psychologist [S39]. |

### Routine cadence on ISS

| Activity | Frequency / detail | Source |
|---|---|---|
| Private Medical Conference (PMC) | Weekly, plus on crew request. Private audio and video from the biomedical support room at MCC-Houston. | [S8, S13] |
| Private Psychological Conference | Every 2 weeks, 15–20 min. Topics: sleep, fatigue, workload, morale, crew relationships. Not recorded. | [S39] |
| Family support | Private family conferences, care packages, discretionary events. All optional. | [S39] |
| Exercise | At least 2 h/day across treadmill (T2), cycle ergometer (CEVIS) and resistive device (ARED). | [S2, S5, S6] |
| Periodic Fitness Evaluation (PFE) | Run on CEVIS with BP/ECG and heart-rate monitoring; also done before landing. The commonly cited ~monthly cadence is **unverified**. | [S6, S7] |
| Spaceflight Standard Measures (since 2018) | Actigraphy (two 2-week pre-flight sessions at L-270/L-180, continuous in flight); 10-test Cognition battery; sleep/team questionnaires after waking and before sleep; blood and urine biochemistry; immune cellular profile; microbiome; carotid ultrasound; sensorimotor tests pre/post. | [S37, S38] |
| Environment | Periodic air, water and surface sampling for toxic gases and microbes. Real-time radiation monitors; personal dosimeters analysed after flight; crew shelter during large proton events. | [S2] |
| Pre-return | Daily medical interviews plus fluid and salt loading advice from 2 days before landing. | [S2] |
| Post-flight | 45-day rehabilitation in 3 phases: until day 3 (assisted walking, stretching), until day 14 (underwater walking, cycling), then running and strength work. | [S2, S8] |

### Telemedicine and escalation path

1. The crew member notices a symptom, or a measurement or research scan flags something.
2. The CMO applies the **ISS Medical Checklist** (>120 procedures, rewritten around 2011), supported by video, email or phone contact with the medical team [S12].
3. The flight surgeon handles day-to-day issues in real time from console (US hardware can store and forward ECG over Ku-band at any time). The surgeon holds an unscheduled PMC if needed and can bring in specialist consultants [S8, S15].
4. Issues that remain open go to the **weekly SMOT** (Space Medical Operations Team, all partners). If still unresolved, they go to the **biweekly Mission Management Team** [S8].
5. If the mission is affected, the surgeon informs the flight director [S13]. The last resort is an early return.

Worked examples:
- **Jugular vein thrombosis (published 2020):** a research ultrasound about 2 months into a mission found an obstructive left internal jugular vein clot. Two radiologists on the ground confirmed it during a follow-up scan guided in real time. Ground physicians started enoxaparin from the onboard kit, and the clot regressed over 90+ days. This was the first such case treated in space [S14].
- **Crew-11 (January 2026):** a crew member, later self-identified as Mike Fincke, had an event of about 20 minutes on 2026-01-07. Crewmates stabilized him under flight-surgeon guidance. NASA postponed the next day's spacewalk and returned the crew early (splashdown 2026-01-15) to use "advanced medical imaging not available on the space station". NASA cited medical privacy and named neither the person nor the condition [S15]. In 2008 NASA could still write that ISS had had no forced medical evacuations [S8].
- Conditions treated on orbit up to 2008 include skin rashes, dental abscesses, lacerations and ST-T segment ECG changes [S8].

### Exercise prescription

The ASCR prescribes periodized programs fitted to individual fitness, mission tasks and areas of concern [S5]. A 2009 NASA review concluded that the hardware of the time could not reach enough intensity and that crew compliance was imperfect. It recommended higher-intensity interval training, which led to ARED and T2 [S4]. A current NASA study, still running, tests whether exploration-style devices without a treadmill (ESA's E4D) protect as well as the full ISS suite (n ≥ 40 controls) [S7].

## 2. Artemis (Orion)

### Orion Medical System

From Haas, NASA flight surgeon, 2023–2024 presentations [S16, S17]:

| Component | Content / access |
|---|---|
| Seat Accessible Medical Items (SAMI) | One kit per crew member in the suit forearm pocket: a few pills, glasses. Usable while seated and restrained (pre-launch, post-ascent, post-landing). |
| Orion Medical Kit System (OMKS) | Hard-sided kit mounted on the cabin wall. In-flight only. |
| Orion Secondary Medical Kit (OSMK) | Extra stowed supplies. In-flight only. |
| Orion Medical Accessory Kit (OMAK) | Personal medical items for each crew member, like the ISS IMAK. |
| In-suit pill delivery tool; supplemental O2 | Medication for a pressurized, suited crew member; oxygen for smoke inhalation. |

- **Mass:** about 30 lb for all Orion medical hardware. The container alone is about 9.5 lb, a third of that.
- **Planning basis:** Kit contents came from NASA's Integrated Medical Model (probability of each condition, plus mass and volume) and interviews with 11 flight surgeons.
- **Care levels:** in NASA's Levels-of-Care ladder (table below) Artemis sits at III–IV. The current standard (Vol 1 Rev C) sizes capability per mission with the Integrated Medical Model rather than fixed levels (see `nasa-hrp.md` §3).
- **Diagnostics flown on Orion:** vitals measurement, ECG, auscultation, lighted imaging (otoscope), point-of-care urinalysis, corneal evaluation.
- **Diagnostics planned for Gateway, not Orion:** ultrasonography, co-oximetry, positive-pressure breathing support.

| Device | Standalone? | Display needs laptop/tablet | Data storage on laptop/tablet | Transmission to Mission Control |
|---|---|---|---|---|
| Augmented stethoscope | No | No | Required | Required |
| Otoscope | No | Required | Required | Required |
| ECG | No | Required | Required | Required |
| Blood-pressure cuff | Yes | No | Should (manual entry OK) | Should |
| Pulse oximeter | Yes | No | Should (manual entry OK) | Should |

**Space-to-ground plan for Artemis II:** audio and optional video with Mission Control; private audio with the flight surgeon; private videoconferencing during medical events. Medical procedures are stored on crew personal computing devices, with a few paper cue cards. "Advanced remote guidance or automated guidance" is listed as a future goal [S16]. Flight surgeons use a Flight Surgeon Quick Reference Guide, adapted from the ISS version to Orion's smaller resources. For each condition it lists crew actions, what data to collect, the differential diagnosis and the medications [S18].

**Levels of Care** (capability ladder from a 2023 NASA slide [S17]):

| Level | Mission | Capability |
|---|---|---|
| I | LEO, <8 days | Space motion sickness, basic life support, first aid, private audio, anaphylaxis response |
| II | LEO, <30 days | Level I + clinical diagnostics, ambulatory care, private video and telemedicine |
| III | Beyond LEO, <30 days | Level II + limited advanced life support, trauma care, limited dental |
| IV | Lunar, >30 days | Level III + medical imaging, sustainable advanced life support, limited surgery, dental care |
| V | Mars expedition | Level IV + autonomous advanced life support and ambulatory care, basic surgery |

### Artemis II crew-health studies

| Study | What | Real-time? |
|---|---|---|
| ARCHeR (Artemis Research for Crew Health and Readiness) | A wrist actigraph worn before, during and after flight: sleep, activity, light and proximity. Pre/post cognition tests, a simulated manual docking task, team-dynamics measures and surveys. The device is from **Condor Instruments** (Brazil): accelerometer, 10 light sensors including melanopic light, temperature, and an event button the crew pressed at milestones. | Yes. Crew and flight controllers saw real-time health and behavioral information [S19, S21, S22]. |
| Immune Biomarkers | Dry saliva on filter-paper booklets (no refrigeration on board), plus pre/post blood. Looks at viral reactivation and cortisol. | No [S19, S23] |
| Artemis II Standard Measures | First deep-space use of the ISS Standard Measures. Pre-flight blood, urine and saliva; in-flight motion-sickness assessment; post-landing head, eye and body movement tests and an obstacle course, some in suits offloaded to lunar gravity. | No [S19, S20] |
| AVATAR | Organ-on-a-chip (USB-stick size) grown from crew bone-marrow cells. Analysed after flight with single-cell RNA sequencing. | No [S19, S20] |
| Radiation | Personal dosimeters (real time), Orion shelter-alert sensors, 4 DLR cabin monitors, CubeSats. | Yes [S19] |

**Status as of 2026-11-06:** launch in April 2026 and splashdown on 2026-04-10. The crew reported "four green" at recovery. Within a day researchers collected BP, heart rate, eye health and motor control. Initial collection ended 45 days after splashdown. **No findings had been released** as of NASA's June 2026 update, and NASA plans a research solicitation and LSDA access. Searches for later results found none [S20, S23]. Context: post-flight blood-pressure regulation problems affected about 25% of Shuttle astronauts and nearly 80% of early ISS crews [S23].

## 3. Earth-independent medicine

| Effort | What | Status / evidence |
|---|---|---|
| ExMC **Medical Data Architecture (MDA)** | Prototype health data system. Test Bed 1: automated time-series physiological data collection. Test Bed 1.5: Astroskin data sent to core Flight Software. Test Bed 3 (FY19): cognition data, ultrasound image analytics, cFS integration, demonstrated in "Gateway-in-a-box". Test Bed 4 (FY20): clinical decision support for crew self-reliance. The architecture has a data sources layer, a storage layer, descriptive and advanced analytics, decision support, a knowledge base and dashboards, with separate interfaces for Medical, Wellness, Task Performance, EVA, Environmental, Research and Maintenance. | Prototypes and requirements documents up to about 2020. No 2024–26 status found [S25, S26]. |
| ExMC Clinical Decision Support concept of operations | An onboard system to help the crew assess, diagnose, decide and treat. | Concept [S26]. |
| TRISH **HERMES** | A "democratized" crew health record that travels with the astronaut and merges data from many sources. | Program [S44]. |
| NASA/Google **CMO-DA** | Multimodal (speech, text, images) proof-of-concept clinical decision support. Press reports say it runs on Vertex AI and that NASA owns the code. Tested with an OSCE rubric; press names the scenarios as ankle injury, flank pain and ear pain. | Google says "early results showed promise" with no numbers; refinement with physicians continues. No deployment reported [S24]. |
| **rHEALTH ONE** (DNA Medicine Institute) | Flow cytometry plus assays from <10 µL of blood. 1.5 kg, <2.5 W over USB (vendor figures). | Run by Cristoforetti on ISS in May 2022 with remote guidance. NASA-blinded samples were all read correctly (Nature Communications 2024) [S28]. |
| CSA **Bio-Analyzer** (Honeywell/COM DEV) | Finger-prick blood, saliva and urine. Results in 2–3 h instead of freezing samples for return. | First used on ISS by Saint-Jacques in May 2019 [S29]. |
| **ADUM** remote-guided ultrasound | About 4 h of pre-flight training 6–8 months before flight, just-in-time training 2–3 days before the session, and live expert guidance. A non-physician got diagnostic-quality shoulder and cardiac exams (Fincke, Expedition 9, 2004). A motorized probe that ground experts steer (Sonoscanner) was added in 2017. | Operational lineage of ISS ultrasound [S45]. |
| **Butterfly iQ** handheld ultrasound | Connects to a phone or tablet; 21 presets; automated calculations (Auto-EF, Auto-Bladder). In 2021 astronauts scanned cardiovascular, lung, MSK and urinary sets "without any ground support". On Inspiration4: 89 pre-flight and 108 in-flight scans; ocular images were mostly too poor to analyse. | Technology demonstration [S30, S46]. |
| **CIMON / CIMON-2** (DLR, Airbus, IBM) | Free-flying voice assistant. CIMON-2 (launched 2019-12-05) used Watson Tone Analyzer for "empathic" replies, navigated by voice command and took photos. Not self-learning. | Demonstration; no health outcomes published [S27]. |
| **Playbook** (NASA Ames) | Crew self-scheduling tool that works offline during loss of signal. ISS checkout in 2015, Crew Autonomy Scheduling Test in 2017. In HERA Campaign 7, about 20% of each mission was self-scheduled, with aids "Suggested Fixes" and "No-Go Zones". Lesson: the crew could not resolve conflicts when they did not understand *why* a constraint existed. | Research tool [S47, S48]. |

## 4. Wearables used in spaceflight and analogs

| Device | Where / when | Metrics | Source |
|---|---|---|---|
| CSA **Bio-Monitor** (Astroskin; commercial version Hexoskin, by Carré Technologies) | ISS from December 2018 (Saint-Jacques onward); offered to ISS partners | ECG and pulse, BP, breathing rate and volume, skin temperature, SpO2 (headband), activity. Has a tablet app. Wearable during sleep and exercise; data downlinked when the battery pack is docked. Early prototype: the SpO2 headband became uncomfortable over long wear. | [S31, S32] |
| **Actiwatch Spectrum** | ISS (Standard Measures, sleep studies) | Accelerometer, ambient light; sleep-wake cycle | [S33, S37] |
| **Condor Instruments** actigraph | Artemis II (ARCHeR) | Activity, sleep, 10-channel light including melanopic light, temperature, event button | [S21, S22] |
| **Apple Watch Series 6** | Inspiration4 (2021) | HR and HRV as 1-h averages, SpO2, energy, activity, sound pressure (2 per hour), barometric pressure | [S30] |
| **Garmin fēnix 7** | Polaris Dawn (2024) | HR, SpO2, sleep; no recharge needed for the whole mission | [S34] |
| **Oura ring**, plus Garmin smartwatch and BioIntelliSense BioButton via TrialX | Fram2 (2025-03-31, about 4 days) | Oura: sleep quality and stress before, during and after flight. TrialX: HR, HRV, respiration rate, stress, SpO2. Fram2's official list of 22 studies also includes: CGM validation (fluid shifts may affect accuracy; aimed at flying diabetic crew); Hormona hormone test and app; first X-rays of humans in space; Hyperfine portable MRI right after landing; blood-flow-restriction exercise; motion sickness; anemia; bone imaging; unassisted egress. | [S35, S64] |
| **Oura ring**, "ISS Edge Computing for Crew Readiness Demonstration" (PI: Booz Allen; Axiom; ISS National Lab) | Ax-4 (2025-06-25 to 07-15) | Total sleep time and HRV during sleep, processed in orbit by an edge device and shown directly to the crew member, to test readiness decisions without the ground. **No results published as of 2026-11-06.** | [S36, S65] |
| Commercial glucose monitors, "Suite Ride" (Axiom and Burjeel Holdings) | Ax-4 (2025) | Several commercial glucose monitors (one interstitial), tested for accuracy in microgravity, plus insulin delivery, insulin integrity and data sharing. Brands and results not published. | [S65, S66] |
| ESA **T-Mini** headband | ISS | Core body temperature | [S33] |
| "Wearable Monitoring" vest; personal CO2 monitor | ISS | HR and breathing during sleep; CO2 near the wearer | [S33] |
| Personal and active dosimeters (ESA, CSA EVARM) | ISS, Artemis I and II | Radiation dose over time, during EVA, and in real time on Artemis II | [S19, S33] |
| Bodytrak (ear), Cosinuss One (ear), Whoop | — | **No confirmed flight use found.** Cosinuss was pitched to TRISH. | [S36] |

Takeaway: HR, HRV, SpO2, sleep/activity, light and skin or core temperature have flown repeatedly. BP has flown as cuff-style spot checks; continuous wearable BP appeared only in the Bio-Monitor.

## 5. Behavioral health tools

- **ISS operations:** private psychological conferences every 2 weeks, plus family conferences, care packages and discretionary events, all optional and private [S39]. A 2024 NASA BHP deck addresses exploration needs (text not extracted) [S40].
- **Cognition battery** (Basner, Dinges, Gur; Penn and Pulsar Informatics): 10 tests including a 3-minute PVT-B, about 16 minutes per session on ISS. Part of Standard Measures; gives an objective counterpart to self-reported alertness. The Reaction Self-Test study tracked sleep and alertness in 24 astronauts on 6-month missions [S38]. Inspiration4 paired the battery with an 11-point Alertness and Mood Survey before each session [S30].
- **Journals study** (Stuster, NASA, 2010): diaries from 10 ISS astronauts (average 188 days). 24 issue categories, of which the top 10 accounted for 88% of entries. Every participant said the journal was an outlet for frustration that would otherwise damage relationships [S41].
- **Virtual Space Station** (Buckey, Dartmouth, NSBRI-funded): interactive self-help modules for conflict, stress and mild depression (problem-solving therapy) plus self-assessment. Tested on Earth, including an RCT and a 68-volunteer evaluation. No ISS deployment confirmed [S49].
- **VR:** ESA's VAMB with Mogensen used 5 nature environments (anecdotal benefit only). SFU's "Earthgazing" ran in SIRIUS-21. A Texas A&M VR-plus-scent pilot (n=4) reduced anxiety. Reviews note boredom with repeated scenes and cybersickness. Evidence so far is preliminary [S51].
- **Analogs:**
  - **HERA** (JSC): 4 crew, 45-day missions. Studies behavioral health, team dynamics and human-system interfaces; Playbook was tested there [S47, S52].
  - **CHAPEA 2**: 2025-10-19 to 2026-10-31, 378 days, crew of commander, medical officer, science officer and flight engineer. Communication delays reported as "26–44 min each way", which is longer than the real Mars one-way light time of about 3–22 min, so treat that figure as reported, not checked. Includes a 2-week blackout simulating solar conjunction. No results published yet. CHAPEA becomes the Moon and Mars Exploration Analog (MMEA), with the next one-year crew from about August 2027 [S54]. CHAPEA 1 ended in July 2024.
  - **Not re-verified this session:** Mars-500 (520 days, 2010–11), SIRIUS-21 (240 days), Concordia (Antarctic winter-over), HI-SEAS (up to 1 year).

## 6. Commercial, startup and research ecosystem

- **TRISH** (Baylor-led consortium with Caltech and MIT, funded by NASA HRP, partnership through 2028) [S43, S44, S46]:
  - **EXPAND** collects pre-, in- and post-flight data from volunteering commercial flyers on more than a dozen missions.
  - Essential Measures: sensorimotor, neurocognitive, biosamples (blood, saliva, urine, stool, skin), questionnaires, SANS surveillance, physiology.
  - Exploratory studies: in-flight blood and saliva analysis, vision, portable ultrasound, 3D optical imaging.
  - TrialX built the database. The CADRE model shares data without re-consent, and an independent 5-person Privacy and Release Board reviews requests.
  - **First call for proposals opened 2026-03-16:** data access instead of money, Step-1 deadline April 23, projects start fall 2026 [S42, S43].
  - Other TRISH programs: HERMES (health record) and SENTINEL (tissue chips).
- **Mission partners:**
  - Axiom (Ax-1 to Ax-4). The Ax-4 TRISH studies covered motion sickness, sleep, genome, cognition and eye/brain health [S56]. Other Ax-4 health studies:
    - AstroMentalHealth: questionnaires, interviews and video diaries before, during and after flight.
    - Telemetric Health AI (TESH, Semmelweis University): merges medical-device data with mission data for real-time cardiovascular and balance monitoring.
    - NeuroMotion VR: VR cognitive tasks with an fNIRS brain-activity cap.
    [S65]
  - SpaceX private missions (Inspiration4, Polaris Dawn, Fram2) [S30, S34, S35, S64].
- **Companies in flight health:** Butterfly Network, DNA Medicine Institute (rHEALTH), Carré Technologies/Hexoskin, Condor Instruments, Garmin, Apple, Oura, BioIntelliSense, TrialX, Booz Allen, Google Public Sector, Airbus/IBM, Honeywell/COM DEV, Xiphos (CSA data processors) [cited above].
- **Open science:** the Inspiration4 data (Nature 2024 "SOMA" package) sits in TrialX, NASA OSDR/GeneLab, the SOMA portal and a commercial spaceflight repository, mostly under **controlled access** [S30].
- **CSA Deep Space Healthcare Challenge** (CSA and Impact Canada, 2021–2024): autonomous detection and diagnosis tools for remote Canadian communities first, deep space later. Prizes: up to 20 × $30k, then 5 × $350k, then a $500k grand prize.
  - **Winner:** MD Applications, **EZResus**, a resuscitation app for the critical first hour (diagnosis, drug dosage, equipment).
  - **Other finalists:** CSii autonomous medical robot; IndigenousTech.ai smartphone dermatology AI; Luxsonic SieVRt (extended-reality remote cardiac radiology); Neursantys NEURVESTA (neurovestibular wearable).
  - **Semi-finalists** included an AI virtual medical assistant (ADGA) and a finger-prick multi-test blood platform (Alentic).
  - **Judging criteria:** effectiveness, autonomy in low connectivity, innovation, ease of use by non-physicians, adoption potential, context sensitivity, reliability.
  [S67]

## 7. Previous Space Apps and other hackathon projects

| Year | Challenge | Project | What it was | Outcome |
|---|---|---|---|---|
| 2014 | Humans category | Astronaut Health Monitoring System (github.com/NazS2/Astronaut-health-monitoring-system) | Body and suit sensors (temperature, EEG, ECG) feeding a ground dashboard | No award found [S57] |
| 2014–15 | Fit as a MOoSE | Astro Health Check; S.A.H.M. (github.com/Icecube1911/S.A.H.M.) | Citizen-science fitness tests modelled on astronaut tests; belt and earpiece vitals | No award found [S57] |
| 2017 | Small Spaces Big Ideas; BYOS | Team tyf; "Super Space Gym" | Clinical-station layout plus a per-crew health summary app; exercise concept | No award found [S57] |
| 2018 | Make Sense Out of Mars | Spacemed (Mazatlán) | "Space Health System" for vitals and biomechanics; no hardware or data specified | **Global Nominee** [S58] |
| 2018 | Bring Your Own Solution | AstroMentis (github.com/blbessie/astromentis) | Diary entries parsed by NLP into therapist reports | No award listed. Page shows no validation or privacy design [S59] |
| 2020 (COVID) | The Isolation Solution | **Shelter in Space** | App turning users into crew of a virtual analog mission: gamified challenges, sleep and nutrition guidance, opt-in data for research | **Best Mission Concept** (global) [S50] |
| 2022–2024 | — | — | None of the 10 global winners each year was about astronaut health. For 2021 only the winners' names were checked; none suggests health, and Best Use of Science "Ani's Cuff" was about insects | [S60, S61, S62, S63] |
| 2025 | Build a Space Biology Knowledge Engine | **SpaceGenes+** (Germany) | Interactive dashboard of how radiation and microgravity *together* affect astronauts at the molecular level, built on NASA data | **Best Use of Science** [S53] |
| 2025 | Your Home in Space: Habitat Layout Creator | PureFlow (Brazil) | Habitat design and 3D modelling tool tested against space-weather threats | **Best Mission Concept** [S53] |

Other: RASU AI (Wolfhacks 2021, a dashboard plus MongoDB proof of concept) [S57].

Patterns:
- Weak entries assumed sensors that do not exist or do not fly, gave no thresholds or escalation logic, and did not address privacy.
- Winners grounded their work in real NASA data or protocols and told a plausible mission story.
- 2026 is the first Space Apps challenge about crew health self-assessment software. The closest precedents are the 2020 Sleep Shift Scheduling Tool and the 2021 Trail to Mars game. Section 9 lists the past health challenges and their Resources tabs.

## 8. Synthesis: gaps, opportunities and pitfalls

### Gaps a 48-hour prototype can credibly address

1. **Crew-side interpretation.** Data today flows to the ground, which interprets it. Both NASA's MDA and TRISH's HERMES describe a fragmented record. A crew-facing view that merges manually entered spot vitals (BP and SpO2 are explicitly "manual entry OK"), wearable trends (HR, HRV, sleep), questionnaires and cognition scores matches NASA's own architecture [S16, S25, S44].
2. **Tiered escalation that mirrors real operations:**
   - self-care with an explanation;
   - CMO check with a checklist-style guided procedure;
   - flag for the next PMC (weekly) or PPC (every 2 weeks);
   - immediate surgeon consult.
   On deep-space missions the tool can also show the one-way delay and prepare a store-and-forward packet for the surgeon.
3. **Delay- and loss-of-signal-tolerant design.** Playbook ran fully offline, and Ax-4 tested on-station analytics without the cloud. A local-first app is the realistic choice [S36, S47].
4. **Explaining "why".** The Playbook lesson and the challenge brief both point at crews needing the rationale behind a constraint or measurement. Explain each measurement, the hazard behind it and the action it leads to [S48].
5. **Countermeasure adherence.** Exercise compliance has historically been imperfect. Gamifying the ≥2 h/day prescription and pre-landing fluid loading fits the brief's gamification suggestion [S2, S4].
6. **Behavioral self-check between conferences.** A short daily sleep, mood, workload and team check-in modelled on Standard Measures questionnaires, plus an optional private journal (backed by the Stuster findings), fits current practice [S37, S41].
7. **Environment-specific modes** (spacecraft, station, lunar base) using each vehicle's medical capability (Levels of Care ladder, §2) to decide what resources the crew has [S17].

### Pitfalls to avoid

- **Claiming diagnosis.** Even the NASA/Google CMO-DA is a proof of concept with no published accuracy. Use "decision support / flag for review" language, and cite the source of every threshold [S24].
- **Medical privacy.** PMC and PPC content stays between crew member and surgeon. NASA withheld Crew-11 identity and diagnosis. Design role-based visibility (self, CMO, surgeon, mission control sees status only), consent and de-identification [S13, S15, S39].
- **Hardware that does not fly.** Orion has no ultrasound, X-ray, CT or MRI, and about 30 lb of medical hardware in total. Imaging is ultrasound only, from Gateway onward. Stick to flown classes of device: actigraph or watch, BP cuff, pulse oximeter, thermometer, ECG patch or shirt, saliva or finger-prick tests, camera [S16, S23].
- **Assuming real-time ground support.** Mars one-way light time is about 3–22 minutes, with conjunction blackouts. CHAPEA simulated a 2-week blackout [S54].
- **Assuming real astronaut data is downloadable.** It is mostly controlled access (LSDA, EXPAND, OSDR controlled tiers). Generate synthetic data from published ranges and label it as synthetic [S20, S30, S42].
- **Over-claiming from tiny samples.** Analog and commercial crews are 4 people, and early CHAPEA and Inspiration4 results are n=4.
- **Starting the build early.** Event rules forbid work before Nov 14. This file is research only.

### Open leads (not completed; the search budget ran out)

- Full Polaris Dawn research list (Polaris program pages).
- Ax-4 results (Oura edge computing, Suite Ride, TRISH): none published yet. Watch https://issnationallab.org/press-releases/ax4-booz-allen-sleep-tech/ and https://issnationallab.org/press-releases/ax4-suite-ride-diabetes-research/
- 2024–26 ExMC and Earth-Independent Medical Operations status, and any CMO-DA follow-up publication.
- The 2024 BHP deck (text not extractable here): https://ntrs.nasa.gov/api/citations/20240014687/downloads/BHP%20for%20Future%20Space%20Exploration%202024.pdf

## 9. Second-pass findings

### Past Space Apps human-health challenges and their Resources tabs

Scanned: the 2015 humans category, 2016–2022 category pages, the COVID-19 edition, and all 2023–2026 challenges (86). No CSA Bio-Monitor data challenge appears in any year scanned.

| Year | Challenge (teams) | What it asked | Resources tab listed |
|---|---|---|---|
| 2014–15 | Fit as a MOoSE | Citizen-science tool linking ISS astronaut health to exercise on Earth, using past mission data (body mass, fluid intake, temperature, saliva pH; hydration as an example) | NASA JSC Life Sciences Data Archive (LSDA) and its public data; Train Like an Astronaut; Astronaut Fact Book [S68] |
| 2015 | 3D AstroMed Devices | 3D-printable medical-kit items | Medical kit images; HRP site; Human Research Roadmap and architecture; Future Engineers [S68] |
| 2016 | Astrocize (56 solutions); Space Recreation (ESA, 71) | Gym tools and workout under 500 kg with VR or gaming; leisure and VR for crews | Only the generic 2016 resources repo [S69] |
| 2017 | Small Spaces Big Ideas | HI-SEAS habitat layout, including a crew "clinical station" | HI-SEAS habitat details [S70] |
| 2018 | Make Sense Out of Mars | A sensor for humans on Mars | Generic (Mars missions, Earth remote sensing, sensor monitoring) [S71] |
| 2020 | **Sleep Shift Scheduling Tool** (217) | Tool that adapts sleep, exercise and nutrition schedules to manage fatigue and keep circadian rhythm | Bootcamp video; NASA "How Astronauts Improve Sleep"; NASA Ames "biological clock misalignment" study [S72] |
| 2020 (COVID) | The Isolation Solution (305) | Counter social isolation | NASA HRP "Social Isolation and Space" and "...in Context"; Task Book project on psychological risk in isolated, confined, extreme environments [S73] |
| 2021 | **The Trail to Mars: Can You Keep Your Crew Alive** (216) | Educational game (ages 10–14) keeping an avatar healthy Earth→Mars→Earth: sleep, exercise, solar-particle-event shelter, antioxidants, family contact | GeneLab rodent datasets (GLDS-32/352 brain, 288/211 immune, 345 bone, 270 heart, 326/135 muscle); NASA Space Biology; HRP 5 Hazards; three.jsc.nasa.gov (radiation); Twins Study [S74] |
| 2022 | Build a Space Biology Superhero (422) | Explore space stressors and how organisms cope | Human Research Roadmap risks; Space Biology; 5 Hazards; GeneLab; **CSA "Health Beyond" deep-space healthcare report (Appendix B: clinical, biomedical and performance needs)**; CSA "Effects of Space on the Human Body"; Mexican Space Agency data [S75] |
| 2023 | Building the Space Biology "Model Zoo" | Transfer-learning dataset catalogue | NASA OSDR (examples OSD-465, -466, -520, -524) [S76] |
| 2024 | **Galactic Games: Fun in a Microgravity Environment** | Game for crew well-being and cohesion | NASA "Living and Working in Space", "The Human Body in Space", human-body experiments page; ESA Erasmus Experiment Archive, ESA HREDA (Human and Robotic Exploration Data Archive), ESA PSA; CSA "Effects of Space on the Human Body", CSA Vection VR experiment, CSA "Living Aboard Orion" [S77] |
| 2025 | Build a Space Biology Knowledge Engine | AI dashboard over NASA bioscience papers | 608 open-access space-biology papers (github.com/jgalazka/SB_publications); OSDR; NASA Space Life Sciences Library (NSLSL); NASA Task Book [S78] |
| 2025 | Your Home in Space: Habitat Layout Creator | Habitat layout including medical care, sleep and exercise areas | NTRS habitability papers (net habitable volume, deep-space habitability guidelines, Moon to Mars architecture); CSA education pages [S78] |

The 2026 sibling human-exploration challenges are Junior Astronaut Mission Trainer, Interplanetary Survival Guide: Martian Map, and Flame in Freefall. As of 2026-11-06 the health-monitoring challenge page still reads "Resources will be available on Friday, November 13" [S79].

**Resources likely to appear on Nov 13 (inference from the pattern above; not confirmed):**
- **NASA:** HRP pages (5 Hazards of Human Spaceflight, Human Research Roadmap risks, "The Human Body in Space"); NASA OSDR, which the challenge video names (includes the Inspiration4/SOMA human data); the LSDA / Life Sciences Portal and Spaceflight Standard Measures; NASA Task Book; Twins Study; probably the Artemis II crew-health research pages.
- **CSA**, the most consistent partner contributor: Health Beyond report, Effects of Space on the Human Body, Bio-Monitor and Bio-Analyzer, Living Aboard Orion.
- **ESA:** HREDA and the Erasmus Experiment Archive.

Past health challenges listed **pages and repositories, not a ready-made per-astronaut vitals dataset.** Plan to build realistic synthetic data and cite the listed pages for thresholds and rationale.

### Wearables on recent commercial missions

- **Fram2's official list of 22 studies** includes an Oura ring sleep and stress study and CGM validation, plus a hormone test and app, X-rays, post-landing MRI and more [S64]. The table in Section 4 is corrected.
- **Ax-4 (2025-06-25 to 07-15):** the Oura edge-computing demo processed data in orbit and showed it directly to the crew. The "Suite Ride" study tested commercial glucose monitors, insulin delivery and data sharing for future insulin-dependent crew. **Neither had published results as of 2026-11-06.** Axiom's mission highlights describe what was tested, without findings [S65, S66].
- **CSA Deep Space Healthcare Challenge:** won by EZResus, a resuscitation decision-support app (Section 6) [S67].

## Sources

- [S1] CHeCS overview (NASA ISS guide and NTRS search summary): https://ntrs.nasa.gov/api/citations/20110011351/downloads/20110011351.pdf
- [S2] JAXA, ISS medical operations system: https://humans-in-space.jaxa.jp/en/biz-lab/med-in-space/healthcare/medops/system
- [S3] NASA, Evaluating the ISS Medical Kit System (2011): https://ntrs.nasa.gov/citations/20110010924
- [S4] NASA, Evidence-based approach to ISS exercise prescriptions (2009): https://ntrs.nasa.gov/citations/20090013286
- [S5] NASA, Preflight and in-flight exercise conditions for ISS astronauts (2011): https://ntrs.nasa.gov/api/citations/20110016265/downloads/20110016265.pdf
- [S6] NASA, Countermeasures incl. Periodic Fitness Evaluation, BP-ECG (2010): https://ntrs.nasa.gov/citations/20100008451 ; ISS exercise systems reliability (2016): https://ntrs.nasa.gov/api/citations/20160012791/downloads/20160012791.pdf
- [S7] NASA, Replacing treadmill running with alternative countermeasures (2024): https://ntrs.nasa.gov/citations/20240016101
- [S8] Jones, NASA JSC, International Space Station Medical Operations (2008): https://ntrs.nasa.gov/api/citations/20080010877/downloads/20080010877.pdf
- [S9] NASA, Crew Medical Officer training and role of ground support (AsMA 2021 abstract): https://ntrs.nasa.gov/citations/20205008925
- [S10] Same abstract, full text: https://ntrs.nasa.gov/api/citations/20205008925/downloads/AsMA%202021%20Abstract%20CMO%20Training_PubPress_DAA_v1.docx
- [S11] NASA, Assessing CMO preparedness for ISS missions (2023): https://ntrs.nasa.gov/citations/20230013415
- [S12] NASA, ISS Medical Checklist human factors (2011): https://ntrs.nasa.gov/api/citations/20110002798/downloads/20110002798.pdf
- [S13] NASA, Flight Surgeons: https://www.nasa.gov/content/flight-surgeons
- [S14] Auñón-Chancellor et al., Venous Thrombosis during Spaceflight, NEJM 2020 (DOI 10.1056/NEJMc1905875); coverage: https://phys.org/news/2020-01-occurrence-treatment-spaceflight-medical-miles.html
- [S15] CBS News, Mike Fincke on the ISS medical issue: https://www.cbsnews.com/news/mike-fincke-astronaut-medical-issue-aboard-iss ; Sky at Night, Crew-11 early return: https://www.skyatnightmagazine.com/news/nasa-crew-11-medical-emergency ; Astronomy: https://www.astronomy.com/space-exploration/nasa-announces-early-return-for-iss-crew-11/
- [S16] Haas, Orion Medical System Overview, AsMA 2024: https://ntrs.nasa.gov/api/citations/20240004890/downloads/Orion%20Medical%20System%20Development.pdf
- [S17] Haas, Artemis Medical System Overview, ASCEND 2023: https://ntrs.nasa.gov/api/citations/20230015294/downloads/ASCEND_Artemis_Med_System_Dvlpnt_Ovrvw_Final.pdf
- [S18] NASA, Flight Surgeon Quick Reference Guide for Orion (2023): https://ntrs.nasa.gov/citations/20230015544
- [S19] NASA, Artemis II crew to advance human spaceflight research (Sept 2025): https://www.nasa.gov/humans-in-space/artemis-ii-crew-to-advance-human-spaceflight-research/
- [S20] NASA, Artemis II research continues on Earth (June 2026): https://science.nasa.gov/missions/artemis/artemis-2/nasas-artemis-ii-moon-mission-research-continues-on-earth/
- [S21] Universe Magazine (citing phys.org), Condor actigraph on Artemis II: https://universemagazine.com/en/wrist-device-monitored-the-astronauts-health-during-the-flight-to-the-moon/ ; https://phys.org/news/2026-05-wristwatch-device-enables-health-astronauts.html
- [S22] FAPESP, Brazilian technology on Artemis II: https://agencia.fapesp.br/brazilian-technology-helps-nasa-assess-health-risks-for-astronauts-on-mission-to-the-moon/58065 ; CSA Artemis II research: https://www.asc-csa.gc.ca/eng/missions/artemis-ii/scientific-research-during-mission.asp
- [S23] Planetary Radio, Astronaut health experiments of Artemis II (2026): https://www.planetary.org/planetary-radio/2026-astronaut-health-experiments-artemis-ii
- [S24] Google Cloud, How Google and NASA are testing AI for medical care in space (2025-08-08): https://cloud.google.com/blog/topics/public-sector/how-google-and-nasa-are-testing-ai-for-medical-care-in-space ; Space.com: https://www.space.com/technology/nasa-and-google-test-ai-medical-assistant-for-astronaut-missions-to-the-moon-and-mars
- [S25] Krihak et al., MDA platform and recommended requirements (2020): https://ntrs.nasa.gov/api/citations/20200000569/downloads/20200000569.pdf
- [S26] MDA Test Beds and CDS ConOps: https://ntrs.nasa.gov/api/citations/20180008706/downloads/20180008706.pdf ; https://ntrs.nasa.gov/api/citations/20190000384/downloads/20190000384.pdf ; https://ntrs.nasa.gov/citations/20220017856
- [S27] IBM, CIMON-2 debut on ISS (2020): https://newsroom.ibm.com/2020-04-15-CIMON-2-Masters-Its-Debut-on-the-International-Space-Station ; IBM (2019): https://newsroom.ibm.com/2019-12-05-AI-Powered-Astronaut-Assistant-Returns-to-Space-with-Emotional-Intelligence
- [S28] rHEALTH, Single drop cytometry onboard the ISS, Nature Communications 2024: https://link.springer.com/10.1038/s41467-024-46483-6 ; NASA demo publication: https://ntrs.nasa.gov/api/citations/20230012750/downloads/ISS%20rHEALTH%20Demo%20Publication%20e11.pdf
- [S29] CSA, Bio-Analyzer: https://www.asc-csa.gc.ca/eng/iss/bio-analyzer.asp
- [S30] Jones et al., Molecular and physiological changes in the SpaceX Inspiration4 civilian crew, Nature 2024: https://pmc.ncbi.nlm.nih.gov/articles/PMC11357997
- [S31] CSA, Bio-Monitor: https://www.asc-csa.gc.ca/eng/sciences/astroskin.asp
- [S32] NASA, AstroSkin prototype evaluation: https://ntrs.nasa.gov/api/citations/20190000238/downloads/20190000238.pdf
- [S33] NASA, Wearable tech for space station research (Nov 2024): https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research
- [S34] Garmin, Polaris Dawn: https://www.garmin.com.sg/news/press-release/news-2023-feb-polaris-dawn/ ; https://www.wareable.com/garmin/polaris-dawn-astronauts-to-wear-garmin-fenix-7-watches
- [S35] TrialX, Fram2 data collection: https://trialx.com/facilitating-health-research-data-collection-for-the-first-human-spaceflight-to-earths-polar-regions-fram2/ ; Neowin: https://www.neowin.net/amp/garmin-tag-teams-with-elon-musks-spacex-to-study-crew-on-fram2-with-its-watches/
- [S36] ISS National Lab, Oura on Ax-4: https://issnationallab.org/?p=48894 ; The Engineer: https://www.theengineer.co.uk/articles/oura-ring-to-monitor-astronaut-sleep-on-ax-4-iss-mission ; Wareable, Cosinuss: https://www.wareable.com/hearables/cosinuss-one-space-nasa-833
- [S37] NASA, Spaceflight Standard Measures: https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space ; NTRS: https://ntrs.nasa.gov/api/citations/20180002943/downloads/20180002943.pdf ; https://ntrs.nasa.gov/api/citations/20200001281/downloads/20200001281.pdf
- [S38] Penn, Cognition Test Battery: https://www.med.upenn.edu/uep/cognition.html ; Astronaut behavioral health: https://www.med.upenn.edu/uep/astronaut.html
- [S39] NASA, Space psychology (2022): https://ntrs.nasa.gov/api/citations/20230010798/downloads/071622%20CSP_Space%20Psychology.pdf ; NASA BHP (2017): https://ntrs.nasa.gov/api/citations/20170003866/downloads/20170003866.pdf
- [S40] NASA, BHP for Future Space Exploration (2024): https://ntrs.nasa.gov/citations/20240014687
- [S41] Stuster, Behavioral issues associated with long-duration space expeditions, journals final report (2010): https://ntrs.nasa.gov/api/citations/20100026549/downloads/20100026549.pdf
- [S42] BCM, TRISH opens commercial spaceflight database (2026-03-16): https://www.bcm.edu/news/trish-opens-commercial-spaceflight-database-to-scientific-community
- [S43] BCM, EXPAND Database and Biorepository FAQ: https://www.bcm.edu/academic-centers/space-medicine/expand/expand-database-biorepository-faq
- [S44] BCM, TRISH research (EXPAND, HERMES, SENTINEL): https://www.bcm.edu/academic-centers/space-medicine/translational-research-institute/research
- [S45] NASA ISS R&D 2012 (ADUM): https://www.nasa.gov/sites/default/files/files/issrdc_2012-06-26-1000_melton2012.pdf ; RSNA 2004: https://press.rsna.org/timssnet/media/pressreleases/pr_target.cfm?ID=204 ; IAC-18: https://iafastro.directory/iac/archive/browse/IAC-18/A1/IP/45565/
- [S46] BCM, TRISH demonstrates Butterfly iQ in space (2021-09-29): https://www.bcm.edu/news/trish-demonstrates-performance-of-portable-handheld-ultrasound-in-space ; NASA IWS 2021: https://ntrs.nasa.gov/api/citations/20210000940/downloads/Butterfly_iQ_IWS2021_SargsyanA.pdf
- [S47] NASA, Crew autonomy through self-scheduling (2025): https://ntrs.nasa.gov/citations/20250000944 ; (2024): https://ntrs.nasa.gov/citations/20240001818
- [S48] NASA, Playbook lessons (SpaceCHI 2023): https://ntrs.nasa.gov/api/citations/20230008619/downloads/Spacechi2023v5.pdf
- [S49] Virtual Space Station: https://www.eurekalert.org/news-releases/510297 ; https://www.thedartmouth.com/article/2008/09/buckey-to-test-program-for-astronauts
- [S50] Space Apps COVID-19 2020, Shelter in Space: https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/teams/shelter-in-space
- [S51] VR countermeasures: https://80.lv/articles/how-astronauts-enhance-mental-physical-health-with-vr ; https://sfu.ca/sfunews/stories/2021/11/earthgazing-vr-experience-to-help-astronauts-cope-with-lonelines.html ; https://bhp.engr.tamu.edu/wp-content/uploads/sites/212/2022/02/Abbott-2022-IMPACT-OF-VIRTUAL-NATURE-WITH-OLFACTORY-STIMULI-ON-ASTRONAUT-BEHAVIORAL-HEALTH.pdf
- [S52] NASA, HERA: https://www.nasa.gov/wp-content/uploads/2023/07/jsc-hhp-hera.pdf
- [S53] NASA, 2025 Space Apps global winners: https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-announces-2025-international-space-apps-challenge-global-winners/
- [S54] Texas Public Radio, CHAPEA 2 crew exits (2026-11-02): https://www.tpr.org/science/2026-11-02/they-spent-more-than-a-year-inside-a-nasa-hangar-in-houston-simulating-life-on-mars-now-theyre-finally-out
- [S56] BCM, TRISH research on Ax-4 (2025-04-23): https://www.bcm.edu/news/trish-to-lead-innovative-human-health-and-performance-research-on-upcoming-ax-4-mission
- [S57] Past Space Apps project pages: https://2014.spaceappschallenge.org/project/astronaut-health-monitoring-system ; https://2015.spaceappschallenge.org/project/sahm-space-astronaut-health-monitoring/ ; https://2015.spaceappschallenge.org/project/astro-health-check/ ; https://2017.spaceappschallenge.org/challenges/ideate-and-create/small-spaces-big-ideas/teams/tyf ; https://github.com/Wolfhacks-2021-Team-16/RASU-AI
- [S58] Space Apps 2018, Spacemed: https://2018.spaceappschallenge.org/challenges/can-you-build/make-sense-out-mars/teams/spacemed-1/project
- [S59] Space Apps 2018, AstroMentis: https://2018.spaceappschallenge.org/challenges/can-you-build/bring-your-own-solution/teams/astromentis
- [S60] Space Apps, 2021 Global Winners: https://www.spaceappschallenge.org/blog/2021-global-winners/ ; Ani's Cuff: https://www.earthdata.nasa.gov/news/spaceapps-2021-winners
- [S61] Space Apps, 2022 Global Winners: https://www.spaceappschallenge.org/blog/2022-global-winners/
- [S62] NASA, 2023 Space Apps global winners: https://science.nasa.gov/directorates/smd/2023-nasa-international-space-apps-challenge-announces-10-global-winners
- [S63] NASA, 2024 Space Apps global winners: https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-international-space-apps-challenge-announces-2024-global-winners/
- [S64] Fram2 press release, "Fram2 Selects 22 Science and Research Experiments" (2025-03-24): https://f2.com/research-announcement.pdf
- [S65] Axiom Space, Ax-4 mission and research pages: https://www.axiomspace.com/missions/ax4 ; https://www.axiomspace.com/research/iss-edge-computing-for-crew-readiness-demonstration ; https://www.axiomspace.com/research/suite-ride ; https://www.axiomspace.com/mission-blog/ax4-18-highlights ; ISS National Lab Ax-4: https://issnationallab.org/launch/axiom-mission-4/
- [S66] ISS National Lab, Suite Ride diabetes research: https://issnationallab.org/press-releases/ax4-suite-ride-diabetes-research/
- [S67] Impact Canada / CSA, Deep Space Healthcare Challenge (results, finalists, criteria): https://impact.canada.ca/en/challenges/deep-space-healthcare-challenge
- [S68] Space Apps 2015, Fit as a MOoSE: https://2015.spaceappschallenge.org/challenge/fit-moose-metabolic-observations-space-explorers/ ; 3D AstroMed Devices: https://2015.spaceappschallenge.org/challenge/3d-astromed-devices/
- [S69] Space Apps 2016, Astrocize: https://2016.spaceappschallenge.org/challenges/space-station/astrocize ; Space Recreation: https://2016.spaceappschallenge.org/challenges/mars/space-recreation
- [S70] Space Apps 2017, Small Spaces Big Ideas: https://2017.spaceappschallenge.org/challenges/ideate-and-create/small-spaces-big-ideas/details
- [S71] Space Apps 2018, Make Sense Out of Mars: https://2018.spaceappschallenge.org/challenges/can-you-build/make-sense-out-mars/details
- [S72] Space Apps 2020, Sleep Shift Scheduling Tool: https://2020.spaceappschallenge.org/challenges/sustain/sleep-shift-scheduling-tool/resources
- [S73] Space Apps COVID-19, The Isolation Solution resources: https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/resources
- [S74] Space Apps 2021, The Trail to Mars resources: https://2021.spaceappschallenge.org/challenges/statements/the-trail-to-mars-can-you-keep-your-crew-alive/resources
- [S75] Space Apps 2022, Build a Space Biology Superhero resources: https://2022.spaceappschallenge.org/challenges/2022-challenges/space-biology-superhero/resources
- [S76] Space Apps 2023, Building the Space Biology "Model Zoo": https://www.spaceappschallenge.org/2023/challenges/building-the-space-biology-model-zoo/?tab=resources
- [S77] Space Apps 2024, Galactic Games: https://www.spaceappschallenge.org/nasa-space-apps-2024/challenges/galactic-games-fun-in-a-microgravity-environment/?tab=resources
- [S78] Space Apps 2025, Space Biology Knowledge Engine: https://www.spaceappschallenge.org/2025/challenges/build-a-space-biology-knowledge-engine/?tab=resources ; Habitat Layout Creator: https://www.spaceappschallenge.org/2025/challenges/your-home-in-space-the-habitat-layout-creator/?tab=resources
- [S79] Space Apps 2026, Create Health Monitoring Software for Astronauts: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
