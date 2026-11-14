---
name: issue-merge
description: Merge a PR whose build is green and that is mergeable, then close its issue. Use when the user asks to merge, land or ship PR #<n> or issue #<n>, or to close an issue once its PR is merged.
argument-hint: "<PR or issue number>"
model: sonnet
---

Merges only what is ready: never bypass a failing gate (no `--admin`). Tracker, labels and commands: [../issue-create/TRACKER.md](../issue-create/TRACKER.md).

**Stop** = tell the user which gate failed and what is missing, change nothing.

## Steps

1. **Resolve the PR and its issue.** `gh pr view <n> --json number,state,title,headRefName,closingIssuesReferences`; if `<n>` is an issue, take the open PR whose `closingIssuesReferences` contains it (`gh pr list --search "<n> in:body" --json number,closingIssuesReferences`). Stop when there is no open PR, or the PR closes no issue (ask the user which issue, or merge without one). Done when you have one open PR and its issue number(s).

2. **Check the gates.** All must hold, otherwise stop listing every failing one:
   - Build: `gh pr checks <pr>` every check `pass`; a pending one is not a pass, offer to wait (`gh pr checks <pr> --watch`). If the repo has no checks, run `mvn clean verify` on the PR branch locally and require it green.
   - Mergeable: `gh pr view <pr> --json mergeable,mergeStateStatus` is `MERGEABLE` and not `BEHIND`/`DIRTY`. If behind, offer `gh pr update-branch <pr>`, then check the build again.
   - Not changes-requested: if anyone requested changes (`gh pr view <pr> --json reviewDecision` is `CHANGES_REQUESTED`), stop; the merge waits for them.

3. **Merge.** Show the user the PR title, issue and gate results and get a yes. Then `gh pr merge <pr> --squash --delete-branch` (the squash commit takes the PR title). Done when `gh pr view <pr> --json mergeCommit` returns the merge SHA.

4. **Close the issue.** For each issue: comment `Merged by #<pr> (<sha>).`, then `gh issue close <issue>` unless the `Closes #<n>` already closed it, and remove any `agent-in-progress` / `ready-for-agent` label left. Done when the issue is closed with the comment and its URL is returned to the user.

## Rules

- Never merge with a failing gate, even if asked to: tell the user what to fix.
- Don't approve, dismiss reviews or rerun failed jobs on your own.
- The user's yes in step 3 is per PR.
