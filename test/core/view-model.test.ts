import { describe, expect, it } from "vitest";
import type { Dependency, IR, Module } from "../../src/core/ir.js";
import { viewModel } from "../../src/core/view-model.js";

const mod = (id: string, componentPath: string[]): Module => ({
  id,
  componentPath,
  lang: "typescript",
  file: `src/${id}.ts`,
  members: [],
});

const dep = (from: string, to: string): Dependency => ({ from, to, violation: false, allowed: false });

const ir: IR = {
  irVersion: 1,
  title: "shop",
  modules: [
    mod("app/checkout", ["app"]),
    mod("app/legacy", ["app"]),
    mod("core/money", ["core"]),
    mod("domain", ["domain"]),
    mod("domain/order", ["domain"]),
    mod("domain/pricing/rules", ["domain", "pricing"]),
    mod("main", []),
  ],
  dependencies: [
    dep("app/checkout", "domain"),
    dep("app/checkout", "domain/pricing/rules"),
    dep("app/legacy", "core/money"),
    dep("domain", "domain/order"),
    dep("domain/order", "core/money"),
    dep("main", "app/checkout"),
  ],
};

describe("viewModel at the top level", () => {
  it("shows each top-level Component, plus Modules that sit directly under the source root", () => {
    expect(viewModel(ir).nodes).toEqual([
      { id: "component:app", kind: "component", label: "app" },
      { id: "component:core", kind: "component", label: "core" },
      { id: "component:domain", kind: "component", label: "domain" },
      { id: "module:main", kind: "module", label: "main" },
    ]);
  });

  it("collapses Dependencies into one edge per node pair, keeping the bundled pairs, and drops internal ones", () => {
    expect(viewModel(ir).edges).toEqual([
      {
        from: "component:app",
        to: "component:core",
        dependencies: [dep("app/legacy", "core/money")],
      },
      {
        from: "component:app",
        to: "component:domain",
        dependencies: [dep("app/checkout", "domain"), dep("app/checkout", "domain/pricing/rules")],
      },
      {
        from: "component:domain",
        to: "component:core",
        dependencies: [dep("domain/order", "core/money")],
      },
      {
        from: "module:main",
        to: "component:app",
        dependencies: [dep("main", "app/checkout")],
      },
    ]);
  });
});
