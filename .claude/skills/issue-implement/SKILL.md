---
name: issue-implement
description: Implement a ready-for-agent GitHub issue end to end, test first from its acceptance criteria, and open a PR. Use when the user asks to implement, build, pick up or work on issue #<n>.
argument-hint: "<issue number>"
model: sonnet
---

**Model:** Sonnet by default. Use Opus instead when the issue is labeled `opus` or its Sources section is not `None` (thresholds, rule rows, hints or other medical logic). Switch with `/model` before starting; if you notice it only at step 1, stop and tell the user.

The issue is the spec. Build exactly its acceptance criteria (ACs), nothing more. Never guess: when the issue doesn't decide something and the code doesn't either, **park** it. Tracker, labels and commands: [../issue-create/TRACKER.md](../issue-create/TRACKER.md).

**Park** = comment on the issue with the numbered questions (each with the options you see and your recommendation), swap `agent-in-progress` for `needs-info`, keep commits local, stop and tell the user.

## Steps

1. **Load the spec.** `gh issue view <n> --comments`. Continue only if it has `ready-for-agent`, Open questions is `None`, and every `Blocked by #<m>` issue is closed; otherwise stop and say why. Done when you can restate each AC as one test.

2. **Claim it.** If `git status --porcelain` isn't empty, stop and say why. If the current branch isn't `main` (and isn't this issue's branch), ask the user: new branch from `origin/main` (recommended) or implement on the current branch. For a new branch, `git fetch origin main` and create `feat/<n>-<slug>` (`fix/<n>-<slug>` for a bug) from `origin/main`; if that branch already exists, check it out instead (resuming a parked issue). Add `agent-in-progress`.

3. **Plan.** Read every touch point, `CLAUDE.md`, the feature in `ideas/features.md` and its section in `ideas/crew-health-companion.md`, and the `research/` files in the issue's Sources. Map each AC to a test (file, test name) and the production files it needs, by layer. Post the map as an issue comment. Done when every AC has a test and nothing in the plan lacks an AC, except the docs.

4. **Build, one AC at a time.** Load the `solid-principles` skill. For each AC:
   - write the test, run it, see it fail for the right reason:
     - backend: `mvn test -DskipFrontend=true -Dtest=<Class>`
     - frontend: `cd src/main/frontend && npm run test -- <path>`
   - write the minimum code to pass it, run it green;
   - commit `<type>(<scope>): <AC summary> (#<n>)`, conventional commits, no `Co-Authored-By` trailer.

   Frontend-only ACs without a test seam (pure layout): verify with `npm run build` and a screenshot, and say so in the PR.

5. **Docs.** Do everything in the issue's Docs section. If the change alters behaviour described in `ideas/crew-health-companion.md` or `ideas/features.md`, update them in the same branch. Update `CLAUDE.md` only for architecture, command or convention changes.

6. **Verify.** `mvn clean verify` green (backend tests plus frontend build and tests). Fix and rerun until it is; three failed attempts at the same failure → park with the output.

7. **Ship.** Push once (`git push -u origin HEAD`) and open the PR ready for review (not draft) without asking.
   - Title: conventional commit with `(#<n>)` suffix.
   - Body: Problem (one line), What changed (by layer), `Closes #<n>`, the AC checklist with each item ticked and the test that proves it, Sources touched, and a "Noticed" note for anything out of scope. End with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
   - Remove `agent-in-progress` and `ready-for-agent`, comment the PR URL on the issue.

   Done when the PR URL is returned to the user. Never approve or merge the PR.

## Rules

- Scope is the ACs. A bug or refactor you spot outside them goes in the PR body under "Noticed", not in the diff.
- Don't change an AC to fit the code. If one is wrong or contradicts another, park.
- Don't weaken, skip or delete an existing test to get green; if one breaks because the issue changes that behaviour, say so in the PR.
- Never add a threshold, rule row or hint without its `research/` source; if the issue lacks one, park.
- Crew-facing logic stays in the frontend; the backend only receives, stores and shows.

## Documentation

- Comments MUST add information the code can't show, never restate it. They SHOULD explain why when it isn't obvious, and SHOULD be one line, in plain English.
- Comments MUST NOT contain commented-out code, change notes, history or narrative; those belong in commits and PRs. TODOs MUST give a reason and SHOULD link an issue.
- Comments and docs MUST describe actual current behaviour and MUST change in the same commit as the code. When in doubt, write less.
