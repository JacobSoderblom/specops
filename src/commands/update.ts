/**
 * `specops update` command.
 *
 * Reads specops.yaml and regenerates all managed files. This is safe to
 * run repeatedly — it is idempotent. Files that are user-owned (like
 * individual skill SKILL.md files after initial creation) are not
 * overwritten.
 *
 * Files that are always regenerated:
 * - CLAUDE.md
 * - docs/agent-context/README.md
 * - docs/agent-context/escalation-rules.md
 * - docs/agent-context/continuous-improvement.md
 * - docs/exec-plans/PLANS.md
 *
 * Files created only if missing:
 * - docs/exec-plans/README.md
 * - .claude/skills/<name>/SKILL.md (per skill)
 */

import chalk from "chalk";
import { loadConfig } from "../config/loader.js";
import { generateClaudeMd } from "../generators/claude-md.js";
import { generateExecPlans } from "../generators/exec-plans.js";
import { generateAgentContext } from "../generators/agent-context.js";
import { generateSkills } from "../generators/skills.js";

/**
 * Run the update command.
 *
 * @param projectDir — Project root. Defaults to cwd.
 */
export async function runUpdate(projectDir?: string): Promise<void> {
  const dir = projectDir ?? process.cwd();

  console.log("");
  console.log(chalk.bold("specops update"));
  console.log(chalk.dim(`Project root: ${dir}`));
  console.log("");

  // Load config
  const config = await loadConfig(dir);

  // Track all created/updated files
  const results: { path: string; action: "created" | "updated" }[] = [];

  // 1. Generate CLAUDE.md
  const claudePath = await generateClaudeMd(dir, config);
  results.push({ path: claudePath, action: "updated" });

  // 2. Generate docs/agent-context/
  const agentContextPaths = await generateAgentContext(dir, config);
  for (const p of agentContextPaths) {
    results.push({ path: p, action: "updated" });
  }

  // 3. Generate docs/exec-plans/
  const execPlanPaths = await generateExecPlans(dir, config);
  for (const p of execPlanPaths) {
    results.push({ path: p, action: "updated" });
  }

  // 4. Generate skills
  const skillPaths = await generateSkills(dir, config);
  for (const p of skillPaths) {
    results.push({ path: p, action: "created" });
  }

  // Report results
  const relPath = (p: string) => p.replace(dir + "/", "");

  for (const r of results) {
    const icon = r.action === "created" ? chalk.green("+") : chalk.blue("~");
    console.log(`  ${icon} ${relPath(r.path)}`);
  }

  console.log("");
  console.log(
    chalk.green(`Done. ${results.length} files generated.`)
  );
  console.log(
    chalk.dim(
      "Edit specops.yaml and run `specops update` to regenerate."
    )
  );
  console.log("");
}
