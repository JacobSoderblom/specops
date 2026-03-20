# ExecPlan: Managed Sections

**Status:** Complete
**Branch:** feature/managed-sections
**PR:** (filled when opened)
**Author:** Claude Opus 4.6
**Created:** 2026-03-20

---

## Purpose

`specops update` currently overwrites CLAUDE.md (and AGENTS.md) entirely on every run. This makes specops unusable for any repo with hand-tuned agent instructions — running update destroys the user's work. The tool needs to shift from "own the whole file" to "manage marked sections within a user-owned file."

This feature introduces HTML comment markers (`<!-- specops:begin:section -->` / `<!-- specops:end:section -->`) that delineate generated regions. `specops update` replaces content inside markers and leaves everything outside untouched. The user owns the file; specops manages sections within it.

## Progress

- [x] Milestone 1: Section parser — read and write marked regions in Markdown files (2026-03-20)
- [x] Milestone 2: Update CLAUDE.md generator to use managed sections (2026-03-20)
- [x] Milestone 3: Update AGENTS.md generator to use managed sections (2026-03-20)
- [x] Milestone 4: First-run behavior — generate initial file with markers when no file exists (2026-03-20)

## Surprises & Discoveries

(None yet)

## Decision Log

**Decision:** Use HTML comment markers with section names, not generic start/end pairs.
**Context:** We need to identify which generated section is which so we can update them independently. A generic `<!-- specops:managed:start -->` can't distinguish the escalation section from the stack section.
**Rationale:** Named sections (`<!-- specops:begin:escalation -->` / `<!-- specops:end:escalation -->`) let us update individual sections, which enables future `--only` flag support. They're also self-documenting — a user reading CLAUDE.md can see exactly what specops manages. HTML comments are invisible in rendered Markdown.

**Decision:** Content outside markers is never touched — user-owned by default.
**Context:** The user may have custom instructions, memory references, project-specific notes anywhere in CLAUDE.md. The current "overwrite everything" model destroys these.
**Rationale:** This inverts the ownership model. Today specops owns the file and the user can't customize. After this change, the user owns the file and specops manages named regions within it. Content before the first marker, between markers, and after the last marker is all preserved.

**Decision:** Each generated section (stack, escalation, doc-hierarchy, principles, resources, skills, workflow, architecture-ref) gets its own marker pair.
**Context:** We could use one big managed block for all generated content, but that prevents the user from interleaving custom content between generated sections.
**Rationale:** Per-section markers let the user reorder sections, add custom sections between generated ones, or delete generated sections they don't want. If a marker pair is missing, specops skips that section rather than re-inserting it — the user deliberately removed it.

**Decision:** Keep the Handlebars template approach but render sections individually.
**Context:** Currently one template renders the entire file. We need to render each section independently so we can replace them within the existing file.
**Rationale:** Split the single `claude-md.hbs` into per-section templates (or one template with named partials). Each section renders to a string that gets inserted between its markers. This is a clean refactor — the templates still use Handlebars, just organized per-section.

---

## Context and Orientation

### Relevant Code Areas

**CLAUDE.md generator** — `src/generators/claude-md.ts`. Currently `renderClaudeMd()` renders one big template and `generateClaudeMd()` writes the whole file. Needs to change to: read existing file, find markers, replace section content, write back.

**AGENTS.md generator** — `src/generators/agents-md.ts`. Same pattern as claude-md.ts, same changes needed.

**CLAUDE.md template** — `src/templates/claude-md.hbs`. Currently one monolithic template. Needs to be split into per-section templates or partials.

**AGENTS.md template** — `src/templates/agents-md.hbs`. Same split needed.

**Update command** — `src/commands/update.ts`. No changes needed — it already calls `generateClaudeMd()` and `generateAgentsMd()`. The section logic is internal to those generators.

**Config schema** — `src/config/schema.ts`. No changes — the config shape doesn't change.

### Invariants and Constraints

- **User content must NEVER be lost.** This is the whole point. If `specops update` deletes user content, the feature has failed.
- **Missing markers = skip.** If a section's markers aren't in the file, don't insert it. The user may have intentionally removed a section.
- **First run must still work.** When CLAUDE.md doesn't exist, generate the full file with all markers — same as today but with markers wrapping each section.
- **Marker format must be stable.** Once shipped, the marker format is a contract. Changing it would orphan existing markers.
- **AGENTS.md follows the same pattern.** Both generators use the same section-management logic.

### Architecture Alignment

Touches two components:
- **generators** — claude-md.ts and agents-md.ts get the section parsing/writing logic
- **templates** — claude-md.hbs and agents-md.hbs split into per-section content

New shared module: a section parser/writer utility used by both generators. Lives in `src/generators/sections.ts`.

## Plan of Work

Introduce a `sections.ts` utility that can parse a Markdown file into managed and unmanaged regions, then replace managed region content while preserving everything else. Refactor both generators to render per-section content and use the utility to write it back. The template split is straightforward — each `## Section` block becomes its own render call. First-run behavior generates the full file with markers, same content as today but wrapped.

## Concrete Steps

### Milestone 1: Section Parser

1. Create `src/generators/sections.ts` with:
   - `parseSections(content: string): ParsedFile` — splits a file into an ordered list of regions, each either `{ type: "user", content: string }` or `{ type: "managed", name: string, content: string }`
   - `replaceSections(parsed: ParsedFile, updates: Map<string, string>): string` — takes parsed regions and a map of `sectionName → newContent`, replaces managed sections, preserves user regions
   - `updateFile(filePath: string, updates: Map<string, string>): Promise<void>` — reads file, parses, replaces, writes back
   - Marker format: `<!-- specops:begin:section-name -->` and `<!-- specops:end:section-name -->`
   - Edge cases: nested markers (error), mismatched open/close (error with clear message), no markers in file (return file unchanged)

### Milestone 2: CLAUDE.md Generator with Managed Sections

1. Split `src/templates/claude-md.hbs` into per-section Handlebars templates. Either:
   - Separate files: `claude-md-stack.hbs`, `claude-md-escalation.hbs`, etc.
   - Or: one file with named Handlebars partials extracted programmatically
   - Preferred: keep it simple — define section content as template strings in the generator, since each section is small

2. Define the section names for CLAUDE.md:
   - `header` — project name, description, workflow steps
   - `skills` — skills table (if any)
   - `architecture-ref` — architecture quick reference table
   - `stack` — technology stack list
   - `escalation` — escalation rules
   - `doc-hierarchy` — conflict resolution hierarchy
   - `principles` — design principles
   - `resources` — resource links

3. Refactor `src/generators/claude-md.ts`:
   - `renderClaudeMdSections(config: SpecopsConfig): Map<string, string>` — renders each section independently, returns a map of `sectionName → content`
   - `generateClaudeMd(projectDir, config)`:
     - If CLAUDE.md exists: read it, call `updateFile()` with rendered sections
     - If CLAUDE.md doesn't exist: generate initial file with all sections wrapped in markers, with a user section at the top for custom content

4. Update the initial file template to look like:
   ```markdown
   <!-- specops:begin:header -->
   # Project Name
   ...
   <!-- specops:end:header -->

   <!-- Add your custom instructions here -->

   <!-- specops:begin:stack -->
   ## Technology Stack
   ...
   <!-- specops:end:stack -->
   ```

### Milestone 3: AGENTS.md Generator with Managed Sections

1. Same refactor as Milestone 2 but for `src/generators/agents-md.ts` and `src/templates/agents-md.hbs`.
2. AGENTS.md has the same sections minus `skills` (Codex has no skills).
3. Reuse the same `sections.ts` utility.

### Milestone 4: First-Run and Edge Cases

1. When CLAUDE.md doesn't exist, `generateClaudeMd()` creates the full file with markers.
2. When CLAUDE.md exists but has NO markers (pre-managed-sections file or hand-written), `generateClaudeMd()` should:
   - Print a warning: "CLAUDE.md exists but has no specops markers. Skipping to avoid overwriting. Run `specops import` to add markers."
   - Exit without modifying the file
   - This prevents destroying an existing hand-written CLAUDE.md
3. Update the `<!-- Generated by specops -->` notice to say: `<!-- Managed by specops. Sections between specops markers are regenerated by 'specops update'. -->`

## Validation and Acceptance

### Test Expectations

- `parseSections` correctly splits a file with multiple managed and user regions
- `parseSections` handles a file with no markers (returns single user region)
- `parseSections` errors on mismatched markers
- `replaceSections` preserves user content between and around managed sections
- `replaceSections` handles sections in the update map that don't exist in the file (skips them)
- `replaceSections` handles sections in the file that aren't in the update map (preserves existing content)
- Full round-trip: parse → replace → parse produces expected structure

### Acceptance Criteria

- [ ] `specops update` on a new project creates CLAUDE.md with markers around each section
- [ ] `specops update` on an existing CLAUDE.md with markers replaces only managed section content
- [ ] User content between markers is preserved across updates
- [ ] User content before first marker is preserved
- [ ] User content after last marker is preserved
- [ ] If a user removes a marker pair, that section is not re-inserted
- [ ] If CLAUDE.md exists without markers, update prints a warning and does not modify
- [ ] Same behavior for AGENTS.md
- [ ] All tests pass
- [ ] No lint warnings
- [ ] Code formatted
