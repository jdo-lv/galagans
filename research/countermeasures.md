# Countermeasures and guidance: what the crew should do

Companion to [health-indicators.md](health-indicators.md). That file covers what to measure and when to worry (all thresholds live there). This file covers the documented preventive actions and treatments, who performs them, and how a problem escalates. Source tags like [C1] point to the Sources list at the end. "Unverified" marks claims I could not check against a primary source. This is reference material for a prototype, not medical guidance.

## Key takeaways for the team

- **The model to follow is guidance plus escalation, not diagnosis.** On the ISS, crew take some over-the-counter medicines without consulting the flight surgeon (FS) [C8]. Two trained Crew Medical Officers (CMOs) per vehicle handle exams and the medical kit [C1]. Everything else goes through a Private Medical Conference (PMC): weekly, or any time on request [C15]. An app that says "do X now; if Y, call the CMO; if Z, request a PMC" mirrors real operations.
- **Distance changes the ladder.** Communication delay is 6–10 s at the Moon and much longer at Mars [C2]. The standard then expects:
  - store-and-forward PMCs and private psychological conferences (PPCs) [C1];
  - "autonomous medical care" [C1];
  - "evidence-based asynchronous behavioral health treatment protocols available on electronic devices" [C1];
  - decision aids at the skill level of any crew member [C2].
  This is the clearest opening for a software tool.
- **NASA's own risk model ranks the problems.** The most likely conditions are minor and treatable on board: late insomnia (91% chance per crew member on a 6-month low Earth orbit (LEO) flight), skin abrasion or rash (82%), space motion sickness (73%), eye foreign body (72%) and headache (59%) [C22]. The main reasons for evacuation are different: kidney stones (2nd most likely cause of ISS emergency evacuation) and urosepsis (3rd) [C13]. On Mars-class missions, shingles is added [C24]. Prevention of stones and infection therefore deserves screen space.
- **Exercise is the biggest single countermeasure, and it is quantified.** ISS crew average about 600 min/week [C3]. The prescription is about 30 min of interval or steady-state aerobic work plus 30–60 min of resistance training [C3]. Aerobic sessions run at 70–100% VO2peak on the cycle and 70–100% HRmax on the treadmill [C3]. Even so, crews lose about 7% VO2peak over 178 days, and 12–21% of crew drop below the −20% limit at some in-flight time point [C3]. An app can log sessions against this prescription.
- **Several countermeasures are cheap, simple, and suited to app reminders:**
  - Hydration with a 2.5 L/day water provision, plus potassium citrate at FS discretion, against kidney stones [C2][C13].
  - Pre-landing fluid loading of 24–48 oz salt water [C5].
  - Light timing and caffeine cut-off for sleep [C6].
  - Avoiding pitch head movements early in flight [C15].
  - Hearing protection on the treadmill [C20].
  - B-vitamins and spare "Space Anticipation Glasses" for SANS [C12].
- **Medication is the most common in-flight treatment, and NASA already tracks it with an iPad app.** 71% of crew reported using sleep aids, about 10× the terrestrial rate [C17]. The "Dose Tracker" iPad app recorded about 4 medication uses per crew member per week, versus 12.6 doses per mission under the old recall-based reporting [C8]. Logging medications, and their effects, in an app has direct precedent.
- **Several prevention claims are still research-stage:** lower-body negative pressure and thigh cuffs for SANS [C12], in-flight bisphosphonates [C4][C13], and VR for isolation [C17]. Present them as "under study", not as orders.

## Escalation ladder and how it changes with distance

| Tier | Who / tools | Typical trigger | LEO (ISS) | Moon (Artemis) | Mars |
|---|---|---|---|---|---|
| 1. Self-care | Crew member; OTC medications, procedures on personal device, hygiene/sleep/hydration actions | Mild symptom, out-of-range self-measurement | OTC meds without FS discussion allowed; encouraged to tell FS [C8] | Same; procedures on crew devices plus a few paper cue cards [C26] | Same; app becomes the main decision aid |
| 2. Crew Medical Officer | Two trained CMOs per vehicle [C1]; exam, vitals, point-of-care tests, medical kit, procedures | Symptom persists or worsens; needs exam, injection, procedure | ISS Medical Checklist and kit [C20] | Orion kit (~30 lb) [C26] | Larger kit sized by the Integrated Medical Model (IMM); more autonomy |
| 3. Private Medical / Psychological Conference | Flight surgeon or behavioral provider, private audio/video | Scheduled or crew-requested | Daily on FD1–5, weekly, before and after EVA, daily for 5 days before entry, any time on request [C15]; PPCs routine [C1]; scheduled per program requirements [C27] | Private audio with FS; video expected during medical events [C26] | Store-and-forward allowed when delayed [C1] |
| 4. Ground specialists and mission control | FS, biomedical engineers, consultants; flight control team for environment | Diagnosis beyond onboard skills; environment problem (e.g. CO2) | Real-time; remote-guided ultrasound/OCT [C12] | 6–10 s delay [C2] | Long delays; "advanced remote or automated guidance a future goal" [C26] |
| 5. Evacuation or definitive care | Return vehicle, Definitive Medical Care Facility [C1] | Threat to life or permanent impairment ("emergent" = within 24 h in the IMM) [C23] | ISS 6-month, 6-crew: 5.03% evacuation probability, 1.80% emergent [C23] | Return measured in days (Orion design mission 21 days) [C25] | Return may be impossible or futile, so palliative care must be planned [C1] |

- **The standard's long-delay toolkit** [C1][C17]:
  - [V1 3004 q] evidence-based asynchronous behavioral treatment protocols on electronic devices;
  - [V1 3004 t] means of autonomous medical care;
  - the TB-033 list of capabilities "needed for medically autonomous missions", which includes an individualized behavioral health countermeasures suite with VR and store-and-forward family contact, sensory-deprivation countermeasures (novelty, VR, greenhouse) and social-isolation countermeasures (games, holidays).
- **One-way Mars delay:** ~3–22 min light-time; NASA cites "up to 20 minutes" (sources in `nasa-hrp.md` §5).

## What the crew can treat on board

- **ISS kits (2011 catalog; contents change, so verify current) [C20]:**
  - Ambulatory Medical Pack: oral and topical medications, bandages, dental and surgical supplies, physical-exam pack, stethoscope, BP cuff, and the point-of-care blood analyzer.
  - Advanced Life Support Pack: cardiac life support and trauma care, with airway, drug, IV (4.5 L saline), emergency surgery and assessment packs, plus Ambu bag, automatic BP cuff and Foley catheters.
  - Contamination protection kit with eyewash; a crew medical restraint system; an AED.
  - Intubation kit, respiratory support pack and variable oxygen system.
  - ISS Medical Accessory Kit with crew-specific medications and resupply.
  - Crew are expected to use the kits under FS guidance via the ISS Medical Checklist [C20].
- **Orion (Artemis) [C26]:**
  - Medications: anti-inflammatory, antibiotic/antiviral/antifungal, pain, sleep, stimulant, decongestant, antihistamine, anti-emetic, laxative/motility, anti-arrhythmia, anticoagulant, bronchodilator, anaphylaxis, ophthalmic, and pre-landing fluid support.
  - Therapeutics: splinting, wound closure and dressing, dental repair, nasal packing, urinary catheterization, manual ventilation, collapsed-lung (decompression) care, enriched-oxygen breathing, airway support.
  - Diagnostics: lighted imaging, point-of-care urinalysis, ECG, vitals, auscultation, corneal evaluation.
  - Gateway adds ultrasonography, co-oximetry, extended limb-injury care and positive-pressure breathing support.
- **Kit sizing logic** [C25]: an IMM optimization for a 21-day, 4-crew Orion mission cut the kit from an ISS-like 253 lb to about 20 lb. That kit was modeled to keep 97.2% crew health index, 0.65% evacuation and 0.05% loss-of-life probability. Dropping IV fluid, a SAM splint and oxygen for volume raised evacuation risk to 0.74%.
- **Medication shelf life:** sleep aids are the leading acute in-flight medication [C17]. Most flown medicines lost <20% potency, but 1–5-year missions exceed typical 1–2-year expiry dates [C8].

## Most likely conditions (NASA Integrated Medical Model)

All IMM reports and per-condition files are public on the IMM documentation hub [C21].


- **Sample IMM output in NASA-STD-3001 (likelihood per mission; mission parameters not stated in the table) [C1]:**
  - late insomnia 13.85;
  - skin abrasion 9.86 and skin rash 9.83;
  - eye abrasion 7.42;
  - late headache 5.25;
  - space motion sickness 4.37;
  - diarrhea 3.53, nasal congestion 3.51, respiratory infection 3.46;
  - back injury 3.41, ear/sinus block 3.28, space-adaptation back pain 3.15;
  - CO2 headache 2.15, SANS 2.08, urinary tract infection 1.44;
  - dental caries 0.88, hearing loss 0.57;
  - shingles 0.11, dental abscess 0.068.
- **Probability of at least one event per crew member, 6-month LEO with 1 EVA (iMED v5.0, 2014 data) [C22]:**
  - late insomnia 0.91; skin abrasion and skin rash 0.82 each;
  - space motion sickness 0.73; eye foreign body 0.72;
  - late headache 0.59; nasal congestion 0.59; space-adaptation back pain 0.53;
  - diarrhea and respiratory infection 0.45 each;
  - SANS (then called "VIIP") 0.34; CO2 headache 0.31;
  - urinary tract infection 0.49 for women and 0.08 for men;
  - kidney stone 0.0018; depression about 0.0015–0.0018; anxiety about 0.001–0.0035; behavioral emergency 7×10⁻⁶.
  - On a 36-month planetary mission, insomnia, abrasion, rash and eye foreign body all approach 1.0, and CO2 headache reaches 0.89 [C22].
- **Mars missions (IMM 2020, 4 crew) [C24]:**
  - 426-day mission: 156 medical events, crew health index 91.6, evacuation probability 6.25%, loss-of-life probability 0.57%.
  - 923-day mission: 603 events, crew health index 72.5, evacuation probability 29.4%, loss-of-life probability 1.58%.
  - Top evacuation drivers (426-day): shingles 15%, kidney stones about 11.5% combined, sepsis 5.7%, urinary tract infection 4.2%, eye chemical burn 4.1%, dental abscess 3.7%.
  - Top loss-of-life drivers: sepsis, stroke, medication overdose or adverse reaction, ammonia exposure.
- **Caveat:** the IMM is a planning tool. NASA states its outputs are "other than diagnostic or treatment applications" [C23].

## Countermeasures by risk

Columns: documented countermeasure → who → escalation when it fails. Thresholds that trigger escalation are in [health-indicators.md](health-indicators.md).

| Risk / indicator | Documented countermeasure (in flight) | Who | Escalation when it fails |
|---|---|---|---|
| Aerobic fitness, muscle, bone (exercise) | See "Exercise prescription" below [C3][C4] | Self (executes); exercise specialists on the ground (ASCRs) set and adjust prescriptions from device data [C3][C4] | ASCR adjusts prescription; FS. Below 80% of preflight VO2 or strength breaches [V1 4003]/[V1 4024] [C1]. Post-flight reconditioning restores VO2peak in about 30 days [C3] |
| Bone loss (nutrition and drugs) | Vitamin D: target 25-OH D 35–90 ng/mL; maintenance 1,000 IU/day or 5,000 IU/week; repletion per FS protocol [C4]. Adequate calcium (excess raises stone risk) [C4]. Bisphosphonates: research only so far. Alendronate 70 mg weekly plus ARED gave better protection than ARED alone in 18 ISS astronauts. Side effects (jaw osteonecrosis, GI, atypical fracture) limit routine use [C4][C13] | FS prescribes; self takes | Bone specialist referral post-flight. Post-flight DXA at 6 months, 1, 2 and 3 years [C4] |
| Orthostatic intolerance (landing) | Day before or before deorbit: fluid loading with 24–48 oz NaCl-water by body weight (broth, or water plus salt tablets) [C5]; 1.5 L water per crew member reserved [C2]. Compression: anti-G suit about 75 mmHg, or gradient garment about 55→30→20 mmHg [C5]. Cooling garments; in-flight exercise. Midodrine/octreotide data too limited for routine use [C5]. After landing: oral fluids, saline bolus, rest, slow activity [C17] | Self (drink, don garments); CMO (salt tablets); ground recovery team | Recovery-team IV saline; symptomatic medications [C17] |
| Sleep loss | Sleep hygiene [C6]: cool, dark, quiet sleep station with no screens; no napping unless scheduled; no caffeine 6–12 h before sleep; no vigorous exercise or large meals within 2 h of sleep. 8.5 h scheduled sleep [C7] | Self | Fatigue Management Consultation Service or FS; hypnotics (71% of crew used sleep aids) [C17]; schedule changes ([V1 6001]) [C1] |
| Circadian misalignment | Light timing [C6]: avoid bright, blue-enriched light 1–2 h before bed (blinds, eye masks, blue blockers, device night mode); seek bright blue-enriched light 1–2 h after waking. Vehicle lighting modes per [V2 8055] [C2] | Self; schedulers | NASA-approved medicines given by a trained provider [C6]: melatonin 0.5–6 mg or Circadin 2 mg to shift rhythm; zaleplon as hypnotic; caffeine, modafinil or armodafinil for alertness. A hypnotic taken shortly before an alarm can impair emergency response (see indicators file) |
| CO2 headache / hypercapnia | CO2 headaches "typically resolve rapidly and spontaneously with improvement of intramodular airflow". Analgesics as needed. Local pockets in poorly ventilated volumes are the suspected cause [C11]. Vehicle airflow must be 4.57–36.58 m/min ([V2 6107]) [C2]. Exercise raises CO2 output sharply [C10]. Sleep-station airflow should run head to foot [C7] | Self: move to a ventilated area, improve airflow, ease exertion, take an analgesic, report it | Flight control team: diagnose or repair the CO2 removal system, or activate backup scrubbing [C10]. Apollo 13 improvised CO2 filters as a precedent [C10]. A headache can be the first sign of scrubber failure [C11] |
| SANS | In use: B-complex vitamins (under study) [C12]. "Space Anticipation Glasses": every crew member flies at least 3 pairs of different power [C12][C1]. CO2 control [C12]. Under study: lower-body negative pressure; thigh cuffs. Russian "Braslet" cuffs (name unverified here). Acetazolamide considered; no proven drug [C12] | Self (glasses, vitamins, acuity/Amsler checks); CMO/ground (OCT, fundus) | Extra eye exams; FS. Post-flight lumbar puncture if criteria met. Cerebrospinal fluid pressure ≥25 cm needs medical-board review [C12] |
| Kidney stones | Hydration: "ensure crew has ample supply of water and is encouraged to drink" [C13]; 2.5 L/day minimum provision [C2]. Exercise reduces urinary calcium. Limit oxalate and salt in the diet. Potassium citrate available on ISS at FS discretion; thiazide is an option [C13]. Self-dehydration to avoid toileting is a known risk [C13] | Self (drink, diet); FS (potassium citrate) | Ultrasound with NASA's guided software (AMOS). Tamsulosin, NSAIDs or opioids, and ondansetron for an attack; catheter if blocked [C13]. Kidney stones are the 2nd most likely reason for ISS emergency evacuation [C13] |
| Urinary retention / urinary tract infection | Hydration; aseptic catheter use; anti-motion-sickness drugs with anticholinergic effects can cause retention [C13] | Self; CMO (catheter) | Tamsulosin or catheter for retention; antibiotics for infection, with prophylaxis considered [C13]. Untreated infection can progress to urosepsis, the 3rd evacuation driver [C13] |
| Energy deficit / nutrition | Food variety and personal favorites, condiments for altered taste, scheduled meals and team dining. Control motion sickness to keep appetite. Reduce odors from waste and trash [C14]. Provide 100% of energy requirement [V1 4020] [C1]. Vitamin D supplementation ([V1 3003 c]) [C1] | Self (eat and log); food system | Nutritionist and FS review of intake logs; menu changes ([6038] nutritional assessment) [C4] |
| Space motion sickness | Train to avoid provocative activities and head or body movement; pitch is most provocative, then roll and yaw [C15]. Keep a "1-g" visual orientation; head restraints; inactivity early on [C15]. EVAs historically delayed ≥72 h [C15]. Daily PMCs on FD1–5 [C15] | Self; CMO (injection) | Promethazine (NASA's drug of choice; up to 90% initial response; intramuscular or rectal if vomiting), meclizine, ondansetron [C15]. Post-flight: avoid rapid head movements and increase activity slowly [C17] |
| Behavioral health | PPCs on a routine schedule [C1]; weekly PMCs [C15]; Private Family Conferences; crew care packages; crew support events; entertainment; journaling and Earth photography; private crew quarters ([V2 7071]); repatriation briefings 6 weeks before landing [C16]. Beyond LEO: an individualized suite with personal device, VR, store-and-forward family messaging, novelty and greenhouse activities, and asynchronous self-help protocols [C17][C1] | Self; behavioral health provider (ground) | Request an extra PPC; behavioral emergency procedures; medications in kit (e.g. lorazepam appears in the IMM-optimized Orion kit) [C25] |
| Immune / latent virus | Multi-component countermeasures ([V1 3003 o]: nutrition, exercise, sleep, stress management) [C1]. Health Stabilization Program before flight (quarantine, vaccinations) [C17]. Antivirals: shingles managed with valacyclovir plus symptomatic care, usually resolving in 7–10 days [C18] | Self (report rash or pain early); CMO/FS (antivirals) | FS. Eye involvement (herpes zoster ophthalmicus) or prolonged pain is the worst case [C18]. Shingles is the top evacuation driver on the 426-day Mars mission [C24] |
| Hearing / noise | Hearing protection while running on the T2 treadmill and when in the same node during others' T2 runs. Use a passive hearing protector with insert speakers if listening to music [C20]. 4 earplug types plus active noise-cancelling headphones [C20]. Crew use the acoustic dosimeter "as they see fit" to decide on protection [C20]. Source control: fan maintenance, mufflers, baffles [C19] | Self; environmental health team | On-orbit hearing assessment [C20]; FS. Hearing protection may not be used to meet design limits [C19] |
| Radiation (solar particle event) | Ground alerts ([V2 6100]) [C2][C9]. Storm shelter: rearrange water containers or high-hydrogen material to add about 10 cm water-equivalent in crew quarters for a once-a-century event (about 20 cm for a once-a-millennium event). Event timelines allow time to reconfigure [C9]. A capsule stowage shelter cut modeled event dose from about 210–260 mSv to about 65–83 mSv [C9]. End EVAs within 2 h of alert [C9]. Day to day: ALARA dose management ([V1 4029]) [C1] | Ground radiation group (alert), all crew (build shelter) | Stay sheltered until all-clear. Dose recorded against career limit (see indicators file). Acute radiation syndrome treatment in kit planning [C1] |
| Jugular vein thrombosis | Early in-flight ultrasound surveillance of the left jugular vein [C28] | CMO with ground guidance | Anticoagulant (apixaban) per NASA/ESA algorithm [C28] |

### Exercise prescription (ISS long-duration, about 180 days)

- **Prescribed** [C3]:
  - Aerobic: about 30 min of interval or steady-state work.
  - Resistance: 30–60 min of load-bearing work.
  - Cycle (CEVIS): 70–100% VO2peak, from preflight testing.
  - Treadmill (T2): 70–100% HRmax.
  - Historically about 2 h per workday [C4].
- **Observed, 46 astronauts, 2011–2017** [C3]:
  - Treadmill: 84 sessions per 178 days (47% of days), 27 min each; average HR 131 bpm; harness load about 68% of body weight.
  - Cycle: 65 sessions (37% of days), 26 min each; average 137 W.
  - Total about 600 min/week per crew member.
- **What works:** crew who exercised ≥3 times/week at >70% of age-predicted HRmax for >20 min/session had smaller VO2 losses [C3]. Bone needs 6–7 sessions/week in bed rest and spaceflight; single-leg and loaded squats target the hip [C4]. ARED provides up to 600 lbf [C4].
- **Bed-rest model (70 days, 34 subjects):** 6 days/week, alternating high-intensity intervals with continuous aerobic work, plus resistance on separate sessions 4–6 h apart. Fitness and muscle were maintained [C3].
- **Artemis II** replaced the treadmill, cycle and ARED with one flywheel device for both aerobic and resistive work [C4].

## Open leads

- Current ISS Medical Checklist and the actual flown kit inventories. The 2011 catalog and the 2018 IMM optimization are proxies [C20][C25].
- Crucian et al. immune countermeasure package details (not fetched).
- Primary source for Braslet thigh cuffs and lower-body negative pressure flight results.
- A primary figure for Mars communication delay.
- The fully named Artemis medical concept of operations. The 2024 overview says the lunar sortie concept is still being developed [C26].

## Sources

- [C1] NASA-STD-3001 Vol 1 Rev C (2023), incl. Appendix E Table E.2-1 sample IMM output: https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf
- [C2] NASA-STD-3001 Vol 2 Rev F (2026-07-14): https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf
- [C3] OCHMO-TB-031 Exercise Overview: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-031-exercise-overview.pdf
- [C4] OCHMO-MTB-013 Bone Loss Rev D (Feb 2026): https://www.nasa.gov/wp-content/uploads/2026/02/ochmo-mtb-013-bone-loss.pdf
- [C5] OCHMO-TB-019 Orthostatic Intolerance: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf
- [C6] OCHMO-MTB-009 Circadian Desynchrony (Mar 2026): https://www.nasa.gov/wp-content/uploads/2026/03/ochmo-mtb-009-circadian-desynchrony.pdf
- [C7] Sleep Accommodations technical brief: https://www.nasa.gov/wp-content/uploads/2023/03/sleep-accomodations-technical-brief-ochmo.pdf
- [C8] OCHMO-MTB-012 Pharmaceutical Care Rev B (Jan 2026; incl. Dose Tracker): https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-006-pharmaceuticals.pdf
- [C9] OCHMO-TB-020 Ionizing Radiation Protection: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf
- [C10] OCHMO-TB-004 Carbon Dioxide Rev D: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf
- [C11] IMM condition file, Headache – CO2 induced (2023): https://www.nasa.gov/wp-content/uploads/2026/08/headache-co2-induced-cliff-2023.pdf
- [C12] OCHMO-MTB-001 SANS: https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf
- [C13] OCHMO-MTB-003 Urinary Health Rev A (Mar 2026): https://www.nasa.gov/wp-content/uploads/2025/01/ochmo-mtb-003-urinary-health.pdf
- [C14] OCHMO-TB-013 Food and Nutrition: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-013-food-and-nutrition.pdf
- [C15] OCHMO-MTB-004 Space Adaptation Sickness Rev A (Sep 2025; incl. ISS MORD PMC schedule): https://www.nasa.gov/wp-content/uploads/2025/09/ochmo-mtb-004-space-adaptation-sickness-sas.pdf
- [C16] OCHMO-TB-016 Behavioral Health and Performance: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-016-behavioral-health.pdf
- [C17] OCHMO-TB-033 Spaceflight Experience and Medical Care Rev D: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-033-spaceflight-experience-medical-care.pdf
- [C18] IMM condition file, Herpes Zoster Reactivation (2023): https://www.nasa.gov/wp-content/uploads/2026/08/herpes-zoster-reactivation-shingles-cliff-2023.pdf
- [C19] OCHMO-TB-035 Acoustics: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-035-acoustics.pdf
- [C20] CHeCS ISS Medical Hardware Catalog v10.0 (2011): https://ntrs.nasa.gov/citations/20110022379
- [C21] NASA IMM documentation hub (condition files, mission runs): https://www.nasa.gov/integrated-medical-model-documentation/
- [C22] IMM, Ranking of Medical Conditions by Probability (iMED v5.0, Feb 2015): https://www.nasa.gov/wp-content/uploads/2026/08/ranking-of-medical-conditions-by-probability.pdf
- [C23] IMM, Medical Updates to the ISS PRA (S-20151123-341RevA, 2016): https://www.nasa.gov/wp-content/uploads/2026/08/iss-%E2%80%93-180-days-6-month-pra-update.pdf
- [C24] IMM, Medical Risk Assessment for an Accelerated and Standard Mars Mission (2020): https://www.nasa.gov/wp-content/uploads/2026/08/medical-risk-assessment-for-an-accelerated-and-standard-mars-mission.pdf
- [C25] IMM, Orion Medical Kit Contents (2018): https://www.nasa.gov/wp-content/uploads/2026/08/orion-medical-kit-contents.pdf
- [C26] Haas, Orion Medical System Overview, AsMA 2024: https://ntrs.nasa.gov/api/citations/20240004890/downloads/Orion%20Medical%20System%20Development.pdf
- [C27] OCHMO-TB-044 Medical Operations (2025): https://www.nasa.gov/wp-content/uploads/2025/08/ochmo-tb-044-medical-operations.pdf
- [C28] OCHMO-MTB-007 Venous Thrombosis in Spaceflight (Jan 2026): https://www.nasa.gov/wp-content/uploads/2026/01/ochmo-mtb-007-venous-thrombosis-in-spaceflight.pdf
