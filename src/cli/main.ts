import { writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { loadPolicy } from "../core/policy.js";
import { scan, scanProject } from "../scanner/scan.js";
import { serve } from "../server/server.js";

const DEFAULT_POLICY = "arch-viewer.policy.yaml";
const DEFAULT_PORT = 4400;

const USAGE = `usage:
  arch-viewer [policy-file] [--port n]   scan, then serve the viewer (default port ${DEFAULT_PORT})
  arch-viewer scan [policy-file]         scan, write the IR to the Policy's \`out\`, and exit

policy-file defaults to ${DEFAULT_POLICY}`;

async function main(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { port: { type: "string" }, help: { type: "boolean", short: "h" } },
  });
  if (values.help) {
    console.log(USAGE);
    return;
  }

  const [first, second] = positionals;
  if (first === "scan") {
    await scanCommand(second ?? DEFAULT_POLICY);
  } else {
    await serveCommand(first ?? DEFAULT_POLICY, values.port === undefined ? DEFAULT_PORT : Number(values.port));
  }
}

async function scanCommand(policyFile: string): Promise<void> {
  const policy = loadPolicy(policyFile);
  const projectRoot = path.dirname(path.resolve(policyFile));
  const ir = await scanProject(policy, projectRoot);
  const outFile = path.resolve(projectRoot, policy.out);
  writeFileSync(outFile, JSON.stringify(ir, null, 2) + "\n");
  console.log(`${ir.modules.length} Modules, ${ir.dependencies.length} Dependencies → ${path.relative(process.cwd(), outFile)}`);
}

async function serveCommand(policyFile: string, port: number): Promise<void> {
  const ir = await scan(policyFile);
  const { url } = await serve(ir, port);
  console.log(`arch-viewer: ${ir.title} at ${url}`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(`\n${USAGE}`);
  process.exit(1);
});
