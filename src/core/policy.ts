import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { z } from "zod";

const SourceSchema = z.strictObject({
  lang: z.enum(["typescript", "java"]),
  root: z.string().min(1),
});

const PolicySchema = z.strictObject({
  title: z.string().min(1),
  sources: z.array(SourceSchema).min(1),
  out: z.string().min(1),
});

export type Source = z.infer<typeof SourceSchema>;
export type Policy = z.infer<typeof PolicySchema>;

/** Reads and validates a Policy file. Errors name the offending key, because agents edit this file (ADR-0001). */
export function loadPolicy(file: string): Policy {
  const result = PolicySchema.safeParse(parse(readFileSync(file, "utf8")));
  if (result.success) return result.data;

  const problems = result.error.issues.map((issue) => `  ${issue.path.join(".") || "(top level)"}: ${issue.message}`);
  throw new Error(`Invalid Policy ${file}:\n${problems.join("\n")}`);
}
