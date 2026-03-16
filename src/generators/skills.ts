/**
 * Skills generator.
 *
 * Creates .claude/skills/<skill-name>/SKILL.md stub files for each skill
 * defined in the specops config. Existing SKILL.md files are never
 * overwritten — they are owned by the user after initial generation.
 *
 * Framework-owned skills (feature-workspace, specops-scan, specops-plan)
 * are always overwritten on every `specops update` run. They are managed
 * by specops and should not be edited manually.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { SpecopsConfig, SkillConfig } from "../config/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * User-owned skills: only created if SKILL.md does not already exist.
 * Framework-owned skills (feature-workspace, specops-scan): always
 * overwritten on every run.
 *
 * @param projectDir — Project root directory.
 * @param config — Parsed specops config.
 * @returns List of absolute paths of files created or updated.
 */
export async function generateSkills(
  projectDir: string,
  config: SpecopsConfig
): Promise<string[]> {
  const created: string[] = [];

  // Generate user-defined skill stubs (only if missing).
  if (config.skills && config.skills.skills.length > 0) {
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
  }

  // Framework-owned: feature-workspace (created only if missing).
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

  // Framework-owned: specops-scan (always overwritten — never user-edited).
  const scanDir = resolve(projectDir, ".claude", "skills", "specops-scan");
  await mkdir(scanDir, { recursive: true });

  const scanPath = resolve(scanDir, "SKILL.md");
  const scanContent = await loadSkillTemplate("scan-skill.md");
  await writeFile(scanPath, scanContent, "utf-8");
  created.push(scanPath);

  // Framework-owned: specops-plan (always overwritten — never user-edited).
  const planDir = resolve(projectDir, ".claude", "skills", "specops-plan");
  await mkdir(planDir, { recursive: true });

  const planPath = resolve(planDir, "SKILL.md");
  const planContent = await loadSkillTemplate("plan-skill.md");
  await writeFile(planPath, planContent, "utf-8");
  created.push(planPath);

  return created;
}

/**
 * Load a skill template from the bundled templates directory.
 *
 * At runtime, __dirname is dist/generators/. We walk up two levels to the
 * package root and then into src/templates/ — the same pattern used by the
 * CLAUDE.md generator. The src/templates/ directory is shipped in the npm
 * package via the "files" field in package.json.
 */
async function loadSkillTemplate(filename: string): Promise<string> {
  const packageRoot = resolve(__dirname, "..", "..");
  const templatePath = resolve(packageRoot, "src", "templates", filename);
  try {
    return await readFile(templatePath, "utf-8");
  } catch {
    // Fallback: generate a minimal stub so the skill is always present.
    if (filename === "scan-skill.md") return generateScanSkillFallback();
    return generatePlanSkillFallback();
  }
}

/**
 * Minimal fallback scan skill content used when the template file cannot be
 * found (e.g., during development before the first build).
 */
function generateScanSkillFallback(): string {
  return [
    "---",
    'name: "specops-scan"',
    'description: "Bootstrap specops.yaml by analyzing the codebase automatically."',
    "---",
    "",
    "# Specops Scan",
    "",
    "Analyze this codebase and generate a complete `specops.yaml` configuration.",
    "",
    "Run this skill to bootstrap specops governance for a new project.",
    "",
    "## Steps",
    "",
    "1. Read package manifests to identify the tech stack",
    "2. Analyze directory structure to map component boundaries",
    "3. Read existing docs and conventions",
    "4. Recommend appropriate agent roles",
    "5. Write `specops.yaml` with discovered configuration",
    "6. Tell the user to run `specops update`",
  ].join("\n");
}

/**
 * Minimal fallback plan skill content used when the template file cannot be
 * found (e.g., during development before the first build).
 */
function generatePlanSkillFallback(): string {
  return [
    "---",
    'name: "specops-plan"',
    'description: "Plan a feature using an ExecPlan."',
    "---",
    "",
    "# Specops Plan",
    "",
    "Create a feature branch and ExecPlan for a new feature.",
    "",
    "## Steps",
    "",
    "1. Parse feature name from args (or ask the user)",
    "2. Read specops.yaml, CLAUDE.md, and relevant code",
    "3. Fill out the ExecPlan template at docs/exec-plans/<feature>.md",
    "4. Create feature branch, write plan, commit",
    "5. Present plan to user for review",
  ].join("\n");
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
