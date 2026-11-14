# How non-NASA space agencies monitor astronaut health

Research leg: approaches, devices, crew-facing software, analog studies and public resources of CSA, ESA, CNES/MEDES, DLR, ASI, UKSA, AEE, JAXA, Roscosmos/IBMP, ISRO, CNSA, MBRSC, TUA, KASA and Ax-4 (Poland, Hungary). Collected 2026-11-06. Bracketed numbers point to **Sources**. "(secondary)" means news or company material, not an agency or peer-reviewed source. "(unverified)" means a single weak source.

## Key takeaways for the team

- **A crew-facing health app already flies, so we have to beat it.** CNES/MEDES **EveryWear** has run on ISS iPads since 2016. It logs nutrition by barcode scan, medication intake and questionnaires, and offers private messaging with the flight surgeon. It reads connected devices: the Lumina dosimeter, a tonometer, a skin-temperature patch, an ECG T-shirt and a **blood glucose meter**. CNES says "nearly all" ISS crews use it, and it flew on Artemis II [12][13][14]. To stand out, our tool should do what EveryWear does not: interpret readings for the astronaut, give guidance, and work without the ground.
- **Every agency watches the same core signals.** These are ECG/heart rate (HR) and heart-rate variability (HRV), blood pressure (BP), breathing, SpO2, skin or core temperature, activity and sleep. CSA Bio-Monitor, ASI's MagIC vest, IBMP Sonocard, JAXA Holter+Actiwatch, CNES PhysioTool and ISRO's wearable tender all measure this set [1][16][27][30][39]. **ISRO's tender** is the clearest public spec: 3-lead ECG with arrhythmia detection, continuous non-invasive BP, SpO2, breathing rate, skin temperature, 6-lead EEG with REM/N-REM staging, 7 days of storage, and USB/BLE transfer within 5 minutes. A saliva/sweat biomarker device is part of the same tender [39].
- **The shared direction is crew autonomy.** CSA Health Beyond aims for crews that "monitor and analyze health data", "predict or identify early onset" of conditions and "assess sleep, fitness or nutrition" on their own [3]. CSA's C2M2 modules are "AI-based" [5]. On the ISS, CNES **EchoFinder** uses augmented reality (AR) and AI to guide a non-expert through an ultrasound scan with no ground help. Sophie Adenot flew it in 2026 [15][16]. DLR **SpacePatch** is an AI cardiac wearable that works "without internet or cloud" [24]. If our software assumes no ground link, it follows where the agencies are heading.
- **The cautionary example is CIMON.** DLR/Airbus/IBM's floating assistant did its speech AI on the ground: IBM Watson in the IBM Cloud, reached over ISS links [22][23]. That cannot work with Moon or Mars delays. An onboard or offline design is a selling point for us.
- **No agency publishes raw in-flight vital signs.** The best public options:
  - CSA open data **PRET**: neurocognitive scores from PVT, WinSCAT, DANA, D-KEFS and other tests, with lab data and a Mars-500 usability test, in CSV/DOCX [9].
  - Aggregate numbers from papers, such as JAXA's 48-h ECG and actigraphy study [31] and Mars-500 actigraphy [34].
  - At Space Apps 2018 a Winnipeg team posed its own "Be a bio-spy" challenge ("Invent Your Own Challenge" category) using Bio-Monitor astronaut data that, per the team page, CSA provided [10]. It was not an official global challenge, but CSA has shared Bio-Monitor data with Space Apps participants before.
- **Numbers we can show in the UI** (all from agency sources):
  - Arteries stiffened 17–30% after 6 months, comparable to 10–20 years of ageing on Earth. Insulin resistance appeared in astronauts [6].
  - Up to 80% of long-duration astronauts get lightheaded on return. A self-run leg-cuff test identified who needed countermeasures [8].
  - At least 2 h of exercise a day are required [28].
  - Fluid and salt loading plus daily interviews with the flight surgeon start 2 days before return. Post-flight rehab takes about 45 days in 3 phases [28].
- **Analog studies show behaviour drifting quietly.**
  - Mars-500 (520 days): crews moved less, rested and slept more, saw less light, and most had sleep, vigilance or circadian problems. The authors call for keeping light, meal and exercise timing like on Earth [34].
  - SIRIUS-21: early conflicts were stabilised by mental-health professionals [36].
  - Concordia adds chronic hypoxia and months of darkness [19].
  - Routine prompts (light, movement, sleep timing, mood check-ins) are supported by evidence.
- **Mood and cognition are tracked with standard tests and questionnaires, not inferred.** Examples: Polish AstroMentalHealth (questionnaires, photos, video diaries) [44][45], CSA PRET [9], Shenzhou-21 laptop tests [37], and the ISRO/IISc "Electronic Displays" study of cognition with in-flight user interfaces [41]. EEG and fNIRS are research tools (PhysioTool, MAGYAR, PhotonGrav) [16][43][45].
- **Which 2026 partners will supply health resources is unknown until Nov 13.** There are 17 partners [11]. CSA is the most likely, given its Space Apps history, Bio-Monitor and Health Beyond. ESA and JAXA are plausible. The others' Space Apps descriptions stress Earth observation.

---

## 1. CSA (Canada)

**Bio-Monitor (Astroskin; commercial version Hexoskin)** [1]
- A smart shirt, a headband and a dedicated tablet app. It measures "pulse and electrical activity of the heart", BP, breathing rate and volume, skin temperature, SpO2 and activity. It can be worn while sleeping and exercising.
- Data flow: the astronaut picks the activity type on the tablet and sees vital signs live during exercise. Afterwards the battery pack goes into a base that downloads the data to Earth.
- Launched December 2018. First used by David Saint-Jacques. Built by Carré Technologies (Montreal), with CALM, Xiphos and Katz Design.
- Hexoskin says ESA's Luca Parmitano ran a 72-hour validation session [48] (secondary).
- Use in 2025 studies [2]:
  - **CARDIOBREATH**: how heart and lung deconditioning affects BP control.
  - **Space Health**: Bio-Monitor data "analyzed by an AI computing platform" to assess cardiovascular function.
  - **Vascular Aging**.
- Vascular Calcium requires 48 h of Bio-Monitor wear in flight [6].
- A CSA grant (2025–26, about C$75k) analyses existing Bio-Monitor data from **9 astronauts** for sleep, fitness and BP from long recordings [47] (open.canada.ca record via search; page not fetched).

**Bio-Analyzer** [7]
- Console-sized and needs only a finger prick. Tests blood, saliva or urine in orbit with results in **2–3 h**, so samples need not be frozen and returned.
- Arrived on the ISS April 2019; Saint-Jacques ran the first tests May 2019. Built by Honeywell (COM DEV) with Xiphos.
- This shows blood biomarker testing in flight is feasible.

**Vascular series (PI Richard Hughson, Waterloo)** [6]
- Vascular (2009–14, 9 astronauts):
  - Arteries **stiffened 17–30%** in 6 months.
  - Astronauts develop **insulin resistance**, with a worse effect in men.
  - The usual exercise routine was not enough to prevent this. Several short bouts of exercise a day beat one long session.
- Vascular Echo (2016–22): uses ultrasound and a self-applied BP cuff, partly to test whether BP can stand in for ultrasound as an index of arterial change.
- Vascular Aging (2019–2027): adds an oral glucose tolerance test (a sugary drink, then blood-sugar measurement) and Bio-Monitor wear.
- Vascular Calcium (2022–2031, 30 astronauts, part of NASA CIPHER): blood, urine and BP before, during and after flight; 48 h Bio-Monitor; 3D imaging.

**BP Reg (2012–15, 8 astronauts)** [8]
- Up to **80%** of long-duration astronauts have lightheadedness on return.
- The in-flight self-test inflates thigh cuffs and then releases them suddenly, mimicking standing up. The rate of BP drop predicted who should take countermeasures:
  - more medical monitoring
  - more fluids
  - exercise changes
  - compression garments
  - lower-body negative pressure
- The fingertip BP monitor was not accurate enough to estimate cardiac output.

**Health Beyond Initiative (since 2019, funded by LEAP)** [3][4][5]
- Three pillars: vision and mobilization, capacity building, and demonstration and deployment.
- The target model lets astronauts "manage their health and handle medical situations", with spinoff benefits for remote and Indigenous communities.
- **C2M2 (Connected Care Medical Module)**: "an AI-based computer system that integrates and connects" medical devices to "detect, diagnose, treat and monitor".
  - 2022: five companies got about C$2M each for prototypes in shipping containers.
  - Fall 2024: four companies got about C$150k each, then three (Baüne, Lunar Medical, ResusMind) got up to C$650k each to prototype.
  - The 2nd series focuses on integrating software for the ISS or Gateway.
- CSA's list of target capabilities [3] works as a feature checklist for the team. Crews should independently:
  - monitor and analyze health data and medical history
  - predict or identify early onset of conditions
  - assess sleep, fitness or nutrition
  - diagnose and treat
  - maintain their medical skills

**Deep Space Healthcare Challenge (CSA + Impact Canada, 2021–24)** [4][46]
- 108 applications. Winner: MD Applications' **EZResus**, a resuscitation app, which received C$500k in February 2024.
- Stage-2 finalists:
  - IndigenousTech.ai: AI dermatology
  - Neursantys: NEURVESTA, managing vestibular disruption
  - Luxsonic: SieVRt mixed-reality ultrasound
  - CSii: autonomous medical robot
- Stage-1 included ideas close to ours:
  - ADGA's "AI-Powered Virtual Medical Assistant"
  - Tidal Medical's diagnostic wearable for respiratory and cardiac problems
  - Texavie's "MarsWear" health-sensing apparel
  - McMaster's "Heart-Tracker" for cardiac markers in interstitial fluid
  - Swift Medical's wound monitoring

**How ISS medical operations work (CSA description)** [29]
- Flight surgeons hold **weekly private medical conferences** with each crewmember. The Crew Medical Officer (CMO) does periodic in-flight evaluations.
- Multilateral boards (MMPB, MSMB, MMOP) set common standards. Working groups cover behaviour and performance (sleep and fatigue monitoring), nutrition, radiation, countermeasures and in-flight clinical medicine. The last includes "criteria for ordering the early termination of a flight".

**Public resources**
- **PRET dataset** [9]:
  - A CSA tool built on a 3D VR Mars-mission simulator with embedded neurocognitive tests (processing speed, memory, attention, response control).
  - Prototype from 2010, usability-tested in Mars-500, then refined at Carleton.
  - Data from PRET v1–5 plus PVT, TOVA, PASAT, WAIS-IV, WMS, D-KEFS, DANA and WinSCAT. Open Government Licence.
- Other CSA publications:
  - "Canadian Healthcare in Deep Space" expert-group report [42]
  - 2023 Topical Teams report with an astronaut-health chapter [42]
  - "Health in space" hub [26]

## 2. ESA (European Astronaut Centre, analogs)

- **EAC Space Medicine Team (Cologne)** [17]:
  - Staff: doctors, biomedical engineers, exercise physiologists, psychologists and IT specialists.
  - Supports ISS crews and prepares missions beyond low Earth orbit.
  - Intern project areas show its priorities: medical risks for deep-space vehicles, exercise countermeasures, "non-exercise management of astronaut health", validating medical technology, post-flight rehabilitation, and lunar hypogravity medical requirements.
  - Runs a Space Physician Training Course.
- **Concordia (Antarctica)** [19]: ESA sponsors a research doctor every winter. Crews live in permanent hypoxia without a regular day/night cycle. Monitoring uses mood questionnaires, sleep instruments and blood sampling. ESA calls it "the closest thing on Earth to interplanetary exploration".
- **Bed rest** [18][35]:
  - 60 days at 6° head-down tilt, about 12 volunteers. Sites: MEDES Toulouse, DLR :envihab, Slovenia.
  - BRACE tested in-bed cycling plus centrifuge.
  - AGBRESA (2019, NASA/DLR/ESA, 24 participants): 30 min of artificial gravity a day did not prevent the post-bed-rest rise in resting HR.
- **LUNA** [25]: a lunar analog hall run by DLR and ESA next to EAC, opened September 2024, with 700 m² of regolith simulant. Its health or medical use is not described publicly.
- **SIRIUS-21** [36]: ESA-backed science in IBMP's 240-day isolation study.
- **Crew-facing tools**: EveryWear (CNES) is used by ESA crews and the EAC medical team [12]. EchoFinder-2 was run in ESA's Columbus module [15].
- ESA's Space Apps partner description highlights Earth observation and science-mission data, not human health [11].

## 3. CNES / MEDES / CADMOS (France)

- **EveryWear** [12][13][14]:
  - iPad app built by CADMOS with MEDES, Inserm and EAC. On the ISS since 2016; first user Thomas Pesquet.
  - Features:
    - barcode food logging with calories and a comparison against a personal goal
    - medication log
    - dynamic questionnaires
    - private messaging with ground physicians
    - data synced in flight
  - Connected devices: Lumina dosimeter, carotid tonometer, continuous skin-temperature patch (used for sleep), ECG T-shirt, blood glucose meter.
  - Pesquet logged 1,200+ food items when asked for one week [13].
  - A new version combines NASA and European requests and is meant for Artemis tablets on Orion and Gateway. CNES says it is on Artemis II [14].
- **ECHO** [15][16]: tele-operated ultrasound installed in Columbus in 2016 and first used in 2017. A ground sonographer steers the motorised probe; the astronaut only holds it in place. It supported Vascular Echo/Aging and CIPHER.
- **EchoFinder / EchoFinder-2** [15][16]:
  - Before flight, an expert records each astronaut's reference probe positions.
  - In orbit, a tablet with a camera and QR markers shows blue spheres for the current probe position and orange cubes for the target. The astronaut lines them up, the shapes turn green, and AI recognises the organ and saves the image.
  - Needs no expertise and no ground link. Sophie Adenot was first to use it (εpsilon mission, 2026), and she and Jack Hathaway completed two sessions by April 2026.
  - Partners: Inserm/UniCaen, CHU Caen, MEDES.
- **PhysioTool** [16]: belt-worn ambulatory sensors for BP, HR, breathing rate, SpO2 and brain activity, using polysomnography and NIRS over a full day, plus a 1-hour cognitive task on a box with buttons, joystick and touchscreen. Partners: Angers, Lorraine, MEDES, Artinis, Somnomedics.
- **Echo-Bones** [16]: ultrasound of the tibia before and after flight to see bone anatomy, density and blood flow.
- **Lumina** [16]: fibre-optic radiation dosimeter, on board since 2021 and still working. Its data feeds EveryWear.
- **MatISS-4 and MultISS** [16]: monitor microbes and contamination on station surfaces.
- MEDES runs ESA bed-rest studies in Toulouse [18].
- Not researched: Cardiolab/Cardiospace (search budget ran out).

## 4. DLR (Germany)

- **CIMON** [22][23]:
  - Crew Interactive MObile companioN: a 32 cm sphere with 12 rotors, cameras for face recognition, ultrasonic sensors, microphones and a speaker.
  - CIMON-1 arrived July 2018. Alexander Gerst woke it on 15 Nov 2018; the first session lasted 90 min and included face recognition, photos, video and autonomous movement in Columbus.
  - Speech used IBM Watson in the **IBM Cloud on the ground**, reached over ISS Wi-Fi and satellite links. Airbus supplied the navigation AI, and LMU Munich led the human-factors work.
  - CIMON-2 launched 5 Dec 2019 and was commissioned February 2020 by Parmitano. With Matthias Maurer (Cosmic Kiss) it studied human–machine interaction and whether a companion reduces stress.
  - DLR's stated vision is robots that act as a "neutral conversation partner" on long voyages.
- **Institute of Aerospace Medicine and :envihab (Cologne)** [20][21]: operating since 2013. It has a short-arm centrifuge for up to 4 subjects, a 3T PET-MRI and a bed-rest/sleep ward. It hosted AGBRESA.
- **Thermolab (2008–15) and Circadian Rhythms (2015–19)** [49]: the "Double Sensor" (KORA/Dräger) measured non-invasive core body temperature. Core temperature stays raised on long flights and rises faster and higher during exercise in orbit. A 2024 IAC paper covers 10 astronauts (secondary summary).
- **SpacePatch** [24]: a non-invasive, radiation-resistant wearable (described as a "cardioballistic" sensor) with on-board signal processing and AI. It runs without internet or cloud and is aimed at Artemis and Mars, including before and during spacewalks. Shown at ILA 2026; development stage not stated.

## 5. ASI (Italy), UK Space Agency, AEE (Spain)

- **ASI**:
  - **Wearable Monitoring** (2015, Expeditions 41–46) [27]: MagIC-Space textile vest recording ECG, breathing, body accelerations, skin temperature and **seismocardiographic** cardiac timing during sleep, to see whether heart changes explain poor sleep.
  - **Drain Brain 2.0** (Crew-10, March 2025): cervical plethysmography for cardiovascular monitoring.
  - **NutrISS**: body composition by bioimpedance.
  - **Acoustic Diagnostics**: hearing checks using otoacoustic emissions.
  - ASI reports 80+ ISS experiments [50] (search summary of asi.it and IAC pages).
- **UK Space Agency**:
  - October 2021: £440k for 5 projects, including SANS (eye changes in space, Birmingham with NASA), isolation stress (Manchester Met) and muscle (Liverpool) [51].
  - 2017: funded the Myoton muscle-tone device.
  - Tim Peake's Principia mission (2015–16) included lung, sleep and calorie studies [51].
  - Since **1 Apr 2026** UKSA is no longer an executive agency; it is a directorate inside DSIT [52] (secondary).
- **AEE (Spain)**: nothing on crew health found. Spanish astronauts belong to the ESA corps, e.g. Pablo Álvarez; Sara García (reserve) is a cancer researcher [53] (secondary).

## 6. JAXA (Japan)

**Medical operations** [28]
- Three phases: pre-flight, in-flight and post-flight.
- In flight, care is run by JAXA's flight surgeon at NASA's mission control in Houston (MCC-H) and a medical team at Tsukuba. They combine:
  - interviews, exams and tests
  - physical performance
  - nutrition
  - mental health
  - life-support status
  - station and individual radiation
- Onboard medical equipment is NASA's Crew Health Care System (CHeCS):
  - HMS: medical instruments, emergency kits, AED, advanced life support, medicines
  - EHS: air, water, microbe and radiation monitoring
  - CMS: treadmill, ergometer, resistance exercise
- Rules and support:
  - **≥2 h exercise a day** on three machines.
  - Personal dosimeters plus real-time station monitors. During solar proton events the crew shelters in shielded areas.
  - Private counselling and regular family calls.
  - **Daily flight-surgeon interviews and fluid/salt loading start 2 days before return.**
  - A **3-phase rehab of about 45 days**: massage and assisted walking until day 3; underwater walking and cycling until week 2; then running and strength work.

**Studies**
- **Biological Rhythms 48 Hrs** [30][31]: 48-h Holter ECG inside a 96-h Actiwatch period, 4 times per astronaut, 10 astronauts.
  - Daily HR swing (circadian amplitude) was **10.90 bpm before flight vs 12.54 and 12.77 in flight**.
  - Sleep fell in 7 astronauts (454 → 409/382 min) and rose in 3 (371 → 388/413 min).
  - Sleep-quality score improved in the group whose sleep shortened.
  - Parasympathetic activity during sleep (pNN50) rose from 55% to 75%.
- **Holter ECG validation** (24 h) and **ODK2 Onboard Diagnostic Kit** [32]: COTS devices such as a stethoscope (ophthalmoscope "TBD"), real-time downlink for ground diagnosis. Completed.
- **Hybrid Training System** [33]: electrical muscle stimulation plus voluntary contraction (Kurume University, Goldwin gear), tested on the ISS around 2014 as a compact countermeasure (secondary sources).
- **Cell-Free Epigenome** [54]: liquid biopsy of 6 astronauts on missions over 120 days. Plasma cfRNA confirms mitochondrial dysregulation (Nature Communications, 2024).

**Exploration R&D: open calls (RFPs)** [55]
- high-definition portable ultrasound
- radiation-resistant portable X-ray
- **"automatic risk assessment method for mental fatigue, physical fatigue and lack of sleep by self-monitoring of skin condition"** (a camera-based self-check idea)
- noisy galvanic vestibular stimulation (nGVS) for re-adapting to gravity
- synbiotics
- radiation dose calculation
- drug treatment of radiation myelosuppression

## 7. Roscosmos / IBMP (Russia)

- **Periodic medical checks on the Russian segment** (NASA status reports via SpaceRef, 2002–12; may be outdated) [38]:
  - MO-1: resting ECG
  - MO-3: fitness test
  - MO-5: graded exercise test using the Gamma-1(M) ECG and BP system
  - MO-7: calf volume
  - MO-8: body mass
  - MO-9: urinalysis every 30 days and around spacewalks; NASA adopted it for US crews
  - MO-10: hematocrit every 60 days
  - MO-21: microbial air sampling
- **Sonocard** [30]: a cigarette-pack-sized accelerometer in a T-shirt pocket records the heart's chest vibrations (seismocardiography) during sleep for **contactless HRV**. 302 sessions, 215 in flight. The authors conclude seismocardiography gives reliable HRV during sleep in microgravity.
- **Pneumocard** and **Cosmocard** [30]: in-flight studies of the heart, lungs and autonomic regulation (Cosmocard co-author: Baevsky).
- **Mars-500** (2010–11, 520 days, 6 crew) [34]:
  - 4.4 million minutes of wrist actigraphy plus light, and 888 neurobehavioural test sessions.
  - Results: **hypokinesis** (less waking movement), more sleep and rest, less light exposure.
  - Most crew had sleep, vigilance or sleep-timing problems. One crewmember drifted toward a 25-h day (secondary press).
- **SIRIUS-21** (240 days, November 2021 – July 2022) [36]: one crewmember left early for medical reasons. Tsukuba found early conflicts that stabilised after mental-health intervention while performance stayed high.

## 8. ISRO (India)

- **Wearable health monitoring tender, HSFC Bengaluru** [39]:
  - First call (EOI 01/2023), three models:
    - training-load model: HR/HRV, skin temperature, SpO2
    - physiology model: 3-lead ECG with arrhythmia detection, continuous non-invasive BP, breathing rate
    - recovery model: 6-lead EEG with REM/N-REM sleep staging
  - Data every 5 s or faster, more than 100 MB storage, wireless data kept on an ISRO private cloud.
  - Required standards: ISO 10993, IEC 60601, CDSCO/FDA/CE.
  - Second call (EOI 02/2024): Model-1 for ground analogs and training; **Model-2 for in-orbit crew monitoring** with 3-lead ECG, 6-lead EEG with sleep staging, continuous non-invasive BP, skin temperature, breathing rate and SpO2. Also 7-day storage, transfer within 5 min, USB/BLE, an "integrated health data analytical engine with appropriate GUI", and a **saliva/sweat biomarker device** for cardiovascular, musculoskeletal and neuropsychological response.
- **Other Gaganyaan elements** (secondary or older):
  - The IAF Institute of Aerospace Medicine is the "nodal agency" for medical aspects and crew healthcare (DRDO News, 2020) [40].
  - DRDO/DEBEL is developing a "Bio-Vest" with ECG, SpO2, HR and temperature [40].
  - VSSC's **SAKHI** app reportedly tracks BP, HR and SpO2 and handles diet schedules and communication (secondary).
- **Axiom-4 (Shubhanshu Shukla, 25 Jun – 15 Jul 2025)** [41]:
  - 7 Indian experiments, including Myogenesis (muscle) and **Electronic Displays** (IISc): "cognitive testing with in-flight user interface displays", directly relevant to UI design.
  - Post-flight: 7-day program of cardiovascular, musculoskeletal and psychological checks.
- **Status**: the uncrewed Gaganyaan G1 (with the Vyommitra robot) is planned for Q4 2026; crewed flight in 2027 (secondary).

## 9. CNSA / China (Tiangong)

- Ground staff monitor temperature, BP and HR in real time through wearables. The space-to-ground telemedicine link was first used on Shenzhou-11 (2016). The onboard clinic has a CPR device and ultrasound. Crews exercise 1–2 h a day. Traditional Chinese medicine is used, including acupuncture on Shenzhou-13 [56] (secondary, April 2024).
- **Shenzhou-21 (2026)** [37]:
  - eye pressure and fundus exams, heart and lung checks
  - a TCM "four-diagnosis" instrument
  - **Raman spectrometer urine metabolomics** to "refine medical standards" for in-orbit monitoring
  - EEG
  - laptop tests of trust and human–machine trust
- **SIAT (CAS) EMG muscle monitor** [57]: flew on the Qingzhou cargo test vehicle (launched 30 Mar 2026) for real-time tracking of muscle atrophy, together with a handheld blood-cell analyser. CAS institutes also plan a "space hospital" (agreement July 2025).
- No public detail found on the China Astronaut Research and Training Center's AI tools.

## 10. MBRSC (UAE), TUA (Türkiye), KASA (Korea), Ax-4 Poland and Hungary

- **MBRSC**:
  - Sultan AlNeyadi (6 months, 2023): **200+ experiments, about 585 h**, with 10 agencies and 25 universities. Topics included cardiovascular health (heart tissue chips with MBRU/Harvard, Cardinal Heart 2.0, Cardiobreath), back pain, sleep, immunity, radiation, dental and posture [58][59] (UAE state press).
  - **UAE Analog Programme** in NASA's HERA habitat (two 45-day phases in 2024, e.g. 1 Nov – 16 Dec 2024): **18 human-health studies**, six led by MBRSC with UAEU, MBRU and AUS, covering physiological, behavioural and psychological responses. Communication delays went up to 5 min [60].
- **TUA, Alper Gezeravcı (Ax-3, January 2024)** [61]:
  - 13 experiments covering health, physics and acoustics.
  - An **Oxygen Saturation** experiment (Nişantaşı University) uses AI to calculate the oxygen level of the crew's air supply.
  - Also Metabolom (Ankara University), on how spaceflight affects human metabolism, and VocalCORD (voice in low gravity) (secondary).
- **Ax-4 Hungary (HUNOR, Tibor Kapu)** [43]:
  - **MAGYAR**: VR motor tasks with an fNIRS cap, plus saliva and tear stress markers
  - END SANS: eye insert intended to deliver a drug for SANS
  - personal radiation dosimetry
  - microbiome
  - heat transfer through clothing
- **Ax-4 Poland (Ignis, Sławosz Uznański-Wiśniewski, 13 experiments)** [44][45]:
  - **AstroMentalHealth**: mood and wellbeing through questionnaires, crew photos and video diaries (University of Silesia; secondary)
  - **EEG Neurofeedback**: stress reduction
  - **PhotonGrav**: fNIRS attention monitoring and brain-computer interface (Cortivision)
  - Immune Multiomics
  - Human Gut Microbiota
  - Mollis Textus/AstroPerformance: muscles and tendons
  - **MXene in LEO**: material for wearables such as an HR wristband
  - **Wireless Acoustics**: noise sensors linked to the station's medical system
  - Stability of Drugs
- **KASA**: no astronaut-medicine program found. Related efforts are a health-ministry "Space Medicine Research Platform", the NGMSAT-3 cell-biology payload (Nuri launch, November 2025) and a 2026 hospital platform plan [62] (secondary).

## 11. Space Apps 2026 partners likely to supply human-health resources

There are 17 partners [11]: Angola GGPEN, CONAE, Bahrain BSA, AEB, **CSA**, **ESA**, **ISRO**, **ASI**, **JAXA**, **KASA**, Nigeria NASRDA, Paraguay AEP, Senegal ASES, **AEE**, **TUA**, **MBRSC**, **UKSA**. These are estimates; check the Resources tab on Nov 13.

| Partner | Likelihood of health resources | Most likely material |
|---|---|---|
| CSA | High | Bio-Monitor pages (data shared with a 2018 local team [10]); Health Beyond and C2M2; Vascular and BP Reg; PRET open data [9] |
| ESA | Medium | EAC space medicine pages; Concordia and bed rest; EchoFinder; but ESA's partner text stresses Earth observation [11] |
| JAXA | Medium | humans-in-space.jaxa.jp medical-operations pages [28]; Biological Rhythms; but JAXA's partner text stresses Earth observation [11] |
| ISRO | Low–medium | Gaganyaan and Axiom-4 pages [41] |
| ASI | Low–medium | ISS experiment pages (Wearable Monitoring, NutrISS) [27] |
| MBRSC | Low–medium | AlNeyadi science; HERA analog [60] |
| UKSA, TUA, KASA, AEE | Low | Ax-3/HERA-type news; no health datasets found |
| CONAE, AEB, others | Low | Not researched (search budget ran out); none known |

## 12. Comparison table

| Agency | What they monitor | Key device or tool | Crew-facing software? | Public resource URL |
|---|---|---|---|---|
| CSA | ECG/HR, BP, breathing, SpO2, skin temperature, activity, sleep; blood biomarkers; arterial stiffness; glucose (OGTT) | Bio-Monitor (Astroskin); Bio-Analyzer; C2M2 | Yes: Bio-Monitor tablet app with live vitals during exercise | asc-csa.gc.ca/eng/sciences/astroskin.asp; data.asc-csa.gc.ca (PRET) |
| ESA | Isolation, sleep, mood, physiology in analogs; crew medical operations | Concordia, bed rest, LUNA; uses EveryWear and ECHO/EchoFinder | Indirect (EveryWear) | esa.int/About_Us/EAC/Space_Medicine |
| CNES/MEDES | Nutrition, medication, questionnaires, radiation, skin temperature, ECG, glucose; ultrasound; BP, HR, breathing, SpO2, brain activity | EveryWear, ECHO, EchoFinder (AR+AI), PhysioTool, Lumina | **Yes: EveryWear** (iPad; ISS since 2016; Artemis II) | cnes.fr/projets/cadmos/everywear |
| DLR | Core temperature and circadian rhythm; cardiac (SpacePatch); human–machine interaction | Double Sensor; :envihab; CIMON; SpacePatch | Yes: CIMON voice assistant (procedures, not health) | dlr.de (CIMON; Institute of Aerospace Medicine) |
| ASI | Sleep cardiac mechanics (SCG), ECG, breathing; body composition; hearing; cerebral venous outflow | MagIC-Space vest; Drain Brain 2.0; bioimpedance | Not found | asi.it (Wearable Monitoring) |
| UKSA | SANS, isolation stress, muscle (funded research) | Myoton | No | gov.uk press releases |
| JAXA | 48-h ECG/HRV + 96-h actigraphy; full medical operations; cfDNA/RNA | Holter, Actiwatch, ODK2, Hybrid Training | No public crew app found | humans-in-space.jaxa.jp |
| Roscosmos/IBMP | Resting ECG, exercise ECG and BP, urinalysis, hematocrit, body mass; sleep HRV; isolation behaviour | Gamma-1M, Sonocard, Pneumocard; Mars-500, SIRIUS | Not found | PNAS Mars-500 paper (PMC3574912) |
| ISRO | Spec: 3-lead ECG + arrhythmia, continuous BP, SpO2, breathing, skin temperature, 6-lead EEG sleep staging, saliva/sweat biomarkers | HSFC wearable (tendered); DRDO Bio-Vest | Planned: "analytical engine with GUI"; SAKHI app reported | isro.gov.in tenders (EOI PDFs) |
| CNSA | Temperature, BP, HR (wearables); eye exams; urine Raman metabolomics; EEG; EMG muscle; TCM | Telemedicine link; TCM instrument; SIAT EMG monitor | Laptop psychology tests (research) | Xinhua/China Daily (secondary) |
| MBRSC | Cardiovascular, sleep, back pain, immunity; analog behaviour | Partner payloads; HERA | Not found | mbrsc.ae |
| TUA | Air oxygen with AI, metabolome, voice | Ax-3 payloads | Not found | aa.com.tr (secondary) |
| Ax-4 PL/HU | Mood (questionnaires, video diaries), EEG/fNIRS, immunity, microbiome, dosimetry | AstroMentalHealth, PhotonGrav, MAGYAR | Questionnaires and VR tasks | esa.int Ignis science; axiomspace.com |

## 13. Common patterns and ideas worth borrowing

**Common patterns**
- **The same vital-sign set everywhere**: HR/ECG, BP, breathing, SpO2, temperature, activity, sleep. It is measured in sessions (48–96 h campaigns, exercise sessions, sleep), not all the time, because of crew time and battery limits [1][6][30].
- **Data flows to the ground today.** Real-time telemetry or post-session download goes to flight surgeons, with weekly private medical conferences [1][28][29]. Every exploration roadmap flips this to onboard interpretation [3][15][24].
- **Mental health means questionnaires, scheduled family calls and counselling, and analog studies.** No agency publicly describes inferring mood automatically [28][44].
- **Countermeasures are prescriptions:** exercise of at least 2 h a day, fluid and salt loading before return, compression, lower-body negative pressure, sheltering during solar events [8][28].

**Ideas worth borrowing**
1. **EchoFinder's game-like guidance**: line up spheres with cubes, the shapes turn green, then AI captures the image [15]. A pattern for "guided self-measurement" of any reading, e.g. camera framing or cuff placement.
2. **BP Reg's self-run provocation test** turns a measurement into a risk flag with a list of actions [8]. A model for a "test, then interpret, then recommend" flow.
3. **EveryWear's barcode nutrition log with a personal goal**, plus a private channel to the flight surgeon [12]. Crews used it far more than asked (1,200+ items) [13], which suggests low-friction logging gets used.
4. **Several short exercise bouts a day beat one long session** (Vascular result) [6]. A ready-made nudge for a gamified exercise feature.
5. **JAXA's skin self-monitoring call**: use camera images of the skin to estimate fatigue and sleep debt [55]. This fits the brief's "camera images" input. It is an open problem, so present it as exploratory.
6. **Offline-first, like SpacePatch** [24], and **don't depend on the cloud like CIMON** [22]. Show behaviour during a simulated communication delay; HERA used delays of up to 5 min [60].
7. **Return-to-gravity countdown**: JAXA's "2 days before return" fluid/salt and interview protocol and the 45-day 3-phase rehab [28]. These map onto a mission-phase timeline view.
8. **Circadian guardrails from Mars-500**: track light exposure, activity and sleep timing, and prompt corrections [34].
9. **Standard cognitive tests**, such as PVT and WinSCAT-like tasks from the PRET dataset [9], give an objective "readiness" score next to self-reported mood.

---

## Sources

1. CSA – Bio-Monitor: https://www.asc-csa.gc.ca/eng/sciences/astroskin.asp
2. CSA – CARDIOBREATH, Space Health, Vascular Aging sessions (2025-03-28): https://www.asc-csa.gc.ca/eng/news/articles/2025/2025-03-28-canadian-science-experiments-iss.asp
3. CSA – Future beyond the ISS (target capabilities): https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/the-future-of-space-exploration-beyond-the-international-space-station.asp
4. CSA – About Health Beyond: https://www.asc-csa.gc.ca/eng/health/health-beyond-initiative/about.asp ; Deep Space Healthcare Challenge: https://www.asc-csa.gc.ca/eng/health/deep-space-healthcare-challenge.asp
5. CSA – C2M2: https://www.asc-csa.gc.ca/eng/health/health-beyond-initiative/health-beyond-canadian-flagship-c2m2.asp
6. CSA – Vascular series: https://www.asc-csa.gc.ca/eng/sciences/vascular.asp
7. CSA – Bio-Analyzer: https://www.asc-csa.gc.ca/eng/iss/bio-analyzer.asp
8. CSA – BP Reg: https://www.asc-csa.gc.ca/eng/sciences/bpreg.asp
9. CSA Open Data – PRET: https://data.asc-csa.gc.ca/dataset/c22fa749-b005-4956-bf68-2ac2b9e68d31 ; files: https://donnees-data.asc-csa.gc.ca/users/OpenData_DonneesOuvertes/pub/PRET/
10. Space Apps 2018 – Team Jaime, Winnipeg, self-posed "Be a bio-spy" (CSA Bio-Monitor data): https://2018.spaceappschallenge.org/challenges/can-you-build/bring-your-own-solution/teams/team-jaime
11. Space Apps 2026 – Space Agency Partners: https://www.spaceappschallenge.org/2026/space-agency-partners/
12. CNES – EveryWear: https://cnes.fr/projets/cadmos/everywear
13. ESA – Diet tracker in space: https://esa.int/Newsroom/Diet_tracker_in_space
14. CNES – Artemis II (EveryWear on board, 2026-04-02): https://cnes.fr/actualites/artemis-ii-un-nouveau-depart-vers-lune
15. ESA – Finding the echo (EchoFinder-2, 2026-01-08): https://www.esa.int/ESA_Multimedia/Images/2026/01/Finding_the_echo ; EchoFinder video: https://www.esa.int/ESA_Multimedia/Videos/2026/04/EchoFinder_setup_and_wrap-up
16. CNES – Press release CP034-2025, Adenot experiments: https://cnes.fr/sites/default/files/2025-07/CP034-2025_-_Experiences_scientifiques_Sophie_Adenot.pdf ; https://cnes.fr/en/news/sophie-adenot-set-french-space-physiology-experiments ; ECHO: https://cnes.fr/projets/cadmos/echographie
17. ESA – EAC Space Medicine: https://www.esa.int/About_Us/EAC/Space_Medicine
18. ESA – Around the bed in 60 days (2023): https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Around_the_bed_in_60_days
19. ESA – Isolation studies in Antarctica (2018): https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/Isolation_studies_in_Antarctica
20. DLR – :envihab: https://www.dlr.de/envihab/en/ ; short-arm centrifuge: https://www.dlr.de/content/en/research-facilities/dlr-short-arm-centrifuge.html
21. DLR – Institute of Aerospace Medicine: https://www.dlr.de/en/me
22. DLR – CIMON (German): https://www.dlr.de/de/ar/themen-missionen/weltraumforschung/internationale-raumstion/cimon
23. Airbus – CIMON first tasks (2018): https://airbus.com/en/newsroom/press-releases/2018-11-crew-assistant-cimon-successfully-completes-first-tasks-in-space
24. DLR – SpacePatch (ILA 2026): https://event.dlr.de/en/?p=24217
25. DLR – LUNA analog facility: https://www.dlr.de/en/rb/research-operation/infrastructure/luna-analog-facility
26. CSA – Health in space hub: https://www.asc-csa.gc.ca/eng/health/
27. ASI – Wearable Monitoring: https://www.asi.it/en/?p=16857 ; NASA ISS report 2015-02-12: https://www.nasa.gov/blogs/stationreport/2015/02/12/iss-daily-summary-report-02-12-15/
28. JAXA – Medical Operations Team Activities: https://humans-in-space.jaxa.jp/en/biz-lab/med-in-space/healthcare/medops/system
29. CSA – Medical support (MMOP, flight surgeons): https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/medical-support.asp
30. JAXA – Biological Rhythms 48: https://humans-in-space.jaxa.jp/en/biz-lab/experiment/theme/detail/000917.html ; IBMP Sonocard (Cardiometry 2014): https://cardiometry.net/issues/no5-november-2014/night-sleep-in-microgravity ; Pneumocard/Sonocard IAC-11: https://iafastro.directory/iac/archive/browse/IAC-11/A1/2/10491/ ; Cosmocard: https://iafastro.directory/iac/archive/browse/IAC-14/A1/2/21716/
31. Otsuka et al., Sci Rep 2021, "Astronauts well-being…" (PMC8295322): https://pmc.ncbi.nlm.nih.gov/articles/PMC8295322/
32. JAXA – ODK2: https://humans-in-space.jaxa.jp/en/biz-lab/experiment/theme/detail/000926.html ; Holter ECG: https://humans-in-space.jaxa.jp/en/biz-lab/experiment/theme/detail/000925.html
33. Goldwin – Hybrid Training System (secondary): https://about.goldwin.co.jp/eng/news/page-8639 ; IEICE 2014: https://ken.ieice.org/ken/paper/20141019IBSF/eng/
34. Basner et al., PNAS 2013, Mars-500 (PMC3574912): https://pmc.ncbi.nlm.nih.gov/articles/PMC3574912/
35. AGBRESA protocol (PMC9492851): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9492851/ ; resting HR (PMC7518067): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7518067/
36. ESA – European research for interplanetary isolation (SIRIUS): https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/European_research_for_interplanetary_isolation ; Tsukuba (EurekAlert): https://www.eurekalert.org/news-releases/1089670
37. China Daily Asia/Xinhua – Shenzhou-21 medical work (2026-03-09): https://www.chinadailyasia.com/article/630090
38. NASA ISS On-Orbit Status via SpaceRef (Russian MO tests; 2002–2012): https://spaceref.com/status-report/nasa-iss-on-orbit-status-18-april-2012/ ; https://spaceref.com/status-report/nasa-iss-on-orbit-status-08-june-2012/
39. ISRO HSFC – EOI Wearable Health Monitoring (2023): https://www.isro.gov.in/media_isro/pdf/Tenders/2023/EOI_Wearable_Health_Monitoring_System.pdf ; EOI 2024: https://new1.isro.gov.in/media_isro/pdf/Tenders/2024/EOI_hsfc300724.pdf
40. DRDO News, 5 Mar 2020 (IAM nodal agency): https://drdo.gov.in/drdo/sites/default/files/drdo-news-documents/DRDO%20News%2005%20March%202020.pdf ; DEBEL Bio-Vest (secondary): https://www.indiandefensenews.in/2020/01/defence-lab-debel-developing-bio-vests.html ; SAKHI (secondary): https://www.civilsdaily.com/news/multi-purpose-app-sakhi-to-assist-gaganyaan-crew
41. ISRO – Axiom-4 mission concluded: https://www.isro.gov.in/Axiom04_mission_successfully_concluded_return_ISRO_Gaganyatri_ShubhanshuShukla.html
42. CSA Open Data – Canadian Healthcare in Deep Space: https://data.asc-csa.gc.ca/dataset/a6f8cbbc-0f49-42da-9185-64bac61030b1 ; Topical Teams 2023 report (PDF): https://open.canada.ca/data/dataset/520fe919-0868-4086-ba3f-1964b80ec26c/resource/4d0a0fe4-92b3-4e94-abf3-362169cd7877/download/science-community-topical-teams-2023-report-on-space-astronomy-planetary-science-and-astronaut-h.pdf
43. Axiom Space – HUNOR research on Ax-4: https://axiomspace.com/mission-blog/ax4-hunor-research
44. ESA – Ignis science: https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Ignis_science
45. TVN24 – 13 Polish experiments (secondary, Polish): https://tvn24.pl/technologia/lot-polaka-w-kosmos-co-slawosz-uznanski-wisniewski-bedzie-tam-robil-lista-eksperymentow-st8529302
46. Canada.ca – DSHC winner (2024-02): https://www.canada.ca/en/space-agency/news/2024/02/deep-space-healthcare-challenge-winner-addressing-medical-emergencies-in-space-and-on-earth.html
47. Open Canada grant record (Bio-Monitor data, 9 astronauts): https://search.open.canada.ca/grants/record/csa-asc,003-2025-2026-Q2-00080,current
48. Hexoskin blog – space-grade garments (secondary): https://hexoskin.com/blogs/news/tagged/space-grade-smart-garments
49. Core body temperature IAC-24 abstract: https://iafastro.directory/iac/paper/id/89578/abstract-pdf/IAC-24,A1,4,3,x89578.brief.pdf ; physoc abstract: https://www.physoc.org/abstracts/core-body-temperature-changes-under-different-physical-and-environmental-conditions-on-earth-and-in-space/
50. ASI ISS experiments (Drain Brain 2.0, NutrISS, Acoustic Diagnostics): https://www.asi.it/en/?p=16480 ; IAC-24 abstract: https://iafastro.directory/iac/paper/id/87224/abstract-pdf/IAC-24,A1,3,15,x87224.brief.pdf
51. GOV.UK – Research to boost astronaut health (2021): https://www.gov.uk/government/news/research-to-boost-astronaut-health-for-future-space-missions ; Principia brochure: https://assets.publishing.service.gov.uk/media/5a80c3d7ed915d74e33fc482/SUK_Tim_Peake_issue.pdf
52. UKSA into DSIT (secondary): https://www.imeche.org/news/news-article/uk-space-agency-merges-with-department-for-science-innovation-and-technology
53. La Moncloa – Spanish astronauts (2022): https://lamoncloa.gob.es/lang/en/gobierno/news/Paginas/2022/20221123_spanish-astronauts.aspx
54. JAXA Cell-Free Epigenome, Nat Commun 2024 (PMC11166646): https://pmc.ncbi.nlm.nih.gov/articles/PMC11166646
55. JAXA – Space Medicine R&D for exploration (RFP list): https://humans-in-space.jaxa.jp/en/biz-lab/med-in-space/med/planetary-exploration
56. Space Devices Ensure Health of Taikonauts (SPX, 2024-04-10, secondary): https://space-travel.com/space-devices-ensure-health-of-taikonauts-aboard-tiangong-space-station-999/
57. CAS – EMG monitor tested on Qingzhou (2026-07-01): https://english.cas.cn/newsroom/cas-in-media/202607/t20260701_1175167.shtml
58. WAM – AlNeyadi 200+ experiments: https://www.wam.ae/en/article/hszrhtf9-sultan-alneyadi-conducts-over-200-advanced
59. The National – AlNeyadi heart tissue experiment: https://www.thenationalnews.com/uae/2023/03/14/sultan-al-neyadi-gets-to-the-heart-of-the-matter-in-space-experiment
60. MBRSC – Analog Study 2 completion: https://www.mbrsc.ae/analog-study-2-completion/
61. Anadolu – Oxygen Saturation experiment: https://aa.com.tr/en/turkiye/turkish-astronaut-conducts-oxygen-saturation-experiment-at-international-space-station/3119398 ; Ax-3 summary: https://aa.com.tr/en/science-technology/astronaut-gezeravci-achieves-historic-milestone-with-turkiyes-first-manned-space-adventure/3133837 ; Daily Sabah (secondary): https://www.dailysabah.com/turkiye/turkiyes-1st-astronaut-set-to-conduct-13-space-experiments/news
62. Asiae – Hwasun hospital space medicine platform (2026, secondary): https://www.asiae.co.kr/en/article/2026030410485619003 ; NGMSAT-3: https://www.asiae.co.kr/en/article/2025112509225016365
