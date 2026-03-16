/**
 * Skills generator.
 *
 * Creates .claude/skills/<skill-name>/SKILL.md stub files for each skill
 * defined in the specops config. Existing SKILL.md files are never
 * overwritten — they are owned by the user after initial generation.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import type { SpecopsConfig, SkillConfig } from "../config/schema.js";

/**
 * Generate a SKILL.md stub for a single skill.
 */
function generateSkillStub(skill: SkillConfig): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push(`name: "${skill.name}"`);
  lines.push(`description: "${skill.description}"`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${formatSkillTitle(skill.name)}`);
  lines.push("");
  lines.push("## When to Use This Skill");
  lines.push("");
  lines.push(`- ${skill.whenToUse}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Workflows");
  lines.push("");
  lines.push("<!-- Add domain-specific workflows here. Each workflow should include: -->");
  lines.push("<!-- 1. When to use it -->");
  lines.push("<!-- 2. Files to reference -->");
  lines.push("<!-- 3. Step-by-step instructions -->");
  lines.push("<!-- 4. Verification steps -->");
  lines.push("");
  lines.push("### Workflow 1: [Name]");
  lines.push("");
  lines.push("**Files to reference:**");
  lines.push("- `path/to/relevant/file`");
  lines.push("");
  lines.push("**Steps:**");
  lines.push("1. [Step description]");
  lines.push("2. [Step description]");
  lines.push("3. [Step description]");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Documentation Map");
  lines.push("");
  lines.push("<!-- List the key docs agents should reference when using this skill -->");
  lines.push("- `docs/` -- [description]");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Quick Reference");
  lines.push("");
  lines.push("<!-- Add commonly needed commands, paths, or patterns -->");

  return lines.join("\n");
}

/**
 * Convert a kebab-case skill name to a title.
 * "backend-workflows" -> "Backend Workflows"
 */
function formatSkillTitle(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate skill stubs under .claude/skills/.
 *
 * Only creates SKILL.md if it does not already exist. Existing skill files
 * are never overwritten — they are user-owned content.
 *
 * @param projectDir — Project root directory.
 * @param config — Parsed specops config.
 * @returns List of absolute paths of files created (not updated).
 */
export async function generateSkills(
  projectDir: string,
  config: SpecopsConfig
): Promise<string[]> {
  if (!config.skills || config.skills.skills.length === 0) {
    return [];
  }

  const created: string[] = [];

  for (const skill of config.skills.skills) {
    const skillDir = resolve(projectDir, ".claude", "skills", skill.name);
    await mkdir(skillDir, { recursive: true });

    const skillPath = resolve(skillDir, "SKILL.md");
    if (!existsSync(skillPath)) {
      const content = generateSkillStub(skill);
      await writeFile(skillPath, content, "utf-8");
      created.push(skillPath);
    }
  }

  // Also generate the feature-workspace skill if it does not exist,
  // since ExecPlans are a core specops concept.
  const featureWorkspaceDir = resolve(
    projectDir,
    ".claude",
    "skills",
    "feature-workspace"
  );
  await mkdir(featureWorkspaceDir, { recursive: true });

  const fwPath = resolve(featureWorkspaceDir, "SKILL.md");
  if (!existsSync(fwPath)) {
    const content = generateFeatureWorkspaceSkill();
    await writeFile(fwPath, content, "utf-8");
    created.push(fwPath);
  }

  return created;
}

/**
 * Generate the built-in feature-workspace skill.
 */
function generateFeatureWorkspaceSkill(): string {
  return [
    "---",
    'name: "feature-workspace"',
    'description: "Autonomous feature implementation using ExecPlans -- living documents checked into the repo. Use for non-trivial features requiring planning, implementation, and review."',
    "---",
    "",
    "# Feature Workspace",
    "",
    "## Purpose",
    "",
    "For non-trivial features, create an **ExecPlan** -- a living document at `docs/exec-plans/<feature>.md` that tracks the feature from design through implementation to outcome. The plan is committed to the feature branch alongside code, updated throughout implementation, and reviewed as part of the PR.",
    "",
    "See `docs/exec-plans/PLANS.md` for the full template and guidelines.",
    "",
    "---",
    "",
    "## When to Use This Pattern",
    "",
    "**Use for:**",
    "- Non-trivial features requiring planning",
    "- Architectural changes affecting multiple components",
    "- Features spanning multiple files or modules",
    "- Complex bug investigations requiring documentation",
    "",
    "**Skip for:**",
    "- Trivial bug fixes (single file, obvious solution)",
    "- Simple refactoring with no architectural impact",
    "- Documentation-only changes",
    "- Well-defined, single-agent tasks with clear scope",
    "",
    "**When in doubt:** Ask the user if an ExecPlan is needed.",
    "",
    "---",
    "",
    "## Workflow",
    "",
    "1. Create a feature branch",
    "2. Copy the ExecPlan template from `docs/exec-plans/PLANS.md`",
    "3. Fill in Context, Plan of Work, and Concrete Steps",
    "4. Commit the plan as the first commit on the branch",
    "5. Implement milestone by milestone, updating Progress and Decision Log",
    "6. Fill Outcomes & Retrospective at completion",
    "7. Open PR with ExecPlan and code visible together",
    "",
    "---",
    "",
    "## Commit Strategy",
    "",
    "```",
    "Add ExecPlan for <feature>          # First commit: plan only",
    "Milestone 1: <description>          # Code + plan progress",
    "Milestone 2: <description>          # Code + plan progress",
    "Complete ExecPlan outcomes           # Final plan update",
    "```",
    "",
    "PRs can use squash merge if desired, or keep the full history to show plan evolution.",
  ].join("\n");
}
