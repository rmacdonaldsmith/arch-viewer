import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { scan } from "../../src/scanner/scan.js";

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

/** A copy of a fixture with some files added or replaced. Returns the copy's Policy file. */
function fixtureWith(name: string, files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), `${name}-`));
  cpSync(fixture(name), dir, { recursive: true });
  for (const [file, content] of Object.entries(files)) writeFileSync(path.join(dir, file), content);
  return path.join(dir, "arch-viewer.policy.yaml");
}

const dep = (from: string, to: string) => ({ from, to, violation: false, allowed: false });

describe("scan: TypeScript / JavaScript", () => {
  it("produces a Module per source file and one Dependency per resolved project import", async () => {
    const ir = await scan(path.join(fixture("ts-basic"), "arch-viewer.policy.yaml"));

    expect(ir).toEqual({
      irVersion: 1,
      title: "ts-basic",
      modules: [
        { id: "app/checkout", componentPath: ["app"], lang: "typescript", file: "src/app/checkout.ts", members: [] },
        { id: "app/legacy", componentPath: ["app"], lang: "typescript", file: "src/app/legacy.js", members: [] },
        { id: "core/money", componentPath: ["core"], lang: "typescript", file: "src/core/money.ts", members: [] },
        { id: "domain", componentPath: ["domain"], lang: "typescript", file: "src/domain/index.ts", members: [] },
        { id: "domain/order", componentPath: ["domain"], lang: "typescript", file: "src/domain/order.ts", members: [] },
        { id: "main", componentPath: [], lang: "typescript", file: "src/main.ts", members: [] },
      ],
      dependencies: [
        dep("app/checkout", "domain"),
        dep("app/legacy", "core/money"),
        dep("domain", "domain/order"),
        dep("domain/order", "core/money"),
        dep("main", "app/checkout"),
      ],
    });
  });
});

describe("scan: Module ids", () => {
  it("fails, naming both files, when a barrel and a sibling file would share a Module id", async () => {
    const policyFile = fixtureWith("ts-basic", { "src/domain.ts": "export const clash = 1;\n" });

    await expect(scan(policyFile)).rejects.toThrow(/src\/domain\.ts.*src\/domain\/index\.ts|src\/domain\/index\.ts.*src\/domain\.ts/s);
  });
});

describe("scan: Policy validation", () => {
  it("names the offending key when a value is invalid", async () => {
    const policyFile = fixtureWith("ts-basic", {
      "arch-viewer.policy.yaml": "title: x\nsources:\n  - lang: cobol\n    root: src\nout: x.json\n",
    });

    await expect(scan(policyFile)).rejects.toThrow(/sources\.0\.lang/);
  });

  it("rejects unknown keys so typos are not silently ignored", async () => {
    const policyFile = fixtureWith("ts-basic", {
      "arch-viewer.policy.yaml": "title: x\nsources: [{ lang: typescript, root: src }]\nout: x.json\nlevles: [[core]]\n",
    });

    await expect(scan(policyFile)).rejects.toThrow(/levles/);
  });
});
