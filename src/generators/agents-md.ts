/**
 * AGENTS.md generator with managed sections (Codex target).
 *
 * Same managed-section approach as the CLAUDE.md generator.
 * Sections between markers are regenerated; user content is preserved.
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import Handlebars from "handlebars";
import type { SpecopsConfig } from "../config/schema.js";
import { wrapSection, updateFile, hasMarkers } from "./sections.js";

function registerHelpers(): void {
  if (!Handlebars.helpers["inc"]) {
    Handlebars.registerHelper("inc", (value: number) => value + 1);
  }
}

function render(template: string, config: SpecopsConfig): string {
  registerHelpers();
  const compiled = Handlebars.compile(template, { noEscape: true });
  return compiled(config).trim();
}

// ---------------------------------------------------------------------------
// Section renderers (Codex — no skills section)
// ---------------------------------------------------------------------------

const AGENTS_SECTIONS = [
  "header",
  "architecture-ref",
  "stack",
  "escalation",
  "doc-hierarchy",
  "principles",
  "resources",
] as const;

function renderHeader(config: SpecopsConfig): string {
  return render(
    `# {{project.name}} Project Context

**{{project.description}}** This file is the **authoritative entry point** for all agents. For detailed workflows, see [\`docs/agent-context/README.md\`](docs/agent-context/README.md).

---

## Workflow

1. **Read architecture docs** -- understand component boundaries before changing code
2. **For non-trivial features, create an ExecPlan** -- see [\`docs/exec-plans/PLANS.md\`](docs/exec-plans/PLANS.md)
3. **Follow escalation rules** -- stop and ask the user when uncertain
4. **Suggest improvements** -- if docs are unclear or missing, flag it ([how](docs/agent-context/continuous-improvement.md))`,
    config
  );
}

function renderArchitectureRef(config: SpecopsConfig): string {
  return render(
    `## Architecture Quick Reference

| Document | Purpose |
|----------|---------|
| \`docs/agent-context/escalation-rules.md\` | Escalation rules and conflict resolution |
| \`docs/exec-plans/PLANS.md\` | ExecPlan process and template |
| \`docs/agent-context/README.md\` | Agent workflow overview |
{{#if docHierarchy}}
{{#each docHierarchy.layers}}
| \`{{this.path}}\` | {{this.description}} |
{{/each}}
{{/if}}`,
    config
  );
}

function renderStack(config: SpecopsConfig): string {
  return render(
    `## Technology Stack

{{#each stack.languages}}
- **Language:** {{this}}
{{/each}}
{{#if stack.frameworks}}
{{#each stack.frameworks}}
- **Framework:** {{this}}
{{/each}}
{{/if}}
{{#if stack.databases}}
{{#each stack.databases}}
- **Database:** {{this}}
{{/each}}
{{/if}}
{{#if stack.infrastructure}}
{{#each stack.infrastructure}}
- **Infrastructure:** {{this}}
{{/each}}
{{/if}}`,
    config
  );
}

function renderEscalation(config: SpecopsConfig): string | null {
  if (!config.escalation) return null;
  return render(
    `## Escalation Rules

**STOP and escalate to the user if:**

{{#each escalation.categories}}
### {{this.name}}

{{#each this.triggers}}
- {{this}}
{{/each}}

{{/each}}
Full details: [\`docs/agent-context/escalation-rules.md\`](docs/agent-context/escalation-rules.md)`,
    config
  );
}

function renderDocHierarchy(config: SpecopsConfig): string | null {
  if (!config.docHierarchy) return null;
  return render(
    `## Conflict Resolution Hierarchy

When documentation conflicts, prefer higher-authority sources (highest first):

{{#each docHierarchy.layers}}
{{inc @index}}. \`{{this.path}}\` -- {{this.description}}
{{/each}}

Full procedures: [\`docs/agent-context/escalation-rules.md\`](docs/agent-context/escalation-rules.md)`,
    config
  );
}

function renderPrinciples(config: SpecopsConfig): string | null {
  if (!config.principles) return null;
  return render(
    `## Design Principles

{{#each principles.items}}
- {{this}}
{{/each}}`,
    config
  );
}

function renderResources(config: SpecopsConfig): string | null {
  if (!config.resources) return null;
  return render(
    `## Resources

{{#each resources.sections}}
**{{this.name}}:**
{{#each this.links}}
- {{this.label}}: \`{{this.path}}\`
{{/each}}

{{/each}}`,
    config
  );
}

type SectionRenderer = (config: SpecopsConfig) => string | null;

const SECTION_RENDERERS: Record<string, SectionRenderer> = {
  header: renderHeader,
  "architecture-ref": renderArchitectureRef,
  stack: renderStack,
  escalation: renderEscalation,
  "doc-hierarchy": renderDocHierarchy,
  principles: renderPrinciples,
  resources: renderResources,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function renderAgentsMdSections(
  config: SpecopsConfig
): Map<string, string> {
  const sections = new Map<string, string>();
  for (const name of AGENTS_SECTIONS) {
    const renderer = SECTION_RENDERERS[name];
    const content = renderer(config);
    if (content !== null) {
      sections.set(name, content);
    }
  }
  return sections;
}

function generateInitialAgentsMd(config: SpecopsConfig): string {
  const notice =
    "<!-- Managed by specops. Sections between specops markers are regenerated by 'specops update'. -->";

  const sections = renderAgentsMdSections(config);
  const parts: string[] = [notice, ""];

  for (const [name, content] of sections) {
    parts.push(wrapSection(name, content));
    parts.push("");
  }

  return parts.join("\n");
}

export async function generateAgentsMd(
  projectDir: string,
  config: SpecopsConfig
): Promise<{ path: string; action: "created" | "updated" | "skipped" }> {
  const outputPath = resolve(projectDir, "AGENTS.md");
  const sections = renderAgentsMdSections(config);

  if (!existsSync(outputPath)) {
    const content = generateInitialAgentsMd(config);
    await writeFile(outputPath, content, "utf-8");
    return { path: outputPath, action: "created" };
  }

  const existing = await readFile(outputPath, "utf-8");

  if (!hasMarkers(existing)) {
    return { path: outputPath, action: "skipped" };
  }

  await updateFile(outputPath, sections);
  return { path: outputPath, action: "updated" };
}
