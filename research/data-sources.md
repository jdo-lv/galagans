# Data sources for an astronaut health-monitoring prototype

Research leg: which real data the team can download and use, and which exists but is locked. Probed 2026-11-06 with live API calls (curl), so every "verified" row below was opened, not just read about. Research only: no project code.

## Key takeaways for the team

- **No public astronaut vital-sign stream exists.** In-flight heart rate, blood pressure, SpO2, temperature, sleep and mood from NASA or commercial crews are not downloadable. The richest such set (Inspiration4 Apple Watch HR/HRV, cognition, sleep, ultrasound) went to the TRISH **EXPAND** database. You get in only through a proposal and a privacy board, so it is useless for Nov 14–15. Plan to **simulate vitals**, anchored on public terrestrial wearable data plus published spaceflight shifts.
- **The best real astronaut clinical data:** Inspiration4 (4 crew, 3-day flight, 2021) **CBC (OSD-569, LSDS-7)** and **CMP + immune/cardiovascular serum panels (OSD-575, LSDS-8)**. They are small, open CSVs (9–107 KB). Each row carries the lab's **reference range min/max**, so they fit color-coded green/amber/red demos directly. Time points: L-92, L-44, L-3, R+1, R+45, R+82, R+194. There are no in-flight blood draws.
- **Radiation is the one hazard with rich, open, time-series data.** OSDR **RadLab** API serves dose-rate CSVs for the ISS (2009–2024), the Mars surface (MSL RAD, 2015–2024, ~17-min cadence), lunar orbit (LRO CRaTER, 2009–2024, hourly) and **Artemis I Orion** (HERA, EAD and M-42 sensors, 1-min, Nov 16–Dec 11 2022). The **ISS TEPC** set via CDAWeb HAPI gives dose and dose equivalent per minute (2010–2018) with ISS lat/lon/alt. Both returned CSV within seconds in our tests. Usability 5.
- **Baselines our probes computed:** ISS ≈ **0.41 mGy/day absorbed, 0.90 mSv/day dose equivalent** (TEPC, 1–7 Aug 2017). Mars surface ≈ **9.2 µGy/h ≈ 0.22 mGy/day** (MSL RAD, Dec 2019). Artemis I storm-shelter sensor median **16.7 µGy/h**, peaks of **~8,000 µGy/h** during Van Allen belt passes. Good for a "radiation budget" widget.
- **Real ISS cabin air data is open:** OSDR's Environmental Data App has **CO2 (ppm), temperature (°C) and relative humidity (%)**, flight and matched ground, for 14 Rodent Research windows 2014–2024. Cadence is 1–5 min (415k CO2 samples); daily GCR/SAA/total dose comes in mGy/day. Median cabin CO2 is about 3,080 ppm (≈2.3 mmHg), the 95th percentile about 4,270 ppm. It sits as JSON embedded in each dashboard page; one curl plus a parse gets it (§7).
- **OSDR has documented, working APIs.** These are the Search, Metadata, Data-File and Biological Data API v2 (OpenAPI 3.1), plus the RadLab and EDA APIs. Example URLs below were all tested. Of 119 human datasets, 38 carry a spaceflight factor. Almost all are omics on cells or blood, not vitals.
- **The LSDA/LSAH route (now via NLSP) is not viable for a hackathon.** Requests historically take months: scoping up to 6 months, review 2–6 months, IRB 2–4 months, crew consent, then a data use agreement. Real in-flight time series do exist there: biochemistry and immune measures for **27 ISS astronauts** before, during and after ~165-day missions ([Frontiers 2023](https://doi.org/10.3389/fphys.2023.1219221)). The same request-only route applies to HRP Standard Measures (ISS, HERA), ESA/DLR bed-rest data ("can be requested directly from ESA") and CHAPEA (Mission 2 ended 31 Oct 2026; no release). Cite them as "how agencies do it", not as inputs.
- **Terrestrial proxies cover every indicator in the brief.** HR and sleep: PhysioNet `sleep-accel` (Apple Watch + polysomnography), MMASH, Fitbit sets on Zenodo. Blood pressure and orthostatic stress: PhysioNet `prcp` tilt data, Fantasia. **Blood sugar:** CGMacros, BIG IDEAs (Dexcom CGM + Empatica). Stress/EDA/temperature: `noneeg`, `wearable-exam-stress`, WESAD. Population reference ranges: NHANES 2021–2023 files, all verified downloadable.
- **Other agencies give nothing raw, open and reachable.** CSA's **PRET** ground cognitive dataset (PVT, WinSCAT, DANA) is still listed on open.canada.ca. Its FTP folder now refuses access, and the HTTPS mirror times out. JAXA and IBMP human data sit in OSDR as omics only (OSD-530, -174, -542, -316, -353, -359, -140). Mars-500's OSD-140 holds methylation data only, no mood scores. The ESA Erasmus Experiment Archive portal returned HTTP 401.
- **Artemis II (Apr 2026): nothing released yet.** RadLab has no records for 2026-04-03, and there is no ARCHeR sleep/actigraphy data release (news only).

## 1. NASA Open Science Data Repository (OSDR)

**What it is.** OSDR merges **GeneLab** (omics; `GLDS-` IDs) and the **Ames Life Sciences Data Archive, ALSDA** (non-omics phenotype/physiology; `LSDS-` IDs) under one `OSD-` accession per study. Example: OSD-575 = LSDS-8 + GLDS-579. Raw human sequence data is controlled-access via an ethics-board application modelled on dbGaP/UK Biobank. Processed data is public ([I4 data-access paper](https://www.nature.com/articles/s41467-024-48806-z) via [Europe PMC](https://europepmc.org/article/PMC/PMC11094041)).

**Web UIs (all reachable 2026-11-06):**
- Repository search: https://osdr.nasa.gov/bio/repo/search/ ; study page pattern `https://osdr.nasa.gov/bio/repo/data/studies/OSD-572` ; mission page `https://osdr.nasa.gov/bio/repo/data/missions/SpaceX%20Inspiration4`
- Visualization portal: https://visualization.osdr.nasa.gov/ (biology, environment, samples)
- RadLab (radiation): https://visualization.osdr.nasa.gov/radlab/gui/overview/ ([tutorial](https://osdr-tutorials.readthedocs.io/en/latest/pages/guides/radlab_portal.html))
- Environmental Data App (ISS cabin temperature, RH, CO2 + radiation for 24 rodent/plant mission windows): https://visualization.osdr.nasa.gov/eda/
- Biospecimen search: https://visualization.osdr.nasa.gov/nbisc/home/
- SOMA browser (Weill Cornell; gene-level I4/Twins/mouse omics): https://soma.weill.cornell.edu/apps/SOMA_Browser/

### APIs (each example executed; response shape noted)

| API | Endpoint pattern | Tested example | Returns |
|---|---|---|---|
| Search | `https://osdr.nasa.gov/osdr/data/search?term=…&type=cgene&size=N` | `…/search?term=Inspiration4&type=cgene&size=50` → 8 hits | Elasticsearch JSON: `hits.total`, `hits.hits[]._source` with `Accession`, `Study Title`, `organism`, `Project Identifier`, `Study Assay Measurement Type`, `Study Factor Name`, … |
| Metadata | `https://osdr.nasa.gov/osdr/data/osd/meta/{n}` | `…/osd/meta/903` | ISA-JSON: `study["OSD-903"].studies[0]` title, description, comments (e.g. GEO accession, mission dates) |
| Data files | `https://osdr.nasa.gov/osdr/data/osd/files/{n[,n…]}` | `…/osd/files/569` and `…/files/903,943` | JSON per study: `file_name`, `category`, `file_size`, `restricted`, `remote_url`. Download = `https://osdr.nasa.gov` + `remote_url` (e.g. `/geode-py/ws/studies/OSD-569/download?source=datamanager&file=LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv`) |
| Biological Data API v2 (OpenAPI 3.1 spec served at root) | `https://visualization.osdr.nasa.gov/biodata/api/v2/…` : `datasets/`, `dataset/{OSD}/`, `…/files/`, `…/assays/`, `…/samples/`, `query/datasets\|assays\|samples/` | `…/v2/query/datasets/?study.characteristics.organism=homo%20sapiens&study.factor%20value.spaceflight` → 158 rows, 119 human datasets, 38 with a spaceflight factor value | CSV by default; `format=tsv\|json.records\|json.table\|json.split`. Filters = metadata field paths; `a\|b` = OR; a bare field adds a column |
| RadLab | `https://visualization.osdr.nasa.gov/radlab/api/?…` | `…?timestamp%3E=2019-12-01&timestamp%3C2020-01-01&instrument_id=MSL-RAD-Surface&absorbed_dose_rate=&format=csv` → 2,522 rows | CSV/TSV/JSON/HTML: `timestamp,instrument_id,absorbed_dose_rate`. Add `latitude=&longitude=&altitude=` for ISS sensors. The tutorial's `fields+=` syntax failed ("Invalid key: fields+"); bare field names work. A request with no field filter → HTTP 500 "No columns specified" |
| EDA | `https://visualization.osdr.nasa.gov/eda/api/missions/` (metadata); data are embedded in `https://visualization.osdr.nasa.gov/eda/dashboard_{mission}` (e.g. `dashboard_RR-9`, 0.6 MB) and `…/eda/data_tables` (all missions, 35 MB) | `curl -s …/eda/dashboard_RR-20`, then parse `<script id="data">` | JSON: `telemetry_data` (a JSON string: `time`, `temperature_iss/_ground` °C, `rh_iss/_ground` %, `co2_iss/_ground` ppm, `milestones`) and `radiation_data` (daily `gcr`, `saa`, `total` mGy/day, `accumulated` mGy). Details in §7 |

**RadLab units (inferred, not stated in the API):** `absorbed_dose_rate` is µGy/h. Cross-checks: the Artemis I HERA HSU1 max of 8,012 matches the paper's storm-shelter belt peak of 134 µGy/min = 8,040 µGy/h. The MSL value of 9.2 → 0.22 mGy/day matches published Mars-surface values. Confirm on RadLab's Settings page before relying on it.

### Human studies in OSDR

Inspiration4 (SpaceX, 16–18 Sep 2021, 4 civilians C001–C004, both sexes). The project is split into 10 OSDs by tissue ([Overbey et al. 2024](https://doi.org/10.1038/s41467-024-48806-z); [SOMA site](https://soma.weill.cornell.edu/)). Common time points: **L-92, L-44, L-3, FD1–FD3 (swabs/skin only), R+1, R+45, R+82, R+194**.

| OSD | Content | Variables (non-omics in bold) | Format / size | Access |
|---|---|---|---|---|
| OSD-569 (LSDS-7, GLDS-561) | Whole blood | **CBC, 23 analytes**: WBC, RBC, Hgb, Hct, MCV, MCH, MCHC, RDW, platelets, MPV, neutrophil/lymphocyte/monocyte/eosinophil/basophil % and absolute. **Each value with lab range min/max**; 28 samples (4 crew × 7 time points). Plus direct RNA-seq, m6A, WGS, clonal hematopoiesis | `LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv` (9 KB, wide), `…upload_SUBMITTED.csv` (26 KB, long: ANALYTE, VALUE, RANGE_MIN, RANGE_MAX, UNITS, SUBJECT_ID, SEX, TEST_DATE); omics xlsx 90–120 MB | Open (processed); raw reads controlled |
| OSD-575 (LSDS-8, GLDS-579) | Serum | **CMP, 19 analytes**: albumin, A/G, ALP, ALT, AST, bilirubin, BUN, BUN/creatinine, Ca, CO2, Cl, creatinine, eGFR, globulin, **glucose**, K, total protein, Na; with ranges. **Eve Technologies immune panel (HD71)**, **cardiovascular panel (HDCVD9)**: α2-macroglobulin, AGP, **CRP**, fetuin-A, fibrinogen, haptoglobin, L-selectin, PF4, SAP. **Alamar NULISA immune panel** | CSV 6–142 KB + xlsx 323 KB | Open |
| OSD-656 (LSDS-64) | Urine | **Alamar NULISAseq 200-plex inflammation panel** | CSV 115 KB + xlsx | Open |
| OSD-570 | PBMC | snRNA-seq, snATAC-seq, TCR/BCR repertoire | large | Processed open; raw controlled |
| OSD-571 | Plasma | proteomics, EVPs, metabolomics, cfDNA/cfRNA | large | same |
| OSD-572 / OSD-573 | Oral, nasal, skin swabs / Dragon capsule swabs | metagenomics, metatranscriptomics (in-flight FD1–3 included) | large | same |
| OSD-574 | Deltoid skin biopsy | spatial transcriptomics (GeoMx), microbiome | large | same |
| OSD-630 / OSD-687 | Stool / T cells | metagenome / histone ChIP | large | same |

Physiology from the same mission is **not in OSDR**. Apple Watch Series 6 HR, HRV, SpO2, activity, sound and barometric pressure (worn in-flight ~1.3 days from FD2). Cognition battery (10 tests, 26 administrations). Alertness/mood survey, sleep self-report (6.7 ± 0.7 h in-flight), Butterfly iQ+ ultrasound (bladder, jugular vein, eye; 108 in-flight clips), ocular alignment. These went to the "SOMA Data Portal and the TRISH EXPAND TrialX database" ([Jones et al., Nature 2024](https://doi.org/10.1038/s41586-024-07648-x)). The Nature supplement contains only a .docx and a .pdf; no per-sample source data.

Other human OSDR studies (verified titles via API). All are omics; none has vitals:

| OSD | Who | N / time points | Data | Note |
|---|---|---|---|---|
| OSD-903 / OSD-943 | Axiom-1 (Apr 2022) | 2 astronauts; L-14 d, R+1 d, R+3 mo | Blood RNA-seq / methylation | OSDR holds metadata only; data in GEO [GSE276490](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE276490) |
| OSD-530 | JAXA Cell-Free Epigenome | 6 ISS astronauts; pre/in/post | Plasma cfRNA | JAXA |
| OSD-174 | JAXA | 10 ISS astronauts | Hair-follicle microarray | JAXA |
| OSD-542 | JAXA confinement analog | 2 × 8 men, 14 days | Blood microarray | Isolation analog |
| OSD-316 | IBMP cosmonauts | 5; L-25, FD64, FD129, R+1, R+7, R+30 | IgM repertoire | Long-duration ISS |
| OSD-359 | IBMP cosmonauts | pre (L-30), R0, R+7 | Exhaled breath condensate proteome | |
| OSD-353 | IBMP analogs | 5 (21-d head-down bed rest) + 5 (21-d dry immersion) | Plasma proteome | |
| OSD-140 | Mars-500 | 6 crew × 6 time points (day -7, 60, 168, 300, 512, 527) | Blood DNA methylation only (36 arrays) | The description mentions mood and biochemistry, but no such files exist (§7) |
| OSD-53 / OSD-483 | NASA Shuttle crews | 14 STS astronauts; L-10, R+0, R+3 (OSD-483) | Blood stress genes / plasma sEV small RNA | |
| OSD-195, -198, -51, -370 | Bed-rest volunteers | 21–60 days | Muscle transcriptome | |

Searches for Polaris Dawn, Fram2, HERA, CHAPEA, Concordia, "Apple Watch" and "actigraphy" returned **no human datasets** in OSDR.

## 2. Other NASA human data

| Source | What exists | Access reality |
|---|---|---|
| **LSDA → NASA Life Sciences Portal (NLSP)** — `lsda.jsc.nasa.gov` now redirects to https://nlsp.nasa.gov ; data request: https://nlsp.nasa.gov/explore/lsdahome/datarequest | Archived HRP/flight study data, Standard Measures pages (`/explore/home/lsda_sm`, `…/lsda_sm_hera`), LSAH pages, data-request portal and guidelines (routes seen in the site bundle) | JS app, content not crawlable. Historic process ([NTRS 20170009502](https://ntrs.nasa.gov/api/citations/20170009502/downloads/20170009502.pdf)): scoping ≤6 mo, review 2–6 mo, IRB 2–4 mo, crew consent, DUA plus audit. Medical data US crew only; usually needs funded peer-reviewed research. Not hackathon-usable |
| **LSAH** (Lifetime Surveillance of Astronaut Health) | Occupational medical surveillance of NASA astronauts | Same single request form as LSDA ([NTRS 20120007708](https://ntrs.nasa.gov/api/citations/20120007708/downloads/20120007708.pdf)); astronauts set full/partial/no research access. Summaries only appear in publications |
| **HRP Standard Measures** (ISS, HERA, NEK, :envihab) | Core physiological, psychological, biological measures before, during and after missions. In HERA and NEK: **weekly mood/mental-state questionnaires; serum cortisol at start, middle, end** ([NTRS 20220014080](https://ntrs.nasa.gov/citations/20220014080)) | Shared with concurrent investigators via data-sharing agreements, otherwise retrospective access. Not public |
| **HERA / CHAPEA** | HERA: 4 crew, 45 days. Latest dated item on the NASA page is the Oct 2024 crew ([page](https://www.nasa.gov/mission/hera/), updated Aug 2026). CHAPEA: Mission 1 25 Jun 2023 → 6 Jul 2024; Mission 2 19 Oct 2025 → 31 Oct 2026 (378 days); collects "physical and behavioral health and performance" data ([page](https://www.nasa.gov/humans-in-space/chapea/), updated 28 Oct 2026) | No data release statement; 0 datasets in OSDR and data.nasa.gov; NTRS has 3 CHAPEA items, none a dataset. Not public |
| **ISS long-duration crew biochemistry and immune series** | 27 astronauts, mean ~165 days; time-resolved biochemical and immune measures before, during and after flight; findings tied to bone resorption, kidney function, immune dysregulation ([Frontiers in Physiology 2023](https://doi.org/10.3389/fphys.2023.1219221)) | Deposited in LSDA; request via https://nlsp.nasa.gov/explore/lsdahome/datarequest. Not public |
| **TRISH EXPAND** (Baylor/TrialX) | De-identified commercial-crew data: multi-omics, smartwatch sleep and activity, cognitive tests, questionnaires (I4 confirmed via Jones et al.) | Proposal-based. Review by the EXPAND Data Privacy and Release Board; 2026 Step-1 deadline was 23 Apr 2026 ([TRISH 2026 call](https://spacehealth.bcm.edu/prog/2026_expand_data_analysis/), [BCM FAQ](https://www.bcm.edu/academic-centers/space-medicine/expand/expand-database-biorepository-faq)). BCM pages failed TLS from our network, so the details come from search snippets |
| **NASA Twins Study** | 1-year ISS vs ground twin, multi-omics, cognition, physiology ([Science 2019](https://doi.org/10.1126/science.aau8650)) | Not in OSDR (search "Twins" → no human study). Reportedly in LSDA, request-only like the 27-astronaut set. **Unverified**: science.org returned 403 and there is no open full text |
| **NASA Task Book** https://taskbook.nasaprs.com/tbp/index.cfm | Descriptions, progress reports and bibliography for every HRP task, filterable by HRP element (ExMC, HHC, BHP, SR, HFBP…) and by the HRP Risks/Gaps (IRP Nov 2024) | Open text, no data. Good for "why this exam matters" content |
| **data.nasa.gov** (CKAN; API `https://data.nasa.gov/api/action/package_search?q=…`) | Mostly mirrors OSDR studies. Useful finds: **ISS TEPC dose** (below), **MSL RAD Level 2** | 0 hits for LSAH and HERA |
| **Artemis II** (Apr 2026) | ARCHeR (actigraphy: sleep, light, motion; cognition; teamwork) and other crew studies | No data release found; RadLab has no 2026 Artemis records |

### NASA open-data portals (reference documentation, verified 2026-11-14)

- **Science Data Portal** https://science.data.nasa.gov/ : SMD catalog across astrophysics, biological and physical sciences, earth, heliophysics, planetary. Entry point for discovery, not an API. Biological and physical sciences filter: https://science.data.nasa.gov/search?rendered_item=biological+and+physical+sciences ; Science Discovery Engine: https://science.data.nasa.gov/science-discovery-engine ; license: https://science.data.nasa.gov/about/license . Human-health data still resolves to OSDR (§1).
- **data.nasa.gov** https://data.nasa.gov/ : CKAN catalog. API `https://data.nasa.gov/api/action/package_search?q=TEPC&rows=1` returned `success: true` on 2026-11-14; each response links its own help (`/api/3/action/help_show?name=package_search`). Dataset list: https://data.nasa.gov/dataset/ ; about: https://data.nasa.gov/about .
- **api.nasa.gov** https://api.nasa.gov/ : API catalog and key service (api.data.gov). No auth needed to explore; `DEMO_KEY` allows 30 req/h and 50 req/day per IP, a personal key 1,000 req/h; usage in `X-RateLimit-Limit` / `X-RateLimit-Remaining` headers. On 2026-11-14 the doc example `planetary/apod?api_key=DEMO_KEY` returned HTTP 500 and `DONKI/FLR` returned 404, so don't depend on it for the demo. None of its APIs carry crew health data.

### Radiation dosimetry (the most usable real space data)

| Instrument (RadLab `instrument_id`) | Where | Coverage seen | Cadence |
|---|---|---|---|
| `DosTel1`, `DosTel2` | ISS Columbus (ASI DORELI) | DosTel1 2009-07-31 → 2024-10-29 | ~1.5 min, with lat/lon/alt |
| `Liulin-5-D1/D3` | ISS (Bulgarian) | seen 2012, 2015 | ~1.4 min |
| `SPACEDOS02A-F-2019`, `REM-*`, `RAD-COL1A2-pre` | ISS (SRAG/LBNL curated, by module) | seen 2019-12 | varies |
| `Lidal`, `REM-Lid` | ISS (ALTEA-LIDAL) | seen 2022 | 5 min |
| `Liulin-MO-AB/CD-Orbit` | ExoMars TGO, Mars orbit | seen 2019, 2022 | ~1 min |
| `MSL-RAD-Surface` | Gale crater, Mars surface | 2015-01-01 → 2024-06-03 | ~17 min |
| `CRaTER-D1D2` | LRO, lunar orbit | 2009-06-26 → 2024-06-18 | hourly |
| `Artemis-I-HERA-HSU1/HSU2`, `Artemis-I-EAD-MU01`, `Artemis-I-M42-SN127` | Orion cabin / storm shelter | 2022-11-16 → 2022-12-11 | HERA 1 min, EAD/M-42 5 min |
| `BPD` | unidentified (seen 2022–2025-06) | — | 1 min |

- **ISS TEPC (JSC SRAG)**, 2010-04-29 → 2018-04-11, CDF files at https://spdf.gsfc.nasa.gov/pub/data/international_space_station_iss/dos_tepc/. Easier is HAPI CSV: `https://cdaweb.gsfc.nasa.gov/hapi/data?id=ISS_DOSANL_TEPC&time.min=2017-08-01T00:00:00Z&time.max=2017-08-08T00:00:00Z&parameters=DOSE,DOSE_EQ60` gives DOSE in µGy/min, DOSE_EQ60 in µSv/min, ~1-min resolution; metadata at `…/hapi/info?id=ISS_DOSANL_TEPC`. Our probe: 0.41 mGy/day, 0.90 mSv/day. The 10 Sep 2017 solar-particle-event day averaged about the same (0.41 mGy/day) at this sensor. Don't assume every SPE spikes cabin dose.
- **Artemis I**: dose equivalent 26.7–35.4 mSv over the mission depending on location. Belt-pass peaks 69–287 µGy/min. Shielding and orientation changes cut dose ~50%. GCR dose equivalent rates up to 60% below earlier deep-space probes. The authors deposit to RadLab ([Berger/Matthiä et al., Nature 2024](https://doi.org/10.1038/s41586-024-07927-7)). Helga/Zohar phantom vest results: DLR said in 2024 that the comparison was still in progress ([DLR](https://www.dlr.de/en/latest/news/2024/orion-spacecraft-radiation-protection-tested-initial-findings-from-artemis-i-moon-mission)).
- **MSL RAD**: also archived in PDS PPI ([RDR SIS](https://pds-ppi.igpp.ucla.edu/volume/MSLRAD_1002/DOCUMENT/RAD_RDR_SIS.HTM)). RadLab is far easier.

## 3. Other agencies

| Agency / source | Finding | Access |
|---|---|---|
| ESA Erasmus Experiment Archive https://eea.spaceflight.esa.int/ | Experiment descriptions (metadata), not raw data | Portal returned **HTTP 401** on 2026-11-06 |
| ESA / DLR bed-rest (incl. AGBRESA 60-day 6° head-down tilt with artificial gravity, :envihab Cologne) | Many open-access papers. Standard timeline vocabulary: BDC-n (baseline), HDTn, R+n ([PMC13140337](https://europepmc.org/article/PMC/PMC13140337)) | "Data… generated as part of ESA studies… can be requested directly from ESA" ([PMC12558760](https://europepmc.org/article/PMC/PMC12558760), 2025). Not public |
| JAXA | OSD-530, OSD-174, OSD-542 (above) | Open processed omics |
| IBMP (Russia) | OSD-316, -353, -359, -140 (Mars-500) | Open processed omics |
| CSA open data (open.canada.ca CKAN) | **PRET (Performance Readiness Evaluation Tool)**: neurocognitive results from PRET v1–5 plus D-KEFS, PASAT, **PVT**, TOVA, WAIS-IV, WMS, **DANA**, **WinSCAT**; ground lab testing with Mars-500 heritage ([dataset](https://open.canada.ca/data/en/dataset/c22fa749-b005-4956-bf68-2ac2b9e68d31)) | Open Government Licence – Canada; posted 2017. The data resource (~412 MB) points to `ftp://ftp.asc-csa.gc.ca/users/OpenData_DonneesOuvertes/pub/PRET/`. Anonymous login works, but that folder returns **550 / file not found**, and the HTTPS mirror timed out. Not obtainable today; subject count unknown |
| CSA Bio-Monitor / Astroskin, Vascular series | No open dataset found ("Bio-Monitor", "Astroskin", "vascular astronaut" → 0 CSA datasets) | — |

## 4. Terrestrial proxy datasets (all landing pages verified 2026-11-06)

| Indicator in brief | Dataset | Key facts |
|---|---|---|
| HR + sleep (wrist) | PhysioNet [`sleep-accel`](https://physionet.org/content/sleep-accel/) | **Apple Watch** PPG HR (bpm) + accelerometer + polysomnography-labelled sleep, 31 subjects; 550 MB zip; ODC-By |
| HRV, activity, sleep, stress hormones | PhysioNet [`mmash`](https://physionet.org/content/mmash/) | 22 healthy people, 24 h beat-to-beat RR, actigraphy, sleep quality, anxiety/emotion scales, saliva cortisol/melatonin; **23 MB**; ODbL |
| Orthostatic BP/HR (re-entry, post-flight analog) | PhysioNet [`prcp`](https://physionet.org/content/prcp/) | 10 healthy subjects, slow/fast tilt + stand-up, ECG + continuous BP; 54 MB; ODC-By |
| Resting ECG/HRV, BP | PhysioNet [`fantasia`](https://physionet.org/content/fantasia/), [`nsr2db`](https://physionet.org/content/nsr2db/), [`autonomic-aging-cardiovascular`](https://physionet.org/content/autonomic-aging-cardiovascular/) | Fantasia 40 subjects × 120 min ECG/resp (half with BP), 293 MB. NSR2DB 24-h RR series, 11 MB. Autonomic Aging 1,121 subjects ECG + continuous BP, 5.2 GB |
| Stress, EDA, skin temp, SpO2 | PhysioNet [`noneeg`](https://physionet.org/content/noneeg/) (20 subjects, wrist EDA/temp/accel + SpO2/HR, **3.7 MB**); [`wearable-exam-stress`](https://physionet.org/content/wearable-exam-stress/) (Empatica E4 during real exams + grades, 82 MB); [WESAD](https://archive.ics.uci.edu/dataset/465/wesad+wearable+stress+and+affect+detection) (15 subjects, chest + wrist) | ODC-By (PhysioNet). WESAD: "scientific, non-commercial purposes" with credit ([original page](https://ubi29.informatik.uni-siegen.de/usi/data_wesad.html)) |
| **Blood sugar (mg/dL)** | [`cgmacros`](https://physionet.org/content/cgmacros/) | 45 people (15 healthy, 16 prediabetic, 14 T2D), 10 days free-living, 2 CGMs + meals/photos + activity + blood labs, 627 MB, **CC BY-NC-SA 4.0** |
| Blood sugar + wearable | [`big-ideas-glycemic-wearable`](https://physionet.org/content/big-ideas-glycemic-wearable/) | Dexcom G6 + Empatica E4 for 10 days, standardized breakfasts; 4.7 GB zip; ODC-By |
| Sleep staging (EEG) | [`sleep-edfx`](https://physionet.org/content/sleep-edfx/) | 8.1 GB (subsets downloadable); ODC-By |
| Exercise PPG | [`wrist`](https://physionet.org/content/wrist/) (50 MB); [PPG-DaLiA](https://archive.ics.uci.edu/dataset/495/ppg+dalia) | PPG + IMU + reference ECG |
| Consumer wearable, long-term | [Fitbit MTurk (Zenodo 53894)](https://zenodo.org/records/53894) (30 users, minute-level HR, steps, sleep, 2016, 45 MB, **CC BY 4.0**); [LifeSnaps (Zenodo 7229547)](https://zenodo.org/records/7229547) (4-month Fitbit Sense + surveys, 615 MB, CC BY 4.0); [PMData](https://datasets.simula.no/pmdata/) (16 people × 5 months, Fitbit Versa 2: ~21 M HR samples, 1,836 sleep-score days, plus wellness self-reports incl. mood, sleep quality, stress; CC BY 4.0) | Daily rhythm, missing-data realism |
| Population reference ranges | [NHANES 2021–2023](https://wwwn.cdc.gov/nchs/nhanes/continuousnhanes/default.aspx?Cycle=2021-2023) | Verified files under `https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/`: `DEMO_L`, `BPXO_L` (oscillometric BP), `BMX_L`, `CBC_L`, `BIOPRO_L`, `GLU_L`, `GHB_L` (HbA1c), `SLQ_L` (sleep), `DPQ_L` (PHQ-9 mood), `PAQ_L`; SAS XPT 0.1–2.6 MB each (`pandas.read_sas`); US public domain |
| Clinical record structure | [MIMIC-IV demo](https://physionet.org/content/mimic-iv-demo/) | 100 patients, 15 MB, ODbL |
| Restricted (skip) | [DREAMT](https://physionet.org/content/dreamt/) | Restricted access |

No open Antarctic or Concordia physiological dataset was found. A 2026 scoping review of ICE monitoring ([PMC13724870](https://europepmc.org/article/PMC/PMC13724870)) is a good source of *methods*, not data.

## 5. Master table

Usability: 5 = download and use within an hour; 1 = not obtainable during the event.

| Name | URL | What's in it | Format | License / access | Use | How it feeds a prototype |
|---|---|---|---|---|---|---|
| I4 CBC (OSD-569 / LSDS-7) | osdr.nasa.gov/osdr/data/osd/files/569 | 23 CBC analytes × 4 crew × 7 time points, with ranges | CSV | Open | **5** | Real astronaut lab values plus built-in normal ranges for color coding; "pre vs R+1" deltas |
| I4 CMP + serum panels (OSD-575 / LSDS-8) | …/files/575 | CMP incl. glucose, electrolytes, renal/liver; CRP, fibrinogen, cytokines | CSV/xlsx | Open | **5** | Blood-sugar, kidney, inflammation cards; immune hazard story |
| I4 urine panel (OSD-656) | …/files/656 | 200-plex inflammation | CSV | Open | 4 | Non-invasive sample concept |
| I4 omics (OSD-570–574, 630, 687) | osdr.nasa.gov | RNA, proteome, metabolome, microbiome | large xlsx/fastq | Processed open; raw controlled | 2 | Background only |
| OSDR Search/Meta/Files API | osdr.nasa.gov/osdr/data/… | Study discovery and downloads | JSON | Open | 4 | Live "evidence" links in the app |
| Biological Data API v2 | visualization.osdr.nasa.gov/biodata/api/ | Cross-study metadata/sample queries | CSV/JSON | Open | 4 | Same, tabular |
| RadLab API | visualization.osdr.nasa.gov/radlab/api/ | ISS, Mars surface, lunar orbit, Artemis I dose rates | CSV/TSV/JSON | Open | **5** | Real dose timeline, cumulative mSv vs limits, SPE/belt-pass alert demo, ISS → Moon → Mars presets |
| ISS TEPC via CDAWeb HAPI | cdaweb.gsfc.nasa.gov/hapi | Dose + dose equivalent per minute + ISS position, 2010–2018 | CSV (HAPI), CDF | Open (NASA) | **5** | Orbit-dependent dose (SAA), daily mSv budget |
| EDA (ISS environment) | visualization.osdr.nasa.gov/eda/dashboard_RR-20 | ISS cabin CO2 (ppm), temperature (°C), RH (%) at 1–5 min, flight vs ground, 14 windows 2014–2024; daily GCR/SAA/total dose | JSON embedded in HTML | Open | **4** | Real cabin-CO2 time series for the "hostile closed environment" panel (CO2 → headache/cognition alerts), comfort band for temperature/RH |
| SOMA browser | soma.weill.cornell.edu | Gene-level I4/Twins/mouse results | Web | Open | 2 | Citations only |
| Axiom-1 (OSD-903/943, GEO GSE276490) | ncbi GEO | Blood RNA-seq, methylation, 2 crew | GEO | Open | 2 | Background |
| JAXA / IBMP human omics | OSD-530, 174, 542, 316, 353, 359, 140 | Plasma, hair, blood; confinement, bed rest; Mars-500 methylation only | various | Open processed | 2 | Background only |
| NLSP / LSDA / LSAH | nlsp.nasa.gov | Archived flight and analog human data | — | Request + IRB + DUA (months) | 1 | Cite as the real-world data pipeline |
| HRP Standard Measures (ISS, HERA) | nlsp.nasa.gov/explore/home/lsda_sm | Core vitals, labs, cognition, behavior | — | DSA only | 1 | Use the *measure list* as the app's checklist |
| TRISH EXPAND | spacehealth.bcm.edu | Commercial-crew wearables, cognition, omics | — | Proposal + privacy board | 1 | Cite as precedent for wearables in flight |
| NASA Task Book | taskbook.nasaprs.com | HRP project descriptions by risk | Web text | Open | 2 | Explanations per hazard/indicator |
| ESA EEA / ESA–DLR bed rest | eea.spaceflight.esa.int | Experiment metadata; bed-rest data on request | — | 401 / request | 1 | Timeline vocabulary (BDC, HDT, R+) |
| CSA PRET | open.canada.ca … c22fa749… | Neurocognitive tests (PVT, WinSCAT, DANA…) | CSV/DOCX via FTP | OGL-Canada, files unreachable (550) | 1 | Cite only; use the test list for a PVT-style task |
| PhysioNet sleep-accel | physionet.org/content/sleep-accel/ | Apple Watch HR + PSG sleep | CSV/txt | ODC-By | 4 | Realistic watch HR + sleep for simulated crew |
| PhysioNet MMASH | physionet.org/content/mmash/ | 24-h RR, actigraphy, sleep, mood, cortisol | CSV | ODbL | **5** | One full "crew day" template |
| PhysioNet prcp | physionet.org/content/prcp/ | Tilt and stand: HR, BP | WFDB | ODC-By | 4 | Orthostatic-intolerance alert on return to gravity |
| Fantasia / NSR2DB / Autonomic Aging | physionet.org | ECG, RR, BP | WFDB | ODC-By / ODbL | 3–4 | HRV baselines |
| noneeg / exam-stress / WESAD | physionet.org, UCI | EDA, temperature, HR, SpO2, stress labels | CSV/WFDB/pkl | ODC-By / WESAD non-commercial | 3–5 | Stress and mood proxy signals |
| CGMacros / BIG IDEAs | physionet.org | CGM glucose + meals + wearables | CSV | CC BY-NC-SA / ODC-By | 3–4 | Blood-sugar trace in mg/dL around meals |
| Fitbit MTurk / LifeSnaps / PMData | zenodo.org, datasets.simula.no | Minute-level HR, steps, sleep, self-reports | CSV/JSON | CC BY 4.0 | 4–5 | Multi-week personal baselines and gaps |
| NHANES 2021–2023 | wwwn.cdc.gov/nchs/nhanes | BP, CBC, chemistry, glucose, HbA1c, sleep, PHQ-9 | XPT | Public domain | 4 | Population percentiles for "normal" bands |

## 6. Gaps and caveats

- In-flight time series for vitals, sleep and mood: only in controlled archives (EXPAND, LSDA). Any "in-flight drift" in a demo must be **simulated**. State the assumption and cite the source paper for each shift.
- The I4 CBC/CMP reference ranges are the commercial lab's, not NASA medical thresholds. Female-specific ranges appear as separate analytes (e.g. "HEMOGLOBIN (FEMALE)").
- RadLab units are inferred (µGy/h); `BPD` is unidentified; RadLab data are for research/visualization, and SRAG data carry citation expectations.
- **WebSearch quota was exhausted mid-task.** The Twins Study access terms and ESA's current bed-rest request route were not re-verified.

## 7. Second-pass findings

**OSDR Environmental Data App: the ISS cabin-air data is real and downloadable.** There is no JSON data API. Each page embeds its full dataset in a `<script id="data">` block:
- `https://visualization.osdr.nasa.gov/eda/dashboard_{mission}`: one mission. RR-9 is 0.6 MB; RR-20 is 4.2 MB.
- `https://visualization.osdr.nasa.gov/eda/data_tables`: all missions, 35 MB, with keys suffixed `_RR-1`, `_RR-9`, etc.

Parse it with:

```python
d = json.loads(html.unescape(script_text))
tel = json.loads(d["telemetry_data"])
```

The `tel` keys are `time`, `temperature_iss`/`_ground` (°C), `rh_iss`/`_ground` (%), `co2_iss`/`_ground` (ppm) and `milestones` (Launch, transfer, Undock, Return). `d["radiation_data"]` holds daily `gcr`, `saa`, `total` (mGy/day) and `accumulated` (mGy). Units come from the app's plot labels in `telemetry_plots.js` and `radiation_plots.js`.

| Mission (window) | Samples | Step | T °C median (min–max) | RH % median | CO2 ppm median (max) |
|---|---|---|---|---|---|
| RR-1 (2014-09-20 → 11-01) | 12,087 | 5 min | 22.6 (18.5–26.8) | 43 | 3,192 (4,667) |
| RR-3 (2016-04-08 → 05-28) | 14,385 | 5 min | 21.7 | 40 | 3,638 (6,977) |
| RR-12 (2019-04-17 → 05-28) | 11,785 | 5 min | 22.1 | 41 | 2,675 (3,668) |
| RR-10 / RR-23 (2020-12 → 2021-01) | 43,103 / 52,600 | 1 min | 21.9 | 36–38 | 2,141–2,165 |
| RR-18 (2021-12-20 → 2022-08-20) | 100,801 | 1 min | 22.4 | 49 | no CO2 |
| RR-25 (2022-11-29 → 2023-02-02) | 93,763 | 1 min | 23.2 | 37 | 3,156 (5,544) |
| RR-20 (2023-11-10 → 2024-04-30) | 67,976 | 1 min | 22.9 | 36 | 3,147 (9,043) |
| RR-28 (2024-03-21 → 05-06) | 61,488 | 1 min | 22.5 | 38 | 3,892 (8,886) |

Further missions with telemetry are RR-5, -6, -7, -9 and -19. Across all CO2 samples (n = 415,375): median 3,080 ppm, 95th percentile 4,266 ppm. To convert, 1 mmHg ≈ 1,316 ppm, so the median is about 2.3 mmHg. Daily total dose across the 10 radiation windows was 0.19–0.55 mGy/day, median 0.30.

Data caveats:
- Some values are sensor dropouts (CO2 0–500 ppm, RH 125.8 %); filter them out.
- APEX and VEG entries are plant-hardware readings, not cabin air (APEX-03 down to 1.5 °C; APEX-04 and VEG have no flight T/RH/CO2).
- RR-9 telemetry is stamped 2018-08-14 → 09-18, while its radiation series and the mission are 2017. Suspect a year offset.

Demo use: replay a real CO2 and temperature week as the habitat-environment feed, and trigger CO2 alerts on real ~9,000 ppm excursions.

**Mars-500 (OSD-140): no behavioral data.** It has 7 files: the ISA metadata plus Illumina 450K methylation, raw and processed. That covers 36 samples, 6 male crew at day -7, 60, 168, 300, 512 and 527. The ISA sample table has no mood, POMS or biochemistry columns. The mood and glucose phenotypes behind the description come from Liang et al. 2019 and are not deposited in OSDR. The 2022 re-analysis ([iScience, PMC9194130](https://doi.org/10.1016/j.isci.2022.104493)) puts only intermediate methylation results on Mendeley Data.

**CSA PRET: not obtainable.** The open.canada.ca record dates from 2017. Its main resource (~412 MB "CSV" folder) points to `ftp://ftp.asc-csa.gc.ca/users/OpenData_DonneesOuvertes/pub/PRET/`. Anonymous FTP logs in and shows `users/` (ExP, GPITT-IPMTT, SESS, TRP, communications, spacemed), but changing into `OpenData_DonneesOuvertes` or `spacemed` is refused (550), and the direct file path returns "not found". `ftp.asc-csa.gc.ca` over HTTP/HTTPS timed out. The subject count is not stated in the metadata. Usability downgraded to 1.

**CHAPEA and HERA: no public crew data.**
- CHAPEA Mission 1 ran 25 Jun 2023 → 6 Jul 2024. Mission 2 ran 19 Oct 2025 → 31 Oct 2026, so it ended last week. The NASA page mentions "physical and behavioral health and performance" data but makes no release statement.
- HERA: the latest dated item on NASA's page is the Oct 2024 crew; the page was updated Aug 2026.
- NTRS describes the analog Standard Measures cadence: weekly mood/mental-state questionnaires and serum cortisol at start, middle and end of HERA/NEK missions ([NTRS 20220014080](https://ntrs.nasa.gov/citations/20220014080)). This is useful as a model for in-app prompts.
- 0 CHAPEA/HERA datasets in OSDR or data.nasa.gov.

**Request-only, but tells us in-flight drift exists:** biochemistry and immune time series for 27 ISS astronauts (mean ~165 days) are in LSDA, requested via the NLSP data-request portal ([Frontiers in Physiology 2023](https://doi.org/10.3389/fphys.2023.1219221)). Concordant in-flight changes relate to bone resorption, renal-stone risk and T-cell function. Cite it to justify simulated drift directions.

**Licenses now verified:**
- WESAD: scientific, non-commercial use with credit ([source](https://ubi29.informatik.uni-siegen.de/usi/data_wesad.html)).
- PMData: CC BY 4.0 ([source](https://datasets.simula.no/pmdata/)).
- Twins Study: science.org returned 403, so its access terms remain unverified.

## Sources

- OSDR Search, Metadata, Files APIs: https://osdr.nasa.gov/osdr/data/search?term=Inspiration4&type=cgene ; https://osdr.nasa.gov/osdr/data/osd/meta/903 ; https://osdr.nasa.gov/osdr/data/osd/files/569
- OSDR Biological Data API (OpenAPI spec): https://visualization.osdr.nasa.gov/biodata/api/
- RadLab GUI/API and tutorial: https://visualization.osdr.nasa.gov/radlab/gui/overview/ ; https://visualization.osdr.nasa.gov/radlab/api/ ; https://osdr-tutorials.readthedocs.io/en/latest/pages/guides/radlab_portal.html
- RadLab description: https://astrobiology.com/2024/03/03/nasa-open-science-for-life-in-space-the-radlab-portal-radlab-data-api/
- EDA: https://visualization.osdr.nasa.gov/eda/ ; https://visualization.osdr.nasa.gov/eda/api/missions/ ; https://visualization.osdr.nasa.gov/eda/dashboard_RR-9 ; https://visualization.osdr.nasa.gov/eda/data_tables ; https://visualization.osdr.nasa.gov/eda/static/js/telemetry_plots.js (units)
- Mars-500 OSD-140 files: https://osdr.nasa.gov/osdr/data/osd/files/140 ; iScience 2022: https://doi.org/10.1016/j.isci.2022.104493
- CHAPEA: https://www.nasa.gov/humans-in-space/chapea/ ; HERA: https://www.nasa.gov/mission/hera/ ; NTRS API: https://ntrs.nasa.gov/api/citations/search?q=CHAPEA
- ISS 27-astronaut time-resolved biochemistry/immune (LSDA): https://doi.org/10.3389/fphys.2023.1219221 (PMC10376710)
- WESAD license: https://ubi29.informatik.uni-siegen.de/usi/data_wesad.html
- OSDR tool menu / SOMA news: https://www.nasa.gov/osdr-latest-news-soma-publications
- I4 data access in OSDR (Nat Commun 2024): https://doi.org/10.1038/s41467-024-48806-z (PMC11094041)
- I4 molecular and physiological changes (Nature 2024, Apple Watch, cognition, ultrasound, data availability): https://doi.org/10.1038/s41586-024-07648-x (PMC11357997)
- SOMA: https://soma.weill.cornell.edu/
- Axiom-1 study: https://osdr.nasa.gov/bio/repo/data/studies/OSD-903 ; GEO https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE276490
- Artemis I radiation (Nature 2024): https://doi.org/10.1038/s41586-024-07927-7 (PMC11446838)
- DLR MARE: https://www.dlr.de/en/latest/news/2024/orion-spacecraft-radiation-protection-tested-initial-findings-from-artemis-i-moon-mission
- ISS TEPC: https://spdf.gsfc.nasa.gov/pub/data/international_space_station_iss/dos_tepc/ ; https://cdaweb.gsfc.nasa.gov/hapi/info?id=ISS_DOSANL_TEPC ; data.nasa.gov record `iss-tissue-equivalent-proportional-counter-tepc-dose-analyzer-10-s-data-61b24`
- MSL RAD PDS: https://pds-ppi.igpp.ucla.edu/volume/MSLRAD_1002/DOCUMENT/RAD_RDR_SIS.HTM
- LSDA/LSAH request process: https://ntrs.nasa.gov/api/citations/20170009502/downloads/20170009502.pdf ; https://ntrs.nasa.gov/api/citations/20120007708/downloads/20120007708.pdf
- Standard Measures: https://nlsp.nasa.gov/explore/home/lsda_sm ; https://nlsp.nasa.gov/explore/home/lsda_sm_hera ; https://ntrs.nasa.gov/citations/20220014080
- NLSP data request: https://nlsp.nasa.gov/explore/lsdahome/datarequest
- TRISH EXPAND: https://spacehealth.bcm.edu/prog/2026_expand_data_analysis/ ; https://www.bcm.edu/academic-centers/space-medicine/expand/expand-database-biorepository-faq ; https://blogs.bcm.edu/2026/03/17/from-the-labs-trish-opens-commercial-spaceflight-database-to-scientific-community/
- NASA Task Book: https://taskbook.nasaprs.com/tbp/index.cfm
- Artemis II ARCHeR actigraphy (news): https://universemagazine.com/en/wrist-device-monitored-the-astronauts-health-during-the-flight-to-the-moon/
- Bed-rest data availability: https://europepmc.org/article/PMC/PMC12558760 ; AGBRESA timeline: https://europepmc.org/article/PMC/PMC13140337 ; ICE monitoring review: https://europepmc.org/article/PMC/PMC13724870
- CSA PRET: https://open.canada.ca/data/en/dataset/c22fa749-b005-4956-bf68-2ac2b9e68d31
- PhysioNet: https://physionet.org/content/sleep-accel/ ; /mmash/ ; /prcp/ ; /fantasia/ ; /nsr2db/ ; /autonomic-aging-cardiovascular/ ; /noneeg/ ; /wearable-exam-stress/ ; /cgmacros/ ; /big-ideas-glycemic-wearable/ ; /sleep-edfx/ ; /wrist/ ; /mimic-iv-demo/ ; /dreamt/
- WESAD: https://archive.ics.uci.edu/dataset/465/wesad+wearable+stress+and+affect+detection ; PPG-DaLiA: https://archive.ics.uci.edu/dataset/495/ppg+dalia
- Fitbit MTurk: https://zenodo.org/records/53894 ; LifeSnaps: https://zenodo.org/records/7229547 ; PMData: https://datasets.simula.no/pmdata/
- NASA Science Data Portal: https://science.data.nasa.gov/ (verified 2026-11-14)
- data.nasa.gov CKAN catalog and API: https://data.nasa.gov/ ; https://data.nasa.gov/api/action/package_search?q=TEPC&rows=1 (verified 2026-11-14)
- NASA Open APIs, authentication and rate limits: https://api.nasa.gov/ ; https://api.nasa.gov/assets/html/authentication.html (verified 2026-11-14)
- NHANES 2021–2023: https://wwwn.cdc.gov/nchs/nhanes/continuousnhanes/default.aspx?Cycle=2021-2023
