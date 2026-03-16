/**
 * ExecPlan scaffolder.
 *
 * Creates the docs/exec-plans/ directory with PLANS.md (process documentation
 * and template) so that agents and humans know how to create and maintain
 * ExecPlans for non-trivial features.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import type { SpecopsConfig } from "../config/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function templateDir(): string {
  const packageRoot = resolve(__dirname, "..", "..");
  return resolve(packageRoot, "src", "templates");
}

/**
 * Read the bundled ExecPlan template.
 */
async function readExecPlanTemplate(): Promise<string> {
  const templatePath = resolve(templateDir(), "exec-plan.md");
  return readFile(templatePath, "utf-8");
}

/**
 * Generate the PLANS.md process document that explains how ExecPlans work.
 */
function generatePlansDoc(
  _config: SpecopsConfig,
  template: string
): string {
  const lines: string[] = [];

  lines.push("# ExecPlans");
  lines.push("");
  lines.push(
    "ExecPlans are **living documents checked into the repo** that track a feature from design through implementation to outcome. Each plan is self-contained, maintained throughout implementation, and committed alongside code on the feature branch."
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // -- How ExecPlans Work --
  lines.push("## How ExecPlans Work");
  lines.push("");
  lines.push("### Three Modes");
  lines.push("");
  lines.push(
    "1. **Authoring** -- Agent researches the codebase, fills Context and Orientation, designs Plan of Work, defines Validation criteria. The plan is committed as the first commit on the feature branch."
  );
  lines.push(
    "2. **Implementing** -- Agent works through Concrete Steps, updating Progress, Decision Log, and Surprises & Discoveries at every stopping point. Plan updates are committed alongside code."
  );
  lines.push(
    "3. **Discussing** -- Reviewers (human or agent) read the plan in the PR diff. The plan provides full context for the code changes without needing separate design docs."
  );
  lines.push("");

  // -- Non-Negotiable Requirements --
  lines.push("### Non-Negotiable Requirements");
  lines.push("");
  lines.push(
    "- **Self-contained.** A newcomer reading only the ExecPlan understands what is being built, why, and how to verify it."
  );
  lines.push(
    "- **Living.** The plan is updated throughout implementation -- not written once and forgotten."
  );
  lines.push(
    "- **Novice-friendly.** Plain language. No jargon without definition. Someone unfamiliar with the codebase can follow along."
  );
  lines.push(
    "- **Verifiable.** Every milestone and acceptance criterion is observable and testable."
  );
  lines.push("");

  // -- Guidelines --
  lines.push("### Guidelines");
  lines.push("");
  lines.push(
    "- Use plain language and concrete examples over abstract descriptions."
  );
  lines.push(
    '- State observable outcomes ("GET /api/x returns 200 with body matching Y") not vague goals ("works correctly").'
  );
  lines.push(
    "- Include explicit repo context -- name files, types, and functions the reader needs to find."
  );
  lines.push(
    "- Each milestone should be independently verifiable: tests pass, behavior observable, no partial states."
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // -- Plan Location and Lifecycle --
  lines.push("## Plan Location and Lifecycle");
  lines.push("");
  lines.push("- Plans live at `docs/exec-plans/<feature-name>.md`");
  lines.push(
    "- Created on the feature branch, committed alongside code"
  );
  lines.push(
    "- Updated throughout implementation (Progress, Decision Log, Surprises)"
  );
  lines.push(
    "- Merged with the PR -- the plan becomes permanent project history"
  );
  lines.push(
    "- Completed plans stay in place; the Outcomes & Retrospective section marks them done"
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // -- Milestones --
  lines.push("## Milestones");
  lines.push("");
  lines.push("Break work into milestones that are:");
  lines.push(
    "- **Small enough** to complete and verify in one focused session"
  );
  lines.push(
    "- **Independently testable** -- each milestone leaves the codebase in a working state"
  );
  lines.push(
    "- **Ordered by dependency** -- later milestones build on earlier ones"
  );
  lines.push(
    '- **Concrete** -- "Add `parse_temperature` function with 5 unit tests" not "implement parsing"'
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // -- Living Plan Sections --
  lines.push("## Living Plan Sections");
  lines.push("");
  lines.push("These sections are updated throughout implementation:");
  lines.push("");
  lines.push("### Progress");
  lines.push(
    "Check off milestones as they complete. Add timestamps. Note anything that deviated from the plan."
  );
  lines.push("");
  lines.push("### Decision Log");
  lines.push(
    "Record every non-obvious decision with context and rationale. Future readers need to understand *why*, not just *what*."
  );
  lines.push("");
  lines.push("### Surprises & Discoveries");
  lines.push(
    "Document anything unexpected: API behavior that differs from docs, edge cases not anticipated, performance characteristics, bugs found in adjacent code. This section is the most valuable for future work."
  );
  lines.push("");
  lines.push("### Outcomes & Retrospective");
  lines.push(
    "Filled at completion. What shipped, what was deferred, what would you do differently. Include PR number and any metrics."
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // -- Template --
  lines.push("## Template");
  lines.push("");
  lines.push(
    "Copy this skeleton when creating a new ExecPlan. Replace bracketed placeholders. Delete guidance comments (lines starting with `>`)."
  );
  lines.push("");
  lines.push("```markdown");
  lines.push(template);
  lines.push("```");
  lines.push("");
  lines.push("---");
  lines.push("");

  // -- Quick Reference --
  lines.push("## Quick Reference");
  lines.push("");
  lines.push("| Aspect | Details |");
  lines.push("|--------|---------|");
  lines.push("| Location | `docs/exec-plans/<feature-name>.md` |");
  lines.push("| Created | First commit on feature branch |");
  lines.push(
    "| Updated | At every stopping point during implementation |"
  );
  lines.push("| Reviewed | In the PR diff alongside code |");
  lines.push("| Completed | Outcomes section filled, stays in place |");
  lines.push("| Template | Copy the skeleton above |");

  return lines.join("\n");
}

/**
 * Scaffold the docs/exec-plans/ directory.
 *
 * @param projectDir — Project root directory.
 * @param config — Parsed specops config.
 * @returns List of absolute paths of files created or updated.
 */
export async function generateExecPlans(
  projectDir: string,
  config: SpecopsConfig
): Promise<string[]> {
  const execPlansDir = resolve(projectDir, "docs", "exec-plans");
  await mkdir(execPlansDir, { recursive: true });

  const template = await readExecPlanTemplate();
  const created: string[] = [];

  // PLANS.md — always regenerated
  const plansPath = resolve(execPlansDir, "PLANS.md");
  const plansContent = generatePlansDoc(config, template);
  await writeFile(plansPath, plansContent, "utf-8");
  created.push(plansPath);

  // README.md — index file, only created if it does not exist
  const readmePath = resolve(execPlansDir, "README.md");
  if (!existsSync(readmePath)) {
    const readmeContent = [
      "# ExecPlan Index",
      "",
      "This directory contains ExecPlans for features tracked in this project.",
      "See [PLANS.md](PLANS.md) for the process documentation and template.",
      "",
      "## Plans",
      "",
      "<!-- Add links to plans as they are created -->",
      "<!-- - [Feature Name](feature-name.md) — Status: In Progress -->",
      "",
    ].join("\n");
    await writeFile(readmePath, readmeContent, "utf-8");
    created.push(readmePath);
  }

  return created;
}
