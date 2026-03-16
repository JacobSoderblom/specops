# ExecPlan: Plan Skill

**Status:** Complete
**Branch:** feature/plan-skill
**PR:** (filled when opened)
**Author:** Claude Opus 4.6
**Created:** 2026-03-16

---

## Purpose

Add a `/specops:plan <feature-name>` skill that lets users plan features entirely inside the AI chat. The AI reads the codebase, fills out a complete ExecPlan, creates the feature branch, writes the plan file, and commits it — all guided by a skill template. This closes the loop: `scan` bootstraps the project, `plan` bootstraps each feature.

## Progress

- [x] Milestone 1: Create plan skill template (2026-03-16)
- [x] Milestone 2: Wire into skills generator (2026-03-16)
- [x] Milestone 3: Verify end-to-end (2026-03-16)

## Surprises & Discoveries

(None yet)

## Decision Log

**Decision:** Make plan skill framework-owned (always overwritten on `specops update`).
**Context:** Users should not need to maintain the planning instructions — they're part of the framework.
**Rationale:** Same pattern as `specops-scan`. The skill defines the process; users own the output (the ExecPlan files), not the instructions.

**Decision:** The feature name comes from the skill argument, not a CLI flag.
**Context:** `/specops:plan add-dark-mode` passes "add-dark-mode" as args to the skill.
**Rationale:** Keeps the flow entirely in-chat. No CLI command needed.

## Outcomes & Retrospective

Shipped all 3 milestones. The plan skill template is 170 lines across 5 phases. Refactored `loadScanSkillTemplate()` into a generic `loadSkillTemplate(filename)` to avoid copy-paste for each framework-owned skill. No deferred work.

---

## Context and Orientation

### Relevant Code Areas

- `src/generators/skills.ts` — skill generation, framework-owned skill pattern (`specops-scan` as reference)
- `src/templates/scan-skill.md` — reference for how a framework-owned skill template is structured (243 lines, 6 phases)
- `src/templates/exec-plan.md` — the ExecPlan template the plan skill will tell the AI to fill out
- `docs/exec-plans/PLANS.md` — ExecPlan process docs (three modes, non-negotiable requirements, living sections)

### Invariants and Constraints

- Framework-owned skills are loaded from `src/templates/` via `loadTemplate()` pattern — same as scan skill
- The `"files"` field in `package.json` must include `src/templates` for templates to ship with the npm package
- Skill names map to `.claude/skills/<name>/SKILL.md` — the name `specops-plan` follows the `specops-scan` convention

### Architecture Alignment

Touches only the `generators` and `templates` components. No config schema changes — the plan skill doesn't need config input (it reads `specops.yaml` and `CLAUDE.md` at runtime via the AI).

## Plan of Work

Single approach: create `src/templates/plan-skill.md` and add it to the skills generator as a framework-owned skill (same pattern as `specops-scan`). The template instructs the AI to read the codebase, fill the ExecPlan, create a branch, write the file, and commit.

## Concrete Steps

### Milestone 1: Create plan skill template

1. Create `src/templates/plan-skill.md` with:
   - Frontmatter (name, description)
   - Phase 1: Parse the feature name from args (or ask user)
   - Phase 2: Read `specops.yaml`, `CLAUDE.md`, and relevant codebase areas
   - Phase 3: Fill out the ExecPlan template (all sections)
   - Phase 4: Create branch, write file, commit
   - Phase 5: Present plan to user for review

### Milestone 2: Wire into skills generator

1. In `src/generators/skills.ts`: add `specops-plan` as framework-owned skill using the `loadTemplate()` pattern (copy from scan skill)
2. Update the JSDoc comment at top of file to mention `specops-plan`
3. Build and verify with `pnpm run build`

### Milestone 3: Verify end-to-end

1. Run `specops update` — verify `specops-plan` skill appears in output
2. Check `.claude/skills/specops-plan/SKILL.md` is generated with correct content

## Validation and Acceptance

### Acceptance Criteria

- [ ] `src/templates/plan-skill.md` exists with comprehensive AI instructions
- [ ] `specops update` generates `.claude/skills/specops-plan/SKILL.md`
- [ ] Plan skill is always overwritten (framework-owned)
- [ ] `pnpm run build` passes clean
- [ ] Plan skill references the ExecPlan template sections correctly
