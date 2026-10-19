import { useEffect, useState } from "react";
import type { IR } from "../core/ir.js";
import { viewModel } from "../core/view-model.js";
import { Diagram } from "./Diagram.js";
import { layout, type Layout } from "./layout.js";

const FONT = "14px system-ui, sans-serif";

export function App() {
  const [title, setTitle] = useState("arch-viewer");
  const [placed, setPlaced] = useState<Layout>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch("/ir.json")
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load the IR from the arch-viewer server (HTTP ${response.status}).`);
        return response.json() as Promise<IR>;
      })
      .then((ir) => {
        setTitle(ir.title);
        return layout(viewModel(ir), measureText);
      })
      .then(setPlaced)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <main>
      <h1>{title}</h1>
      {error && <p className="error">{error}</p>}
      {placed && <Diagram layout={placed} />}
    </main>
  );
}

const context = document.createElement("canvas").getContext("2d")!;
context.font = FONT;

function measureText(text: string): number {
  return context.measureText(text).width;
}
