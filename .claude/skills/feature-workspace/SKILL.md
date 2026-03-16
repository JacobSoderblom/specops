---
name: "feature-workspace"
description: "Autonomous feature implementation using ExecPlans -- living documents checked into the repo. Use for non-trivial features requiring planning, implementation, and review."
---

# Feature Workspace

## Purpose

For non-trivial features, create an **ExecPlan** -- a living document at `docs/exec-plans/<feature>.md` that tracks the feature from design through implementation to outcome. The plan is committed to the feature branch alongside code, updated throughout implementation, and reviewed as part of the PR.

See `docs/exec-plans/PLANS.md` for the full template and guidelines.

---

## When to Use This Pattern

**Use for:**
- Non-trivial features requiring planning
- Architectural changes affecting multiple components
- Features spanning multiple files or modules
- Complex bug investigations requiring documentation

**Skip for:**
- Trivial bug fixes (single file, obvious solution)
- Simple refactoring with no architectural impact
- Documentation-only changes
- Well-defined, single-agent tasks with clear scope

**When in doubt:** Ask the user if an ExecPlan is needed.

---

## Workflow

1. Create a feature branch
2. Copy the ExecPlan template from `docs/exec-plans/PLANS.md`
3. Fill in Context, Plan of Work, and Concrete Steps
4. Commit the plan as the first commit on the branch
5. Implement milestone by milestone, updating Progress and Decision Log
6. Fill Outcomes & Retrospective at completion
7. Open PR with ExecPlan and code visible together

---

## Commit Strategy

```
Add ExecPlan for <feature>          # First commit: plan only
Milestone 1: <description>          # Code + plan progress
Milestone 2: <description>          # Code + plan progress
Complete ExecPlan outcomes           # Final plan update
```

PRs can use squash merge if desired, or keep the full history to show plan evolution.