import { claudeCodeAdapter } from "./clients/claude-code.js";
import { codexAdapter } from "./clients/codex.js";
import { kiloAdapter } from "./clients/kilo.js";
import { opencodeAdapter } from "./clients/opencode.js";
import { traeAgentAdapter } from "./clients/trae-agent.js";
import { zedAdapter } from "./clients/zed.js";
import type { Adapter } from "./types.js";

export const ADAPTERS: readonly Adapter[] = [
  codexAdapter,
  claudeCodeAdapter,
  zedAdapter,
  opencodeAdapter,
  kiloAdapter,
  traeAgentAdapter,
];

export function findAdapter(id: string): Adapter | undefined {
  const normalized = id.trim().toLowerCase();
  return ADAPTERS.find((adapter) => adapter.id === normalized);
}

export const ADAPTER_IDS = ADAPTERS.map((adapter) => adapter.id);

/**
 * Clients whose provider settings live only in a GUI or vendor backend. There
 * is no file to write, so they get documentation instead of an adapter.
 */
export const MANUAL_CLIENTS: ReadonlyArray<{
  id: string;
  label: string;
  status: "manual" | "unsupported";
  note: string;
}> = [
  {
    id: "cline",
    label: "Cline",
    status: "manual",
    note: "Settings panel -> API Provider: OpenAI Compatible. Base URL + key entered in the UI.",
  },
  {
    id: "roo",
    label: "Roo Code",
    status: "manual",
    note: "Settings panel -> API Provider: OpenAI Compatible. Base URL + key entered in the UI.",
  },
  {
    id: "cursor",
    label: "Cursor",
    status: "manual",
    note: "Settings -> Models -> Override OpenAI Base URL. Tab and Apply stay on Cursor's own backend.",
  },
  {
    id: "windsurf",
    label: "Windsurf",
    status: "unsupported",
    note: "BYOK does not expose a custom base URL.",
  },
  {
    id: "trae-ide",
    label: "Trae IDE",
    status: "unsupported",
    note: "No custom base URL (Trae-AI/Trae#2076). Use Trae Agent CLI instead.",
  },
  {
    id: "antigravity",
    label: "Antigravity",
    status: "unsupported",
    note: "BYOK accepts Gemini/Anthropic keys only; custom endpoints do not route.",
  },
  {
    id: "kiro",
    label: "Kiro",
    status: "unsupported",
    note: "No BYOK support yet (kirodotdev/Kiro#9367).",
  },
];
