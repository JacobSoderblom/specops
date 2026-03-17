/**
 * Config loader — reads and validates specops.yaml.
 *
 * Validation is intentionally simple: we check structural requirements
 * (required fields, correct types) without pulling in a schema validation
 * library. This keeps the dependency footprint minimal.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import yaml from "js-yaml";
import type { SpecopsConfig } from "./schema.js";
import { KNOWN_TARGETS } from "./schema.js";

/** Thrown when config is missing or structurally invalid. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Default config file name, resolved relative to the working directory.
 */
export const CONFIG_FILE = "specops.yaml";

/**
 * Load and validate specops.yaml from the given directory.
 *
 * @param dir — Directory containing specops.yaml. Defaults to cwd.
 * @returns Parsed and validated config.
 * @throws ConfigError if the file is missing or fails validation.
 */
export async function loadConfig(dir?: string): Promise<SpecopsConfig> {
  const root = dir ?? process.cwd();
  const configPath = resolve(root, CONFIG_FILE);

  let raw: string;
  try {
    raw = await readFile(configPath, "utf-8");
  } catch {
    throw new ConfigError(
      `Config file not found: ${configPath}\nRun \`specops init\` to create one.`
    );
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ConfigError(`Failed to parse ${configPath}:\n${message}`);
  }

  return validate(parsed);
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validate(data: unknown): SpecopsConfig {
  if (typeof data !== "object" || data === null) {
    throw new ConfigError("Config must be a YAML object.");
  }

  const obj = data as Record<string, unknown>;

  // -- project (required) --------------------------------------------------
  requireObject(obj, "project");
  const project = obj["project"] as Record<string, unknown>;
  requireString(project, "name", "project.name");
  requireString(project, "description", "project.description");

  // -- stack (required) ----------------------------------------------------
  requireObject(obj, "stack");
  const stack = obj["stack"] as Record<string, unknown>;
  requireStringArray(stack, "languages", "stack.languages");

  // -- agents (required) ---------------------------------------------------
  requireObject(obj, "agents");
  const agents = obj["agents"] as Record<string, unknown>;
  requireArray(agents, "roles", "agents.roles");
  const roles = agents["roles"] as unknown[];
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    if (typeof role !== "object" || role === null) {
      throw new ConfigError(`agents.roles[${i}] must be an object.`);
    }
    const r = role as Record<string, unknown>;
    requireString(r, "name", `agents.roles[${i}].name`);
    requireString(r, "authority", `agents.roles[${i}].authority`);
    requireString(r, "description", `agents.roles[${i}].description`);
  }

  // -- agents.targets (optional) --------------------------------------------
  if (agents["targets"] !== undefined) {
    requireStringArray(agents, "targets", "agents.targets");
    const targets = agents["targets"] as string[];
    for (let i = 0; i < targets.length; i++) {
      if (!(KNOWN_TARGETS as readonly string[]).includes(targets[i])) {
        throw new ConfigError(
          `agents.targets[${i}] must be one of: ${KNOWN_TARGETS.join(", ")}. Got "${targets[i]}".`
        );
      }
    }
  }

  // -- escalation (optional) -----------------------------------------------
  if (obj["escalation"] !== undefined) {
    const esc = obj["escalation"] as Record<string, unknown>;
    requireArray(esc, "categories", "escalation.categories");
    const cats = esc["categories"] as unknown[];
    for (let i = 0; i < cats.length; i++) {
      const cat = cats[i];
      if (typeof cat !== "object" || cat === null) {
        throw new ConfigError(
          `escalation.categories[${i}] must be an object.`
        );
      }
      const c = cat as Record<string, unknown>;
      requireString(c, "name", `escalation.categories[${i}].name`);
      requireStringArray(
        c,
        "triggers",
        `escalation.categories[${i}].triggers`
      );
    }
  }

  // -- docHierarchy (optional) ---------------------------------------------
  if (obj["docHierarchy"] !== undefined) {
    const dh = obj["docHierarchy"] as Record<string, unknown>;
    requireArray(dh, "layers", "docHierarchy.layers");
    const layers = dh["layers"] as unknown[];
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (typeof layer !== "object" || layer === null) {
        throw new ConfigError(`docHierarchy.layers[${i}] must be an object.`);
      }
      const l = layer as Record<string, unknown>;
      requireString(l, "path", `docHierarchy.layers[${i}].path`);
      requireString(
        l,
        "description",
        `docHierarchy.layers[${i}].description`
      );
    }
  }

  // -- skills (optional) ---------------------------------------------------
  if (obj["skills"] !== undefined) {
    const sk = obj["skills"] as Record<string, unknown>;
    requireArray(sk, "skills", "skills.skills");
    const skills = sk["skills"] as unknown[];
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      if (typeof skill !== "object" || skill === null) {
        throw new ConfigError(`skills.skills[${i}] must be an object.`);
      }
      const s = skill as Record<string, unknown>;
      requireString(s, "name", `skills.skills[${i}].name`);
      requireString(s, "description", `skills.skills[${i}].description`);
      requireString(s, "whenToUse", `skills.skills[${i}].whenToUse`);
    }
  }

  // If we got here, the structure is valid. Cast and return.
  return data as unknown as SpecopsConfig;
}

function requireObject(obj: Record<string, unknown>, key: string): void {
  if (typeof obj[key] !== "object" || obj[key] === null) {
    throw new ConfigError(`Missing required section: ${key}`);
  }
}

function requireString(
  obj: Record<string, unknown>,
  key: string,
  path: string
): void {
  if (typeof obj[key] !== "string" || obj[key] === "") {
    throw new ConfigError(`${path} must be a non-empty string.`);
  }
}

function requireArray(
  obj: Record<string, unknown>,
  key: string,
  path: string
): void {
  if (!Array.isArray(obj[key])) {
    throw new ConfigError(`${path} must be an array.`);
  }
}

/**
 * Return the effective agent targets for a config.
 * Defaults to ["claude"] when the field is absent.
 */
export function getTargets(config: SpecopsConfig): string[] {
  return config.agents.targets ?? ["claude"];
}

function requireStringArray(
  obj: Record<string, unknown>,
  key: string,
  path: string
): void {
  requireArray(obj, key, path);
  const arr = obj[key] as unknown[];
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== "string") {
      throw new ConfigError(`${path}[${i}] must be a string.`);
    }
  }
  if (arr.length === 0) {
    throw new ConfigError(`${path} must have at least one entry.`);
  }
}
