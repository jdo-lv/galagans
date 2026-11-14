---
name: feature-evaluate
description: Investigate a suggested new feature, judge it against the lead idea, the research, the code and the hackathon clock, and give a short, honest verdict. Use when the user asks to evaluate, assess, review or give feedback on a suggested, proposed or new feature or idea for the app, before it is added to the features list or specced with issue-create.
argument-hint: "<feature suggestion>"
model: opus
---

Read-only: give a verdict, don't write a spec or edit docs. Adding the feature to `ideas/features.md` or speccing it with issue-create comes after, and only if the user asks.

Principles:
- **Real, not polite.** If the suggestion is weak, duplicated, off-brief or too late in the build order, say so plainly. Don't praise it to soften the verdict.
- **Verified, not remembered.** Every claim about the code, the idea or `research/` cites a path or section you opened in this session. If you didn't find something, say "not found in X". Don't say it doesn't exist.
- **Concise.** Each point is one line. Skip criteria that don't apply.

## Steps

1. **Restate the ask** in one sentence: what the crew member, CMO or flight surgeon gets. If you can't, the suggestion is ambiguous: list what's unclear and stop.

2. **Investigate.** Each check is done when you have a fact with its location:
   - **Overlap:** the feature in `ideas/features.md` (F-id) and the section in `ideas/crew-health-companion.md` that already covers it, fully or in part. Check "Later" (F21) and the pitch-only features too.
   - **Code:** what in `src/` already does this or would change. Grep for it. Name the files and say whether each is a hot file (`container.ts`, `domain/ports.ts`, `pom.xml`, `package.json`, `CLAUDE.md`, a Spring config class).
   - **Evidence:** the `research/` section that supports or contradicts each medical claim or threshold. Open the line and read it. If there's no source, say so.
   - **Constraints:** check `CLAUDE.md` "Design constraints". The inputs must come from device classes that fly. Thresholds must be sourced or set against the person's baseline. The app must work offline. NASA display rules apply. Data is private by default, and only the process is gamified. No emotion inference and no diagnosing. Crew-facing logic stays in the frontend. It must differ from EveryWear.
   - **Gates:** apply G1–G5 in `ideas/viability-checklist.md` to the suggestion itself.
   - **Clock:** where it would land in the `ideas/features.md` "Build order", and what it would delay or cut before the feature freeze.

3. **Judge.** Pick one verdict:
   - `Adopt`: fits as written. Name its priority (Must/Nice) and its build-order slot.
   - `Modify`: the core is worth having but the form is wrong. Give the smallest change that rescues it.
   - `Merge into F<n>`: it's a variation of an existing feature. Say what to add to that feature.
   - `Pitch only`: worth saying on a slide, not worth building before the freeze.
   - `Reject`: off-brief, unsourced medical logic, breaks a constraint, or low value for its cost.

   Base the verdict on demo value for the brief's five questions (`challenge.md`) and the scores in `ideas/viability-checklist.md` against build cost and risk. Don't decide by how it sounds.

4. **Report** in this format, and nothing else:

   ```
   **<feature name>** — <Verdict>
   Ask: <one sentence>
   Why: <one or two lines, the deciding reason>

   - Overlap: <F-id and what it already covers | none found>
   - Evidence: <research/file.md §x supports | contradicts | no source>
   - Constraints: <ok | breaks: …>
   - Gates: <failing gates with reason | all pass>
   - Cost: <files touched, hot files, size S/M/L, build-order slot>
   - Risks: <what could go wrong in the demo or with judges>

   Change: <for Modify / Merge: the minimal reshaping; otherwise omit>
   Open questions: <only questions only the user can answer; otherwise omit>
   ```

5. **Offer the follow-up** in one line, for `Adopt`, `Modify` or `Merge` only: add it to `ideas/features.md` and the build order, or spec it with issue-create.

## Rules

- Never edit code, docs or the tracker during the evaluation.
- Never invent a threshold, citation, path or library behaviour to strengthen or weaken the case.
- Judge the suggestion, not the person who made it.
- When the evidence is mixed, give the verdict anyway and name the one fact that would flip it.
