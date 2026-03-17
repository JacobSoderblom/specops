# ExecPlan: Support for Codex

**Status:** Complete
**Branch:** feature/support-codex
**PR:** (filled when opened)
**Author:** Claude Opus 4.6
**Created:** 2026-03-16

---

## Purpose

specops currently generates governance files exclusively for Claude Code (CLAUDE.md, `.claude/skills/`). OpenAI's Codex CLI is a growing alternative that uses `AGENTS.md` as its project instruction file. This feature adds Codex as a generation target so teams using Codex (or both tools) get the same governance scaffolding — escalation rules, architecture boundaries, agent roles, and workflow documentation — without maintaining separate files by hand.

## Progress

- [x] Milestone 1: Schema and config — add `agents.targets` to config (2026-03-16)
- [x] Milestone 2: AGENTS.md template and generator (2026-03-16)
- [x] Milestone 3: Wire into update command and init flow (2026-03-16)
- [x] Milestone 4: Tests — smoke-tested all target modes (2026-03-16)

## Surprises & Discoveries

- No test framework was configured in the project, so formal unit tests were not added. Milestone 4 was validated via manual smoke tests covering all three target modes (claude-only default, codex-only, both) and invalid target rejection.

## Decision Log

**Decision:** Model agent targets as `agents.targets: string[]` with a default of `["claude"]`.
**Context:** We need users to opt in to which agent tools they use. Some teams use Claude Code only, some use Codex only, some use both. The config must support all three cases without breaking existing configs that have no `targets` field.
**Rationale:** An array of strings is simple, extensible (can add `"cursor"`, `"windsurf"` later), and a missing field defaults to `["claude"]` for full backward compatibility. Alternatives considered: a boolean `codex: true` (not extensible), a separate top-level `targets` section (over-scoped for what's needed).

**Decision:** Generate AGENTS.md with the same governance content as CLAUDE.md but without Claude-specific features (skills table, `.claude/skills/` references).
**Context:** Codex reads `AGENTS.md` for project instructions. It has no skills/slash-command system. The governance content (escalation rules, architecture, roles, design principles) is agent-agnostic and should appear in both files.
**Rationale:** Rather than trying to make one template serve both agents with conditionals, a separate `agents-md.hbs` template is cleaner. The templates share the same data model (`SpecopsConfig`) but differ in structure. This avoids complex conditional logic in Handlebars and lets each template evolve independently as the agent tools diverge.

**Decision:** Skills generation remains Claude-only. No skill stubs for Codex.
**Context:** Codex has no equivalent of `.claude/skills/`. Skills are a Claude Code feature.
**Rationale:** Generating skill files for a tool that can't use them would be confusing. If Codex adds a similar feature later, we add support then.

---

## Context and Orientation

### Relevant Code Areas

**Config schema** — `src/config/schema.ts` defines `SpecopsConfig` and all nested interfaces. `AgentsConfig` currently has only `roles: AgentRole[]`. We'll add `targets?: string[]` here.

**Config loader** — `src/config/loader.ts` validates YAML against the schema. The `validate()` function checks required fields and types. Needs a new optional validation block for `agents.targets`.

**CLAUDE.md generator** — `src/generators/claude-md.ts` loads `src/templates/claude-md.hbs`, renders with Handlebars, writes `CLAUDE.md`. This is the pattern to follow for the Codex generator.

**CLAUDE.md template** — `src/templates/claude-md.hbs` is the Handlebars template. The Codex template will be similar but omit the skills table and `.claude/skills/` references.

**Update command** — `src/commands/update.ts` runs all generators in sequence. Needs to conditionally call the Codex generator when `"codex"` is in `agents.targets`, and conditionally skip Claude generation when `"claude"` is not in targets.

**Init command** — `src/commands/init.ts` has both scan and interactive modes. The interactive wizard could ask about agent targets. The scan skill already handles this implicitly (the AI can detect which tools are in use).

**Skills generator** — `src/generators/skills.ts` generates `.claude/skills/` directories. This should only run when `"claude"` is in targets.

### Invariants and Constraints

- **Backward compatibility is critical.** Existing `specops.yaml` files have no `agents.targets` field. The loader must treat missing `targets` as `["claude"]` so `specops update` continues to work identically for existing users.
- **User-owned files are never overwritten.** AGENTS.md follows the same pattern as CLAUDE.md — it's framework-owned and always regenerated.
- **Config schema changes trigger escalation.** This is a schema addition (new optional field), not a breaking change. The YAML format remains backward-compatible.
- **Template content quality.** AGENTS.md must be self-contained and useful to Codex without referencing Claude-specific concepts.

### Architecture Alignment

This feature touches three components:
- **config** — schema extension and validation (new optional field)
- **generators** — new generator module, conditional execution of existing generators
- **templates** — new Handlebars template
- **cli** — update command orchestration, init command messaging

No contract or boundary changes. The generator interface pattern (`(projectDir, config) => Promise<string[]>`) remains the same.

## Plan of Work

Add Codex as a first-class generation target alongside Claude Code. The approach is: extend the config schema with an optional `agents.targets` array, create a new AGENTS.md template and generator following the existing CLAUDE.md pattern, and conditionally run generators based on the targets list. Existing behavior is preserved when `targets` is absent. This is additive — no existing code is removed or refactored.

## Concrete Steps

### Milestone 1: Schema and Config

1. In `src/config/schema.ts`, add `targets?: string[]` to the `AgentsConfig` interface with JSDoc explaining valid values (`"claude"`, `"codex"`).
2. In `src/config/loader.ts`, add optional validation for `agents.targets` — if present, must be a non-empty string array. Each entry should be one of the known targets.
3. Add a helper function `getTargets(config: SpecopsConfig): string[]` in a new utility or in the loader that returns `config.agents.targets ?? ["claude"]`.

### Milestone 2: AGENTS.md Template and Generator

1. Create `src/templates/agents-md.hbs` — a Handlebars template for Codex's AGENTS.md. Adapts the CLAUDE.md structure but:
   - Removes the Skills table (Codex has no skills)
   - Removes references to `.claude/skills/`
   - Keeps: project context, architecture reference, tech stack, escalation rules, conflict resolution, design principles, agent roles, resources
   - Uses neutral language ("agents" not "Claude")
2. Create `src/generators/agents-md.ts` following the same pattern as `src/generators/claude-md.ts`:
   - `renderAgentsMd(config: SpecopsConfig): Promise<string>` — renders the template
   - `generateAgentsMd(projectDir: string, config: SpecopsConfig): Promise<string>` — writes AGENTS.md with generation notice

### Milestone 3: Wire into Update and Init

1. In `src/commands/update.ts`:
   - Import the new generator
   - Add a `getTargets()` call to determine which targets are active
   - Only generate CLAUDE.md when `"claude"` is in targets
   - Only generate AGENTS.md when `"codex"` is in targets
   - Only generate `.claude/skills/` when `"claude"` is in targets
2. In `src/commands/init.ts`:
   - Add an interactive prompt for agent targets in the wizard
   - Update scan mode messaging to mention Codex support
3. In `src/generators/skills.ts` — no changes needed; the update command controls whether it's called.

### Milestone 4: Tests

1. Create `src/__tests__/generators/agents-md.test.ts` — test that `renderAgentsMd` produces valid markdown with expected sections.
2. Create `src/__tests__/config/targets.test.ts` — test the `getTargets()` helper and validation logic.
3. Test backward compatibility: a config without `agents.targets` should produce the same CLAUDE.md output and no AGENTS.md.

## Validation and Acceptance

### Test Expectations

- Unit tests for `renderAgentsMd` covering: basic output structure, all config sections rendered, missing optional sections handled.
- Unit tests for `getTargets()` covering: missing field defaults to `["claude"]`, explicit targets returned, validation rejects invalid values.
- Integration-level check: `specops update` with `targets: ["claude", "codex"]` produces both CLAUDE.md and AGENTS.md.

### Acceptance Criteria

- [ ] `specops update` with no `agents.targets` in config produces identical output to current behavior (CLAUDE.md only, skills generated)
- [ ] `specops update` with `agents.targets: ["codex"]` produces AGENTS.md, no CLAUDE.md, no `.claude/skills/`
- [ ] `specops update` with `agents.targets: ["claude", "codex"]` produces both CLAUDE.md and AGENTS.md
- [ ] AGENTS.md contains: project context, tech stack, escalation rules, conflict resolution hierarchy, design principles, agent roles, resources
- [ ] AGENTS.md does NOT contain: skills table, `.claude/skills/` references
- [ ] Existing specops.yaml files (without `targets`) continue to work without changes
- [ ] Config validation rejects unknown target values
- [ ] All tests pass
- [ ] No lint warnings
- [ ] Code formatted
