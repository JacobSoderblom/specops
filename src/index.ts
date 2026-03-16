#!/usr/bin/env node

/**
 * specops CLI entry point.
 *
 * Commands:
 *   init    — Interactive scaffold for a new project
 *   update  — Regenerate all managed files from specops.yaml
 */

import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runUpdate } from "./commands/update.js";
import { ConfigError } from "./config/loader.js";

const program = new Command();

program
  .name("specops")
  .description(
    "Agent operating system for AI-assisted software development. Scaffolds governance, workflows, and coordination for AI agents working on codebases."
  )
  .version("0.1.0");

program
  .command("init")
  .description(
    "Initialize specops in the current project. By default, installs the AI scan skill and prompts you to run /specops:scan to auto-generate specops.yaml."
  )
  .option(
    "--interactive",
    "Use the interactive wizard instead of the AI scan (manual setup)"
  )
  .option(
    "--no-scan",
    "Alias for --interactive: skip scan mode and use the wizard"
  )
  .action(async (opts: { interactive?: boolean; scan?: boolean }) => {
    try {
      await runInit({ interactive: opts.interactive, scan: opts.scan });
    } catch (err) {
      handleError(err);
    }
  });

program
  .command("update")
  .description(
    "Regenerate all managed files from specops.yaml. Safe to run repeatedly."
  )
  .option(
    "-d, --dir <path>",
    "Project root directory (defaults to current directory)"
  )
  .action(async (opts: { dir?: string }) => {
    try {
      await runUpdate(opts.dir);
    } catch (err) {
      handleError(err);
    }
  });

program.parse();

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

function handleError(err: unknown): void {
  if (err instanceof ConfigError) {
    console.error(`\nConfiguration error: ${err.message}\n`);
    process.exit(1);
  }

  if (err instanceof Error) {
    console.error(`\nError: ${err.message}\n`);
    if (process.env["DEBUG"]) {
      console.error(err.stack);
    }
    process.exit(1);
  }

  console.error("\nUnexpected error:", err, "\n");
  process.exit(1);
}
