---
name: solid-principles
description: Use when writing or refactoring code, planning architecture, designing a feature, writing tests or debugging in this repo (Kotlin/Spring Boot WebFlux ground station, React/TypeScript PWA crew app). Applies SOLID, TDD and clean code within the project's layering and its "interfaces only at boundaries" rule.
---

# SOLID, TDD and clean code for Crew Health Companion

Write testable, maintainable code with the least structure that solves the problem. Project rules come first; the generic guidance in `references/` applies where they are silent.

## Project rules (override everything below)

- **Layering** (`CLAUDE.md`, "Code architecture"):
  - Frontend `src/main/frontend/src`: `domain` (types, ports) ← `application` (use cases depending on ports) ← `infrastructure` (IndexedDB, HTTP, MQTT, browser adapters) and `ui` (React). `container.ts` is the only place that picks concrete classes.
  - Backend `com.galagans.crewhealth.<domain>`: `api` (controller, DTOs) → `application` (use cases behind interfaces) → `domain` (models, repository ports) ← `infrastructure` (adapters). Spring configuration wires concrete classes.
  - `domain` and `application` never import `infrastructure` or `ui`.
- **Where logic lives:** the crew loop (gateway, rules engine, statuses, explanations) runs in the frontend and works offline. The backend is the ground station: it receives, stores and shows. Never put crew-facing rules in the backend.
- **SOLID as the idea defines it:** `ideas/crew-health-companion.md`, "Engineering principles: SOLID". In short:
  - S: the rules engine evaluates only; explanation text comes from a formatter; React components render and call use cases, no business logic.
  - O: a new rule, device, questionnaire, hazard or corridor is a new row, adapter or file, not a new branch in existing code.
  - L: every `ReadingSource` adapter emits the same FHIR-shaped `Observation`; test fakes (`src/test/fakes.ts`) behave like the real adapters.
  - I: small ports (`CheckInRepository`, `CheckInGateway`, `ConnectivityMonitor`, `ReadingSource`, `RuleSource`, `Clock`, `PacketSender`), never one `HealthService`.
  - D: use cases depend on ports in `domain`; concrete classes only in `container.ts` / Spring config.
- **Interfaces only at boundaries** (storage, network, device, clock, rule source) or where a second implementation exists or is planned. Pure logic with one implementation stays a plain function or class. This beats every "always abstract" rule in the references.
- **Medical content:** every threshold, rule row and hint cites a source already in `research/`. No diagnosing LLM; wording is decision support. Every reading carries its source label (bracelet, manual, replay, proxy, synthetic).
- **Comments:** short, only what the code can't show. No commented-out code, no history.

## Process: test first

```
RED → GREEN → REFACTOR
```

1. **RED:** write a failing test for one behaviour, named as a concrete example ("PVT median 312 ms with baseline 265 ms → cognition caution"). Run it and see it fail for the right reason.
2. **GREEN:** the simplest code that passes.
3. **REFACTOR:** remove duplication (Rule of Three), improve names, keep tests green.

Commands (from `CLAUDE.md`):

| What | Command |
|---|---|
| One backend test class | `mvn test -DskipFrontend=true -Dtest=<Class>` |
| All backend tests | `mvn test -DskipFrontend=true` |
| Frontend tests | `cd src/main/frontend && npm run test` (one file: `npm run test -- <path>`) |
| Full build | `mvn clean verify` |

Test stack:
- Backend: JUnit 5 with `kotlin-test`, `spring-boot-starter-test`, `reactor-test` (`StepVerifier` for `Mono`/`Flux`). No MockK in `pom.xml`; prefer hand-written fakes of the ports.
- Frontend: Vitest, Testing Library, `fake-indexeddb`; fakes in `src/test/fakes.ts`.
- Structure tests as Arrange-Act-Assert (Given/When/Then). Assert concrete values, not "no error".

See [references/tdd.md](references/tdd.md) and [references/testing.md](references/testing.md).

## SOLID questions

| Principle | Ask |
|---|---|
| Single responsibility | Does this have one reason to change? |
| Open/closed | Can I add the new case as a row, adapter or file? |
| Liskov substitution | Can every implementation of this port replace another unnoticed? |
| Interface segregation | Does any caller depend on a method it doesn't use? |
| Dependency inversion | Does the use case depend on a port, not a concrete class? |

See [references/solid-principles.md](references/solid-principles.md).

## Clean code

- **Names:** consistent domain language from the idea and `ideas/features.md` (reading, baseline, corridor, rule, tier, packet, agenda). Same concept, same name, in Kotlin and TypeScript.
- **Functions:** few parameters (3+ → a parameter object), one level of abstraction, no hidden side effects, guard clauses over nesting, early return over `else`.
- **Domain types where they prevent mistakes:** units and identifiers that are easy to mix up (bpm vs ms, mmHg vs ppm, flight day vs calendar day, crew id) get a type or a named field with the unit. Don't wrap every primitive by reflex.
- **Errors:** real errors (throw / `Mono.error`) at boundaries, handled where a decision can be made. Never swallow.
- **Reactive backend:** no blocking calls on reactive threads.
- **Untrusted keys:** check with `Object.hasOwn(...)`, never the `in` operator.

Size guides from the references (classes under ~50 lines, methods under ~10, two instance variables) are smells to look at, not hard limits.

See [references/clean-code.md](references/clean-code.md), [references/object-design.md](references/object-design.md).

## Complexity

- YAGNI: build only what an acceptance criterion or the idea's must-haves need now.
- KISS: the simplest thing that works.
- DRY after the third duplication. "A little duplication is better than the wrong abstraction."
- Watch for change amplification (one change touches many files) and cognitive load.

See [references/complexity.md](references/complexity.md), [references/code-smells.md](references/code-smells.md), [references/architecture.md](references/architecture.md). Patterns ([references/design-patterns.md](references/design-patterns.md)) should emerge from refactoring, not be forced; the gateway's adapters are the expected Adapter/Strategy use.

## Checklists

Before coding:
1. Which acceptance criterion or must-have does this serve?
2. Which test comes first?
3. Which layer does it belong to, and does it need a port (boundary) or not?

After the code works:
1. All tests pass (`mvn test -DskipFrontend=true`, `npm run test`).
2. No dead code, no speculative abstraction, names still accurate.
3. No `infrastructure` import from `domain` or `application`; crew-facing logic not in the backend.
4. Every new threshold or hint cites `research/`.
