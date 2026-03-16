# Escalation Rules and Conflict Resolution

## Global Stop/Escalate Rules

**STOP and escalate to the user if:**

### Public API and CLI

- Changing CLI command names, flags, or output format
- Changing specops.yaml schema (breaking existing configs)
- Changing generated file paths or structure
- Removing or renaming exported TypeScript types

### Template Quality

- Changing ExecPlan template sections or structure
- Modifying escalation rule defaults
- Changing CLAUDE.md generation logic

### User-Owned vs Framework-Owned

- Changing which files are overwritten on update vs created once
- Any change that could destroy user customizations

### Security

- Handling file paths from user input (path traversal)
- Executing shell commands from config values

### Code Quality

- Duplicating logic that should be shared
- Test failures you do not understand
- Disabling or skipping tests

---

## Conflict Resolution Hierarchy

When documentation conflicts or is missing, use this hierarchy (highest authority first):

1. **`README.md`** -- Public API, philosophy, quick start
2. **`src/config/schema.ts`** -- Authoritative config shape — specops.yaml must match these types
3. **`src/templates/`** -- Template content shipped to users
4. **`Code and tests`** -- Current implementation

### When Documentation Conflicts

1. Prefer the higher-authority source from the list above
2. Document the conflict and its location
3. Do not proceed with implementation until the conflict is resolved
4. Ask the user to clarify or update the conflicting docs

### When Documentation Is Missing

1. Check if the information exists elsewhere using the hierarchy above
2. Document the gap
3. Ask the user if you need the information to proceed
4. Never guess or assume -- missing docs are a blocker until clarified