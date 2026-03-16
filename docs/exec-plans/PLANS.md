# ExecPlans

ExecPlans are **living documents checked into the repo** that track a feature from design through implementation to outcome. Each plan is self-contained, maintained throughout implementation, and committed alongside code on the feature branch.

---

## How ExecPlans Work

### Three Modes

1. **Authoring** -- Agent researches the codebase, fills Context and Orientation, designs Plan of Work, defines Validation criteria. The plan is committed as the first commit on the feature branch.
2. **Implementing** -- Agent works through Concrete Steps, updating Progress, Decision Log, and Surprises & Discoveries at every stopping point. Plan updates are committed alongside code.
3. **Discussing** -- Reviewers (human or agent) read the plan in the PR diff. The plan provides full context for the code changes without needing separate design docs.

### Non-Negotiable Requirements

- **Self-contained.** A newcomer reading only the ExecPlan understands what is being built, why, and how to verify it.
- **Living.** The plan is updated throughout implementation -- not written once and forgotten.
- **Novice-friendly.** Plain language. No jargon without definition. Someone unfamiliar with the codebase can follow along.
- **Verifiable.** Every milestone and acceptance criterion is observable and testable.

### Guidelines

- Use plain language and concrete examples over abstract descriptions.
- State observable outcomes ("GET /api/x returns 200 with body matching Y") not vague goals ("works correctly").
- Include explicit repo context -- name files, types, and functions the reader needs to find.
- Each milestone should be independently verifiable: tests pass, behavior observable, no partial states.

---

## Plan Location and Lifecycle

- Plans live at `docs/exec-plans/<feature-name>.md`
- Created on the feature branch, committed alongside code
- Updated throughout implementation (Progress, Decision Log, Surprises)
- Merged with the PR -- the plan becomes permanent project history
- Completed plans stay in place; the Outcomes & Retrospective section marks them done

---

## Milestones

Break work into milestones that are:
- **Small enough** to complete and verify in one focused session
- **Independently testable** -- each milestone leaves the codebase in a working state
- **Ordered by dependency** -- later milestones build on earlier ones
- **Concrete** -- "Add `parse_temperature` function with 5 unit tests" not "implement parsing"

---

## Living Plan Sections

These sections are updated throughout implementation:

### Progress
Check off milestones as they complete. Add timestamps. Note anything that deviated from the plan.

### Decision Log
Record every non-obvious decision with context and rationale. Future readers need to understand *why*, not just *what*.

### Surprises & Discoveries
Document anything unexpected: API behavior that differs from docs, edge cases not anticipated, performance characteristics, bugs found in adjacent code. This section is the most valuable for future work.

### Outcomes & Retrospective
Filled at completion. What shipped, what was deferred, what would you do differently. Include PR number and any metrics.

---

## Template

Copy this skeleton when creating a new ExecPlan. Replace bracketed placeholders. Delete guidance comments (lines starting with `>`).

```markdown
# ExecPlan: [Feature Name]

**Status:** Draft | In Progress | Complete
**Branch:** feature/[name]
**PR:** (filled when opened)
**Author:** [agent or human]
**Created:** YYYY-MM-DD

---

## Purpose

> One paragraph: what are we building and why? What user or system need does this address?

## Progress

> Check off milestones as they complete. Add date and any notes.

- [ ] Milestone 1: [description]
- [ ] Milestone 2: [description]
- [ ] Milestone 3: [description]

## Surprises & Discoveries

> Document anything unexpected during implementation. This section is the most
> valuable for future work -- do not skip it even if everything went smoothly.

(None yet)

## Decision Log

> Record every non-obvious choice. Format: **Decision:** what. **Context:** why
> this matters. **Rationale:** why this option over alternatives.

(None yet)

## Outcomes & Retrospective

> Filled at completion. What shipped, what was deferred, what would you do
> differently next time?

(Not yet complete)

---

## Context and Orientation

> Follow the codemap principle: be a "map of a country, not an atlas of maps of
> its states." This section should give a newcomer broad orientation -- where to
> look and what NOT to touch.
>
> - Name important files, types, and functions without linking (agents can find them)
> - Call out non-obvious invariants and cross-cutting concerns
> - Describe the layer boundaries the feature touches
> - Keep it to 1-2 pages -- breadth over depth

### Relevant Code Areas

> List the key files, modules, and types involved. Name them precisely so agents
> can find them with search tools.

### Invariants and Constraints

> What rules must not be broken? What assumptions does the existing code make?
> What is easy to accidentally violate?

### Architecture Alignment

> Which components and boundaries does this feature touch? Any contract changes?

## Plan of Work

> High-level approach. What is the strategy? What are the major phases?
> Why this approach over alternatives?

## Concrete Steps

> Ordered, actionable steps grouped by milestone. Each step should name the
> files to create or modify. Be specific enough that an agent can execute
> without guessing.

### Milestone 1: [Name]

1. [Step description -- name files, types, functions]
2. [Step description]

### Milestone 2: [Name]

1. [Step description]
2. [Step description]

## Validation and Acceptance

> Every criterion must be observable and testable.

### Test Expectations

> What is tested? What coverage is expected for new code?

### Acceptance Criteria

> Observable outcomes. Not "works correctly" but specific, verifiable conditions.

- [ ] [Criterion: specific, observable, testable]
- [ ] [Criterion]
- [ ] All tests pass
- [ ] No lint warnings
- [ ] Code formatted

```

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| Location | `docs/exec-plans/<feature-name>.md` |
| Created | First commit on feature branch |
| Updated | At every stopping point during implementation |
| Reviewed | In the PR diff alongside code |
| Completed | Outcomes section filled, stays in place |
| Template | Copy the skeleton above |