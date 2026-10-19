import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export type Running = { url: string; stop: () => void };

/** Starts the real arch-viewer CLI on a fixture's Policy and resolves with the URL it prints. */
export function startViewer(fixture: string): Promise<Running> {
  const policyFile = path.join(repoRoot, "test/fixtures", fixture, "arch-viewer.policy.yaml");
  const child: ChildProcess = spawn(
    process.execPath,
    ["--import", "tsx", path.join(repoRoot, "src/cli/main.ts"), policyFile, "--port", "0"],
    { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] },
  );

  return new Promise((resolve, reject) => {
    let output = "";
    const onData = (chunk: Buffer) => {
      output += chunk.toString();
      const match = output.match(/http:\/\/localhost:\d+\/?/);
      if (match) resolve({ url: match[0], stop: () => child.kill() });
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.on("exit", (code) => reject(new Error(`arch-viewer exited (${code}) before serving:\n${output}`)));
  });
}
