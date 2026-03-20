# ExecPlan: Mechanical Governance

**Status:** Draft
**Branch:** feature/mechanical-governance
**PR:** (filled when opened)
**Author:** Claude Opus 4.6
**Created:** 2026-03-20

---

## Purpose

specops states "enforce invariants mechanically, not via docs alone" as a core principle, but currently all governance is advisory text — role labels, escalation rules, architecture boundaries — rendered into Markdown that an agent may or may not follow. Research confirms that role labels in context files don't reliably change single-agent behavior, and that bloated CLAUDE.md files cause agents to ignore instructions.

This feature makes governance mechanical: remove the roles concept entirely to slim CLAUDE.md, and generate Claude Code hooks that enforce architecture boundaries via a new `specops guard` CLI command. Instead of hoping the agent reads a table, specops will run a check script on every file edit.

## Progress

- [ ] Milestone 1: Remove roles and slim CLAUDE.md (2026-03-20)
- [ ] Milestone 2: Add `specops guard` CLI command (2026-03-20)
- [ ] Milestone 3: Hook generator — write `.claude/settings.json` hooks (2026-03-20)
- [ ] Milestone 4: Wire hook generation into `specops update` (2026-03-20)

## Surprises & Discoveries

(None yet)

## Decision Log

**Decision:** Remove `agents.roles` entirely — breaking change.
**Context:** Research shows role labels in context files don't change single-agent behavior. The roles table consumes context tokens without providing governance value. Escalation rules and architecture boundaries already do the real work.
**Rationale:** Keeping dead weight "just in case" contradicts the principle of matching governance to complexity. This is a v0.x project — breaking changes are acceptable. Users with existing configs will get a clear validation error pointing them to remove the `roles` section. If multi-agent support becomes real later, it should generate native `.claude/agents/` files, not a Markdown table.

**Decision:** Enforce architecture boundaries via a `specops guard` CLI command called from hooks, rather than inline shell scripts in hooks config.
**Context:** Claude Code hooks execute shell commands. Architecture boundary checking requires reading specops.yaml, parsing component definitions, and matching file paths. This is too complex for inline shell.
**Rationale:** A dedicated CLI command (`specops guard <file>`) keeps hook config clean, is testable independently, and can be extended later (e.g., `specops guard --check-imports`). The hook entry is simply `specops guard $FILE_PATH`. This also works for CI pipelines and pre-commit hooks — not just Claude Code.

**Decision:** Generate `.claude/settings.json` only for Claude targets, create-once semantics.
**Context:** Users may have their own settings in `.claude/settings.json`. Overwriting it on every `specops update` would destroy user customizations.
**Rationale:** Use create-once behavior (like user-owned skill stubs). If the file exists, don't overwrite. Print a message telling the user to add the hooks manually or delete and regenerate. This respects the "user-owned files are never overwritten" principle.

---

## Context and Orientation

### Relevant Code Areas

**Config schema** — `src/config/schema.ts` defines `AgentsConfig` with `roles: AgentRole[]` (to be removed) and `targets?: string[]` (stays). The `ArchitectureComponent` interface has `owns: string[]` and `avoids: string[]` — these are the boundaries to enforce.

**Config loader** — `src/config/loader.ts` validates `agents.roles` as a required array (line 84). This entire block gets removed. The `validate()` function also validates architecture components if present.

**CLAUDE.md template** — `src/templates/claude-md.hbs` lines 111-119 render the Agents table unconditionally. Needs `{{#if}}` guard.

**AGENTS.md template** — `src/templates/agents-md.hbs` lines 97-103 render the Agents table unconditionally. Same fix.

**Agent context generator** — `src/generators/agent-context.ts` lines 150-165 render the Agent Hierarchy section using `config.agents.roles`. Assumes at least one role exists (line 162 accesses `roles[0]`). Must handle empty/missing roles.

**Update command** — `src/commands/update.ts` orchestrates all generators. Needs to call the new hook generator.

**Init command** — `src/commands/init.ts` lines 317-337 populate default roles. Should make this optional/skippable.

**CLI entry point** — `src/index.ts` registers commands. Needs the new `guard` command.

### Invariants and Constraints

- **Backward compatibility.** Existing `specops.yaml` files with `agents.roles` must continue to work without changes.
- **User-owned files are never overwritten.** `.claude/settings.json` must be create-once if we generate it.
- **The `agents` section is required** — it holds `targets`. Only `roles` becomes optional within it.
- **Architecture components are optional** — `specops guard` should gracefully handle configs with no `architecture.components`.
- **Hooks are Claude-only** — Codex has a different extension mechanism. Only generate `.claude/settings.json` when `"claude"` is in targets.

### Architecture Alignment

Touches all four components:
- **config** — schema change (roles optional), no new sections needed
- **cli** — new `guard` command
- **generators** — new hooks generator, template changes
- **templates** — conditional Agents section in both `.hbs` files

No boundary changes. The `guard` command reads config (via loader) and checks a file path — it doesn't generate files, so it fits in `cli` as a command, not in `generators`.

## Plan of Work

Two parallel tracks: (1) slim down — make roles optional and shrink generated CLAUDE.md, and (2) build up — add mechanical enforcement via hooks and a guard command. Track 1 is pure simplification with no new concepts. Track 2 introduces one new generator and one new CLI command. Both are additive changes that don't break existing behavior.

The `specops guard` command is the key design choice: it turns architecture boundaries from prose in a Markdown file into a checkable assertion. By exposing it as a CLI command, it works in hooks, CI, and pre-commit — not just Claude Code.

## Concrete Steps

### Milestone 1: Remove Roles and Slim CLAUDE.md

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

### Milestone 2: Add `specops guard` CLI Command

1. Create `src/commands/guard.ts`:
   - Takes a file path argument
   - Loads `specops.yaml`
   - Reads `architecture.components` from config
   - For each component, checks if the file path matches the component's `owns` patterns
   - If the file is in a component's `avoids` list, exit with code 1 and print a warning
   - If no architecture config exists, exit 0 silently (nothing to check)

2. The matching logic:
   - Parse the `owns` entries to extract directory patterns (e.g., `"Command parsing and user interaction (src/commands/)"` → `src/commands/`)
   - Parse the `avoids` entries similarly
   - A file "belongs to" a component if its path matches an `owns` pattern
   - A file "violates boundaries" if it's being created in a location that a component `avoids`
   - Output format: `⚠ specops guard: <file> is in <component>'s avoids list: <reason>`

3. Register the command in `src/index.ts`:
   ```
   specops guard <file>
   ```

### Milestone 3: Hook Generator

1. Create `src/generators/hooks.ts`:
   - Generates `.claude/settings.json` with a `hooks` section
   - Adds a `PreToolUse` hook for `Edit` and `Write` tools that runs `specops guard` on the target file
   - The hook config format follows Claude Code's settings schema:
     ```json
     {
       "hooks": {
         "PreToolUse": [
           {
             "matcher": "Edit|Write",
             "command": "specops guard \"$INPUT_FILE_PATH\""
           }
         ]
       }
     }
     ```

2. Create-once semantics:
   - If `.claude/settings.json` already exists, do NOT overwrite
   - Instead, print: `ℹ .claude/settings.json already exists. Add hooks manually — see docs/agent-context/README.md`
   - If file does not exist, create it with the hooks config

### Milestone 4: Wire into Update Command

1. In `src/commands/update.ts`:
   - Import the hook generator
   - Call it after skills generation, only when `"claude"` is in targets
   - Track results (created vs. skipped)

2. Update the scan skill template (`src/templates/scan-skill.md`):
   - Remove "4. Recommend appropriate agent roles" from the mandatory steps
   - Make roles a suggested addition rather than required
   - Update the example YAML to show a config without roles

3. Update `docs/agent-context/README.md` generation to document the hooks and guard command.

## Validation and Acceptance

### Test Expectations

- `specops guard` with a file matching an `avoids` pattern exits with code 1 and prints a warning
- `specops guard` with a file not violating any boundary exits with code 0
- `specops guard` with no architecture config exits with code 0
- A config with no `agents.roles` loads successfully
- A config with `agents.roles` present is silently ignored (no error)
- CLAUDE.md no longer contains an Agents section

### Acceptance Criteria

- [ ] A specops.yaml with `agents.roles` still loads (silently ignored)
- [ ] A specops.yaml without `agents.roles` loads and generates valid CLAUDE.md
- [ ] CLAUDE.md no longer contains an Agents section
- [ ] `specops guard src/commands/init.ts` exits 0 (file is in cli component's owns)
- [ ] `specops guard` on a boundary violation exits 1 with a clear warning message
- [ ] `specops update` generates `.claude/settings.json` with hooks when file doesn't exist
- [ ] `specops update` does NOT overwrite existing `.claude/settings.json`
- [ ] Hooks call `specops guard` on Edit and Write tool uses
- [ ] All tests pass
- [ ] No lint warnings
- [ ] Code formatted
