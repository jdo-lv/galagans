# Health indicators for astronaut self-monitoring: evidence catalog

Research for the Space Apps 2026 challenge "Create Health Monitoring Software for Astronauts on Space Missions" (prepared 2026-11-06). Source tags like [S1] point to the Sources list at the end; all NASA technical briefs are indexed at [S3]. "Unverified" marks claims I could not check against a primary source. Thresholds are reference values for a prototype, not medical guidance.

## Key takeaways for the team

- **NASA already requires most of what the challenge asks for.** NASA-STD-3001 Vol 1 Rev C [V1 3003] makes in-mission monitoring mandatory for general health, nutrition, fitness, sleep/circadian, environment, hearing, psychosocial state, orthostatic/vestibular readiness, SANS, neck and leg vein patency, and immune function [S1]. The behavioral health brief adds that missions longer than 6 months or beyond LEO "should" provide "additional minimally obtrusive measures" of psychological state [S8]. A tool that maps each screen to a [V1 3003] item is directly defensible to judges.
- **Earth thresholds misfire in flight. Use personal in-flight baselines.** On the ISS, 24-h blood pressure drops about 8–10 mmHg while heart rate stays flat (63→64 bpm) [S26]. Resting core temperature rises about 1 °C over about 2.5 months [S25]. Plasma volume drops about 15% within 2 days [S11]. Fixed Earth cut-offs (AHA BP bands, fever ≥38 °C) will flag healthy adapted crew. Trends against each crew member's own preflight and early-flight values are what flight surgeons actually compare.
- **Blood sugar is named in the challenge but is not monitored routinely in flight.** The ISS has point-of-care blood chemistry: an i-STAT-type analyzer whose cartridges include glucose, used by the Crew Medical Officer as needed [S18]. Insulin resistance does rise in flight [S31], and continuous glucose monitors were first validated on the station in 2025 (Ax-4, press release) [S32]. Glucose works as a simulated "future capability", not as a core indicator.
- **The best-evidenced, demo-friendly indicators are sleep and fatigue.** Crews sleep about 6–6.5 h against 8.5 h scheduled [S27][S28], and about 75% of ISS crew used sleep medication [S27]. The ISS "Reaction Self Test" (3-min PVT-B plus short ratings, every 4th day) showed that nights of 6 h or less slow responses and raise stress [S28]. A 3-min PVT runs in any browser.
- **SANS is common, and the cheap self-checks are weak.** 70% of long-duration crew show at least one sign of SANS and 18% are clinically concerning [S10]. The tests crew can run themselves are acuity and the Amsler grid. Early disc edema is detected by OCT (ΔTRT >19.4 µm), which a camera or chart cannot replace [S10]. A tool can schedule and log these checks but cannot diagnose SANS.
- **Environmental exposure is the easiest "real sensor" story.** The limits are crisp: CO2 ≤3 mmHg as a 1-h average, with headache risk below 1% if the 7-day average stays under 2.5 mmHg [S2][S5]. Sleep areas must meet the NC-40 noise curve, and the hazardous-noise limit is 85 dBA [S6]. Health limits for temperature and humidity are 18–27 °C and 25–75% RH [S2]. Circadian light targets are melanopic EDI ≥250 lux by day and 8±2 lux before sleep [S2]. Consumer CO2, sound, light and temperature sensors can measure all of these. Caveat: CO2 limits are partial pressures, so a ppm reading must be converted using cabin pressure.
- **Radiation is the top deep-space hazard, but no consumer device can measure it.** The limits are clear: 600 mSv career effective dose, plus 30-day and 1-year organ limits [S1]. Every Artemis II astronaut carried a Crew Active Dosimeter with time-resolved data [S23]. A prototype can trend a simulated or replayed dosimeter feed against the limits.
- **Artemis-class vehicles have far less medical equipment than the ISS.** Orion's medical system has about 30 lb of mass allocation. Its kit holds an ECG, BP cuff, pulse oximeter, augmented stethoscope, otoscope, point-of-care urinalysis and "lighted imaging". Ultrasound and co-oximetry are planned for Gateway. Manual data entry is explicitly acceptable for the BP cuff and pulse oximeter [S20]. A keyboard-entry design is therefore realistic, not a shortcut.
- **Consumer and non-contact methods are fine as trend proxies but not as diagnostics.** Camera-based heart rate (rPPG) error grows with motion, dim light and darker skin, roughly 5 bpm to 14 bpm in one benchmark [S48]. Phone and watch SpO2 sits outside FDA medical-device accuracy rules [S49]. Reading emotion from facial expressions is scientifically weak [S50] and banned in EU workplaces [S51]. Facial puffiness from the fluid shift would also confound it in flight [S15].

## How crew health is monitored today (context for every row below)

- **ISS on-orbit cadence (USOS).** Per the ISS MORD as quoted in [S15] (evaluation types also listed in [S14]):
  - Private Medical Conferences (PMC): daily for the first 5 days after docking (15 min), then weekly, plus within 24 h before and after each EVA, daily for the 5 days before entry, and on crew request.
  - Periodic Fitness Evaluation on the CEVIS cycle: first at about FD14, then monthly [S54].
  - "Eye Weeks" at FD30, FD90 and R-30 [S10].
  - WinSCAT cognitive test monthly [S8].
- **What fills a 6-month increment.** A 2023 analysis of Increment 69/70 requirements [S19] lists:
  - Medical tests: Periodic Health Status exam, urinalysis (MO-9), hematocrit (MO-10), body mass measurement, venous ultrasound, ocular ultrasound, OCT2, tonometry, vision testing (near/far acuity, Amsler, contrast).
  - Fitness and nutrition: PFE on the cycle and treadmill, food-intake reporting via the EveryWear app.
  - Exposure and cognition: crew-worn acoustic monitor, individual CO2 monitoring, on-orbit hearing assessment, Pille radiation dosimeter reads, WinSCAT.
  - Conferences: Private Psychological Conference (PPC) 195 min (about 13 × 15 min, i.e. roughly every 2 weeks, derived), PMC 390 min (about weekly), exercise 27,300 min (about 150 min/day, derived).
- **Crew Medical Officers.** At least two crew per vehicle are trained as CMOs [V1 3006] [S1]. The 2011 CHeCS catalog lists what CMOs use [S18]:
  - Ambulatory Medical Pack: automatic BP cuff, pulse oximeter, oral disposable thermometers, urine Chemstrips with color chart, the point-of-care blood analyzer.
  - Eye and ENT: Tono-Pen tonometer, ophthalmoscope, otoscope.
  - Other: an AED, and a BP/ECG unit used during fitness evaluations.
- **Wearable research hardware.** CSA's Bio-Monitor/Astroskin shirt has been on the ISS since CRS-16 (Dec 2018) [S24]. It records 3-lead ECG, respiration rate and volume (inductance plethysmography), SpO2 via a headband, skin temperature, and a 3-axis accelerometer. Its systolic BP is a calculated value. NASA found the SpO2 headband uncomfortable over 24-h wear [S24].
- **Research baselines.** "Spaceflight Standard Measures" collects a minimum common dataset [S21]:
  - Actigraphy (activity and light).
  - Blood/urine biochemistry and blood/saliva cellular profile (stress hormones, viral reactivation).
  - Carotid ultrasound, Cognition (10 tests) and microbiome.
  - Pre-flight personality; daily sleep-quality and pre-sleep mood/team/workload questionnaires.
  - Pre/post sensorimotor, heart rate and BP.
- **Artemis II (splashdown 10 Apr 2026).** Studies flown [S22]:
  - ARCHeR: wrist-worn device in flight plus postflight cognition and docking-simulation tests.
  - Immune Biomarkers: saliva and blood.
  - AVATAR organ chips.
  - Standard Measures within a day of splashdown: BP, heart rate, eye health, motor control and an obstacle course.
  - Results not yet published (data collection ended at R+45).
- **Requirements a tool can cite.**
  - [V1 7001]: health monitoring results kept in a permanent retrievable format [S1].
  - [V2 6001]: environmental data in formats compatible with trend analysis. Example sampling rates: O2/CO2 every 5 s, temperature and humidity every 1 min [S2].
  - [V2 10001]: crew interfaces must score ≥85 on the NASA-modified System Usability Scale [S13].
  - [V2 5007]: Bedford workload ≤3 for nominal tasks, ≤6 for off-nominal tasks [S13].

## Indicator catalog

Format per indicator: **Risk** (hazard), **Today** (ISS), **Next** (Artemis/Gateway/Mars), **Freq**, **Earth normal**, **In flight**, **Attention**, **Who / consumer hardware** (yes / partly / no).

### 1. Heart rate (HR) and heart rate variability (HRV)
- **Risk:** cardiovascular deconditioning (altered gravity), stress (isolation), fatigue.
- **Today:** HR is recorded: by the BP/ECG monitor during the monthly PFE [S18]; by Holter recordings in research (48-h Holters in Khine 2018 [S36]); by Bio-Monitor [S24].
  HRV is research-only, with mixed results: some studies show reduced vagal indices, others preserved circadian HRV structure (e.g. https://www.nature.com/articles/s41598-023-36389-6; details unverified).
- **Next:** Orion ECG [S20]. Artemis II crew wore a wrist device (ARCHeR) [S22]. One secondary report says it logged HRV and stress indicators (unverified).
- **Freq:** monthly in PFE; continuous only in research.
- **Earth normal:** resting HR 60–100 bpm (fit adults often 50s). Short-term RMSSD about 42±15 ms and SDNN about 50±16 ms (Nunan 2010 pooled norms, via secondary table) [S46]. HRV is highly individual, so trend it against the person's own baseline.
- **In flight:** 24-h HR essentially unchanged (63→64 bpm, n=8, FD85–192) while stroke volume rises 35% and cardiac output 41% [S26]. HR rises only minorly postflight with regular exercise (CCISS abstract, secondary).
- **Attention:** clinical resting tachycardia >100 or bradycardia <40–50 with symptoms (general clinical convention). A sustained deviation from personal baseline (e.g. resting HR +10 bpm for several days) is a reasonable app heuristic (unverified, not a NASA rule).
- **Who / consumer hardware:** self / yes. Chest strap > watch > camera rPPG for accuracy.

### 2. ECG rhythm
- **Risk:** arrhythmia (atrial remodeling, electrolyte shifts, radiation-linked cardiovascular disease).
- **Today:** The BP/ECG unit (5-lead) is used during exercise tests [S18]; Holter recordings are research-only; the AED and anti-arrhythmics are in the medical kit [S18][S20].
- **Next:** Orion carries an ECG with "no requirement" for standalone display or data storage [S20]. Real-time heart rhythm is "desired" in EVA suits for microgravity operations [V2 11023] [S2].
- **Freq:** monthly in PFE; as clinically indicated.
- **Earth normal:** sinus rhythm; PR 120–200 ms; QRS <120 ms; QTc <450 ms in men, <460 ms in women (clinical convention).
- **In flight:**
  - Left atrial volume increases after 6 months, but no atrial fibrillation was seen in 13 astronauts on 48-h Holters [S36].
  - Atrial fibrillation prevalence of about 5% in active astronauts was cited in a review (secondary).
- **Attention:** any new irregular rhythm, palpitations with dizziness, or syncope means immediate CMO/flight surgeon (FS) contact.
- **Who / consumer hardware:** self (single-lead) or CMO (multi-lead); interpretation on the ground / partly. Single-lead watch ECG for atrial fibrillation screening.

### 3. Blood pressure (BP) and orthostatic tolerance
- **Risk:** fluid shift and cardiovascular deconditioning. The main operational risk is fainting at landing or egress (gravity transition).
- **Today:** Automatic BP cuff in the Ambulatory Medical Pack [S18]; the BP/ECG unit's Tango BP device (±3 mmHg) during the PFE [S18]; ESA's 24-h oscillometric ambulatory monitor in research [S26]; Bio-Monitor's calculated systolic BP [S24].
- **Next:** Orion BP cuff (standalone, manual entry OK) [S20]. Standard Measures takes BP within a day of landing [S22].
- **Freq:** monthly PFE, PHS, as indicated; pre-landing evaluations daily for 5 days before entry [S15].
- **Earth normal (2017 AHA categories, kept by the 2025 ACC/AHA guideline [S44]):** normal <120/<80; elevated 120–129/<80; stage 1 130–139 or 80–89; stage 2 ≥140 or ≥90; ≥180 and/or ≥120 is severe (2017 "crisis" definition; 2025 wording not verified).
- **In flight:**
  - 24-h systolic −8, diastolic −9, MAP −10 mmHg, with the night-time dip preserved and systemic vascular resistance −39% [S26].
  - Intravascular volume about −15% within 2 days [S11].
- **Postflight:**
  - >60% of US Mir/early-ISS astronauts (>5 months) could not finish a 10-min 80° tilt test on landing day (as reported in [S38]).
  - Lee 2015: 2 of 6 ISS astronauts completed it on R+0 versus 52 of 65 Shuttle astronauts; 13 of 15 completed by R+3 [S38].
- **Countermeasures:** fluid loading with 24–48 oz of NaCl-water before deorbit [S11], with 1.5 L of water per crew member reserved for it [S2]. Also compression garments (about 55→30→20 mmHg gradient), cooling garments and exercise [S11].
- **Attention:** Earth bands apply poorly in flight. Flag deviation from the person's own in-flight baseline. Before landing, track fluid-loading compliance and symptoms such as lightheadedness on standing in a gravity analog (not testable in microgravity).
- **Who / consumer hardware:** self with a cuff / yes with a validated upper-arm cuff. Cuffless watch BP is not validated (Bio-Monitor's BP is also "calculated").

### 4. SpO2 (oxygen saturation)
- **Risk:** hypoxia from cabin atmosphere faults, fire or smoke, decompression, or EVA prebreathe in exploration atmospheres.
- **Today:** fingertip pulse oximeter in the medical pack [S18]; Bio-Monitor headband [S24].
- **Next:** Orion pulse oximeter (standalone, manual entry OK); Gateway adds co-oximetry, which measures carboxyhemoglobin and is relevant after fire [S20].
- **Exploration atmospheres:** NASA notes that living at a chronic inspired O2 pressure (PIO2) of about 127 mmHg, the mildly hypoxic exploration-atmosphere level, requires "a health monitoring and mitigation plan" [S2]. This makes SpO2 more relevant for landers and habitats than for the ISS (normoxic, 14.7 psia).
- **Freq:** as indicated.
- **Earth normal:** 95–100% at sea level (clinical convention).
- **In flight:** no systematic change reported in normoxic cabins (no source found).
- **Attention:** <94% investigate; <90% hypoxemia, urgent (clinical convention).
- **Who / consumer hardware:** self / partly. Fingertip oximeters are OK-ish. Watch and phone SpO2 is not medical-grade [S49].

### 5. Respiratory rate
- **Risk:** respiratory illness, hypercapnia (CO2), anxiety, and a workload signal during EVA.
- **Today:** Bio-Monitor only (inductance plethysmography) [S24]; otherwise counted manually by the CMO.
- **Next:** the suit may estimate metabolic rate [V2 11023] [S2].
- **Freq:** research/as needed.
- **Earth normal:** 12–20 breaths/min at rest (clinical convention).
- **In flight:** no robust in-flight change reported (not found).
- **Attention:** >24/min at rest, or rising with headache or dyspnea. Check CO2 first (§22).
- **Who / consumer hardware:** self (count over 60 s) / partly. Chest-strap or watch estimates during sleep; camera-based breathing is research-grade.

### 6. Body temperature (incl. ISS "Circadian Rhythms" findings)
- **Risk:** infection/fever, heat stress during exercise (no convective cooling in microgravity), circadian misalignment.
- **Today:**
  - Oral disposable thermometers in the medical pack [S18].
  - Bio-Monitor skin temperature [S24].
  - ESA/DLR "Circadian Rhythms" used a forehead "Double Sensor" (skin temperature plus heat flux) at FD15, 45, 75, 105, 135 and 165 in 11 astronauts [S25].
- **Next:** Orion lists "vitals measurement" [S20]. Derived core temperature is "desired" in lunar and microgravity EVA suits [S2].
- **Freq:** as indicated (illness).
- **Earth normal:** oral about 36.1–37.2 °C; fever ≥38.0 °C (clinical convention).
- **In flight:**
  - Resting core temperature rose about 1.0 °C, built up over about 2.5 months, and plateaued after about FD75, linked to higher IL-1ra.
  - Exercise peak core temperature was about 1.4 °C higher than on Earth (>40 °C in some), rising 0.15 versus 0.10 °C/min [S25].
  - Press coverage reported "about 38 °C"; the paper itself reports deltas, not that value [S25].
- **Attention:** an Earth fever cut-off may false-alarm on adapted crew. Use the personal in-flight baseline plus symptoms. Flag exercise heat strain if core temperature approaches 39–40 °C (unverified operational value).
- **Who / consumer hardware:** self / yes (thermometer); a wrist skin-temperature trend is partly useful.

### 7. Blood glucose / insulin resistance
- **Risk:** metabolic change from inactivity and altered gravity, inflammation, diet. Relevant to future crew with diabetes.
- **Today:**
  - No routine monitoring. The point-of-care blood analyzer (i-STAT-type PCBA, EC8+ cartridge) measures glucose 20–450 mg/dL from 65 µL in 120 s, as needed by the CMO [S18].
  - Its cartridges lose reliability after about 2 weeks unrefrigerated and were resupplied about every 3 months [S18].
  - The Ax-4 private mission (2025) flew the first continuous glucose monitors on the ISS and compared them with fingerstick and lab results (sponsor press release, not peer-reviewed) [S32].
- **Next:** not in the Orion kit list [S20].
- **Freq:** pre/post-flight blood draws and research.
- **Earth normal:** fasting 70–99 mg/dL; prediabetes 100–125 [S45]; diabetes ≥126 (ADA; diabetes cut-off not re-verified here).
- **In flight:** insulin resistance index and HOMA-IR rose in flight in all astronauts, and fasting glucose rose in men (Hughson 2016, about 6-month missions) [S31].
- **Attention:** hypoglycemia level 1 is <70 mg/dL and level 2 is <54 [S45].
- **Who / consumer hardware:** self (fingerstick or CGM) or CMO (analyzer) / yes (glucometer/CGM), but low operational priority for non-diabetic crew.

### 8. Blood and urine chemistry (bone resorption, kidney-stone risk, hydration)
- **Risk:** bone loss raises urinary calcium, which raises stone risk [S4]. Dehydration also contributes (closed environment).
- **Today:**
  - In-flight urinalysis (MO-9) and hematocrit (MO-10) [S19].
  - Urine Chemstrips with color chart; the point-of-care analyzer for electrolytes, BUN, creatinine, hemoglobin and hematocrit [S18].
  - Research and Standard Measures blood/urine are frozen for ground analysis [S21].
  - Calcium, vitamin D, PTH and bone markers are tracked across the career [S4].
- **Next:** point-of-care urinalysis on Orion [S20].
- **Freq:** per increment schedule (urinalysis and hematocrit listed once or a few times per 6 months) [S19].
- **Earth normal:** urine specific gravity 1.005–1.030 (lab convention); 25-OH vitamin D target 35–90 ng/mL [S4].
- **In flight:**
  - Low urine volume is common.
  - Short-flight crews producing <2 L/day of urine had higher stone risk, and supersaturation >2.0 indicates increased risk [S40].
  - Potassium citrate (20 mEq/day) kept calcium-oxalate supersaturation at preflight levels in 30 crew [S40].
- **Attention:**
  - Vitamin D 20–34 ng/mL is repleted; <20 is treated and rechecked in 3 months [S4].
  - Flank pain or hematuria means immediate FS contact (stone).
  - Urine SG persistently >1.025 or urine output <2 L/day are hydration flags (derived from [S40], unverified as a NASA rule).
- **Who / consumer hardware:** CMO collects samples; self can read strips; labs are on the ground / partly. Urine color chart and dipsticks.

### 9. Body mass and composition
- **Risk:** energy deficit leading to loss of muscle and bone, and deconditioning (inadequate nutrition).
- **Today:**
  - "Body Mass Measurement" is a scheduled ISS activity [S19]. The device is SLAMMD, which uses known force and measured acceleration (device detail unverified here).
  - Composition (DXA) is measured pre/post only [S4].
- **Next:** not listed for Orion; a mass-measurement method for Gateway and Mars is unknown.
- **Freq:** periodic (about monthly is typical; unverified).
- **Earth normal:** individual baseline.
- **In flight:** ISS energy intake is about 79–84% of WHO-predicted requirement (food-frequency data, Expeditions 1–34) [S12]. Weight loss has occurred on all program types [S12].
- **Attention:** [V1 4020] requires providing 100% of calculated energy needs [S1]. A loss of ≥5% of body mass is a common clinical malnutrition flag (GLIM-type criterion; unverified here).
- **Who / consumer hardware:** self (device) or CMO / no. Scales do not work in microgravity; a demo can use manual entry.

### 10. Sleep (duration, quality, actigraphy, medication)
- **Risk:** fatigue and errors (isolation, schedule, noise, CO2, light).
- **Today:** Actigraphy (wrist, activity plus light) in Standard Measures [S21]; daily sleep-quality questionnaire [S21]; RST sleep log [S28]; hypnotics in the medical kit; sleep medication is also in the Orion list [S20].
- **Next:** ARCHeR wrist device on Artemis II [S22].
- **Freq:** daily (logs), continuous (actigraphy in research).
- **Earth normal:** 7–9 h for adults [S9].
- **In flight:**
  - ISS crews average 6.09 h by actigraphy (Shuttle 5.96 h) against 8.5 h scheduled.
  - About 75% of ISS crew and 78% of Shuttle crew used sleep medication; hypnotics did not lengthen sleep [S27].
  - Self-reported ISS sleep was 6.5±1.4 h. Nights ≤6 h made up 34.9% of nights (40% on weekdays), and the full 8.5 h opportunity was used on only 5.9% [S28].
  - The average deficit is about 0.3 h/day versus preflight, and sleep is about 7 h at R+7, indicating sleep debt [S9].
- **Attention:**
  - ≤6 h is linked to slower PVT, more stress and more workload [S28].
  - Repeated short nights call for fatigue countermeasures ([V1 6001] fatigue management) [S1].
  - Hypnotic use within the wake-up window before an emergency is a safety concern [S27].
- **Who / consumer hardware:** self / yes (watch or ring sleep duration). Sleep staging is unreliable.

### 11. Circadian rhythm and light exposure
- **Risk:** circadian misalignment (16 sunrises/day in LEO, shift work, Mars sol of 24 h 39–40 min).
- **Today:**
  - The ISS LED lighting has general, pre-sleep and alertness settings (design guidance [S9]).
  - Wrist actigraphs log light [S21].
  - The fatigue management service uses Epworth-type sleepiness, morningness/eveningness and insomnia screens, plus a jet-lag scale for shifts [S17].
- **Next:** [V2 8055] lighting table applies to all new vehicles [S2].
- **Freq:** continuous (light), daily (schedule).
- **Earth normal:** consistent 24-h light/dark cycle.
- **In flight:** misalignment is common [S9]. Sleep shifts happened on 15.7% of nights in the RST cohort [S28].
- **Attention ([V2 8055] Table 8.7-2) [S2]:** wake-time melanopic EDI ≥250 lux (DER ≥0.7, blue-enriched); pre-sleep 8±2 lux (DER ≤0.3, ≥550 nm); windows must block to ≤2.0 lux at 0.5 m [S17]; caffeine 6–12 h before sleep is discouraged [S17].
- **Who / consumer hardware:** self / partly. Phone and watch lux sensors measure photopic lux, not melanopic EDI; a spectrometer is needed for EDI.

### 12. Mood and behavioral health
- **Risk:** depression, anxiety, interpersonal conflict (isolation and confinement, distance from Earth).
- **Today:**
  - Weekly PMC and routine PPC (about biweekly, derived [S19]).
  - Private Family Conferences, crew care packages, and repatriation briefings 6 weeks before landing [S8].
  - A pre-sleep questionnaire on mood, team cohesion and habitability in Standard Measures [S21].
  - Journals (Stuster 2010 journal study) [S8].
- **Next:** [V1 6004] and [V1 6010] require BHP support and routine PPCs [S1]. For missions longer than 6 months or beyond LEO, "minimally obtrusive" objective measures "should be provided" [S8].
- **Freq:** weekly to biweekly conferences; daily questionnaires in research.
- **Earth normal:** PHQ-9 <5, GAD-7 <5 [S47].
- **In flight:** 2 of 7 (29%) NASA Shuttle-Mir astronauts reported depressive symptoms; historical events include a mission shortened partly due to depression (Soyuz T-14) [S8]; RST stress ratings rose across mission quarters [S28].
- **Attention:**
  - PHQ-9 or GAD-7 ≥10 is the usual screening cut-off.
  - Any PHQ-9 item-9 (self-harm) answer above 0 means same-day private FS/psychologist contact. The app must route this privately ([V1 6003] private medical data) [S1][S47].
- **Who / consumer hardware:** self-report; assessment by ground BHP / yes (questionnaires). Facial and voice "emotion detection": see §Non-contact.

### 13. Cognition and fatigue
- **Risk:** performance errors (sleep loss, CO2, radiation (CNS), workload).
- **Today:**
  - WinSCAT monthly against a preflight baseline [S8].
  - NASA "Cognition", 10 tests, about 20 min, 15 parallel forms [S29]. The tests: Motor Praxis, Visual Object Learning, Fractal 2-Back, Abstract Matching, Line Orientation, Emotion Recognition, Matrix Reasoning, Digit Symbol Substitution, Balloon Analog Risk and 3-min PVT.
  - Reaction Self Test: 3-min PVT-B plus 11-point ratings of sleep quality, stress, mental fatigue, physical exhaustion, tiredness, sleepiness and workload. Morning and evening, every 4th day in flight, plus around sleep shifts and EVAs [S28].
- **Next:** ARCHeR postflight cognition and docking simulation [S22]. [V1 4011] behavioral and cognitive status must stay "within clinically accepted values" [S1].
- **Freq:** monthly (operational); every 4 days (research).
- **Earth normal:** a personal baseline from repeated preflight sessions; learning effects require parallel forms.
- **In flight:** ≤6 h of sleep means slower PVT response speed [S28].
- **Attention:** PVT-B lapses (RT ≥355 ms) and false starts (<130 ms) [S28][S30]. Thresholds are relative to the person's baseline; there is no NASA absolute cut-off.
- **Who / consumer hardware:** self / yes. Any laptop or tablet, but use the same device: input latency affects RT.

### 14. Vision and SANS
- **Risk:** optic disc edema, globe flattening, choroidal folds and hyperopic shift from the headward fluid shift (altered gravity; CO2 suspected as a contributor).
- **Today:**
  - Eye Weeks (2–3 days) at FD30, FD90 and R-30, with OCT run by a trained crew operator and remote ground guidance.
  - Fundoscopy, ocular ultrasound, and tonometry by a designated crew member.
  - Visual acuity and Amsler grid pre-, in- and post-flight; visual-field testing "will be deployed" [S10].
  - Routine in-flight tonometry and contrast testing were dropped from the medical requirement around Expedition 40 [S55].
- **Next:** Orion lists corneal evaluation and lighted imaging; ultrasound for Gateway [S20]. [V1 3003 m] requires SANS periodic monitoring [S1].
- **Freq:** FD30, FD90, R-30 plus as indicated [S10].
- **Earth normal:** acuity 20/20; Amsler grid with no distortion; Frisén grade 0.
- **In flight:**
  - 70% have at least one sign and 18% clinically concerning SANS [S10].
  - Choroidal folds about 25%; globe flattening about 25%.
  - Vision degradation reported by 29% of short-duration and 60% of long-duration crew; hyperopic shift +0.5 to +2.0 D [S10].
  - Edema can persist up to 6 months postflight [S43].
  - All crew so far correctable to 20/20 [S10].
- **Attention:**
  - OCT ΔTRT >19.4 µm marks the earliest disc edema.
  - Frisén grade ≥1 plus ≥55 µm TRT increase is the indication for a postflight lumbar puncture.
  - CSF pressure >18 cm is high-normal; >25 cm requires treatment [S10].
  - For an app: any new blur at near, Amsler distortion, or a drop in acuity of ≥1 line means CMO/FS contact (reasonable heuristic, unverified).
- **Countermeasures under study:** lower-body negative pressure, thigh cuffs, B-vitamins, CO2 control [S10].
- **Who / consumer hardware:** self (acuity, Amsler); CMO plus ground (OCT, fundus, ultrasound) / partly. Screen acuity and Amsler charts work; OCT-level detection is not possible.

### 15. Neck vein flow / venous thrombosis (often missed; [V1 3003 n])
- **Risk:** jugular vein stasis and clotting from the headward fluid shift.
- **Today:** in-flight ultrasound of the left internal jugular vein. If a clot is found, anticoagulation (apixaban) follows a NASA/ESA algorithm (Bostick 2025) [S16].
- **In flight:** 6 of 11 ISS crew had stagnant or retrograde jugular flow at about FD50, and 1 had an occlusive clot [S35].
- **Attention:** neck swelling, facial or eyelid edema beyond normal adaptation, headache, dilated pupil, or SANS symptoms feed the risk assessment [S16].
- **Who / consumer hardware:** ground-guided ultrasound / no. A symptom checklist only.

### 16. Bone density
- **Risk:** fracture and renal stones (altered gravity).
- **Today:** No in-flight densitometry. DXA pre/post; QCT supplementary; postflight DXA at 6 months, 1, 2 and 3 years [S4]; exercise (ARED, up to 600 lbf) and vitamin D are the countermeasures [S4].
- **Next:** Artemis II used a flywheel device (FWED) instead of ARED [S4].
- **Earth normal:** T-score ≥−1.0 (WHO); NASA bands: certification T ≥−1.0; in- and end-of-mission T ≥−2.0; FRAX >3% hip or >20% major fracture risk means specialist referral [S4].
- **In flight:** 1–1.5%/month hip and about 1%/month spine (Mir DXA) [S39]; ISS QCT: 0.9%/month spine and 1.4–1.5%/month hip [S39]; a meta-analysis gives a lower-limb loss of −0.8%/month (secondary).
- **Attention:** [V1 4027] requires hip and spine BMD ≥95% of preflight and femoral neck ≥90% [S1].
- **Who / consumer hardware:** ground / no. Proxies: exercise load logs, calcium and vitamin D intake, urine calcium.

### 17. Muscle strength and aerobic fitness
- **Risk:** inability to egress or perform EVA (altered gravity).
- **Today:**
  - PFE on the CEVIS cycle at about FD14 and then monthly [S54]; the "max protocol" variant is listed [S19].
  - ARED, CEVIS and T2 exercise logs; strength coaches (ASCRs) adjust prescriptions from machine data [S4].
- **Next:** flywheel device on Orion [S4]; [V1 4002] surface-EVA fitness standard [S1].
- **Freq:** monthly test; daily exercise (about 2 h per workday historically [S4]).
- **Earth normal:** VO2max is age- and sex-specific; the cohort preflight mean was 40.6±6.4 mL/kg/min [S37].
- **In flight:**
  - VO2peak −17% early in flight, −15% on R+1, and within 2% of preflight by R+30. Individual changes ranged from +5% to −30% [S37].
  - The standard cites strength decrements of up to 20% as tolerable [S1].
- **Attention ([V1 4001]–[V1 4003], [V1 4024]):** VO2max ≥32.9 mL/kg/min for microgravity EVA and ≥36.5 for surface EVA; aerobic capacity ≥80% of preflight; strength ≥80% of baseline [S1].
- **Who / consumer hardware:** self (logs), ground (analysis) / partly. Watch VO2max estimates and HR-based submaximal tests; manual exercise logs.

### 18. Sensorimotor / vestibular (space adaptation sickness, landing)
- **Risk:** nausea and disorientation in the first days of flight; falls and impaired egress after landing (gravity transitions).
- **Today:**
  - Daily PMCs on days 1–5 [S15].
  - SMS grading: 0 none; 1 mild, resolves in 36–48 h; 2 moderate, ≤2 vomits, resolves in 72 h; 3 severe, >2 vomits, >72 h [S15].
  - Promethazine is the most effective drug [S15].
  - Postflight Field Test (functional tasks within 24 h of landing) [S53].
- **Freq:** daily on FD1–5; postflight.
- **In flight:**
  - Space adaptation sickness in 70–90% of crew (up to 73% space motion sickness in the first 2–3 days) [S15]; 67% on a first Shuttle flight [S53].
  - Back pain in 52% (days 2–5); facial/periorbital edema in the first 3 days [S15].
- **Attention:** grade 3 or persistence beyond 72 h; dehydration from vomiting [S15]. [V1 4008] sensorimotor limits are "operationally defined" [S1].
- **Who / consumer hardware:** self / yes (symptom score). Phone IMU balance tests matter only after landing.

### 19. Radiation dose (personal and environmental)
- **Risk:** cancer, CNS, cardiovascular, cataract and acute effects (space radiation).
- **Today:** Pille dosimeter reads [S19]; area monitors and Crew Active Dosimeters (time-resolved, direct-ion-storage) [S23]; [V2 6100] alerting; [V2 6101] personal and area monitoring [S7].
- **Neutrons:** about 30% of total ISS radiation, "especially harmful" (CSA) [S59]. CSA's CANS will measure them continuously and autonomously; it is under development, not flying [S59].
- **Next:** every Artemis II astronaut carried a CAD [S23]. Orion has six radiation sensors and each crew member a pocket monitor (secondary, unverified).
- **Freq:** continuous; alerts during solar particle events.
- **Earth normal:** about 2 mSv/yr background [S42].
- **In flight:**
  - ISS about 80–160 mSv per 6 months (≈0.45–0.9 mSv/day, derived; secondary) [S42].
  - Mars cruise 1.84 mSv/day and Mars surface 0.64 mSv/day (Curiosity RAD) [S41].
  - Transit round trip about 0.66 Sv [S41].
  - Surface-mission environment about 0.5 mSv/day [S7].
  - Shielding cuts solar particle event dose about 50% but galactic cosmic ray dose only about 7% [S7].
- **Attention:**
  - Career effective dose <600 mSv [V1 4030].
  - 30-day/1-year limits: lens 1,000/2,000 mGy-Eq; skin 1,500/3,000; blood-forming organs 250/500; circulatory 250/500 (career 1,000); CNS 500/1,000 mGy (career 1,500) [S1].
  - Vehicle design: solar particle event <250 mSv [V1 4031]; galactic cosmic ray rate <1.3 mSv/day in free space and <0.9 mSv/day on surfaces for habitats >60 days [V1 4033].
  - Alarm means shelter.
- **Who / consumer hardware:** device plus ground (Space Radiation Analysis Group) / no. Simulate the feed.

### 20. Immune markers and latent virus reactivation
- **Risk:** infection, rash, allergy (radiation, stress, isolation, closed environment).
- **Today:** blood and saliva in Standard Measures (stress hormones, viral reactivation, cell profile) [S21]; Immune Biomarkers on Artemis II [S22]. [V1 4017] requires keeping immune and hematology values out of critical ranges [S1].
- **Freq:** research sessions; clinical as indicated.
- **In flight:**
  - 53% (47/89) of Shuttle and 61% (14/23) of ISS astronauts shed at least one herpesvirus. EBV about 90% (saliva); VZV up to 65%; CMV (urine) up to 61%.
  - Shedding lasts up to 30 days after ISS flights [S33].
  - Clinical incidence: 3.40 events per flight-year, mostly rashes at 1.12 per flight-year. 46% of crew had a "notable" event, 40% of those rash or hypersensitivity (46 US astronauts, 7,058 flight-days) [S34].
  - Reactivation is mostly asymptomatic [S33].
- **Attention:** new rash, cold sores, shingles-like pain, fever, or persistent upper-respiratory symptoms mean CMO/FS contact.
- **Who / consumer hardware:** self (symptoms, rash photos); ground lab (saliva PCR) / partly. A symptom diary plus phone photos of rashes.

### 21. Nutrition intake and hydration
- **Risk:** inadequate nutrition, which feeds bone, muscle, immune and mood problems (inadequate nutrition, distance from Earth).
- **Today:** "Food Intake Reporting (using EveryWear)" [S19]; a weekly food-frequency questionnaire historically. NASA's iPad "ISS FIT" app was used earlier (unverified here).
- **Next:** [V1 4020] provide 100% of energy and nutrients [S1]. [V2 7003] sets an average 3,035 kcal/day or an EER equation [S2].
- **Freq:** daily (logging).
- **Earth normal:** DRIs, with vitamin D and protein adjusted for spaceflight [S12].
- **In flight:** Energy 2,313–2,444 kcal/day, which is 79–84% of WHO-predicted [S12]; water 2.0–2.3 L/day [S12]; sodium is high (3.8–4.7 g/day) [S12]; taste changes and space adaptation sickness reduce intake [S12].
- **Attention:** intake persistently below about 90% of EER, or water below 2.5 L/day (the provision minimum [S2]).
- **Who / consumer hardware:** self / yes (logging, barcode or photo).

### 22. Environment: CO2, noise, temperature and humidity, O2
- **CO2 (risk: hostile closed environment):**
  - [V2 6004] ≤3 mmHg as a 1-h average (unchanged in Rev F, 2026) [S2].
  - The ISS has held a ≤3 mmHg 24-h average since a 2016 flight rule; the historical range was 1–9 mmHg [S5].
  - 19 of 49 astronauts reported headaches. Keeping the 7-day average below 2.5 mmHg holds headache risk below 1%. Headaches occur at 2.8–4.5 mmHg [S5].
  - Earth indoor air is about 0.6–0.76 mmHg [S5].
  - Units: at 760 mmHg cabin pressure, 3 mmHg ≈ 3,950 ppm and 2.5 mmHg ≈ 3,300 ppm. At an 8.2 psia exploration atmosphere (424 mmHg), 3 mmHg ≈ 7,100 ppm (derived).
  - Personal CO2 monitors are on the ISS task list [S19].
- **Noise:**
  - Hazardous level <85 dBA; continuous noise in work areas within NC-50; sleep areas within NC-40 for missions >30 days.
  - Intermittent noise during sleep ≤10 dB above background; 24-h noise dose ≤100 [V2 6115]; alarms <95 dBA [S6][S2].
  - Crew wear acoustic dosimeters for 24 h; the crew-worn monitor is also deployed statically [S18][S19].
  - ISS flight rule: if 8-h sleep noise exceeds 50 dBA, the FS advises the crew member (secondary) [S58].
  - On-orbit hearing assessment is part of the increment plan [S19].
- **Temperature and humidity:** Health limits run from 18 °C at 75% RH to 27 °C at 25% RH [V2 6012] [S2]; ISS runs 18–27 °C [S9]; high humidity leads to microbial rashes; low humidity to dry membranes [S2].
- **O2:** normoxic PIO2 139–168 mmHg. Exploration atmospheres at about 127 mmHg need health monitoring [S2].
- **Who / consumer hardware:** vehicle sensors plus self / yes. NDIR CO2 meter, phone dBA meter (roughly calibrated), thermo-hygrometer.

### 23. Skin
- **Risk:** rash, dermatitis, slow healing (immune change, humidity, hygiene limits).
- **Today:** symptom-based. Rashes are the most frequent in-flight event (1.12 per flight-year) [S34]. Humidity limits exist partly for rash prevention [S2].
- **Who / consumer hardware:** self / partly (photo log).

### 24. Dental
- **Risk:** caries or a lost filling far from care (distance from Earth).
- **Today:** preventive dental care is a [V1 3003 i] item [S1]; dental repair supplies are on Orion [S20]. No in-flight incidence data found.
- **Who / consumer hardware:** self/CMO / no (checklist only).

### 25. Ultrasound imaging (a modality, not an indicator)
- **Uses:** ISS "Ultrasound 2" for eye, jugular-vein, venous and other scans [S16][S19]; carotid artery wall thickness in Standard Measures [S21]; ground experts guide crew remotely [S10].
- **Next:** ultrasonography is planned for Gateway, not Orion [S20].
- **Hackathon angle:** ultrasound images are a valid challenge input ("ultrasound images" is named in the brief), but interpretation needs expert or AI guidance. Remote or automated guidance is "a future goal" for Artemis [S20].

## Questionnaires and simple tests an app can administer

| Instrument | What | Time | Scoring / thresholds | Spaceflight use / caveats |
|---|---|---|---|---|
| PVT-B (3-min PVT) | Vigilant attention; random 2–5 s interval (sources differ: 1–4 s vs 2–5 s [S30]) | 3 min | Main: response speed (1/RT). Lapses RT ≥355 ms; false starts <130 ms [S28][S30] | ISS RST every 4th day, AM+PM [S28]. Device latency matters |
| Karolinska Sleepiness Scale (KSS) | Momentary sleepiness, 1–9 (1 extremely alert … 9 very sleepy, fighting sleep) | ~10 s | ≥7 commonly read as "sleepy" (convention, unverified as validated cut-off); EEG-validated [S56] | RST uses 11-point sleepiness ratings instead [S28] |
| Samn-Perelli | Fatigue, 1 (fully alert) – 7 (completely exhausted) | ~10 s | ≥5 often triggers fatigue-risk review in aviation FRMS (unverified) | Not found in NASA operational use |
| Bedford Workload Scale | Spare capacity, 1–10 decision tree | ~30 s | NASA limit: ≤3 nominal, ≤6 off-nominal tasks [V2 5007] [S13] | NASA's chosen verification scale |
| NASA-TLX | Workload: mental, physical, temporal demand, performance, effort, frustration, 0–100 each | 1–3 min (weighted adds 15 pairwise choices) | Raw mean, or weighted (weights/15) → 0–100 [S57][S13] | Diagnostic; "may be preferred for developmental testing" [S13] |
| POMS (65 items; short forms ~30–37) | Mood: tension, depression, anger, vigor, fatigue, confusion | 5–10 min | Total mood disturbance vs norms; no clinical cut-off | Used in analog research; long for daily use (unverified for ISS operations) |
| PHQ-9 / PHQ-2 | Depressive symptoms, past 2 weeks | 2 min / 30 s | 0–27; 5/10/15/20 = mild/moderate/moderately severe/severe; ≥10 screen-positive (pooled sensitivity 0.88, specificity 0.85) [S47] | Not validated in astronauts. Item 9 needs a private escalation path. Under-reporting risk in a selected, career-sensitive population (unverified) |
| GAD-7 | Anxiety, past 2 weeks | 2 min | 0–21; 5/10/15; ≥10 sensitivity 89%, specificity 82% for GAD [S47] | As above; the 2-week recall window fits weekly, not daily, use |
| SMS grading (Barratt) | Space motion sickness severity 0–3 | 30 s | See §18 [S15] | Use on FD1–5 and after gravity transitions |
| Epworth Sleepiness Scale | Trait sleepiness, 8 items, 0–24 | 2 min | >10 excessive daytime sleepiness (convention) | Used in NASA preflight fatigue screening [S17] |
| Sleep diary (RST items) | Bed time, sleep latency, wake after sleep onset, rise time, quality 0–10 | 1 min | Total sleep time ≤6 h → flag [S28] | Morning entry; evening caffeine log [S28] |
| Visual acuity + Amsler grid | Near/far acuity; central distortion | 2–3 min | Drop ≥1 line or any new distortion → CMO/FS (heuristic) | NASA in-flight self-exam [S10] |
| Symptom checklist | Headache, congestion, rash, neck/face swelling, back pain | 1 min | Headache + CO2 >2.5 mmHg → environmental cause likely [S5] | Links §14/15/22 |

## Non-contact and consumer methods (accuracy caveats)

| Method | Indicator | Evidence and caveats | Verdict for demo |
|---|---|---|---|
| Camera rPPG (webcam/phone) | HR, maybe HRV, respiration | Machine-learning methods reach sub-1 bpm error on some lab datasets, but error rises with motion and dim light (only some face regions acceptable at 6.3 lux). Chrominance methods: 5.2 bpm error on lighter skin vs 14.1 on darker skin (via review) [S48]. HRV from rPPG is much less reliable than HR | Good for live HR demo; label as estimate; check against a chest strap or oximeter |
| Phone camera / watch SpO2 | SpO2 | FDA's Jan 2025 draft guidance wants ≥150 participants across skin tones for medical oximeters; general-wellness devices are out of scope [S49] | Use a fingertip oximeter with manual entry instead |
| Watch PPG | HR, HRV (RMSSD at rest), sleep, skin temperature, VO2max estimate | Accuracy differs by device and activity more than by skin tone (npj 2020, via [S48] search set); sleep staging weak | Fine for trends |
| Cuffless BP (watch, Astroskin) | BP | Astroskin's systolic BP is "calculated" [S24]; needs cuff calibration | Use a cuff |
| Voice analysis | Depression, stress, fatigue | Depression detection AUC 0.71–0.93 in small studies. One review found it below PHQ-9 performance [S52]. Apollo 11 voice pitch was higher in flight (case study) [S52]. ISS VOKALKORD (Exp 70) is exploratory with no published accuracy (unverified) | Research-only; opt-in; never diagnostic |
| Facial expression "emotion AI" | Mood | Facial configurations do not reliably map to emotions [S50]. EU AI Act Art. 5(1)(f) bans workplace emotion recognition except for medical or safety reasons [S51]. In-flight facial edema (first days) [S15] shifts baselines | Avoid; use self-report |
| Phone mic dBA | Noise exposure | Uncalibrated ±several dB (convention) | OK for trend vs 50/85 dBA |
| NDIR CO2 meter | CO2 | Reads ppm, but limits are mmHg partial pressure (§22) | Good live demo |
| Phone lux sensor | Light | Photopic lux ≠ melanopic EDI [S2] | Approximate only |

## Summary table

Who: S = self, C = Crew Medical Officer, G = ground. Consumer: Y = yes, P = partly, N = no.

| Indicator | Risk / hazard | In-flight device (ISS → Artemis) | Frequency | Earth normal | Attention threshold | Who | Consumer |
|---|---|---|---|---|---|---|---|
| Heart rate | CV deconditioning, stress | BP/ECG in PFE; Holter; Bio-Monitor → Orion ECG, wrist device | Monthly; research continuous | 60–100 bpm | Personal-baseline drift; >100 or <40–50 + symptoms | S | Y |
| HRV | Stress, autonomic change | Holter, Bio-Monitor (research) | Research | RMSSD ~42±15 ms (short-term) | Personal trend only | S | P |
| ECG rhythm | Arrhythmia | BP/ECG, AED → Orion ECG | Monthly; as indicated | Sinus | Any new irregular rhythm or syncope | S/C/G | P |
| Blood pressure | Fluid shift, landing OI | Auto cuff, Tango BP → Orion cuff | Monthly; pre-landing | <120/<80 | Personal baseline (in-flight −8–10 mmHg normal); ≥180/120 severe | S | Y |
| Orthostatic tolerance | Landing syncope (>60% failed R+0 tilt after long missions) | Tilt/stand tests postflight; fluid loading | Pre-landing, landing | Tolerates 10-min tilt | Lightheaded on standing; fluid loading not done | C/G | N |
| SpO2 | Hypoxia, smoke | Pulse oximeter → Orion oximeter; Gateway co-oximetry | As indicated | 95–100% | <94% check; <90% urgent | S | P |
| Respiratory rate | Illness, CO2 | Bio-Monitor; manual | As indicated | 12–20/min | >24/min at rest | S | P |
| Body temperature | Infection, heat strain | Oral thermometer; Double Sensor (research) | As indicated | 36.1–37.2 °C | Personal baseline (+~1 °C in flight); ≥38 °C + symptoms | S | Y |
| Blood glucose | Insulin resistance | i-STAT-type PCBA as needed; CGM demo (Ax-4) | Not routine | 70–99 mg/dL fasting | <70 / <54 (hypo) | S/C | Y |
| Urine chemistry / hydration | Stones, dehydration | Chemstrips, urinalysis MO-9 → Orion POC urinalysis | Per increment | SG 1.005–1.030 | Urine <2 L/day; SS >2.0; flank pain | S/C | P |
| Bone markers / vit D | Bone loss | Frozen blood/urine to ground | Pre/post, research | 25-OH D 35–90 ng/mL | <20 ng/mL treat | G | N |
| Body mass | Energy deficit | Body mass device (SLAMMD) | Periodic | Baseline | ≥5% loss (clinical convention) | S/C | N |
| Sleep | Fatigue, errors | Actigraph, logs → ARCHeR wristband | Daily | 7–9 h | ≤6 h; repeated hypnotic need | S | Y |
| Light / circadian | Misalignment | Actigraph light; LED lighting | Continuous | 24-h light/dark | Day ≥250 melanopic lux; pre-sleep 8±2 | S | P |
| Mood | Behavioral health | PMC/PPC, questionnaires | Weekly–biweekly | PHQ-9/GAD-7 <5 | ≥10; any item-9 answer above 0 | S/G | Y |
| Cognition / fatigue | Performance | WinSCAT, Cognition, RST (PVT-B) | Monthly; every 4 days | Personal baseline | Lapses ≥355 ms up vs baseline | S | Y |
| Workload | Overload | Bedford, NASA-TLX | Per task | — | Bedford >3 nominal / >6 off-nominal | S | Y |
| Vision / SANS | SANS | Acuity, Amsler, OCT2, fundus, ultrasound | FD30, FD90, R-30 | 20/20, no distortion | OCT ΔTRT >19.4 µm; ≥1-line drop | S/C/G | P |
| Jugular vein flow | Thrombosis | Ultrasound (ground-guided) | Early flight + as indicated | Antegrade flow | Stasis or clot; neck/face swelling | C/G | N |
| Bone density | Fracture | None in flight (DXA/QCT post) | Pre/post | T ≥−1.0 | <95% hip/spine, <90% femoral neck | G | N |
| Aerobic fitness | Egress/EVA failure | CEVIS PFE → flywheel device | Monthly | Cohort ~40 mL/kg/min | <80% preflight; <32.9 / <36.5 | S/G | P |
| Muscle strength | Egress/EVA failure | ARED logs → flywheel device | Daily logs | Baseline | <80% baseline | S/G | P |
| Space motion sickness | Adaptation | Symptom score, PMC | FD1–5 daily | None | Grade 3 or >72 h | S | Y |
| Radiation dose | Cancer, CNS, acute | Pille, CAD, area monitors → CAD, HERA | Continuous | ~2 mSv/yr | 600 mSv career; organ 30-d/1-yr; event alarm | Device/G | N |
| Immune / viral | Infection, rash | Saliva/blood (research) | Research | — | New rash, cold sores, shingles, fever | S/G | P |
| Nutrition | Inadequate intake | EveryWear logging | Daily | 100% EER | <~90% EER; protein/vitamin D gaps | S | Y |
| Water intake | Stones, OI | Logs | Daily | 2.5 L/day provision | <2.5 L/day; urine <2 L | S | Y |
| CO2 | Headache, cognition | Area and personal CO2 monitors | Continuous | ~0.6–0.76 mmHg | >3 mmHg 1-h; >2.5 mmHg 7-day | Device/S | Y |
| Noise | Hearing, sleep | Acoustic dosimeter, hearing test | 24-h periods | — | ≥85 dBA; sleep >50 dBA | Device/S | Y |
| Temperature / humidity | Heat, rash, dryness | Vehicle sensors | 1-min | 18–27 °C, 25–75% RH | Outside envelope | Device | Y |
| Skin | Rash | Self-report | As indicated | — | New or spreading rash | S | P |
| Dental | Dental emergency | Kit only | As indicated | — | Pain, lost filling | S/C | N |

## Top indicators for a hackathon prototype (ranked)

Score = relevance to the challenge (R) × measurable in flight today (M) × easy to capture live or simulate in a demo (D), each 1–5.

| Rank | Indicator | R | M | D | Score | Why / how to demo |
|---|---|---|---|---|---|---|
| 1 | Sleep + fatigue (sleep log, PVT-B, KSS/11-pt ratings) | 5 | 5 | 5 | 125 | Strongest in-flight evidence [S27][S28]; NASA precedent (RST); 3-min PVT runs live on stage |
| 2 | Heart rate (+ HRV trend) | 5 | 5 | 5 | 125 | Named in brief; camera rPPG or watch live; compare with personal baseline |
| 3 | Mood / behavioral self-report (with private escalation) | 5 | 4 | 5 | 100 | Named in brief; [V1 3003 k], BHP "minimally obtrusive measures" gap [S8] |
| 4 | Vision self-check (acuity + Amsler) with Eye-Week scheduler | 5 | 4 | 5 | 100 | 70% SANS prevalence [S10]; on-screen tests demo well; show limits (OCT needed) |
| 5 | Blood pressure (cuff entry, in-flight baseline, landing-readiness card) | 5 | 5 | 4 | 100 | Named in brief; shows "Earth threshold vs space baseline" insight [S26]; fluid-loading checklist [S11] |
| 6 | Cabin environment (CO2, noise, light, temperature/RH) | 4 | 5 | 4 | 80 | Consumer sensors live; ties symptoms (headache) to cause [S5]; crisp limits [S2] |
| 7 | Body temperature | 4 | 5 | 4 | 80 | Named in brief; +1 °C in-flight baseline story [S25] |
| 8 | Radiation dose tracker | 5 | 3 | 5 | 75 | Top deep-space hazard; replay or simulate a CAD feed vs 30-day/1-yr/career limits [S1][S23] |
| 9 | Space motion sickness score (FD1–5 mode) | 3 | 5 | 5 | 75 | Simple validated grading [S15]; good "mission phase" feature |
| 10 | Hydration & urine (intake log, urine color/SG) | 4 | 4 | 3 | 48 | Stones/OI link [S40][S11]; needs props |
| 11 | Exercise & fitness (minutes, HR zones, VO2 estimate) | 4 | 4 | 3 | 48 | Bone/muscle/VO2 standards [S1]; mostly logs |
| 12 | SpO2 | 3 | 4 | 4 | 48 | More relevant for exploration atmospheres [S2] |
| 13 | Nutrition & body mass | 4 | 3 | 3 | 36 | Energy deficit evidence [S12]; manual entry |
| 14 | Blood glucose | 3 | 2 | 4 | 24 | Named in brief, but not routinely monitored; frame as future/CGM (Ax-4) [S31][S32] |

Scores are judgment calls. Pick among close ranks (6–9) by the hardware on hand.

## Contradictions, surprises and open questions

- **SANS prevalence varies with definition and source:**
  - NASA brief: 70% with any sign, 18% clinically concerning [S10].
  - 2020 review: about 15% clinically significant disc edema (Frisén 1–3), but OCT-level edema in "nearly all" [S43].
  - 2024 systematic review: pooled 75% disc edema and 71% choroidal folds (search summary).
  - 2025 minireview: about one-third (search summary).
- **Core temperature value:** press coverage says crew "reach about 38 °C"; the paper reports +1 °C deltas only [S25].
- **CO2 averaging windows:** the standard uses a 1-h average [V2 6004]; the ISS flight rule uses a 24-h average; the headache model uses a 7-day average [S5]. Do not mix them on one gauge.
- **ISS radiation per day:** sources give 80 mSv (archived fact sheet, solar maximum) to 80–160 mSv per 6 months (news citing NASA) [S42]. No current NASA primary page was retrieved.
- **Sleep figures:** actigraphy gives about 6.1 h [S27]; self-report gives 6.5 h [S28]. Self-reports run longer.
- **Orthostatic failure rates** depend on test type (tilt vs stand) and era: >60% on R+0 for Mir/early ISS [S38] versus 2 of 8 men hypotensive on a 3-min stand test 18–36 h after landing (2019, secondary: https://www.nature.com/articles/s41526-019-0082-3).
- **Blood glucose** is challenge-named but absent from ISS routines and the Orion kit [S18][S20]. Judges may reward the team for knowing this.
- **Open leads not completed (web-search budget exhausted):**
  - Current ISS MORD in-flight schedule. Only quoted fragments were found [S15]; the PHS cadence comes from a 2006 paper [S54].
  - Full Lee 2015 and Meck orthostatic papers.
  - Fatigue-score cut-offs (KSS ≥7, Samn-Perelli ≥5) from primary sources.
  - The Artemis II smartwatch/HRV claim. Only a secondary aggregator was found; the official NASA page says only "wrist-worn device" [S22].
  - NASA ISS FIT app documentation.
  - Gateway program status in 2026.

## Sources

- [S1] NASA-STD-3001 Vol 1 Rev C (2023-09-15), Crew Health: https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf
- [S2] NASA-STD-3001 Vol 2 Rev F (2026-07-14), Human Factors, Habitability & Environmental Health: https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf (temporary path on standards.nasa.gov; if it moves, check the standards site)
- [S3] OCHMO technical brief index: https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/
- [S4] OCHMO-MTB-013 Bone Loss Rev D (Feb 2026): https://www.nasa.gov/wp-content/uploads/2026/02/ochmo-mtb-013-bone-loss.pdf
- [S5] OCHMO-TB-004 Carbon Dioxide Rev D (Mar 2026): https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf
- [S6] OCHMO-TB-035 Acoustics: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-035-acoustics.pdf
- [S7] OCHMO-TB-020 Ionizing Radiation Protection: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf
- [S8] OCHMO-TB-016 Behavioral Health & Performance Rev B: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-016-behavioral-health.pdf
- [S9] Sleep Accommodations technical brief (Rev A): https://www.nasa.gov/wp-content/uploads/2023/03/sleep-accomodations-technical-brief-ochmo.pdf
- [S10] OCHMO-MTB-001 SANS: https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf
- [S11] OCHMO-TB-019 Orthostatic Intolerance Rev B: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf
- [S12] OCHMO-TB-013 Food and Nutrition: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-013-food-and-nutrition.pdf
- [S13] OCHMO-TB-032 Cognitive Workload: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-032-cognitive-workload.pdf
- [S14] OCHMO-TB-044 Medical Operations (2025): https://www.nasa.gov/wp-content/uploads/2025/08/ochmo-tb-044-medical-operations.pdf
- [S15] OCHMO-MTB-004 Space Adaptation Sickness Rev A (Sep 2025), incl. quoted ISS MORD PMC schedule: https://www.nasa.gov/wp-content/uploads/2025/09/ochmo-mtb-004-space-adaptation-sickness-sas.pdf
- [S16] OCHMO-MTB-007 Venous Thrombosis in Spaceflight (Jan 2026): https://www.nasa.gov/wp-content/uploads/2026/01/ochmo-mtb-007-venous-thrombosis-in-spaceflight.pdf
- [S17] OCHMO-MTB-009 Circadian Desynchrony (Mar 2026): https://www.nasa.gov/wp-content/uploads/2026/03/ochmo-mtb-009-circadian-desynchrony.pdf
- [S18] CHeCS ISS Medical Hardware Catalog v10.0 (2011): https://ntrs.nasa.gov/citations/20110022379
- [S19] Dulin, Easter, Stratton, Crew Time Analysis of Planned Medical Activities (ISS Increments 69/70 Annex 4), 2023: https://ntrs.nasa.gov/api/citations/20230015627/downloads/Med%20Crew%20Time%20Analysis.pdf
- [S20] Haas, Orion Medical System Overview, AsMA 2024: https://ntrs.nasa.gov/api/citations/20240004890/downloads/Orion%20Medical%20System%20Development.pdf
- [S21] NASA, Spaceflight Standard Measures: https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space
- [S22] NASA Science, Artemis II research continues on Earth: https://science.nasa.gov/missions/artemis/artemis-2/nasas-artemis-ii-moon-mission-research-continues-on-earth
- [S23] Mirion, Crew Active Dosimeters on Artemis II (Mar 2026): https://www.mirion.com/news/mirion-crew-active-dosimeters-to-be-worn-by-astronauts-on-nasas-artemis-ii-mission
- [S24] NASA Bio-Monitor evaluation: https://ntrs.nasa.gov/api/citations/20190000238/downloads/20190000238.pdf ; CSA Astroskin: https://www.canada.ca/en/space-agency/news/2016/10/astroskin.html
- [S25] Stahn et al. 2017, Increased core body temperature in astronauts, Sci Rep 7:16180: https://pmc.ncbi.nlm.nih.gov/articles/PMC5701078
- [S26] Norsk et al. 2015, Fluid shifts, vasodilatation and ambulatory BP reduction, J Physiol: https://pmc.ncbi.nlm.nih.gov/articles/4324706/
- [S27] Barger et al. 2014, Lancet Neurol 13:904: https://doi.org/10.1016/S1474-4422(14)70122-X (summary: https://www.sciencedaily.com/releases/2014/08/140807215803.htm)
- [S28] Jones et al. 2022, Sleep deficiency in spaceflight and the Reaction Self Test, Sleep: https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197
- [S29] Basner et al. 2015, Cognition test battery: https://pmc.ncbi.nlm.nih.gov/articles/PMC4691281 ; test list: https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2020.00394/full
- [S30] Basner, Mollicone, Dinges 2011, PVT-B validation: https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786
- [S31] Hughson et al. 2016, Carotid stiffness and in-flight insulin resistance, Am J Physiol Heart 310:H628, doi:10.1152/ajpheart.00802.2015
- [S32] Axiom Space / Burjeel, Suite Ride CGM results (press release, Sep 2025): https://axiomspace.com/release/suite-ride-research-unlocks-potential-for-first-astronaut-with-diabetes
- [S33] Rooney et al. 2019, Herpes virus reactivation in astronauts, Front Microbiol: https://www.frontiersin.org/articles/10.3389/fmicb.2019.00016/full
- [S34] Crucian et al. 2016, Incidence of clinical symptoms during long-duration orbital spaceflight, Int J Gen Med: https://dovepress.com/article/download/29846
- [S35] Marshall-Goebel et al. 2019, Jugular venous flow stasis and thrombosis, JAMA Netw Open: https://pmc.ncbi.nlm.nih.gov/articles/PMC6902784/
- [S36] Khine et al. 2018, Atrial size, electrophysiology and AF risk: https://www.pubmed.gov/29752376/
- [S37] Moore et al. 2014, Peak VO2 during and after long-duration spaceflight, J Appl Physiol 117:231, doi:10.1152/japplphysiol.01251.2013; NTRS: https://ntrs.nasa.gov/citations/20140003597
- [S38] Lee et al. 2015 orthostatic tolerance ISS vs Shuttle: https://www.pubmed.gov/26630196/ ; >60% R+0 tilt failure reported in: https://www.frontiersin.org/article/10.3389/fphys.2020.00784
- [S39] NASA bone risk page: https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/ ; Lang et al. 2004 QCT: https://pubmed.ncbi.nlm.nih.gov/15125798/ ; NASA ISSRDC 2013 slides: https://nasa.gov/wp-content/uploads/2013/10/issrdc_2013-07-16-0945_lang20132.pdf
- [S40] Whitson et al., potassium citrate and renal stone risk (NTRS): https://ntrs.nasa.gov/api/citations/20090006694/downloads/20090006694.pdf ; https://ntrs.nasa.gov/api/citations/20090019087/downloads/20090019087.pdf
- [S41] Curiosity RAD cruise/surface dose: https://meetingorganizer.copernicus.org/EGU2015/EGU2015-14134.pdf?pdf ; https://spacenews.com/?p=67315
- [S42] NASA radiation fact sheet (archived): https://webarchive.library.unt.edu/eot2008/20090112024921/http://spaceflight.nasa.gov/spacenews/factsheets/pdfs/radiation.pdf ; ABC summary of NASA range: https://abc7news.com/15270382
- [S43] Lee et al. 2020, SANS review, npj Microgravity: https://pmc.ncbi.nlm.nih.gov/articles/PMC7005826/
- [S44] 2025 ACC/AHA High BP Guideline (Hypertension 2025;82:e212, doi:10.1161/HYP.0000000000000249); quick reference: https://www.2minutemedicine.com/guidelines/high-blood-pressure/
- [S45] ADA Standards of Care 2025, Section 6 Glycemic Goals and Hypoglycemia: https://pubmed.ncbi.nlm.nih.gov/39651981/
- [S46] Nunan et al. 2010, Normal values for short-term HRV: https://ora.ox.ac.uk/objects/uuid:52420db3-d094-4c4d-b79f-fbd521e78997
- [S47] Kroenke et al. 2010, PHQ somatic, anxiety and depressive scales review: https://pubmed.ncbi.nlm.nih.gov/20633738/ ; GAD-7 instructions: https://depts.washington.edu/psychres/wordpress/wp-content/uploads/2017/09/gad7_inst.pdf
- [S48] rPPG evidence: npj Digital Medicine 2025 ROI review: https://doaj.org/article/7fb67158fac64c7da0a486d35e8187bd ; skin-tone benchmark: https://arxiv.org/pdf/2010.12769 ; wearable PPG sources of inaccuracy: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7010823/
- [S49] FDA draft guidance on pulse oximeter accuracy across skin tones (Jan 2025): https://www.medtechdive.com/news/fda-draft-guidance-pulse-oximeter-accuracy/736555/
- [S50] Barrett et al. 2019, Emotional expressions reconsidered, Psychol Sci Public Interest 20(1): https://affective-science.org/wp-content/uploads/2024/04/barrett-et-al-2019-emotional-expressions-reconsidered-challenges-to-inferring-emotion-from-human-facial-movements.pdf
- [S51] Future of Privacy Forum, EU AI Act emotion-recognition prohibition: https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/
- [S52] Voice biomarkers for depression, J Voice 2025 review: https://orbi.umons.ac.be/handle/20.500.12907/53444 ; Apollo 11 voice case study: https://terpconnect.umd.edu/~oard/pdf/interspeech14-yu.pdf
- [S53] Space motion sickness during 24 Shuttle flights: https://researchexperts.utmb.edu/en/publications/space-motion-sickness-during-24-flights-of-the-space-shuttle/ ; Field Test: https://ntrs.nasa.gov/citations/20150022289
- [S54] ESA, Periodic Fitness Evaluation: https://outpost42.esa.int/blog/diario-di-bordo/single/l-477-periodic-fitness/ ; ISS medical model incl. monthly PHS (2006): https://ntrs.nasa.gov/citations/20060051792
- [S55] NASA SANS in-flight testing history: https://ntrs.nasa.gov/api/citations/20180004916/downloads/20180004916.pdf
- [S56] KSS validation: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8889981/
- [S57] NASA-TLX computerized manual (NASA Ames): https://ntrs.nasa.gov/api/citations/20000021487/downloads/20000021487.pdf
- [S58] Inter-Noise 2021, ISS crew acoustic exposure: https://ntrs.nasa.gov/api/citations/20210016151/downloads/Inter-Noise2021_Paper2219_DRAFT%20Manuscript.pdf
- [S59] CSA, Monitoring radiation for astronaut health (2026-02-26; verified 2026-11-13): https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
