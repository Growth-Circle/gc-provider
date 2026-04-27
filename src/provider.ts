import type { ModelDefinitionConfig } from "openclaw/plugin-sdk/provider-model-types";
import type {
  OpenClawConfig,
  ProviderRuntimeModel,
  ProviderThinkingProfile,
} from "openclaw/plugin-sdk/plugin-entry";
import { applyProviderConfigWithDefaultModelPreset } from "openclaw/plugin-sdk/provider-onboard";

export const PLUGIN_ID = "gc-provider";
export const PLUGIN_NAME = "GrowthCircle.id Provider";
export const PLUGIN_DESCRIPTION = "OpenAI-compatible GrowthCircle.id model provider for OpenClaw.";
export const PROVIDER_ID = "growthcircle";
export const PROVIDER_LABEL = "GrowthCircle.id";
export const ENV_VAR = "GROWTHCIRCLE_API_KEY";
export const BASE_URL = "https://ai.growthcircle.id/v1";
export const DEFAULT_MODEL_ID = "gpt-5.5";
export const DEFAULT_MODEL_REF = `${PROVIDER_ID}/${DEFAULT_MODEL_ID}`;

export const DEFAULT_MODEL_LIMITS = {
  contextWindow: 272_000,
  maxTokens: 128_000,
} as const;

export const FALLBACK_MODEL_LIMITS = {
  contextWindow: 128_000,
  maxTokens: 8_192,
} as const;

const ZERO_COST: ModelDefinitionConfig["cost"] = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
};

export const DEFAULT_MODEL: ModelDefinitionConfig = {
  id: DEFAULT_MODEL_ID,
  name: "GPT-5.5",
  api: "openai-completions",
  reasoning: true,
  input: ["text", "image"],
  cost: { ...ZERO_COST },
  contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
  maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
};

const GROWTHCIRCLE_THINKING_PROFILE: ProviderThinkingProfile = {
  levels: [
    { id: "off", rank: 0 },
    { id: "minimal", rank: 1 },
    { id: "low", rank: 2 },
    { id: "medium", rank: 3 },
    { id: "high", rank: 4 },
    { id: "xhigh", rank: 5 },
  ],
  defaultLevel: "medium",
};

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

type FetchGrowthCircleModelsOptions = {
  apiKey: string;
  fetchFn?: FetchLike;
  timeoutMs?: number;
};

type RemoteModelObject = {
  id?: unknown;
  name?: unknown;
  display_name?: unknown;
  displayName?: unknown;
  reasoning?: unknown;
  input?: unknown;
  modalities?: unknown;
  capabilities?: unknown;
  cost?: unknown;
  contextWindow?: unknown;
  context_window?: unknown;
  context_length?: unknown;
  max_context_tokens?: unknown;
  maxTokens?: unknown;
  max_tokens?: unknown;
  max_output_tokens?: unknown;
};

export async function fetchGrowthCircleModels({
  apiKey,
  fetchFn = fetch,
  timeoutMs = 10_000,
}: FetchGrowthCircleModelsOptions): Promise<ModelDefinitionConfig[]> {
  const response = await fetchFn(`${BASE_URL}/models`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`GrowthCircle.id /models failed with HTTP ${response.status}`);
  }

  const body = (await response.json()) as unknown;
  return normalizeGrowthCircleModels(body);
}

export function normalizeGrowthCircleModels(body: unknown): ModelDefinitionConfig[] {
  const models = extractModelItems(body)
    .map(normalizeModel)
    .filter((model): model is ModelDefinitionConfig => model !== null);

  const seen = new Set<string>();
  return models.filter((model) => {
    if (seen.has(model.id)) return false;
    seen.add(model.id);
    return true;
  });
}

export function resolveDynamicGrowthCircleModel(modelId: string): ProviderRuntimeModel {
  const model = createModelDefinition({ id: modelId });
  return {
    ...model,
    input: model.input.filter((input): input is "text" | "image" => input === "text" || input === "image"),
    provider: PROVIDER_ID,
    api: "openai-completions",
    baseUrl: BASE_URL,
  };
}

export function resolveGrowthCircleThinkingProfile(params: {
  modelId: string;
  reasoning?: boolean;
}): ProviderThinkingProfile | null {
  if (isDefaultModelId(params.modelId) || params.reasoning) {
    return GROWTHCIRCLE_THINKING_PROFILE;
  }
  return null;
}

export function applyGrowthCircleDefaults(cfg: OpenClawConfig): OpenClawConfig {
  const withModel = applyProviderConfigWithDefaultModelPreset(cfg, {
    providerId: PROVIDER_ID,
    api: "openai-completions",
    baseUrl: BASE_URL,
    defaultModel: DEFAULT_MODEL,
    aliases: [{ modelRef: DEFAULT_MODEL_REF, alias: "GPT" }],
    primaryModelRef: DEFAULT_MODEL_REF,
  });

  return {
    ...withModel,
    agents: {
      ...withModel.agents,
      defaults: {
        ...withModel.agents?.defaults,
        thinkingDefault: withModel.agents?.defaults?.thinkingDefault ?? "medium",
      },
    },
  };
}

function extractModelItems(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!isRecord(body)) return [];
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.models)) return body.models;
  return [];
}

function normalizeModel(raw: unknown): ModelDefinitionConfig | null {
  if (typeof raw === "string") {
    const id = raw.trim();
    return id ? createModelDefinition({ id }) : null;
  }

  if (!isRecord(raw)) return null;
  const object = raw as RemoteModelObject;
  const id = readString(object.id);
  if (!id) return null;

  return createModelDefinition({
    id,
    name: readString(object.name) ?? readString(object.display_name) ?? readString(object.displayName),
    reasoning: readReasoning(object, id),
    input: readInput(object),
    cost: readCost(object.cost),
    contextWindow:
      readPositiveInteger(object.contextWindow) ??
      readPositiveInteger(object.context_window) ??
      readPositiveInteger(object.context_length) ??
      readPositiveInteger(object.max_context_tokens),
    maxTokens:
      readPositiveInteger(object.maxTokens) ??
      readPositiveInteger(object.max_tokens) ??
      readPositiveInteger(object.max_output_tokens),
  });
}

function createModelDefinition(params: {
  id: string;
  name?: string;
  reasoning?: boolean;
  input?: ModelDefinitionConfig["input"];
  cost?: ModelDefinitionConfig["cost"];
  contextWindow?: number;
  maxTokens?: number;
}): ModelDefinitionConfig {
  const limits = defaultLimitsForModel(params.id);
  return {
    id: params.id,
    name: params.name ?? defaultNameForModel(params.id),
    reasoning: params.reasoning ?? isDefaultModelId(params.id),
    input: params.input ?? defaultInputForModel(params.id),
    cost: params.cost ?? { ...ZERO_COST },
    contextWindow: params.contextWindow ?? limits.contextWindow,
    maxTokens: params.maxTokens ?? limits.maxTokens,
  };
}

function readReasoning(model: RemoteModelObject, modelId: string): boolean {
  if (typeof model.reasoning === "boolean") return model.reasoning;
  if (Array.isArray(model.capabilities)) {
    return model.capabilities.some(
      (capability) =>
        typeof capability === "string" &&
        ["reasoning", "reasoning_effort", "thinking"].includes(capability.toLowerCase()),
    );
  }
  return isDefaultModelId(modelId);
}

function readInput(model: RemoteModelObject): ModelDefinitionConfig["input"] | undefined {
  const values = Array.isArray(model.input) ? model.input : Array.isArray(model.modalities) ? model.modalities : null;
  if (!values) return undefined;

  const supported = new Set(["text", "image", "video", "audio"]);
  const input = values.filter(
    (value): value is ModelDefinitionConfig["input"][number] =>
      typeof value === "string" && supported.has(value),
  );

  return input.length > 0 ? input : undefined;
}

function readCost(raw: unknown): ModelDefinitionConfig["cost"] | undefined {
  if (!isRecord(raw)) return undefined;

  const input = readNumber(raw.input);
  const output = readNumber(raw.output);
  const cacheRead = readNumber(raw.cacheRead) ?? readNumber(raw.cache_read);
  const cacheWrite = readNumber(raw.cacheWrite) ?? readNumber(raw.cache_write);

  if (input === undefined || output === undefined) return undefined;

  return {
    input,
    output,
    cacheRead: cacheRead ?? 0,
    cacheWrite: cacheWrite ?? 0,
  };
}

function readString(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

function readPositiveInteger(raw: unknown): number | undefined {
  const value = readNumber(raw);
  if (value === undefined || !Number.isInteger(value) || value <= 0) return undefined;
  return value;
}

function readNumber(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function defaultLimitsForModel(modelId: string): typeof DEFAULT_MODEL_LIMITS | typeof FALLBACK_MODEL_LIMITS {
  return isDefaultModelId(modelId) ? DEFAULT_MODEL_LIMITS : FALLBACK_MODEL_LIMITS;
}

function defaultNameForModel(modelId: string): string {
  return isDefaultModelId(modelId) ? "GPT-5.5" : modelId;
}

function defaultInputForModel(modelId: string): ModelDefinitionConfig["input"] {
  return isDefaultModelId(modelId) ? ["text", "image"] : ["text"];
}

function isDefaultModelId(modelId: string): boolean {
  return modelId.trim().toLowerCase() === DEFAULT_MODEL_ID;
}
