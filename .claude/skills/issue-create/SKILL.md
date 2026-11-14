---
name: issue-create
description: Write a GitHub issue as a spec an agent can implement without asking questions, then publish it. Use when the user wants to create, write or file an issue, ticket or task for later implementation.
argument-hint: "<what to build or fix>"
model: opus
---

The issue is the spec: issue-implement reads nothing else, so anything left out is a guess later. Tracker, labels and commands: [TRACKER.md](TRACKER.md).

Three principles override speed:
- **Clear or asked.** Every point is either decided by the code, the idea, `research/` or the user, or it's a question to the user. Never settle a doubt with an assumption, even a reasonable one.
- **Verified, not remembered.** Every path, symbol, endpoint, topic, value and source in the issue was opened or grepped in this session. If you didn't see it, it doesn't go in.
- **Concise.** The shortest text that leaves nothing to guess.

## Steps

1. **Ground it in the idea and the code.** Read `CLAUDE.md`, the feature in `ideas/features.md` and its section in `ideas/crew-health-companion.md` (mockups in `ideas/mockups/`), the `research/` files behind any threshold or claim, and the code the request touches. Done when every file, class, endpoint, port, MQTT topic and component you will name has been opened and exists (or is marked new), and every threshold has a `research/` source whose exact line you read. Something you looked for and didn't find is a fact to report ("no `RuleSource` port exists yet"), not a gap to fill.

2. **Choose the approach.** Before any detail, ask whether there is more than one reasonable way to solve the problem (not the user's proposed solution: the problem). If there is, ask one `AskUserQuestion` with only the real options, recommended first, each with what it covers, misses and costs; no strawmen to fill a count. If there isn't, say so in one line and go on. Done when the approach is chosen.

3. **Grill the gaps.** List every decision the implementer would otherwise make for the chosen approach:
   - behaviour on errors, empty states and missing data (offline, sensor dropout, no baseline yet)
   - defaults, naming, units, rule table row vs constant
   - which layer and side: crew app (offline, rules) or ground station (receive, store, show)
   - UI placement and NASA display rules (quiet when nominal, icon + word + color, data age and source)
   - which mockup screen and elements the UI copies (`ideas/mockups/NN-*.png`; colours, sizes and status styles from `ideas/ui-guidelines.md`), and any deliberate deviation
   - roles (self, CMO, flight surgeon) and what each sees
   - environment modes it applies to (ISS, Orion, lunar, Mars transit)
   - source labels for data (bracelet, manual, replay, proxy, synthetic)
   - backwards compatibility of IndexedDB data and the sync API
   - the counterpart operation (what undo, delete or decline does with what this creates)
   - existing code or config the change makes redundant

   Answer what the code, the idea or `research/` answers, and note where (file and section). Ask the user everything else, including anything you're unsure about: one `AskUserQuestion` batch at a time, up to 4 questions, each with a recommended option and its reason. A point the sources only half-answer is a question, not an inference. Done when no decision is left open and none rests on your assumption.

4. **Size it.** One issue fits one context window and one PR. If not, split into vertical slices (each through domain, application, adapters, UI and tests, each verifiable alone); each slice is its own issue with `Blocked by #<n>` in Design notes, published in dependency order.

5. **Draft** the body in `.claude/tmp/issue-<slug>.md` using the sections in [TRACKER.md](TRACKER.md#spec-sections):
   - Acceptance criteria: `- [ ] AC<n>: Given …, when …, then …` with concrete values (status codes, statuses, labels, field names, units, numbers). One behaviour each, observable from a test: a returned status, a stored value, a rendered element, a published message. A log is not enough. Include the error and edge cases decided in step 3.
   - Touch points: paths and symbols, `new:` prefix for files to add.
   - Design notes: every step 3 decision, in one line each, and each option rejected in step 2 as `Rejected: <option> — <reason>`.
   - Sources: every threshold or medical claim with its `research/` reference.
   - Docs: which idea, features, mockup or `CLAUDE.md` sections change. UI issues always list `docs/features/<n>-<slug>.md` (feature doc with screenshots).
   - Open questions: `None`.

   Style: Problem in 2–3 sentences; one line per AC, design note and touch point; link to the idea, features or `research/` instead of copying them; no background, intros or filler.

   **AC check with the user.** Before the skeptic, list the ACs to the user. For any AC you couldn't write with concrete values without assuming (a number, a label, a status, a unit, a wording), ask instead of picking. Done when the user has confirmed or corrected every AC that rested on a choice.

6. **Skeptic pass.** Run the `spec-skeptic` agent on the draft file. Fix every finding, or ask the user when the fix is a decision. Repeat until it returns no findings.

   **Final verification.** Grep every existing touch point again and reopen every Sources line; remove or fix anything that doesn't match exactly. Done when every reference in the draft resolves.

7. **Publish** after showing the user the title and body and getting a yes: create the issue with labels `ready-for-agent` plus `enhancement` or `bug`. Add `opus` when the issue adds a new port or touches two or more hot files (`container.ts`, `domain/ports.ts`, `pom.xml`, `package.json`, `CLAUDE.md`, a Spring configuration class); issues with medical sources get Opus anyway from their Sources section. Delete the draft file. Done when the issue URL is returned to the user.

## Rules

- Write for an implementer with no memory of this conversation.
- No implementation code in the issue beyond signatures, payload shapes, rule rows or config snippets that fix a decision.
- Never invent a threshold, citation, path, symbol, API or library behaviour. If `research/` has no source, the threshold is an open question, or a heuristic labeled as such with the user's agreement. If you don't know how a library or API behaves, say so and ask or check its docs; don't describe it from memory.
- Never copy a number or quote from memory: copy it from the source line you opened.
- Words that hide a decision are banned in ACs: "should", "properly", "appropriate", "handle", "etc.", "as needed", "reasonable", "user-friendly". Replace each with the decided value or ask.
- If the user stops answering before Open questions is `None`, publish with `needs-info` instead of `ready-for-agent` and list the questions.
