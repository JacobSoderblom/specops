---
name: "specops-plan"
description: "Plan a feature using an ExecPlan — a living document that tracks design, implementation, and outcomes. Use when starting non-trivial work."
---

# Specops Plan

## Purpose

Create a feature branch and a filled-out ExecPlan for a new feature. The ExecPlan is a living markdown document committed to the branch that tracks the feature from design through implementation to outcome.

**Usage:** `/specops:plan <feature-name>` — e.g., `/specops:plan add-dark-mode`

If no feature name is provided, ask the user what they want to build.

---

## Workflow

Work through these phases in order.

---

### Phase 1: Parse Feature Name

1. Read the argument passed to this skill. It is the feature name (e.g., `add-dark-mode`).
2. If no argument was provided, ask the user: "What feature do you want to plan?"
3. Normalize the name to kebab-case for use in branch names and file paths.
   - `"Add Dark Mode"` → `add-dark-mode`
   - `"fix login bug"` → `fix-login-bug`
4. Derive:
   - **Branch name:** `feature/<feature-name>`
   - **Plan file path:** `docs/exec-plans/<feature-name>.md`

---

### Phase 2: Understand the Project

Read these files to understand the project context:

1. **`specops.yaml`** — tech stack, agent roles, escalation rules, architecture components
2. **`CLAUDE.md`** — agent entry point, design principles, conflict resolution hierarchy
3. **`docs/exec-plans/PLANS.md`** — ExecPlan process, template, and guidelines

Then read the codebase areas relevant to the feature. Use the feature name and any context the user provided to identify:
- Which components/modules will be affected
- Existing code patterns in those areas
- Related tests
- Any architecture docs relevant to the feature

Output a brief summary:
```
Planning: <feature-name>
Branch: feature/<feature-name>
Plan: docs/exec-plans/<feature-name>.md

Relevant areas:
- <file/module>: <why it's relevant>
- <file/module>: <why it's relevant>
```

---

### Phase 3: Fill Out the ExecPlan

Create the ExecPlan file using the template structure from `docs/exec-plans/PLANS.md`. Fill in every section with real content based on your codebase analysis. Do NOT leave template placeholders.

#### Header

```markdown
# ExecPlan: <Feature Title>

**Status:** Draft
**Branch:** feature/<feature-name>
**PR:** (filled when opened)
**Author:** <agent model name>
**Created:** <today's date YYYY-MM-DD>
```

#### Purpose

Write one clear paragraph explaining what is being built and why. Reference the user's request. State the user or system need this addresses.

#### Progress

List milestones as unchecked items. Each milestone should be:
- Small enough to complete in one focused session
- Independently testable
- Ordered by dependency
- Concrete (name specific files, types, functions)

```markdown
- [ ] Milestone 1: <concrete description>
- [ ] Milestone 2: <concrete description>
- [ ] Milestone 3: <concrete description>
```

#### Surprises & Discoveries

Write `(None yet)` — this gets filled during implementation.

#### Decision Log

Record any design decisions you made while planning. If there were multiple approaches, explain why you chose this one. Format:

```markdown
**Decision:** <what>
**Context:** <why this matters>
**Rationale:** <why this option over alternatives>
```

If no decisions yet, write `(None yet)`.

#### Outcomes & Retrospective

Write `(Not yet complete)` — this gets filled at the end.

#### Context and Orientation

This is the most important section for future agents. Write it as a map:

**Relevant Code Areas** — Name the specific files, modules, types, and functions involved. Be precise enough that an agent can find them with search tools.

**Invariants and Constraints** — What rules must not be broken? What assumptions does the existing code make? What's easy to accidentally violate? Reference escalation rules from `specops.yaml` if relevant.

**Architecture Alignment** — Which components (from `specops.yaml` architecture section) does this feature touch? Any contract or boundary changes?

#### Plan of Work

Write the high-level strategy in 2-4 sentences. What's the approach? Why this approach over alternatives?

#### Concrete Steps

Break down each milestone into ordered, actionable steps. Each step should:
- Name the files to create or modify
- Describe what changes are needed
- Be specific enough that an agent can execute without guessing

```markdown
### Milestone 1: <Name>

1. In `src/path/to/file.ts`, add <specific change>
2. Create `src/path/to/new-file.ts` with <what it contains>
3. Update tests in `src/path/to/test.ts` to cover <scenario>
```

#### Validation and Acceptance

**Test Expectations** — What tests should exist? What coverage is expected?

**Acceptance Criteria** — Observable, testable outcomes. Not "works correctly" but specific conditions:

```markdown
- [ ] <specific, observable, testable criterion>
- [ ] <specific criterion>
- [ ] All tests pass
- [ ] No lint warnings
- [ ] Code formatted
```

---

### Phase 4: Create Branch, Write, Commit

1. Check if the branch `feature/<feature-name>` already exists:
   - If yes, switch to it
   - If no, create it from the current branch: `git checkout -b feature/<feature-name>`

2. Write the ExecPlan to `docs/exec-plans/<feature-name>.md`

3. Commit the plan as the first commit on the branch:
   ```
   git add docs/exec-plans/<feature-name>.md
   git commit -m "Add ExecPlan for <feature-name>"
   ```

---

### Phase 5: Present for Review

Show the user the key sections of the plan:
- Purpose (what and why)
- Milestones (scope overview)
- Any decisions made

Then ask:

```
The ExecPlan is committed to feature/<feature-name>.

Review the plan at docs/exec-plans/<feature-name>.md

When you're ready:
- To start implementation, say "go" or "implement"
- To adjust the plan, tell me what to change
- To implement a specific milestone, say "implement milestone 1"
```

---

## Important Notes

- **Read before planning.** The plan quality depends on understanding the codebase. Don't guess — read the relevant files.
- **Be concrete.** Every milestone and step should name specific files, types, and functions. "Implement the feature" is not a step.
- **Match governance to scope.** A small bug fix needs 2 milestones. A major feature might need 5-6. Don't over-plan simple work.
- **Reference the config.** Use `specops.yaml` to understand escalation rules, architecture boundaries, and design principles. Flag anything that would trigger escalation.
- **The plan is living.** Tell the user the plan will be updated during implementation — Decision Log, Surprises, Progress checkboxes all get filled in as work proceeds.
