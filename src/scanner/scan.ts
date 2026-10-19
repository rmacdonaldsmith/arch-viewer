import path from "node:path";
import { compareEnds, compareText } from "../core/compare.js";
import type { IR, Module } from "../core/ir.js";
import { loadPolicy, type Policy } from "../core/policy.js";
import { scanTypeScript } from "./typescript.js";

/**
 * Policy file → IR. The project root is the Policy file's directory.
 * Reads source; never writes. Throws on an invalid Policy, naming the offending key.
 */
export async function scan(policyFile: string): Promise<IR> {
  return scanProject(loadPolicy(policyFile), path.dirname(path.resolve(policyFile)));
}

/** Scans an already-loaded Policy. For callers that also need the Policy itself (e.g. its `out`). */
export async function scanProject(policy: Policy, projectRoot: string): Promise<IR> {
  const scans = policy.sources.map((source) => scanTypeScript(projectRoot, source.root));
  const modules = scans.flatMap((s) => s.modules).sort((a, b) => compareText(a.id, b.id));
  assertUniqueIds(modules);

  return {
    irVersion: 1,
    title: policy.title,
    modules,
    dependencies: scans.flatMap((s) => s.dependencies).sort(compareEnds),
  };
}

/** Two files mapping to one Module id (e.g. `domain.ts` beside `domain/index.ts`) would make Dependencies ambiguous. */
function assertUniqueIds(sortedModules: Module[]): void {
  const clashes = sortedModules.filter((module, i) => module.id === sortedModules[i + 1]?.id);
  if (clashes.length === 0) return;

  const lines = clashes.map((module) => {
    const files = sortedModules.filter((m) => m.id === module.id).map((m) => m.file);
    return `  Module id "${module.id}": ${files.join(", ")}`;
  });
  throw new Error(`Two or more files map to the same Module id:\n${lines.join("\n")}`);
}
