# ExecPlan: Mechanical Governance

**Status:** Draft
**Branch:** feature/mechanical-governance
**PR:** (filled when opened)
**Author:** Claude Opus 4.6
**Created:** 2026-03-20

---

## Purpose

Research confirms that role labels in context files don't reliably change single-agent behavior, and that bloated CLAUDE.md files cause agents to ignore instructions. specops currently generates a roles table in CLAUDE.md that consumes context tokens without providing governance value — escalation rules and architecture boundaries already do the real work.

This feature removes the roles concept entirely to produce a leaner, more focused CLAUDE.md.

## Progress

- [ ] Milestone 1: Remove roles from schema, loader, templates, generators, init, and scan skill

## Surprises & Discoveries

(None yet)

## Decision Log

**Decision:** Remove `agents.roles` entirely — breaking change.
**Context:** Research shows role labels in context files don't change single-agent behavior. The roles table consumes context tokens without providing governance value. Escalation rules and architecture boundaries already do the real work.
**Rationale:** Keeping dead weight "just in case" contradicts the principle of matching governance to complexity. This is a v0.x project — breaking changes are acceptable. Existing configs with roles are silently accepted (soft deprecation). If multi-agent support becomes real later, it should generate native `.claude/agents/` files, not a Markdown table.

---

## Context and Orientation

### Relevant Code Areas

**Config schema** — `src/config/schema.ts` defines `AgentRole` interface and `AgentsConfig` with `roles: AgentRole[]` (to be removed) and `targets?: string[]` (stays).

**Config loader** — `src/config/loader.ts` validates `agents.roles` as a required array (line 84). This entire block gets removed.

**CLAUDE.md template** — `src/templates/claude-md.hbs` lines 111-119 render the Agents table unconditionally.

**AGENTS.md template** — `src/templates/agents-md.hbs` lines 97-103 render the Agents table unconditionally.

**Agent context generator** — `src/generators/agent-context.ts` lines 150-165 render the Agent Hierarchy section using `config.agents.roles`. Assumes at least one role exists (line 162 accesses `roles[0]`).

**Init command** — `src/commands/init.ts` lines 317-337 populate default roles.

**Scan skill template** — `src/templates/scan-skill.md` has "Phase 4: Determine Agent Roles" and role-related output examples.

### Invariants and Constraints

- **The `agents` section stays required** — it holds `targets`. Only `roles` is removed.
- **Existing configs with roles must not error** — silently ignore the field for soft deprecation.

### Architecture Alignment

Touches three components:
- **config** — schema and loader changes
- **generators** — agent-context.ts changes
- **templates** — both `.hbs` templates, scan-skill.md

## Plan of Work

Pure subtraction. Remove the `AgentRole` interface, validation, template sections, init wizard prompts, and scan skill phase. No new concepts introduced.

## Concrete Steps

### Milestone 1: Remove Roles

1. In `src/config/schema.ts`:
   - Remove the `AgentRole` interface
   - Remove `roles: AgentRole[]` from `AgentsConfig`
   - The `AgentsConfig` interface keeps only `targets?: string[]`

2. In `src/config/loader.ts`:
   - Remove the `agents.roles` validation block (lines 84-95)
   - If `agents.roles` is present in the YAML, ignore it silently (don't error — soft deprecation)

3. In `src/templates/claude-md.hbs`:
   - Remove the entire Agents section (lines 111-121: the table, the "Agents discover project context" line)

4. In `src/templates/agents-md.hbs`:
   - Remove the entire Agents section (lines 97-103)

5. In `src/generators/agent-context.ts`:
   - Remove the Agent Hierarchy section entirely (lines 149-165)
   - Remove the "When Agents Disagree" block

6. In `src/commands/init.ts`:
   - Remove the `wantRoles` prompt
   - Remove the `AgentRole` default population in `buildConfig`
   - The `agents` section in generated config only contains `targets`

7. In `src/templates/scan-skill.md`:
   - Remove "Phase 4: Determine Agent Roles" entirely
   - Remove role-related guidance and examples from the output template
   - Renumber remaining phases

8. In `specops.yaml` (this project's own config):
   - Remove the `agents.roles` section

## Validation and Acceptance

### Test Expectations

- A config with no `agents.roles` loads successfully
- A config with `agents.roles` present is silently ignored (no error)
- CLAUDE.md no longer contains an Agents section
- AGENTS.md no longer contains an Agents section
- `specops update` completes without errors

### Acceptance Criteria

- [ ] A specops.yaml with `agents.roles` still loads (silently ignored)
- [ ] A specops.yaml without `agents.roles` loads and generates valid CLAUDE.md
- [ ] CLAUDE.md no longer contains an Agents section
- [ ] AGENTS.md no longer contains an Agents section
- [ ] Init wizard no longer asks about roles
- [ ] Scan skill no longer has a roles phase
- [ ] `specops update` runs cleanly on this project's own config
- [ ] No lint warnings
- [ ] Code formatted
