/**
 * TypeScript types for specops.yaml configuration.
 *
 * This is the canonical schema definition. The YAML config file is validated
 * against these types at load time. When adding new config options, add the
 * type here first, then update the loader validation and generators.
 */

// ---------------------------------------------------------------------------
// Project metadata
// ---------------------------------------------------------------------------

export interface ProjectConfig {
  /** Display name of the project. */
  name: string;
  /** One-line description of what the project does. */
  description: string;
  /** Optional URL to the project repository. */
  repository?: string;
}

// ---------------------------------------------------------------------------
// Technology stack
// ---------------------------------------------------------------------------

export interface StackConfig {
  /** Programming languages used (e.g., ["TypeScript", "Rust", "Python"]). */
  languages: string[];
  /** Frameworks and libraries (e.g., ["Next.js", "Axum", "FastAPI"]). */
  frameworks?: string[];
  /** Databases and storage (e.g., ["PostgreSQL", "Redis", "S3"]). */
  databases?: string[];
  /** Infrastructure and tooling (e.g., ["Docker", "Kubernetes", "AWS"]). */
  infrastructure?: string[];
}

// ---------------------------------------------------------------------------
// Agent roles
// ---------------------------------------------------------------------------

export interface AgentRole {
  /** Role name shown in docs and CLAUDE.md (e.g., "Backend Architect"). */
  name: string;
  /** Comma-separated authority domains (e.g., "system-design, api-contracts"). */
  authority: string;
  /** One-line description of what this role does. */
  description: string;
}

export interface AgentsConfig {
  /** Ordered list of agent roles. First role listed has highest authority for ambiguous decisions. */
  roles: AgentRole[];
}

// ---------------------------------------------------------------------------
// Escalation rules
// ---------------------------------------------------------------------------

export interface EscalationCategory {
  /** Category name (e.g., "Architecture and Design"). */
  name: string;
  /** Triggers that require human escalation. */
  triggers: string[];
}

export interface EscalationConfig {
  /** Categories of escalation triggers. */
  categories: EscalationCategory[];
}

// ---------------------------------------------------------------------------
// Documentation hierarchy (conflict resolution)
// ---------------------------------------------------------------------------

export interface DocLayer {
  /** Glob pattern or path to the documentation source (e.g., "docs/architecture.md"). */
  path: string;
  /** Human-readable description of what this layer covers. */
  description: string;
}

export interface DocHierarchyConfig {
  /**
   * Ordered list of documentation layers from highest to lowest authority.
   * When docs conflict, higher-ranked layers win.
   */
  layers: DocLayer[];
}

// ---------------------------------------------------------------------------
// Architecture components
// ---------------------------------------------------------------------------

export interface ArchitectureComponent {
  /** Component name (e.g., "hub-core", "api-gateway"). */
  name: string;
  /** What this component is responsible for. */
  owns: string[];
  /** What this component must NOT do. */
  avoids: string[];
}

export interface ArchitectureConfig {
  /** Key principles that govern architectural decisions. */
  principles?: string[];
  /** Component responsibility boundaries. */
  components?: ArchitectureComponent[];
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export interface SkillConfig {
  /** Skill identifier used in directory names and slash commands. */
  name: string;
  /** Human-readable description shown in CLAUDE.md skill table. */
  description: string;
  /** When agents should use this skill. */
  whenToUse: string;
}

export interface SkillsConfig {
  /** List of skills to generate stubs for. */
  skills: SkillConfig[];
}

// ---------------------------------------------------------------------------
// Resources — links shown in CLAUDE.md
// ---------------------------------------------------------------------------

export interface ResourceLink {
  /** Display label (e.g., "Setup guide"). */
  label: string;
  /** Path relative to project root (e.g., "README.md"). */
  path: string;
}

export interface ResourceSection {
  /** Section heading (e.g., "Development", "Operations"). */
  name: string;
  /** Links in this section. */
  links: ResourceLink[];
}

export interface ResourcesConfig {
  /** Grouped resource links shown in CLAUDE.md. */
  sections: ResourceSection[];
}

// ---------------------------------------------------------------------------
// Design principles
// ---------------------------------------------------------------------------

export interface PrinciplesConfig {
  /** Project-wide design principles shown in CLAUDE.md. */
  items: string[];
}

// ---------------------------------------------------------------------------
// Top-level config
// ---------------------------------------------------------------------------

export interface SpecopsConfig {
  project: ProjectConfig;
  stack: StackConfig;
  agents: AgentsConfig;
  escalation?: EscalationConfig;
  docHierarchy?: DocHierarchyConfig;
  architecture?: ArchitectureConfig;
  skills?: SkillsConfig;
  resources?: ResourcesConfig;
  principles?: PrinciplesConfig;
}
