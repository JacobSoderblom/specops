# specops

Agent operating system for AI-assisted software development.

specops scaffolds governance, workflows, and coordination for AI agents working on your codebase. It generates the configuration files, templates, and documentation structure that turn ad-hoc AI agent usage into a repeatable, auditable development process.

## The problem

AI coding agents are powerful but chaotic. Without structure, they:

- Make conflicting architectural decisions across sessions
- Lack shared context about project conventions and boundaries
- Have no escalation rules -- they guess instead of asking
- Produce no audit trail of design decisions
- Cannot coordinate across roles (backend, frontend, devops)

## What specops provides

**ExecPlans** -- Living markdown documents that track features from design through implementation to outcome. They travel with the code on feature branches and become permanent project history.

**Agent roles and hierarchy** -- Configurable roles (Backend Architect, Frontend Developer, DevOps, etc.) with explicit authority chains. Agents know who owns what decisions and when to escalate.

**Skills** -- Domain-specific workflow instructions that agents load on demand. Backend workflows, frontend patterns, deployment procedures -- all discoverable and version-controlled.

**Escalation rules** -- Explicit triggers for when agents must stop and ask a human: architecture changes, security boundaries, breaking changes, operational impact.

**Conflict resolution** -- A ranked hierarchy of documentation authority so agents resolve ambiguity deterministically instead of guessing.

**CLAUDE.md generation** -- The agent entry point file, generated from your project config. One source of truth, always in sync with your actual project structure.

## Quick start

```bash
# Install globally
pnpm add -g specops

# Initialize in your project
cd your-project
specops init

# After editing specops.yaml, regenerate files
specops update
```

`specops init` walks you through an interactive setup, creates `specops.yaml`, and generates the initial file structure. `specops update` regenerates all managed files from your config whenever you make changes.

## What gets generated

```
your-project/
  CLAUDE.md                           # Agent entry point (generated)
  specops.yaml                        # Your project config (you edit this)
  docs/
    agent-context/
      README.md                       # Agent workflow overview
      escalation-rules.md             # When to stop and ask
      continuous-improvement.md       # How agents suggest doc improvements
    exec-plans/
      PLANS.md                        # ExecPlan process and template
  .claude/
    skills/
      <skill-name>/
        SKILL.md                      # Skill workflow instructions
```

## Configuration

specops is configured via `specops.yaml` at your project root. Here is a minimal example:

```yaml
project:
  name: my-project
  description: A web application for managing widgets

stack:
  languages:
    - TypeScript
    - Python
  frameworks:
    - Next.js
    - FastAPI
  infrastructure:
    - PostgreSQL
    - Redis
    - Docker

agents:
  roles:
    - name: Backend Architect
      authority: system-design, api-contracts, data-models
      description: Designs backend systems and produces implementation plans
    - name: Frontend Developer
      authority: ui-implementation, component-design
      description: Implements UI based on designs and API contracts
```

See the generated `specops.yaml` after `specops init` for the full configuration reference with all available options.

## ExecPlans

ExecPlans are the core coordination mechanism. They are living markdown documents committed to feature branches that track a feature from design through implementation.

**Sections:**
- **Purpose** -- What and why
- **Progress** -- Milestone checklist with dates
- **Decision Log** -- Every non-obvious choice with rationale
- **Surprises and Discoveries** -- Unexpected findings (the most valuable section for future work)
- **Outcomes and Retrospective** -- What shipped, what was deferred, lessons learned
- **Context and Orientation** -- Codemap for newcomers
- **Plan of Work** -- Strategy and phases
- **Concrete Steps** -- Ordered, actionable steps grouped by milestone
- **Validation** -- Observable, testable acceptance criteria

ExecPlans replace scattered design docs, Slack threads, and tribal knowledge with a single artifact that lives alongside the code it describes.

## Philosophy

**Repository knowledge is the system of record.** If it is not in the repo, agents cannot see it. specops puts governance, workflows, and coordination into version-controlled files that travel with the code.

**Enforce invariants mechanically.** Generated files stay in sync with config. Escalation rules are explicit, not implicit. Authority chains are declared, not assumed.

**Reduce bottlenecks through upfront clarity.** Detailed implementation plans with clear component boundaries mean agents can execute without constant human intervention. The human's role shifts from micromanagement to review and approval.

**Living documents over write-once specs.** ExecPlans are updated throughout implementation. They capture surprises, decisions, and outcomes -- not just the original plan.

## License

MIT
