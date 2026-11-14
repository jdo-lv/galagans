# Long-duration spaceflight: what the peer-reviewed literature says

Research leg: primary papers on how missions of 6 months or more change the body, how fast, and how long recovery takes. Started from the Google Scholar query "Long-duration missions in space impact". Scholar blocks automated access, so the papers were found by web search and their abstracts read through the Europe PMC API (verified 2026-11-06). Research only: no project code.

This file adds **magnitude, timing and recovery** to the NASA operational view in [nasa-hrp.md](nasa-hrp.md) and the indicator catalog in [health-indicators.md](health-indicators.md). Countermeasures are in [countermeasures.md](countermeasures.md).

## Key takeaways for the team

- **Changes have a time course, and the app should show it.** Ventricle expansion happens mostly in the first 6 months [L3]. Cognitive slowing shows up early in flight [L5]. Jugular flow stasis was found around flight day 50 [L4]. Bone and muscle loss build up through the mission [L1][L2]. A "where you are in your adaptation" timeline per body system is grounded in data.
- **Recovery after landing is long, and some of it is incomplete.** One year after flight, 9 of 17 astronauts had not recovered tibia bone density. Missions over 6 months recovered worse (−3.9% vs −0.4% bone strength deficit) [L1]. Brain ventricles may need about 3 years between flights to recover [L3]. Visual working-memory speed was still slow 30 days after return [L5], and in the Twins Study cognition was still reduced 6 months after return [L6]. The tool can cover the return phase too, not only the flight.
- **Many serious changes cause no symptoms, so self-report alone misses them.** Jugular clots were asymptomatic and found only by ultrasound [L4]. Herpesvirus shedding is usually asymptomatic [L7]. Bone loss has no symptoms at all. This supports prompting **scheduled checks** rather than waiting for complaints (see [health-indicators.md](health-indicators.md)).
- **Countermeasures help but don't fully protect.** With ~5 h/week aerobic exercise and resistance work 3–6 days/week, calf muscle volume still fell 13% and peak power 32% over 6 months [L2]. Lower-body negative pressure improved jugular flow in 59% of sessions [L4]. An app should log adherence, not promise prevention.
- **Individual variability is large, which supports personal baselines.** Mars-500 crew differed widely in sleep and activity responses [L8]. In Gabel et al. about half recovered bone and half didn't [L1]. In Dev et al. 11.8% of in-flight and post-flight cognition scores were 1.5 SD or more below the group baseline [L5]. This strengthens the README's "compare against the astronaut's own baseline" rule.
- **Isolation slowly erodes routine.** Over 520 days of confinement, crews moved less, rested and slept more, saw less light, and most had sleep, vigilance or circadian problems [L8]. The authors call for anchoring light, meal and exercise timing. Routine prompts are an evidence-based feature, not decoration.
- **Kidney stones may be a direct kidney effect, not only a side effect of bone loss** [L9]. That gives hydration and urine checks their own justification, beyond the bone story in [countermeasures.md](countermeasures.md).
- **Evidence is thin.** Studies have 1 to 30 astronauts. The Twins Study is a single subject [L6]. Kidney findings are mostly from mice [L9]. Present numbers as "observed in N astronauts", never as population norms.

## By body system

| System | What changes (long-duration) | Timing | Recovery | Something an app can do | Source |
|---|---|---|---|---|---|
| Bone | Tibia strength, density and microarchitecture fall | Accumulates across the mission | Group still −0.9% to −2.1% at 12 months post-flight; 9/17 didn't recover total BMD; >6-month missions −3.9% vs <6-month −0.4% (bone strength) | Track resistance-exercise adherence; show "bone budget" by mission length; note that higher bone-turnover markers went with incomplete recovery | [L1] |
| Muscle | Calf volume −13% (soleus −15%, gastrocnemius −10%), peak power −32%, force −20 to −29%, slow-to-fast fiber shift | 6 months, despite exercise | Not measured in this study | Log exercise against the prescription; simple self-tests of strength or power over time | [L2] |
| Brain (structure) | Right lateral and third ventricles enlarge | Mostly in the first 6 months, then tapers | Intervals < 3 years between flights left little room for further enlargement → ventricles may need ~3 years to recover | Context only, since it isn't measurable on board; relevant to SANS and headache screens | [L3] |
| Veins / clotting | Jugular vein area 9.8 → 70.3 mm²; stagnant or reverse flow in 6/11 crew around flight day 50; 1 occlusive clot in flight, 1 partial clot after landing | Around flight day 50 and 150 | Not described | Schedule checks where ultrasound exists (ISS, Gateway); flag neck swelling or headache for the CMO; LBNP is a countermeasure under study | [L4] |
| Cardiovascular | Fluid shift, cardiac atrophy, vascular remodeling, autonomic impairment → orthostatic intolerance on return | Acute: higher preload and stroke volume; chronic: atrophy | Post-flight orthostatic intolerance | Trend HR and BP against a personal baseline; pre-landing fluid loading reminders | [L10] |
| Cognition | Slowing on processing speed (DSST), visual working memory (Fractal 2-Back) and sustained attention (PVT), plus less risk-taking; no systematic decline | Early flight (PVT early only; 2-Back throughout) | 2-Back speed still slow 30 days post-flight; PVT recovered | A short PVT or 2-Back in-app gives an objective measure; compare to own pre-flight scores; no clear link to self-rated sleep was found | [L5] |
| Immune / latent viruses | 22/23 ISS astronauts shed EBV, VZV or CMV; shedding rose with longer missions (VZV 41→65%, EBV 82→96%, CMV 47→61%); usually asymptomatic, but some skin lesions and shingles reported | Throughout flight, rising with duration | VZV and CMV shedding up to 30 days post-flight | Symptom check-ins for skin rash, lesions and cold sores; stress and sleep logging (stress hormones drive reactivation); flag for the CMO | [L7][L11] |
| Kidney | Renal transporter changes and nephron remodeling; Mars-dose simulated cosmic radiation damaged kidneys (mice) | — | Unknown | Hydration logging; urine color and urinalysis prompts; tie to the stone-evacuation risk in [countermeasures.md](countermeasures.md) | [L9] |
| Multi-system (1 subject) | Telomeres +14.5% in flight; carotid distension and intima-media thickening; retinal and choroidal thickening; 7% body-mass loss; inflammation markers up to 8× after landing | 340-day mission | Most returned to baseline by 6 months; short telomeres, DNA damage, some gene expression and reduced cognition persisted | Body-mass trend; post-landing recovery tracking | [L6] |
| Behavior / sleep (analog) | Hypokinesis, more sleep and rest, less light exposure; most crew had disturbed sleep quality, vigilance deficits or altered sleep timing | Grows over 520 days | — | Light, meal and exercise timing prompts; actigraphy trend; weekly vigilance test | [L8] |

## What this adds to the five brief questions

- **Why the exam matters:** the asymptomatic findings (clots, viral shedding, bone loss) are the strongest argument for scheduled measurement over waiting for symptoms [L1][L4][L7].
- **How hazards shift the value:** the "Timing" column gives each system's shift over time. A screen can show "expected at flight day X" against what was observed.
- **When to escalate:** the literature gives few absolute thresholds. It gives patterns: deviation from personal baseline (cognition z-scores [L5]), new skin lesions or neck swelling (CMO), and recovery that stalls after landing.
- **What action follows:** exercise and LBNP mitigate but don't prevent [L2][L4]. Routine anchoring is the analog recommendation [L8].

## Open leads

- Afshinnekoo et al. 2020, *Cell*, "Fundamental biological features of spaceflight": a cross-system synthesis, not yet located or read.
- The 2024 *Nature* SOMA package on Inspiration4 overlaps with [data-sources.md](data-sources.md). Check whether its findings add anything for short versus long missions.
- Post-flight muscle and cardiovascular recovery timelines with exact numbers (the Alzaabi review gives only qualitative statements in its abstract) [L10].
- The full text of Gabel et al. lists the bone-turnover biomarkers linked to incomplete recovery [L1]. Not read; PMC returned a captcha.

## Sources

All abstracts read through the Europe PMC REST API (`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:"…"&resultType=core&format=json`), verified 2026-11-06, unless noted.

- [L1] Gabel L, et al. Incomplete recovery of bone strength and trabecular microarchitecture at the distal tibia 1 year after return from long duration spaceflight. *Sci Rep* 2022;12:9446. https://doi.org/10.1038/s41598-022-13461-1
- [L2] Trappe S, et al. Exercise in space: human skeletal muscle after 6 months aboard the International Space Station. *J Appl Physiol* 2009. https://doi.org/10.1152/japplphysiol.91578.2008
- [L3] McGregor HR, et al. Impacts of spaceflight experience on human brain structure. *Sci Rep* 2023. https://doi.org/10.1038/s41598-023-33331-8
- [L4] Marshall-Goebel K, et al. Assessment of jugular venous blood flow stasis and thrombosis during spaceflight. *JAMA Netw Open* 2019;2(11):e1915011. https://doi.org/10.1001/jamanetworkopen.2019.15011 (the 6/11 stasis, the clot counts and the 10/17 LBNP sessions come from the full text, as quoted in coverage of it; the Europe PMC abstract is truncated). Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC6902784/
- [L5] Dev SI, et al. Cognitive performance in ISS astronauts on 6-month low earth orbit missions. *Front Physiol* 2024;15. https://doi.org/10.3389/fphys.2024.1451269 (full text read 2026-11-06)
- [L6] Garrett-Bakelman FE, et al. The NASA Twins Study: a multidimensional analysis of a year-long human spaceflight. *Science* 2019. https://pmc.ncbi.nlm.nih.gov/articles/PMC7580864 (full text read 2026-11-06)
- [L7] Rooney BV, et al. Herpes virus reactivation in astronauts during spaceflight and its application on Earth. *Front Microbiol* 2019. https://doi.org/10.3389/fmicb.2019.00016
- [L8] Basner M, et al. Mars 520-d mission simulation reveals protracted crew hypokinesis and alterations of sleep duration and timing. *PNAS* 2013. https://doi.org/10.1073/pnas.1212646110
- [L9] Siew K, et al. Cosmic kidney disease: an integrated pan-omic, physiological and morphological study into spaceflight-induced renal dysfunction. *Nat Commun* 2024. https://doi.org/10.1038/s41467-024-49212-1
- [L10] Alzaabi AA, et al. Review of microgravity's impact on cardiovascular and nervous systems in space exploration. *npj Microgravity* 2025. https://doi.org/10.1038/s41526-025-00534-4
- [L11] Mehta SK, et al. Latent virus reactivation in astronauts on the International Space Station. *npj Microgravity* 2017;3:11. https://doi.org/10.1038/s41526-017-0015-y (the abstract says "8 of 23" but the Results and Table 2 say 22 of 23; this file uses the Results). https://pmc.ncbi.nlm.nih.gov/articles/PMC5445581 (full text read 2026-11-06)
