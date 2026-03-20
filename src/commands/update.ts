/**
 * `specops update` command.
 *
 * Reads specops.yaml and regenerates managed files. CLAUDE.md and AGENTS.md
 * use managed sections — only content between specops markers is replaced,
 * user content is preserved.
 *
 * Files that are always regenerated:
 * - docs/agent-context/README.md
 * - docs/agent-context/escalation-rules.md
 * - docs/agent-context/continuous-improvement.md
 * - docs/exec-plans/PLANS.md
 *
 * Files with managed sections (user content preserved):
 * - CLAUDE.md
 * - AGENTS.md
 *
 * Files created only if missing:
 * - docs/exec-plans/README.md
 * - .claude/skills/<name>/SKILL.md (per skill)
 */

import chalk from "chalk";
import { loadConfig, getTargets } from "../config/loader.js";
import { generateClaudeMd } from "../generators/claude-md.js";
import { generateAgentsMd } from "../generators/agents-md.js";
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
  const results: {
    path: string;
    action: "created" | "updated" | "skipped";
  }[] = [];
  const targets = getTargets(config);

  // 1. Generate CLAUDE.md (when targeting Claude)
  if (targets.includes("claude")) {
    const result = await generateClaudeMd(dir, config);
    results.push(result);
  }

  // 2. Generate AGENTS.md (when targeting Codex)
  if (targets.includes("codex")) {
    const result = await generateAgentsMd(dir, config);
    results.push(result);
  }

  // 3. Generate docs/agent-context/
  const agentContextPaths = await generateAgentContext(dir, config);
  for (const p of agentContextPaths) {
    results.push({ path: p, action: "updated" });
  }

  // 4. Generate docs/exec-plans/
  const execPlanPaths = await generateExecPlans(dir, config);
  for (const p of execPlanPaths) {
    results.push({ path: p, action: "updated" });
  }

  // 5. Generate skills (Claude-only — Codex has no skills system)
  if (targets.includes("claude")) {
    const skillPaths = await generateSkills(dir, config);
    for (const p of skillPaths) {
      results.push({ path: p, action: "created" });
    }
  }

  // Report results
  const relPath = (p: string) => p.replace(dir + "/", "");

  for (const r of results) {
    if (r.action === "skipped") {
      const icon = chalk.yellow("!");
      console.log(
        `  ${icon} ${relPath(r.path)} ${chalk.yellow("(no specops markers — skipped)")}`
      );
    } else {
      const icon =
        r.action === "created" ? chalk.green("+") : chalk.blue("~");
      console.log(`  ${icon} ${relPath(r.path)}`);
    }
  }

  const skipped = results.filter((r) => r.action === "skipped");
  if (skipped.length > 0) {
    console.log("");
    console.log(
      chalk.yellow(
        "  Skipped files have no specops markers. Run `specops import` to add markers,"
      )
    );
    console.log(
      chalk.yellow(
        "  or delete the file and re-run `specops update` to regenerate with markers."
      )
    );
  }

  console.log("");
  console.log(
    chalk.green(
      `Done. ${results.filter((r) => r.action !== "skipped").length} files generated.`
    )
  );
  console.log(
    chalk.dim("Edit specops.yaml and run `specops update` to regenerate.")
  );
  console.log("");
}
