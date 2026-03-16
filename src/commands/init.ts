/**
 * `specops init` command.
 *
 * Two modes:
 *
 * 1. Scan mode (default): Writes the specops-scan skill to
 *    .claude/skills/specops-scan/SKILL.md and tells the user to run
 *    `/specops:scan` in their AI tool. The AI does the rest — it analyzes
 *    the codebase and generates specops.yaml automatically.
 *
 * 2. Interactive mode (--interactive / --no-scan): Runs the wizard that
 *    prompts for project details and generates specops.yaml directly.
 *    Use this as a fallback when you prefer manual setup.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import inquirer from "inquirer";
import chalk from "chalk";
import yaml from "js-yaml";
import type { SpecopsConfig } from "../config/schema.js";
import { runUpdate } from "./update.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface InitOptions {
  /** Run scan mode (default true). Pass false to use the interactive wizard. */
  scan?: boolean;
  /** Alias for scan=false. Overrides scan if both are provided. */
  interactive?: boolean;
}

interface InitAnswers {
  projectName: string;
  projectDescription: string;
  languages: string;
  frameworks: string;
  databases: string;
  infrastructure: string;
  wantRoles: boolean;
  wantEscalation: boolean;
  wantSkills: boolean;
}

/**
 * Run the init command.
 *
 * Defaults to scan mode. Pass `{ interactive: true }` or `{ scan: false }`
 * to use the interactive wizard instead.
 */
export async function runInit(options: InitOptions = {}): Promise<void> {
  const useScan = options.interactive ? false : (options.scan ?? true);

  if (useScan) {
    await runScanInit();
  } else {
    await runInteractiveInit();
  }
}

// ---------------------------------------------------------------------------
// Scan mode
// ---------------------------------------------------------------------------

/**
 * Scan mode: write the specops-scan skill and prompt the user to run it.
 *
 * This is the bootstrap path. The AI skill does the heavy lifting of
 * analyzing the codebase and generating specops.yaml.
 */
async function runScanInit(): Promise<void> {
  const projectDir = process.cwd();

  console.log("");
  console.log(chalk.bold("specops init"));
  console.log(
    chalk.dim("Bootstrap agent governance via AI-powered codebase scan.")
  );
  console.log("");

  // Write the scan skill
  const scanSkillDir = resolve(projectDir, ".claude", "skills", "specops-scan");
  await mkdir(scanSkillDir, { recursive: true });

  const scanSkillPath = resolve(scanSkillDir, "SKILL.md");
  const skillContent = await loadScanSkillTemplate();
  await writeFile(scanSkillPath, skillContent, "utf-8");

  const relPath = scanSkillPath.replace(projectDir + "/", "");
  console.log(chalk.green(`  Created ${relPath}`));
  console.log("");
  console.log(chalk.bold("Next step:"));
  console.log("");
  console.log(
    "  Open your AI tool (Claude Code, Cursor, etc.) in this project and run:"
  );
  console.log("");
  console.log(chalk.cyan("    /specops:scan"));
  console.log("");
  console.log(
    "  The AI will analyze your codebase and generate a complete specops.yaml."
  );
  console.log("  Review it, then run:");
  console.log("");
  console.log(chalk.cyan("    specops update"));
  console.log("");
  console.log(
    chalk.dim(
      "  Prefer the wizard? Run `specops init --interactive` instead."
    )
  );
  console.log("");
}

/**
 * Resolve the scan skill template path.
 *
 * At runtime, __dirname is dist/commands/. Walk up two levels to the package
 * root and look in src/templates/ — the same convention used by other
 * generators in this codebase.
 */
async function loadScanSkillTemplate(): Promise<string> {
  const packageRoot = resolve(__dirname, "..", "..");
  const templatePath = resolve(
    packageRoot,
    "src",
    "templates",
    "scan-skill.md"
  );
  try {
    return await readFile(templatePath, "utf-8");
  } catch {
    return generateScanSkillFallback();
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

// ---------------------------------------------------------------------------
// Interactive mode
// ---------------------------------------------------------------------------

/**
 * Run the interactive init command (legacy / manual path).
 */
async function runInteractiveInit(): Promise<void> {
  const projectDir = process.cwd();
  const configPath = resolve(projectDir, "specops.yaml");

  console.log("");
  console.log(chalk.bold("specops init --interactive"));
  console.log(
    chalk.dim("Configure agent governance for your project.")
  );
  console.log("");

  // Check for existing config
  if (existsSync(configPath)) {
    const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
      {
        type: "confirm",
        name: "overwrite",
        message:
          "specops.yaml already exists. Overwrite it? (managed files will be regenerated)",
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log(chalk.yellow("Aborted. Existing config preserved."));
      return;
    }
  }

  // Interactive prompts
  const answers = await inquirer.prompt<InitAnswers>([
    {
      type: "input",
      name: "projectName",
      message: "Project name:",
      default: projectDir.split("/").pop() ?? "my-project",
    },
    {
      type: "input",
      name: "projectDescription",
      message: "One-line project description:",
      default: "A software project",
    },
    {
      type: "input",
      name: "languages",
      message: "Languages (comma-separated):",
      default: "TypeScript",
    },
    {
      type: "input",
      name: "frameworks",
      message: "Frameworks (comma-separated, or blank):",
      default: "",
    },
    {
      type: "input",
      name: "databases",
      message: "Databases (comma-separated, or blank):",
      default: "",
    },
    {
      type: "input",
      name: "infrastructure",
      message: "Infrastructure (comma-separated, or blank):",
      default: "",
    },
    {
      type: "confirm",
      name: "wantRoles",
      message: "Configure agent roles? (recommended)",
      default: true,
    },
    {
      type: "confirm",
      name: "wantEscalation",
      message: "Include default escalation rules?",
      default: true,
    },
    {
      type: "confirm",
      name: "wantSkills",
      message: "Generate skill stubs?",
      default: true,
    },
  ]);

  // Build config object
  const config = buildConfig(answers);

  // Write specops.yaml
  const yamlContent = generateYamlWithComments(config);
  await writeFile(configPath, yamlContent, "utf-8");
  console.log("");
  console.log(chalk.green("  Created specops.yaml"));

  // Run generators
  await runUpdate(projectDir);
}

/**
 * Build a SpecopsConfig from interactive answers.
 */
function buildConfig(answers: InitAnswers): SpecopsConfig {
  const parseList = (input: string): string[] =>
    input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const config: SpecopsConfig = {
    project: {
      name: answers.projectName,
      description: answers.projectDescription,
    },
    stack: {
      languages: parseList(answers.languages),
    },
    agents: {
      roles: [],
    },
  };

  // Optional stack fields
  const frameworks = parseList(answers.frameworks);
  if (frameworks.length > 0) config.stack.frameworks = frameworks;

  const databases = parseList(answers.databases);
  if (databases.length > 0) config.stack.databases = databases;

  const infrastructure = parseList(answers.infrastructure);
  if (infrastructure.length > 0) config.stack.infrastructure = infrastructure;

  // Default roles
  if (answers.wantRoles) {
    config.agents.roles = [
      {
        name: "Backend Architect",
        authority: "system-design, api-contracts, data-models",
        description:
          "Designs backend systems and produces authoritative implementation plans",
      },
      {
        name: "Frontend Developer",
        authority: "ui-implementation, component-design, state-management",
        description: "Implements UI components and consumes API contracts",
      },
      {
        name: "Staff Engineer",
        authority: "code-review, quality, risk-assessment",
        description:
          "Reviews plans and code for quality, risk, and architectural alignment",
      },
    ];
  } else {
    config.agents.roles = [
      {
        name: "Developer",
        authority: "implementation",
        description: "Implements features and fixes",
      },
    ];
  }

  // Default escalation
  if (answers.wantEscalation) {
    config.escalation = {
      categories: [
        {
          name: "Architecture and Design",
          triggers: [
            "Introducing new components or service boundaries",
            "Changing API contracts or data models",
            "Modifying component responsibilities",
            "Architectural decision not covered by existing docs",
          ],
        },
        {
          name: "Security and Data",
          triggers: [
            "Modifying authentication or authorization boundaries",
            "Changing how secrets or credentials are handled",
            "Modifying database schemas without a migration strategy",
          ],
        },
        {
          name: "Breaking Changes",
          triggers: [
            "Breaking any public API (REST, GraphQL, WebSocket, events)",
            "Removing or renaming public interfaces",
            "Breaking backward compatibility without a deprecation plan",
          ],
        },
        {
          name: "Operational Impact",
          triggers: [
            "Changing deployment topology or infrastructure requirements",
            "Modifying observability or logging semantics",
            "Changes that could impact system reliability",
          ],
        },
        {
          name: "Code Quality",
          triggers: [
            "Duplicating code that should be shared",
            "Test failures you do not understand",
            "Disabling or skipping tests",
            "Working around existing abstractions instead of using them",
          ],
        },
      ],
    };
  }

  // Default doc hierarchy
  config.docHierarchy = {
    layers: [
      {
        path: "docs/architecture.md",
        description: "System architecture and component boundaries",
      },
      {
        path: "docs/api-contracts.md",
        description: "API contracts and schemas",
      },
      {
        path: "docs/adr/*.md",
        description: "Architecture Decision Records",
      },
      {
        path: "Code and tests",
        description: "Ground truth for current implementation",
      },
      {
        path: "Component READMEs",
        description: "Implementation details",
      },
    ],
  };

  // Default skills
  if (answers.wantSkills) {
    config.skills = {
      skills: [
        {
          name: "backend-workflows",
          description: "Common backend development workflows",
          whenToUse:
            "Adding migrations, API endpoints, bus events, or writing tests",
        },
        {
          name: "frontend-workflows",
          description: "Common frontend development workflows",
          whenToUse:
            "Adding routes, components, API integrations, or state management",
        },
      ],
    };
  }

  return config;
}

/**
 * Serialize config to YAML with helpful header comments.
 */
function generateYamlWithComments(config: SpecopsConfig): string {
  const header = [
    "# specops configuration",
    "# This file defines your project's agent governance structure.",
    "# Run `specops update` after editing to regenerate managed files.",
    "",
  ].join("\n");

  const yamlStr = yaml.dump(config, {
    indent: 2,
    lineWidth: 100,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  });

  return header + yamlStr;
}
