import path from "node:path";
import type { Dependency, IR, Module } from "../core/ir.js";
import { loadPolicy } from "../core/policy.js";
import { scanTypeScript } from "./typescript.js";

/**
 * Policy file → IR. The project root is the Policy file's directory.
 * Reads source; never writes. Throws on an invalid Policy, naming the offending key.
 */
export async function scan(policyFile: string): Promise<IR> {
  const policy = loadPolicy(policyFile);
  const projectRoot = path.dirname(path.resolve(policyFile));

  const scans = policy.sources.map((source) => {
    switch (source.lang) {
      case "typescript":
        return scanTypeScript(projectRoot, source.root);
      case "java":
        throw new Error("Java scanning is not implemented yet");
    }
  });

  return {
    irVersion: 1,
    title: policy.title,
    modules: scans.flatMap((s) => s.modules).sort(byId),
    dependencies: scans.flatMap((s) => s.dependencies).sort(byEnds),
  };
}

const byId = (a: Module, b: Module) => a.id.localeCompare(b.id);
const byEnds = (a: Dependency, b: Dependency) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to);
