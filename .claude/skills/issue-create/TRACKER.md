# Tracker

Issues of `billygk/galagans` (default branch `main`); state is the label.

## Labels

| Label | Meaning | Set by |
|---|---|---|
| `ready-for-agent` | Spec complete, Open questions `None` | issue-create |
| `needs-info` | Blocked on a human answer | issue-create, issue-implement |
| `agent-in-progress` | An agent is implementing it | issue-implement (removed by issue-merge if left) |
| `opus` | Implement with Opus instead of Sonnet | issue-create |

Create missing labels once: `gh label create <name> --color <hex> --description "<meaning>"`.

## Commands

```bash
gh issue create --title "<title>" --label "ready-for-agent,<bug|enhancement>[,opus]" --body-file <file>
gh issue edit <n> --add-label <label> --remove-label <label>
gh issue comment <n> --body-file <file>
gh issue list --label ready-for-agent
```

## Spec sections

An issue body has exactly these `###` sections, in order:
`Problem`, `Acceptance criteria`, `Out of scope`, `Touch points`, `Design notes`, `Sources`, `Docs`, `Open questions`.

- **Feature reference:** `Problem` names the feature id from `ideas/features.md` (e.g. F11) when there is one.
- **Sources:** every threshold, rule row, hint or medical claim in the issue, with its `research/` file and section (and source id, e.g. `[S26]`). `None` when the issue has none.
- **Docs:** which of `ideas/crew-health-companion.md`, `ideas/features.md`, `ideas/mockups/src/*`, `README.md` or `CLAUDE.md` change. `None` when nothing does.
