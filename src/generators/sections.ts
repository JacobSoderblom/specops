/**
 * Managed section parser and writer.
 *
 * Parses Markdown files into managed and user-owned regions using
 * HTML comment markers:
 *
 *   <!-- specops:begin:section-name -->
 *   (generated content)
 *   <!-- specops:end:section-name -->
 *
 * Content outside markers is user-owned and never modified.
 */

import { readFile, writeFile } from "node:fs/promises";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserRegion {
  type: "user";
  content: string;
}

export interface ManagedRegion {
  type: "managed";
  name: string;
  content: string;
}

export type Region = UserRegion | ManagedRegion;

export interface ParsedFile {
  regions: Region[];
}

// ---------------------------------------------------------------------------
// Marker format
// ---------------------------------------------------------------------------

const BEGIN_RE = /^<!-- specops:begin:([a-z][a-z0-9-]*) -->$/;
const END_RE = /^<!-- specops:end:([a-z][a-z0-9-]*) -->$/;

/**
 * Wrap content in managed section markers.
 */
export function wrapSection(name: string, content: string): string {
  return `<!-- specops:begin:${name} -->\n${content}\n<!-- specops:end:${name} -->`;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse a file into an ordered list of user and managed regions.
 *
 * Throws on mismatched or nested markers.
 */
export function parseSections(content: string): ParsedFile {
  const lines = content.split("\n");
  const regions: Region[] = [];

  let userLines: string[] = [];
  let managedLines: string[] = [];
  let currentSection: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const beginMatch = line.match(BEGIN_RE);
    const endMatch = line.match(END_RE);

    if (beginMatch) {
      const name = beginMatch[1];

      if (currentSection !== null) {
        throw new Error(
          `Nested specops marker at line ${i + 1}: found begin:${name} inside begin:${currentSection}`
        );
      }

      // Flush accumulated user content
      if (userLines.length > 0) {
        regions.push({ type: "user", content: userLines.join("\n") });
        userLines = [];
      }

      currentSection = name;
      managedLines = [];
    } else if (endMatch) {
      const name = endMatch[1];

      if (currentSection === null) {
        throw new Error(
          `Unexpected specops end marker at line ${i + 1}: end:${name} without matching begin`
        );
      }

      if (name !== currentSection) {
        throw new Error(
          `Mismatched specops markers: begin:${currentSection} closed by end:${name} at line ${i + 1}`
        );
      }

      regions.push({
        type: "managed",
        name,
        content: managedLines.join("\n"),
      });
      managedLines = [];
      currentSection = null;
    } else if (currentSection !== null) {
      managedLines.push(line);
    } else {
      userLines.push(line);
    }
  }

  if (currentSection !== null) {
    throw new Error(
      `Unclosed specops marker: begin:${currentSection} was never closed`
    );
  }

  // Flush trailing user content
  if (userLines.length > 0) {
    regions.push({ type: "user", content: userLines.join("\n") });
  }

  return { regions };
}

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

/**
 * Replace managed section content while preserving user regions.
 *
 * - Sections in `updates` that exist in the file are replaced.
 * - Sections in the file that aren't in `updates` keep their existing content.
 * - Sections in `updates` that don't exist in the file are skipped (not inserted).
 */
export function replaceSections(
  parsed: ParsedFile,
  updates: Map<string, string>
): string {
  const parts: string[] = [];

  for (const region of parsed.regions) {
    if (region.type === "user") {
      parts.push(region.content);
    } else {
      const newContent = updates.get(region.name) ?? region.content;
      parts.push(wrapSection(region.name, newContent));
    }
  }

  return parts.join("\n");
}

/**
 * Check whether a file contains any specops markers.
 */
export function hasMarkers(content: string): boolean {
  return content.split("\n").some((line) => BEGIN_RE.test(line));
}

/**
 * Read a file, replace managed sections, write it back.
 *
 * Returns null if the file has no markers (nothing to update).
 */
export async function updateFile(
  filePath: string,
  updates: Map<string, string>
): Promise<boolean> {
  const content = await readFile(filePath, "utf-8");

  if (!hasMarkers(content)) {
    return false;
  }

  const parsed = parseSections(content);
  const updated = replaceSections(parsed, updates);
  await writeFile(filePath, updated, "utf-8");
  return true;
}
