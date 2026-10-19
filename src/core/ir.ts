/** The generated snapshot the viewer draws. Never edited by hand (ADR-0001). */
export type IR = {
  irVersion: 1;
  title: string;
  modules: Module[];
  dependencies: Dependency[];
};

export type Lang = "typescript" | "java";

export type Member = { name: string; kind: string; line: number };

export type Module = {
  /** Path from the source root, without extension; a barrel is named by its directory. */
  id: string;
  /** The Components containing this Module, outermost first. */
  componentPath: string[];
  lang: Lang;
  /** Path relative to the project root. */
  file: string;
  level?: number;
  members: Member[];
};

export type Dependency = {
  from: string;
  to: string;
  violation: boolean;
  allowed: boolean;
};
