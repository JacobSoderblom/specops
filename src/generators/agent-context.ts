/**
 * Agent context generator.
 *
 * Creates docs/agent-context/ with:
 * - README.md — agent workflow overview
 * - escalation-rules.md — generated from config escalation categories
 * - continuous-improvement.md — how agents suggest doc improvements
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { SpecopsConfig } from "../config/schema.js";

// ---------------------------------------------------------------------------
// Escalation rules
// ---------------------------------------------------------------------------

function generateEscalationRules(config: SpecopsConfig): string {
  const lines: string[] = [];

  lines.push("# Escalation Rules and Conflict Resolution");
  lines.push("");
  lines.push("## Global Stop/Escalate Rules");
  lines.push("");
  lines.push("**STOP and escalate to the user if:**");
  lines.push("");

  if (config.escalation) {
    for (const category of config.escalation.categories) {
      lines.push(`### ${category.name}`);
      lines.push("");
      for (const trigger of category.triggers) {
        lines.push(`- ${trigger}`);
      }
      lines.push("");
    }
  } else {
    lines.push("### Architecture and Design");
    lines.push("");
    lines.push("- Introducing new components or service boundaries");
    lines.push("- Changing API contracts or data models");
    lines.push("- Architectural decision not covered by existing docs");
    lines.push("");
    lines.push("### Security and Data");
    lines.push("");
    lines.push("- Modifying authentication or authorization boundaries");
    lines.push("- Changing how secrets or credentials are handled");
    lines.push("- Modifying database schemas without a migration strategy");
    lines.push("");
    lines.push("### Breaking Changes");
    lines.push("");
    lines.push("- Breaking any public API");
    lines.push("- Removing or renaming public interfaces");
    lines.push("- Breaking backward compatibility without a deprecation plan");
    lines.push("");
    lines.push("### Operational Impact");
    lines.push("");
    lines.push(
      "- Changing deployment topology or infrastructure requirements"
    );
    lines.push("- Changes that could impact system reliability");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Conflict Resolution Hierarchy");
  lines.push("");
  lines.push(
    "When documentation conflicts or is missing, use this hierarchy (highest authority first):"
  );
  lines.push("");

  if (config.docHierarchy) {
    config.docHierarchy.layers.forEach((layer, i) => {
      lines.push(`${i + 1}. **\`${layer.path}\`** -- ${layer.description}`);
    });
  } else {
    lines.push("1. **Architecture documentation** -- Component boundaries");
    lines.push("2. **API contracts and schemas** -- Interface definitions");
    lines.push("3. **Code and tests** -- Ground truth for current implementation");
    lines.push("4. **Component READMEs** -- Implementation details");
  }

  lines.push("");
  lines.push("### When Documentation Conflicts");
  lines.push("");
  lines.push("1. Prefer the higher-authority source from the list above");
  lines.push("2. Document the conflict and its location");
  lines.push(
    "3. Do not proceed with implementation until the conflict is resolved"
  );
  lines.push("4. Ask the user to clarify or update the conflicting docs");
  lines.push("");
  lines.push("### When Documentation Is Missing");
  lines.push("");
  lines.push(
    "1. Check if the information exists elsewhere using the hierarchy above"
  );
  lines.push("2. Document the gap");
  lines.push("3. Ask the user if you need the information to proceed");
  lines.push(
    "4. Never guess or assume -- missing docs are a blocker until clarified"
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// README
// ---------------------------------------------------------------------------

function generateReadme(config: SpecopsConfig): string {
  const lines: string[] = [];

  lines.push("# Agent Context and Workflows");
  lines.push("");
  lines.push(
    "This directory contains agent-specific workflow instructions and behavior rules."
  );
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This directory contains **agent-specific** content:");
  lines.push("- How agents should behave and work");
  lines.push("- When to escalate or stop");
  lines.push("- Coordination between agent types");
  lines.push("- Feature work documentation patterns");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Skills
  if (config.skills && config.skills.skills.length > 0) {
    lines.push("## Available Skills");
    lines.push("");
    for (const skill of config.skills.skills) {
      lines.push(`- **\`${skill.name}\`** -- ${skill.description}`);
    }
    lines.push("");
    lines.push("See `/CLAUDE.md` for complete skill descriptions.");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Escalation summary
  lines.push("## Escalation Rules");
  lines.push("");
  lines.push("All agents must follow the escalation rules in `/CLAUDE.md`.");
  lines.push("");
  lines.push("**Quick summary -- STOP and escalate if:**");
  lines.push("");
  if (config.escalation) {
    for (const category of config.escalation.categories) {
      lines.push(`- **${category.name}:** ${category.triggers[0]}`);
    }
  } else {
    lines.push("- Introducing new components or service boundaries");
    lines.push("- Modifying authentication or security boundaries");
    lines.push("- Breaking any public API");
    lines.push("- Changes that could impact system reliability");
  }
  lines.push("");
  lines.push(
    "**See [`escalation-rules.md`](escalation-rules.md) for full details.**"
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // ExecPlans
  lines.push("## Feature Work");
  lines.push("");
  lines.push(
    "For non-trivial features, create an ExecPlan. See [`docs/exec-plans/PLANS.md`](../exec-plans/PLANS.md) for the process and template."
  );
  lines.push("");
  lines.push("**Use an ExecPlan for:**");
  lines.push("- Non-trivial features requiring planning");
  lines.push("- Architectural changes affecting multiple components");
  lines.push("- Features spanning multiple files or modules");
  lines.push("");
  lines.push("**Skip for:**");
  lines.push("- Trivial bug fixes (single file, obvious solution)");
  lines.push("- Simple refactoring with no architectural impact");
  lines.push("- Documentation-only changes");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Additional context
  lines.push("## Additional Context");
  lines.push("");
  lines.push(
    "- [Escalation Rules](escalation-rules.md) -- Stop/escalate triggers and conflict resolution"
  );
  lines.push(
    "- [Continuous Improvement](continuous-improvement.md) -- How to suggest documentation improvements"
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Continuous improvement
// ---------------------------------------------------------------------------

function generateContinuousImprovement(): string {
  return [
    "# Continuous Improvement",
    "",
    "**This documentation should evolve based on real usage.** If you encounter issues, help improve the system.",
    "",
    "## When to Suggest Improvements",
    "",
    "**Suggest improvements to CLAUDE.md, skills, or docs when:**",
    "",
    "- **Instructions are unclear** -- You had to guess or make assumptions",
    "- **Documentation is missing** -- Critical information was not documented",
    "- **Instructions conflict** -- Different docs gave contradicting guidance",
    "- **Patterns do not work** -- Documented approach failed or caused issues",
    "- **Common tasks are hard** -- Frequent operations lack clear guidance",
    "- **Skills are missing** -- You needed a workflow that does not exist as a skill",
    "",
    "## How to Suggest Improvements",
    "",
    "When suggesting improvements, be specific:",
    "",
    "1. **What went wrong:**",
    "   - Quote the unclear instruction or identify the missing section",
    "   - Explain what you expected vs. what you found",
    "",
    "2. **Why it was problematic:**",
    "   - How did this cause confusion or errors?",
    "   - What assumptions did you have to make?",
    "",
    "3. **Proposed fix:**",
    "   - Specific wording changes",
    "   - Missing content to add",
    "   - New skill to create",
    "   - Reorganization suggestion",
    "",
    "## What We Can Improve",
    "",
    "**In CLAUDE.md:**",
    "- Unclear instructions",
    "- Missing quick references",
    "- Outdated information",
    "",
    "**In Skills:**",
    "- Missing workflows for common tasks",
    "- Unclear step-by-step instructions",
    "- Missing examples or templates",
    "",
    "**In docs/:**",
    "- Missing architecture documentation",
    "- Outdated patterns",
    "- Unclear examples",
    "",
    "## Your Help Matters",
    "",
    "Agents encounter edge cases and gaps that humans might miss. Your suggestions help make instructions clearer for future agents, prevent repeated mistakes, and build a self-improving system.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate the docs/agent-context/ directory.
 *
 * @param projectDir — Project root directory.
 * @param config — Parsed specops config.
 * @returns List of absolute paths of files created or updated.
 */
export async function generateAgentContext(
  projectDir: string,
  config: SpecopsConfig
): Promise<string[]> {
  const agentContextDir = resolve(projectDir, "docs", "agent-context");
  await mkdir(agentContextDir, { recursive: true });

  const created: string[] = [];

  // escalation-rules.md — always regenerated
  const escalationPath = resolve(agentContextDir, "escalation-rules.md");
  await writeFile(escalationPath, generateEscalationRules(config), "utf-8");
  created.push(escalationPath);

  // README.md — always regenerated
  const readmePath = resolve(agentContextDir, "README.md");
  await writeFile(readmePath, generateReadme(config), "utf-8");
  created.push(readmePath);

  // continuous-improvement.md — always regenerated
  const ciPath = resolve(agentContextDir, "continuous-improvement.md");
  await writeFile(ciPath, generateContinuousImprovement(), "utf-8");
  created.push(ciPath);

  return created;
}
