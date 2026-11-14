---
name: issue-orchestrate
description: Implement several ready-for-agent GitHub issues in parallel, one issue-implementer agent per issue in its own git worktree, in waves that avoid dependencies and file conflicts. Use when the user asks to implement several issues, all ready issues, or to run implementation in parallel.
argument-hint: "[issue numbers | all] [--max <n>]"
---

You coordinate; the `issue-implementer` agents build. Never implement, merge or review an issue yourself. Tracker, labels and commands: [../issue-create/TRACKER.md](../issue-create/TRACKER.md).

Runs in the main session because only it can launch agents; subagents can't launch other subagents.

## Steps

1. **Collect.** The given issue numbers, or `all`: `gh issue list --label ready-for-agent --state open --json number,title,labels,body`. Drop issues labeled `agent-in-progress` or `needs-info`, and say which and why. Done when you have the candidate list with each body.

2. **Dependencies.** For each `Blocked by #<m>` in Design notes, check `gh issue view <m> --json state`. An issue is ready only if every blocker is closed. Blocked ones wait for a later run. Done when each candidate is `ready` or `blocked by #…`.

3. **Conflicts.** From each ready issue's Touch points, list the paths it changes or adds. Two issues conflict when they share a path, a new file name, or both touch a hot file: `src/main/frontend/src/container.ts`, `src/main/frontend/src/domain/ports.ts`, `pom.xml`, `src/main/frontend/package.json`, `src/main/frontend/package-lock.json`, `CLAUDE.md`, a Spring configuration class. Done when you have the conflict pairs.

4. **Plan the wave.** Pick the largest set of ready issues with no conflict between any two, up to `--max` (default 3), lowest issue number first on ties. The rest wait for the next run. Pick each wave issue's model: `opus` when the issue is labeled `opus` or its Sources section is not `None`, otherwise `sonnet`. Show the user a table (issue, title, touch points, model, in wave or waiting and why) and the cost (one agent per issue, each a full implementation), and get a yes. Done when the user confirms the wave.

5. **Claim.** For each issue in the wave: `gh issue edit <n> --add-label agent-in-progress`. Done when every wave issue has the label.

6. **Launch.** In one message, one `Agent` call per issue: `subagent_type: issue-implementer`, `isolation: worktree`, `run_in_background: true`, `model: <model from step 4>`, description `Implement #<n>`, prompt `Implement issue #<n> of jdo-lv/galagans. Return the RESULT block.` Done when all are launched; don't poll, the notifications arrive on their own.

7. **Collect results.** As each agent finishes, read its RESULT block. Never write or guess a result for an agent that hasn't reported. For `failed` or a missing block, check the issue's labels and remove a leftover `agent-in-progress`. Done when every agent of the wave has reported.

8. **Report.** One table: issue, status, PR or park questions, ACs proven, shared files touched. Include the model each issue ran on. Then:
   - PRs that touched the same shared file: flag the likely merge conflict and the merge order (lowest issue first).
   - Waiting issues: they start in a new run after this wave's PRs are merged (`issue-merge`), so they branch from a `main` that already has them.

9. **Clean up.** `git worktree list`. For each worktree of this wave whose branch was pushed (`pr`) or parked with commits pushed, run `git worktree remove <path>` only if `git -C <path> status --porcelain` is empty; leave the rest and list them. Done when the user has the list of removed and kept worktrees.

## Rules

- One issue, one agent, one worktree, one branch. Never two agents on the same issue.
- Never exceed `--max` agents at once; never start a waiting issue in the same run.
- Don't merge PRs, approve them, or edit their code. Merging is `issue-merge`, one PR at a time with the user's yes.
- A parked issue stays parked until the user answers on the issue; don't relaunch it in the same run.
