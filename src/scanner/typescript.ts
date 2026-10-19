import { existsSync } from "node:fs";
import path from "node:path";
import { Project, type SourceFile } from "ts-morph";
import type { Dependency, Module } from "../core/ir.js";

const SOURCE_GLOB = "**/*.{ts,tsx,js,jsx}";
const SKIPPED = [/\.d\.ts$/, /\.(test|spec)\.[jt]sx?$/, /(^|\/)(node_modules|dist)\//];

export type Scan = { modules: Module[]; dependencies: Dependency[] };

/** Scans one TypeScript/JavaScript source root. Imports resolve exactly as tsc would, using the project's tsconfig. */
export function scanTypeScript(projectRoot: string, sourceRoot: string): Scan {
  const rootDir = path.resolve(projectRoot, sourceRoot);
  const project = createProject(projectRoot);
  project.addSourceFilesAtPaths(path.join(rootDir, SOURCE_GLOB));

  const files = project.getSourceFiles().filter((file) => isScanned(rootDir, file));
  const modules = files.map((file) => toModule(projectRoot, rootDir, file));
  const idByPath = new Map(files.map((file, i) => [file.getFilePath(), modules[i]!.id]));

  const dependencies = files.flatMap((file) => {
    const from = idByPath.get(file.getFilePath())!;
    const targets = new Set(
      importedFiles(file)
        .map((target) => idByPath.get(target.getFilePath()))
        .filter((to): to is string => to !== undefined && to !== from),
    );
    return [...targets].map((to) => ({ from, to, violation: false, allowed: false }));
  });

  return { modules, dependencies };
}

function createProject(projectRoot: string): Project {
  const tsConfigFilePath = path.join(projectRoot, "tsconfig.json");
  return existsSync(tsConfigFilePath)
    ? new Project({ tsConfigFilePath, skipAddingFilesFromTsConfig: true, compilerOptions: { allowJs: true } })
    : new Project({ compilerOptions: { allowJs: true } });
}

function isScanned(rootDir: string, file: SourceFile): boolean {
  const relative = path.relative(rootDir, file.getFilePath());
  return !relative.startsWith("..") && !SKIPPED.some((pattern) => pattern.test(relative));
}

/**
 * `domain/order.ts` → id `domain/order` in Component `domain`.
 * A barrel `domain/index.ts` is its Component's own Module: id `domain` in Component `domain`.
 */
function toModule(projectRoot: string, rootDir: string, file: SourceFile): Module {
  const relative = toPosix(path.relative(rootDir, file.getFilePath()));
  const segments = relative.replace(/\.[^./]+$/, "").split("/");
  const isNestedBarrel = segments.length > 1 && segments.at(-1) === "index";
  const idSegments = isNestedBarrel ? segments.slice(0, -1) : segments;
  return {
    id: idSegments.join("/"),
    componentPath: isNestedBarrel ? idSegments : idSegments.slice(0, -1),
    lang: "typescript",
    file: toPosix(path.relative(projectRoot, file.getFilePath())),
    members: [],
  };
}

const toPosix = (p: string) => p.split(path.sep).join("/");

function importedFiles(file: SourceFile): SourceFile[] {
  const declarations = [...file.getImportDeclarations(), ...file.getExportDeclarations()];
  return declarations
    .map((declaration) => declaration.getModuleSpecifierSourceFile())
    .filter((target): target is SourceFile => target !== undefined);
}
