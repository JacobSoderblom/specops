# Escalation Rules and Conflict Resolution

## Global Stop/Escalate Rules

**STOP and escalate to the user if:**

{{#each categories}}
### {{this.name}}

{{#each this.triggers}}
- {{this}}
{{/each}}

{{/each}}

---

## Conflict Resolution Hierarchy

When documentation conflicts or is missing, use this hierarchy (highest authority first):

{{#each layers}}
{{@index_1}}. **`{{this.path}}`** -- {{this.description}}
{{/each}}

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
