---
name: "specops-scan"
description: "Bootstrap specops.yaml by analyzing the codebase automatically. Run this before specops.yaml exists to generate a complete config."
---

# Specops Scan

## Purpose

Analyze this codebase and generate a complete `specops.yaml` configuration automatically. This skill is the bootstrap path — run it instead of the interactive wizard when you want the AI to figure out the project structure for you.

**When to use:** Run `/specops:scan` after `specops init` installs this skill. It reads package manifests, CI config, directory structure, and existing docs to produce a tailored `specops.yaml`.

---

## Workflow

Work through these phases in order. Output findings as you go — the user should see what you are discovering.

---

### Phase 1: Discover the Stack

Read package manifests and dependency files to identify languages, frameworks, databases, and infrastructure.

**Files to check (read whichever exist):**

Language/framework manifests:
- `package.json` — Node.js/TypeScript/JavaScript; check `dependencies`, `devDependencies`, `scripts`
- `Cargo.toml` — Rust; check `[dependencies]` and workspace members
- `pyproject.toml` / `setup.py` / `requirements.txt` — Python
- `go.mod` — Go; check module name and dependencies
- `Gemfile` — Ruby
- `pom.xml` / `build.gradle` / `build.gradle.kts` — Java/Kotlin
- `composer.json` — PHP
- `mix.exs` — Elixir
- `*.csproj` / `*.sln` — C#/.NET

CI/CD and deployment:
- `.github/workflows/*.yml` — GitHub Actions; note build steps, test commands, deploy targets
- `.gitlab-ci.yml` — GitLab CI
- `Jenkinsfile` — Jenkins
- `Dockerfile` / `docker-compose.yml` — Container topology, service names, port mappings
- `fly.toml` — Fly.io deployment
- `vercel.json` / `netlify.toml` — Frontend deployment
- `render.yaml` / `railway.toml` — PaaS deployment
- `k8s/` / `kubernetes/` / `helm/` — Kubernetes manifests
- `terraform/` / `*.tf` — Infrastructure as code
- `Makefile` — Common task runner; shows test/build/deploy commands

**What to extract:**

From `package.json`:
- Top-level framework (React, Vue, Angular, Next.js, Remix, Svelte, Nuxt, Astro)
- Backend framework (Express, Fastify, NestJS, Hono, Koa)
- Database clients (pg, mysql2, mongodb, redis, prisma, drizzle, typeorm, sequelize)
- Test framework (jest, vitest, mocha, playwright, cypress)
- Build tooling (vite, webpack, esbuild, turbo, nx)
- Is it a monorepo? Check for `workspaces` field or `packages/` structure

From `Cargo.toml`:
- Web framework (axum, actix-web, warp, rocket, tide)
- Database (sqlx, diesel, sea-orm, mongodb)
- Async runtime (tokio, async-std)
- Is it a workspace? Check for `[workspace]` with `members`

From Docker/CI files:
- Service names in docker-compose (postgres, mysql, redis, rabbitmq, kafka, elasticsearch)
- Deployment targets (AWS, GCP, Azure, Fly, Vercel, Netlify, Railway)

**Output format for this phase:**
```
Stack discovered:
- Languages: [list]
- Frameworks: [list]
- Databases: [list]
- Infrastructure: [list]
- Test tooling: [list]
```

---

### Phase 2: Map Architecture

Analyze directory structure to understand component boundaries and project type.

**Steps:**

1. List the top-level directories. Use Glob with pattern `*` to see what exists.

2. Identify the project type:
   - **Single-app backend**: `src/`, `lib/`, main entry point
   - **Single-app frontend**: `src/`, `public/`, `index.html`
   - **Fullstack monolith**: both frontend and backend in one repo
   - **Monorepo**: `packages/`, `apps/`, `services/`, `crates/`, workspace config
   - **Microservices**: multiple service directories each with their own manifests

3. For monorepos, list packages/apps/services to understand component boundaries.

4. Look for existing architecture docs:
   - `docs/architecture*.md`
   - `docs/architecture/`
   - `docs/design/`
   - `ARCHITECTURE.md`
   - `docs/adr/` (Architecture Decision Records)

5. Identify API patterns by looking for:
   - `routes/`, `controllers/`, `handlers/` — REST API
   - `graphql/`, `schema.graphql`, `*.gql` — GraphQL
   - `*.proto` — gRPC/protobuf
   - Message bus patterns: look for event schemas, queue config, `events/`, `messages/`
   - `openapi.yaml` / `swagger.yaml` — OpenAPI spec

6. Check for design system:
   - `ui/DESIGN_GUIDE.md` or similar
   - `src/components/` with Storybook (`*.stories.*`)
   - Tailwind config, CSS design tokens

**Output format for this phase:**
```
Architecture mapped:
- Project type: [single-app backend | single-app frontend | fullstack | monorepo | microservices]
- Components: [list component names and their purpose]
- API patterns: [REST | GraphQL | gRPC | message bus | WebSocket]
- Has design system: [yes/no]
- Existing architecture docs: [list paths or "none found"]
```

---

### Phase 3: Assess Conventions

Read existing docs and config to understand how the project is run.

**Files to check (read whichever exist):**

- `CLAUDE.md` — Existing AI agent instructions (very important — don't overwrite conventions)
- `README.md` — Project overview, setup instructions, contribution guidelines
- `CONTRIBUTING.md` — Development workflow, PR process, coding standards
- `.github/PULL_REQUEST_TEMPLATE.md` — PR conventions

Linting and formatting:
- `.eslintrc*` / `eslint.config.*` — ESLint rules
- `.prettierrc*` / `prettier.config.*` — Prettier config
- `rustfmt.toml` / `.rustfmt.toml` — Rust formatting
- `.editorconfig` — Editor conventions

Testing:
- `jest.config.*` / `vitest.config.*` — Test config, coverage thresholds
- `pytest.ini` / `pyproject.toml [tool.pytest]` — Python test config
- Look at `tests/`, `__tests__/`, `spec/` for test patterns

**What to extract:**

- Naming conventions (kebab-case files? PascalCase components?)
- Test patterns (unit vs integration, coverage requirements)
- Branch/PR conventions from CONTRIBUTING.md
- Any existing escalation rules or agent guidance from CLAUDE.md
- Design principles mentioned in README or docs

**Output format for this phase:**
```
Conventions found:
- Existing CLAUDE.md: [yes/no — if yes, note key conventions to preserve]
- Test framework: [name and patterns]
- Linting: [tools configured]
- Notable conventions: [list key findings]
```

---

### Phase 4: Generate specops.yaml

Write a complete `specops.yaml` to the project root. Use the schema below. Every field should reflect what you actually found — do not use placeholder values.

**Schema reference:**

```yaml
# specops configuration
# This file defines your project's agent governance structure.
# Run `specops update` after editing to regenerate managed files.

# ---------------------------------------------------------------------------
# Project metadata
# ---------------------------------------------------------------------------
project:
  name: "project-name"          # From package manifest or directory name
  description: "What it does"   # From README first line or package.json description
  # repository: https://github.com/org/repo   # Optional

# ---------------------------------------------------------------------------
# Technology stack
# Languages: programming languages (e.g., TypeScript, Rust, Python, Go)
# Frameworks: web/app frameworks (e.g., React, Axum, FastAPI, Next.js)
# Databases: storage systems (e.g., PostgreSQL, Redis, MongoDB, SQLite)
# Infrastructure: deployment/ops tooling (e.g., Docker, AWS, Kubernetes, Fly)
# ---------------------------------------------------------------------------
stack:
  languages:
    - TypeScript
  frameworks:
    - React
    - Node.js
  databases:
    - PostgreSQL
  infrastructure:
    - Docker

# ---------------------------------------------------------------------------
# Agent targets
# Which AI agent tools to generate files for.
# ---------------------------------------------------------------------------
agents: {}

# ---------------------------------------------------------------------------
# Escalation rules
# Explicit triggers for when agents must STOP and ask a human.
# Tailor these to your actual stack — Rust gets memory/unsafe rules,
# database projects get migration rules, etc.
# ---------------------------------------------------------------------------
escalation:
  categories:
    - name: Architecture and Design
      triggers:
        - Introducing new components or service boundaries
        - Changing API contracts or data models
        - Modifying component responsibilities
    - name: Security and Data
      triggers:
        - Modifying authentication or authorization boundaries
        - Changing how secrets or credentials are handled
        - Modifying database schemas without a migration strategy
    - name: Breaking Changes
      triggers:
        - Breaking any public API (REST, GraphQL, WebSocket, events)
        - Removing or renaming public interfaces
    - name: Operational Impact
      triggers:
        - Changing deployment topology or infrastructure requirements
        - Changes that could impact system reliability
    - name: Code Quality
      triggers:
        - Duplicating code that should be shared
        - Test failures you do not understand
        - Disabling or skipping tests

# ---------------------------------------------------------------------------
# Documentation authority hierarchy
# When docs conflict, higher-ranked layers win. Listed highest first.
# ---------------------------------------------------------------------------
docHierarchy:
  layers:
    - path: docs/architecture.md
      description: System architecture and component boundaries
    - path: docs/api-contracts.md
      description: API contracts and schemas
    - path: "docs/adr/*.md"
      description: Architecture Decision Records
    - path: Code and tests
      description: Ground truth for current implementation
    - path: Component READMEs
      description: Implementation details

# ---------------------------------------------------------------------------
# Architecture components (optional but recommended)
# Define component boundaries so agents know where code belongs.
# Map this from your actual directory structure.
# ---------------------------------------------------------------------------
architecture:
  principles:
    - Parse at boundaries, validate with types not runtime checks
    - Enforce invariants mechanically (lints, tests), not via docs alone
  components:
    - name: api-server
      owns:
        - HTTP routing and middleware
        - Request validation and serialization
      avoids:
        - Business logic (belongs in domain layer)
        - Direct database queries (use repository layer)

# ---------------------------------------------------------------------------
# Skills
# Domain-specific workflow instructions agents load on demand.
# Each skill becomes .claude/skills/<name>/SKILL.md
# The specops-scan skill is always included automatically.
# ---------------------------------------------------------------------------
skills:
  skills:
    - name: backend-workflows
      description: Common backend development workflows
      whenToUse: Adding migrations, API endpoints, bus events, or writing tests
    - name: frontend-workflows
      description: Common frontend development workflows
      whenToUse: Adding routes, components, API integrations, or state management

# ---------------------------------------------------------------------------
# Resources — links shown in CLAUDE.md for quick navigation
# ---------------------------------------------------------------------------
resources:
  sections:
    - name: Development
      links:
        - label: Setup guide
          path: README.md
    - name: Operations
      links:
        - label: Deployment
          path: docs/deployment.md

# ---------------------------------------------------------------------------
# Design principles — shown in CLAUDE.md
# Infer from README, CONTRIBUTING.md, or existing architectural docs.
# ---------------------------------------------------------------------------
principles:
  items:
    - Repository knowledge is the system of record
    - Enforce invariants mechanically, not via docs alone
```

**Rules for generating the actual file:**

1. **Project name**: Use `name` from `package.json`, `Cargo.toml` `[package]`, or `pyproject.toml`. Fall back to the directory name.

2. **Project description**: Use `description` from the manifest. If absent, read the first non-heading paragraph of `README.md`.

3. **Stack**: Only include what you actually found. Do not guess. If no databases were found, omit the `databases` field entirely.

4. **Escalation rules**: Always include the five standard categories. Customize the triggers based on the stack:
   - Rust project: add "Using unsafe code without architectural approval" to Architecture and Design
   - Database project: make the schema migration trigger specific (e.g., "Running migrations in production without review")
   - Auth-heavy project: expand the Security category
   - Monorepo: add "Adding new packages or services" to Architecture and Design
   - Message bus architecture: add "Changing event schemas or bus contracts" to Breaking Changes

6. **docHierarchy**: Only list paths that actually exist or are likely to exist given the project type. If there are no ADRs, omit that layer.

7. **architecture.components**: Map from your actual directory structure. If you found `src/api/`, `src/domain/`, `src/db/` — reflect that. If the project is too simple for component boundaries, omit the entire `architecture` section.

8. **skills**: Recommend skills based on what work will happen:
   - Backend code → `backend-workflows`
   - Frontend code → `frontend-workflows`
   - Deployment/CI → `operations`
   - Architecture work → project-specific architecture skill

9. **principles**: Infer from existing docs. If CLAUDE.md or README mentions principles, use them. Otherwise, use sensible defaults for the stack.

---

### Phase 5: Confirm and Next Steps

After writing `specops.yaml`, tell the user:

```
specops.yaml has been generated.

Please review it and make any adjustments, then run:

  specops update

This will generate:
  - CLAUDE.md (agent entry point)
  - docs/agent-context/ (escalation rules, workflows)
  - docs/exec-plans/PLANS.md (ExecPlan template)
  - .claude/skills/<name>/SKILL.md (per skill stub)

The scan skill itself (specops-scan) is always regenerated by specops update
and should not be manually edited.
```

---

## Important Notes

- **Read, do not execute**: Use Glob and Read tools. Do not run shell commands to discover the stack.
- **Be honest about uncertainty**: If you cannot determine something, say so rather than guessing. Leave a `# TODO: verify this` comment in the YAML.
- **Preserve existing conventions**: If CLAUDE.md already exists, read it carefully. Preserve any escalation rules, principles, or conventions it defines.
- **Don't over-engineer small projects**: Match the governance complexity to the project complexity.
- **The scan skill is framework-owned**: Do not edit `.claude/skills/specops-scan/SKILL.md` manually. It is overwritten by `specops update`. Put custom instructions in other skill files.
