import type { ModelDefinitionConfig } from "openclaw/plugin-sdk/provider-model-types";
import type { ImageGenerationProvider, ImageGenerationRequest } from "openclaw/plugin-sdk/image-generation";
import type {
  OpenClawConfig,
  ProviderRuntimeModel,
} from "openclaw/plugin-sdk/plugin-entry";
import { createOpenAiCompatibleImageGenerationProvider } from "openclaw/plugin-sdk/image-generation";
import { applyProviderConfigWithDefaultModelPreset } from "openclaw/plugin-sdk/provider-onboard";

export const PLUGIN_ID = "gc-provider";
export const PLUGIN_NAME = "GrowthCircle.id Provider";
export const PLUGIN_DESCRIPTION = "OpenAI-compatible GrowthCircle.id model provider for OpenClaw.";
export const PROVIDER_ID = "growthcircle";
export const PROVIDER_LABEL = "GrowthCircle.id";
export const ENV_VAR = "GROWTHCIRCLE_API_KEY";
export const BASE_URL = "https://ai.growthcircle.id/v1";
export const FREE_MODEL_SUFFIX = "-free";
export const DEFAULT_MODEL_ID = "gpt-5.5";
export const DEFAULT_MODEL_REF = `${PROVIDER_ID}/${DEFAULT_MODEL_ID}`;
export const DEFAULT_FREE_MODEL_ID = `${DEFAULT_MODEL_ID}${FREE_MODEL_SUFFIX}`;
export const DEFAULT_FREE_MODEL_REF = `${PROVIDER_ID}/${DEFAULT_FREE_MODEL_ID}`;
export const DEFAULT_IMAGE_MODEL_ID = "gpt-image-2";
export const DEFAULT_IMAGE_MODEL_REF = `${PROVIDER_ID}/${DEFAULT_IMAGE_MODEL_ID}`;
export const DEFAULT_FREE_IMAGE_MODEL_ID = `${DEFAULT_IMAGE_MODEL_ID}${FREE_MODEL_SUFFIX}`;
export const DEFAULT_FREE_IMAGE_MODEL_REF = `${PROVIDER_ID}/${DEFAULT_FREE_IMAGE_MODEL_ID}`;
export const DEFAULT_TEAM_IMAGE_MODEL_ID = "gc-image-pro";
export const DEFAULT_TEAM_IMAGE_MODEL_REF = `${PROVIDER_ID}/${DEFAULT_TEAM_IMAGE_MODEL_ID}`;
export const IMAGE_MODEL_IDS = [
  DEFAULT_IMAGE_MODEL_ID,
  DEFAULT_FREE_IMAGE_MODEL_ID,
  DEFAULT_TEAM_IMAGE_MODEL_ID,
  "gc-image-pro-square",
  "gc-image-pro-landscape",
  "gc-image-pro-portrait",
  "gpt-image-1",
  "gpt-image-1-mini",
] as const;
export const IMAGE_MODEL_REFS = IMAGE_MODEL_IDS.map((modelId) => `${PROVIDER_ID}/${modelId}`);

const DEFAULT_IMAGE_SIZE = "1024x1024";
const DEFAULT_IMAGE_TIMEOUT_MS = 180_000;
const MAX_IMAGE_RESULTS = 4;
const IMAGE_SIZES = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "256x256",
  "512x512",
  "1024x1024",
  "1024x1536",
  "1536x1024",
  "2048x2048",
  "2048x1152",
  "3840x2160",
  "2160x3840",
] as const;
const IMAGE_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"] as const;

export const FREE_TEXT_MODEL_IDS = [
  "MiniMax-M2.7",
  "MiniMax-M2.7-highspeed",
  "claude-haiku-4-5-20251001",
  "claude-opus-4-6",
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gpt-5.3-codex",
  "gpt-5.3-codex-spark",
  "gpt-5.4",
  "gpt-5.4-mini",
  DEFAULT_MODEL_ID,
] as const;

export const PAID_TEXT_MODEL_IDS = [
  "MiniMax-M2.7",
  "MiniMax-M2.7-highspeed",
  "claude-3-5-haiku-latest",
  "claude-haiku-4-5-20251001",
  "claude-opus-4-6",
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gpt-5.3-codex",
  "gpt-5.3-codex-spark",
  "gpt-5.4",
  "gpt-5.4-mini",
  DEFAULT_MODEL_ID,
] as const;

export const TEAM_TEXT_MODEL_IDS = [
  "gpt-5.3-codex",
  "gpt-5.3-codex-spark",
  "gpt-5.4",
  "gpt-5.4-mini",
  DEFAULT_MODEL_ID,
] as const;

export const FREE_TEXT_MODEL_IDS_WITH_SUFFIX = FREE_TEXT_MODEL_IDS.map((modelId) =>
  toGrowthCircleFreeModelId(modelId),
);

export const FREE_TEXT_MODEL_REFS = FREE_TEXT_MODEL_IDS_WITH_SUFFIX.map((modelId) => `${PROVIDER_ID}/${modelId}`);
export const PAID_TEXT_MODEL_REFS = PAID_TEXT_MODEL_IDS.map((modelId) => `${PROVIDER_ID}/${modelId}`);
export const TEAM_TEXT_MODEL_REFS = TEAM_TEXT_MODEL_IDS.map((modelId) => `${PROVIDER_ID}/${modelId}`);

export const KNOWN_TEXT_MODEL_IDS = Array.from(
  new Set([...FREE_TEXT_MODEL_IDS, ...PAID_TEXT_MODEL_IDS, ...TEAM_TEXT_MODEL_IDS]),
);

export const KNOWN_TEXT_MODEL_REFS = [...KNOWN_TEXT_MODEL_IDS, ...FREE_TEXT_MODEL_IDS_WITH_SUFFIX].map(
  (modelId) => `${PROVIDER_ID}/${modelId}`,
);

export const DEFAULT_MODEL_LIMITS = {
  contextWindow: 256_000,
  maxTokens: 36_000,
} as const;

export const FALLBACK_MODEL_LIMITS = {
  contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
  maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
} as const;

const ZERO_COST: ModelDefinitionConfig["cost"] = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
};

export const GROWTHCIRCLE_OPENAI_COMPAT: ModelDefinitionConfig["compat"] = {
  supportsDeveloperRole: true,
  supportsReasoningEffort: true,
  supportsStrictMode: true,
  supportsUsageInStreaming: true,
  maxTokensField: "max_completion_tokens",
};

const BASE_GROWTHCIRCLE_THINKING_LEVELS = [
  { id: "off" },
  { id: "minimal" },
  { id: "low" },
  { id: "medium" },
  { id: "high" },
] as const satisfies ReadonlyArray<{ id: GrowthCircleThinkingLevelId }>;

export const DEFAULT_MODEL: ModelDefinitionConfig = {
  id: DEFAULT_MODEL_ID,
  name: "GPT-5.5",
  api: "openai-completions",
  reasoning: true,
  input: ["text", "image"],
  cost: { ...ZERO_COST },
  contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
  maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
  compat: { ...GROWTHCIRCLE_OPENAI_COMPAT },
};

export const DEFAULT_FREE_MODEL: ModelDefinitionConfig = {
  ...DEFAULT_MODEL,
  id: DEFAULT_FREE_MODEL_ID,
  name: "GPT-5.5 Free",
};

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

type FetchGrowthCircleModelsOptions = {
  apiKey: string;
  fetchFn?: FetchLike;
  timeoutMs?: number;
};

type NormalizeGrowthCircleModelsOptions = {
  freeModels?: boolean;
  tier?: GrowthCircleKeyTier;
};

type ImageGenerationOptionTarget = Record<string, unknown> | FormData;

export type GrowthCircleKeyTier = "free" | "paid" | "team";
type GrowthCircleThinkingLevelId = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

export type GrowthCircleThinkingProfile = {
  levels: Array<{ id: GrowthCircleThinkingLevelId }>;
  defaultLevel?: GrowthCircleThinkingLevelId | null;
};

type RemoteModelObject = {
  id?: unknown;
  name?: unknown;
  display_name?: unknown;
  displayName?: unknown;
  owned_by?: unknown;
  ownedBy?: unknown;
  provider?: unknown;
  unit_type?: unknown;
  unitType?: unknown;
  available_for_current_key?: unknown;
  availableForCurrentKey?: unknown;
  architecture?: unknown;
  reasoning?: unknown;
  reasoning_effort_supported?: unknown;
  reasoningEffortSupported?: unknown;
  input?: unknown;
  modalities?: unknown;
  input_modalities?: unknown;
  inputModalities?: unknown;
  output_modalities?: unknown;
  outputModalities?: unknown;
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
  return normalizeGrowthCircleModels(body, {
    freeModels: isGrowthCircleFreeApiKey(apiKey),
  });
}

export function normalizeGrowthCircleModels(
  body: unknown,
  options: NormalizeGrowthCircleModelsOptions = {},
): ModelDefinitionConfig[] {
  const models = extractModelItems(body)
    .map((model) => normalizeModel(model, options))
    .filter((model): model is ModelDefinitionConfig => model !== null);

  const seen = new Set<string>();
  return models.filter((model) => {
    if (seen.has(model.id)) return false;
    seen.add(model.id);
    return true;
  });
}

export function normalizeGrowthCircleImageModelIds(body: unknown): string[] {
  const modelIds = extractModelItems(body)
    .map((model) => {
      if (typeof model === "string") return model.trim() || null;
      if (!isRecord(model)) return null;
      const object = model as RemoteModelObject;
      const id = readString(object.id);
      if (!id || !isGrowthCircleImageModel(object)) return null;
      return id;
    })
    .filter((id): id is string => id !== null);

  const seen = new Set<string>();
  return modelIds.filter((modelId) => {
    if (seen.has(modelId)) return false;
    seen.add(modelId);
    return true;
  });
}

export function buildGrowthCircleImageGenerationProvider(): ImageGenerationProvider {
  return createOpenAiCompatibleImageGenerationProvider({
    id: PROVIDER_ID,
    label: PROVIDER_LABEL,
    defaultModel: DEFAULT_IMAGE_MODEL_ID,
    models: IMAGE_MODEL_IDS,
    capabilities: {
      generate: {
        maxCount: MAX_IMAGE_RESULTS,
        supportsSize: true,
        supportsAspectRatio: true,
        supportsResolution: false,
      },
      edit: {
        enabled: false,
        maxCount: MAX_IMAGE_RESULTS,
        supportsSize: true,
        supportsAspectRatio: true,
        supportsResolution: false,
      },
      geometry: { sizes: [...IMAGE_SIZES], aspectRatios: [...IMAGE_ASPECT_RATIOS] },
      output: {
        qualities: ["low", "medium", "high", "auto"],
        formats: ["png", "jpeg", "webp"],
        backgrounds: ["transparent", "opaque", "auto"],
      },
    },
    defaultBaseUrl: BASE_URL,
    providerConfigKey: PROVIDER_ID,
    useConfiguredRequest: true,
    defaultTimeoutMs: DEFAULT_IMAGE_TIMEOUT_MS,
    resolveCount: ({ req }) => clampImageCount(req.count),
    buildGenerateRequest: ({ req, model, count }) => {
      const body: Record<string, unknown> = {
        model,
        prompt: req.prompt,
        n: count,
        size: resolveGrowthCircleImageSize(req),
      };
      appendGrowthCircleImageOptions(body, req);
      return { kind: "json", body };
    },
    buildEditRequest: () => {
      throw new Error(
        "GrowthCircle.id image reference edits require public image_urls on /images/generations; OpenClaw local inputImages are not mapped yet.",
      );
    },
    response: {
      defaultMimeType: "image/png",
      fileNamePrefix: "growthcircle-image",
      sniffMimeType: true,
    },
    missingApiKeyError: `GrowthCircle.id image generation requires ${ENV_VAR} or an auth profile.`,
    failureLabels: {
      generate: "GrowthCircle.id image generation failed",
      edit: "GrowthCircle.id image edit failed",
    },
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

export function growthCircleDefaultModelRefForApiKey(apiKey: unknown): string {
  return isGrowthCircleFreeApiKey(apiKey) ? DEFAULT_FREE_MODEL_REF : DEFAULT_MODEL_REF;
}

export function growthCircleDefaultModelRefForTier(tier: GrowthCircleKeyTier): string {
  return tier === "free" ? DEFAULT_FREE_MODEL_REF : DEFAULT_MODEL_REF;
}

export function growthCircleDefaultImageModelRefForTier(tier: GrowthCircleKeyTier): string {
  if (tier === "free") return DEFAULT_FREE_IMAGE_MODEL_REF;
  if (tier === "team") return DEFAULT_TEAM_IMAGE_MODEL_REF;
  return DEFAULT_IMAGE_MODEL_REF;
}

export function growthCircleModelRefsForTier(tier: GrowthCircleKeyTier): string[] {
  if (tier === "free") return [...FREE_TEXT_MODEL_REFS];
  if (tier === "team") return [...TEAM_TEXT_MODEL_REFS];
  return [...PAID_TEXT_MODEL_REFS];
}

export function resolveGrowthCircleDefaultThinkingLevel(params: {
  modelId: string;
  reasoning?: boolean;
}): "medium" | null {
  if (isDefaultModelId(params.modelId) || params.reasoning) {
    return "medium";
  }
  return null;
}

export function supportsGrowthCircleXHighThinking(params: { modelId: string }): boolean | undefined {
  return isDefaultModelId(params.modelId) ? true : undefined;
}

export function resolveGrowthCircleThinkingProfile(params: {
  modelId: string;
  reasoning?: boolean;
}): GrowthCircleThinkingProfile {
  const defaultLevel = resolveGrowthCircleDefaultThinkingLevel(params);
  const levels: GrowthCircleThinkingProfile["levels"] = [...BASE_GROWTHCIRCLE_THINKING_LEVELS];
  if (supportsGrowthCircleXHighThinking({ modelId: params.modelId })) {
    levels.push({ id: "xhigh" });
  }

  return {
    levels,
    ...(defaultLevel ? { defaultLevel } : {}),
  };
}

export function applyGrowthCircleDefaults(
  cfg: OpenClawConfig,
  options: NormalizeGrowthCircleModelsOptions = {},
): OpenClawConfig {
  const tier = options.tier ?? (options.freeModels ? "free" : "paid");
  const defaultModel = tier === "free" ? DEFAULT_FREE_MODEL : DEFAULT_MODEL;
  const defaultModelRef = growthCircleDefaultModelRefForTier(tier);
  const defaultImageModelRef = growthCircleDefaultImageModelRefForTier(tier);
  const withModel = applyProviderConfigWithDefaultModelPreset(cfg, {
    providerId: PROVIDER_ID,
    api: "openai-completions",
    baseUrl: BASE_URL,
    defaultModel,
    aliases: [{ modelRef: defaultModelRef, alias: "GPT" }],
    primaryModelRef: defaultModelRef,
  });

  return {
    ...withModel,
    agents: {
      ...withModel.agents,
      defaults: {
        ...withModel.agents?.defaults,
        imageGenerationModel: withModel.agents?.defaults?.imageGenerationModel ?? defaultImageModelRef,
        thinkingDefault: withModel.agents?.defaults?.thinkingDefault ?? "medium",
      },
    },
  };
}

export function applyGrowthCircleDefaultsForApiKey(cfg: OpenClawConfig, apiKey: unknown): OpenClawConfig {
  const tier: GrowthCircleKeyTier = isGrowthCircleApiKeyForTier(apiKey, "free")
    ? "free"
    : isGrowthCircleApiKeyForTier(apiKey, "team")
      ? "team"
      : "paid";
  return applyGrowthCircleDefaults(cfg, {
    freeModels: tier === "free",
    tier,
  });
}

export function applyGrowthCircleDefaultsForTier(cfg: OpenClawConfig, tier: GrowthCircleKeyTier): OpenClawConfig {
  return applyGrowthCircleDefaults(cfg, {
    freeModels: tier === "free",
    tier,
  });
}

function extractModelItems(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!isRecord(body)) return [];
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.models)) return body.models;
  return [];
}

function normalizeModel(
  raw: unknown,
  options: NormalizeGrowthCircleModelsOptions = {},
): ModelDefinitionConfig | null {
  if (typeof raw === "string") {
    const id = normalizeModelIdForTier(raw.trim(), options);
    return id ? createModelDefinition({ id }) : null;
  }

  if (!isRecord(raw)) return null;
  const object = raw as RemoteModelObject;
  const id = normalizeModelIdForTier(readString(object.id), options);
  if (!id) return null;
  if (!isGrowthCircleTextModel(object)) return null;

  return createModelDefinition({
    id,
    name: readString(object.name) ?? readString(object.display_name) ?? readString(object.displayName),
    reasoning: readReasoning(object, id),
    input: readInput(object),
    cost: readCost(object.cost),
  });
}

function createModelDefinition(params: {
  id: string;
  name?: string;
  reasoning?: boolean;
  input?: ModelDefinitionConfig["input"];
  cost?: ModelDefinitionConfig["cost"];
}): ModelDefinitionConfig {
  const limits = defaultLimitsForModel(params.id);
  return {
    id: params.id,
    name: params.name ?? defaultNameForModel(params.id),
    reasoning: params.reasoning ?? isDefaultModelId(params.id),
    input: params.input ?? defaultInputForModel(params.id),
    cost: params.cost ?? { ...ZERO_COST },
    contextWindow: limits.contextWindow,
    maxTokens: limits.maxTokens,
    compat: { ...GROWTHCIRCLE_OPENAI_COMPAT },
  };
}

function isGrowthCircleTextModel(model: RemoteModelObject): boolean {
  const owner = readString(model.owned_by) ?? readString(model.ownedBy);
  if (owner && !isGrowthCircleOwner(owner)) return false;

  const availableForCurrentKey = model.available_for_current_key ?? model.availableForCurrentKey;
  if (availableForCurrentKey === false) return false;

  const unitType = readString(model.unit_type) ?? readString(model.unitType);
  if (unitType && unitType.toLowerCase() !== "token") return false;

  const outputModalities = readOutputModalities(model);
  if (outputModalities && !outputModalities.some((modality) => modality.toLowerCase() === "text")) return false;

  return true;
}

function isGrowthCircleImageModel(model: RemoteModelObject): boolean {
  const owner = readString(model.owned_by) ?? readString(model.ownedBy);
  if (owner && !isGrowthCircleOwner(owner)) return false;

  const availableForCurrentKey = model.available_for_current_key ?? model.availableForCurrentKey;
  if (availableForCurrentKey === false) return false;

  const unitType = readString(model.unit_type) ?? readString(model.unitType);
  if (unitType && !["image", "image_task"].includes(unitType.toLowerCase())) return false;

  const outputModalities = readOutputModalities(model);
  if (outputModalities && !outputModalities.some((modality) => modality.toLowerCase() === "image")) return false;

  return Boolean(unitType || outputModalities);
}

function clampImageCount(count: number | undefined): number {
  if (typeof count !== "number" || !Number.isFinite(count)) return 1;
  return Math.max(1, Math.min(MAX_IMAGE_RESULTS, Math.trunc(count)));
}

function resolveGrowthCircleImageSize(req: ImageGenerationRequest): string {
  return mapGrowthCircleImageSize(req.size ?? req.aspectRatio) ?? DEFAULT_IMAGE_SIZE;
}

function mapGrowthCircleImageSize(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (/^\d+x\d+$/u.test(normalized)) return normalized;
  switch (normalized) {
    case "1:1":
      return "1024x1024";
    case "16:9":
    case "3:2":
      return "1536x1024";
    case "9:16":
    case "2:3":
      return "1024x1536";
    case "4:3":
      return "1536x1024";
    case "3:4":
      return "1024x1536";
    default:
      return normalized;
  }
}

function appendGrowthCircleImageOptions(
  target: ImageGenerationOptionTarget,
  req: ImageGenerationRequest,
): void {
  const openai = req.providerOptions?.openai;
  const background = openai?.background ?? req.background;
  const entries: Record<string, string | number | undefined> = {
    quality: req.quality,
    output_format: req.outputFormat,
    background,
    moderation: openai?.moderation,
    output_compression: openai?.outputCompression,
    user: openai?.user,
  };

  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined) continue;
    if (target instanceof FormData) target.set(key, String(value));
    else target[key] = value;
  }
}

function normalizeModelIdForTier(
  modelId: string | undefined,
  options: NormalizeGrowthCircleModelsOptions,
): string | undefined {
  if (!modelId) return undefined;
  return options.freeModels ? toGrowthCircleFreeModelId(modelId) : modelId;
}

function readReasoning(model: RemoteModelObject, modelId: string): boolean {
  if (typeof model.reasoning === "boolean") return model.reasoning;
  const reasoningEffortSupported = readStringArray(
    model.reasoning_effort_supported ?? model.reasoningEffortSupported,
  );
  if (reasoningEffortSupported && reasoningEffortSupported.length > 0) return true;
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
  const values =
    readArchitectureModalities(model.architecture, "input") ??
    readStringArray(model.input_modalities ?? model.inputModalities) ??
    readStringArray(model.input) ??
    readStringArray(model.modalities);
  if (!values) return undefined;

  const supported = new Set(["text", "image", "video", "audio"]);
  const input = values
    .map((value) => value.toLowerCase())
    .filter((value): value is ModelDefinitionConfig["input"][number] => supported.has(value));

  return input.length > 0 ? input : undefined;
}

function readOutputModalities(model: RemoteModelObject): string[] | undefined {
  return (
    readArchitectureModalities(model.architecture, "output") ??
    readStringArray(model.output_modalities ?? model.outputModalities)
  );
}

function readArchitectureModalities(raw: unknown, direction: "input" | "output"): string[] | undefined {
  if (!isRecord(raw)) return undefined;
  const snakeKey = `${direction}_modalities`;
  const camelKey = `${direction}Modalities`;
  return readStringArray(raw[snakeKey] ?? raw[camelKey]);
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

function readStringArray(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const values = raw
    .map((value) => readString(value))
    .filter((value): value is string => value !== undefined);
  return values.length > 0 ? values : undefined;
}

export function isGrowthCircleFreeApiKey(apiKey: unknown): boolean {
  return typeof apiKey === "string" && apiKey.trim().toLowerCase().startsWith("gc-free-");
}

export function isGrowthCircleApiKeyForTier(apiKey: unknown, tier: GrowthCircleKeyTier): boolean {
  return typeof apiKey === "string" && apiKey.trim().toLowerCase().startsWith(`gc-${tier}-`);
}

export function toGrowthCircleFreeModelId(modelId: string): string {
  return modelId.endsWith(FREE_MODEL_SUFFIX) ? modelId : `${modelId}${FREE_MODEL_SUFFIX}`;
}

function stripGrowthCircleFreeModelSuffix(modelId: string): string {
  return modelId.endsWith(FREE_MODEL_SUFFIX) ? modelId.slice(0, -FREE_MODEL_SUFFIX.length) : modelId;
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
  if (!isDefaultModelId(modelId)) return modelId;
  return modelId.endsWith(FREE_MODEL_SUFFIX) ? "GPT-5.5 Free" : "GPT-5.5";
}

function defaultInputForModel(modelId: string): ModelDefinitionConfig["input"] {
  return isDefaultModelId(modelId) ? ["text", "image"] : ["text"];
}

function isDefaultModelId(modelId: string): boolean {
  return stripGrowthCircleFreeModelSuffix(modelId.trim().toLowerCase()) === DEFAULT_MODEL_ID;
}

function isGrowthCircleOwner(owner: string): boolean {
  const normalized = owner.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized === "growthcircle" || normalized === "growthcircleid";
}
