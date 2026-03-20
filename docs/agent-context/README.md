# Agent Context and Workflows

This directory contains agent-specific workflow instructions and behavior rules.

---

## Purpose

This directory contains **agent-specific** content:
- How agents should behave and work
- When to escalate or stop
- Coordination between agent types
- Feature work documentation patterns

---

## Escalation Rules

All agents must follow the escalation rules in `/CLAUDE.md`.

**Quick summary -- STOP and escalate if:**

- **Public API and CLI:** Changing CLI command names, flags, or output format
- **Template Quality:** Changing ExecPlan template sections or structure
- **User-Owned vs Framework-Owned:** Changing which files are overwritten on update vs created once
- **Security:** Handling file paths from user input (path traversal)
- **Code Quality:** Duplicating logic that should be shared

**See [`escalation-rules.md`](escalation-rules.md) for full details.**

---

## Feature Work

For non-trivial features, create an ExecPlan. See [`docs/exec-plans/PLANS.md`](../exec-plans/PLANS.md) for the process and template.

**Use an ExecPlan for:**
- Non-trivial features requiring planning
- Architectural changes affecting multiple components
- Features spanning multiple files or modules

**Skip for:**
- Trivial bug fixes (single file, obvious solution)
- Simple refactoring with no architectural impact
- Documentation-only changes

---

## Additional Context

- [Escalation Rules](escalation-rules.md) -- Stop/escalate triggers and conflict resolution
- [Continuous Improvement](continuous-improvement.md) -- How to suggest documentation improvements