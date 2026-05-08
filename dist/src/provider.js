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
];
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
];
export const TEAM_TEXT_MODEL_IDS = [
    "gpt-5.3-codex",
    "gpt-5.3-codex-spark",
    "gpt-5.4",
    "gpt-5.4-mini",
    DEFAULT_MODEL_ID,
];
export const FREE_TEXT_MODEL_IDS_WITH_SUFFIX = FREE_TEXT_MODEL_IDS.map((modelId) => toGrowthCircleFreeModelId(modelId));
export const FREE_TEXT_MODEL_REFS = FREE_TEXT_MODEL_IDS_WITH_SUFFIX.map((modelId) => `${PROVIDER_ID}/${modelId}`);
export const PAID_TEXT_MODEL_REFS = PAID_TEXT_MODEL_IDS.map((modelId) => `${PROVIDER_ID}/${modelId}`);
export const TEAM_TEXT_MODEL_REFS = TEAM_TEXT_MODEL_IDS.map((modelId) => `${PROVIDER_ID}/${modelId}`);
export const KNOWN_TEXT_MODEL_IDS = Array.from(new Set([...FREE_TEXT_MODEL_IDS, ...PAID_TEXT_MODEL_IDS, ...TEAM_TEXT_MODEL_IDS]));
export const KNOWN_TEXT_MODEL_REFS = [...KNOWN_TEXT_MODEL_IDS, ...FREE_TEXT_MODEL_IDS_WITH_SUFFIX].map((modelId) => `${PROVIDER_ID}/${modelId}`);
export const DEFAULT_MODEL_LIMITS = {
    contextWindow: 256_000,
    maxTokens: 36_000,
};
export const FALLBACK_MODEL_LIMITS = {
    contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
    maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
};
const ZERO_COST = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
};
export const GROWTHCIRCLE_OPENAI_COMPAT = {
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
];
export const DEFAULT_MODEL = {
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
export const DEFAULT_FREE_MODEL = {
    ...DEFAULT_MODEL,
    id: DEFAULT_FREE_MODEL_ID,
    name: "GPT-5.5 Free",
};
export async function fetchGrowthCircleModels({ apiKey, fetchFn = fetch, timeoutMs = 10_000, }) {
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
    const body = (await response.json());
    return normalizeGrowthCircleModels(body, {
        freeModels: isGrowthCircleFreeApiKey(apiKey),
    });
}
export function normalizeGrowthCircleModels(body, options = {}) {
    const models = extractModelItems(body)
        .map((model) => normalizeModel(model, options))
        .filter((model) => model !== null);
    const seen = new Set();
    return models.filter((model) => {
        if (seen.has(model.id))
            return false;
        seen.add(model.id);
        return true;
    });
}
export function resolveDynamicGrowthCircleModel(modelId) {
    const model = createModelDefinition({ id: modelId });
    return {
        ...model,
        input: model.input.filter((input) => input === "text" || input === "image"),
        provider: PROVIDER_ID,
        api: "openai-completions",
        baseUrl: BASE_URL,
    };
}
export function growthCircleDefaultModelRefForApiKey(apiKey) {
    return isGrowthCircleFreeApiKey(apiKey) ? DEFAULT_FREE_MODEL_REF : DEFAULT_MODEL_REF;
}
export function growthCircleDefaultModelRefForTier(tier) {
    return tier === "free" ? DEFAULT_FREE_MODEL_REF : DEFAULT_MODEL_REF;
}
export function growthCircleModelRefsForTier(tier) {
    if (tier === "free")
        return [...FREE_TEXT_MODEL_REFS];
    if (tier === "team")
        return [...TEAM_TEXT_MODEL_REFS];
    return [...PAID_TEXT_MODEL_REFS];
}
export function resolveGrowthCircleDefaultThinkingLevel(params) {
    if (isDefaultModelId(params.modelId) || params.reasoning) {
        return "medium";
    }
    return null;
}
export function supportsGrowthCircleXHighThinking(params) {
    return isDefaultModelId(params.modelId) ? true : undefined;
}
export function resolveGrowthCircleThinkingProfile(params) {
    const defaultLevel = resolveGrowthCircleDefaultThinkingLevel(params);
    const levels = [...BASE_GROWTHCIRCLE_THINKING_LEVELS];
    if (supportsGrowthCircleXHighThinking({ modelId: params.modelId })) {
        levels.push({ id: "xhigh" });
    }
    return {
        levels,
        ...(defaultLevel ? { defaultLevel } : {}),
    };
}
export function applyGrowthCircleDefaults(cfg, options = {}) {
    const defaultModel = options.freeModels ? DEFAULT_FREE_MODEL : DEFAULT_MODEL;
    const defaultModelRef = options.freeModels ? DEFAULT_FREE_MODEL_REF : DEFAULT_MODEL_REF;
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
                thinkingDefault: withModel.agents?.defaults?.thinkingDefault ?? "medium",
            },
        },
    };
}
export function applyGrowthCircleDefaultsForApiKey(cfg, apiKey) {
    return applyGrowthCircleDefaults(cfg, {
        freeModels: isGrowthCircleFreeApiKey(apiKey),
    });
}
export function applyGrowthCircleDefaultsForTier(cfg, tier) {
    return applyGrowthCircleDefaults(cfg, {
        freeModels: tier === "free",
    });
}
function extractModelItems(body) {
    if (Array.isArray(body))
        return body;
    if (!isRecord(body))
        return [];
    if (Array.isArray(body.data))
        return body.data;
    if (Array.isArray(body.models))
        return body.models;
    return [];
}
function normalizeModel(raw, options = {}) {
    if (typeof raw === "string") {
        const id = normalizeModelIdForTier(raw.trim(), options);
        return id ? createModelDefinition({ id }) : null;
    }
    if (!isRecord(raw))
        return null;
    const object = raw;
    const id = normalizeModelIdForTier(readString(object.id), options);
    if (!id)
        return null;
    if (!isGrowthCircleTextModel(object))
        return null;
    return createModelDefinition({
        id,
        name: readString(object.name) ?? readString(object.display_name) ?? readString(object.displayName),
        reasoning: readReasoning(object, id),
        input: readInput(object),
        cost: readCost(object.cost),
    });
}
function createModelDefinition(params) {
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
function isGrowthCircleTextModel(model) {
    const owner = readString(model.owned_by) ?? readString(model.ownedBy);
    if (owner && !isGrowthCircleOwner(owner))
        return false;
    const availableForCurrentKey = model.available_for_current_key ?? model.availableForCurrentKey;
    if (availableForCurrentKey === false)
        return false;
    const unitType = readString(model.unit_type) ?? readString(model.unitType);
    if (unitType && unitType.toLowerCase() !== "token")
        return false;
    const outputModalities = readOutputModalities(model);
    if (outputModalities && !outputModalities.some((modality) => modality.toLowerCase() === "text"))
        return false;
    return true;
}
function normalizeModelIdForTier(modelId, options) {
    if (!modelId)
        return undefined;
    return options.freeModels ? toGrowthCircleFreeModelId(modelId) : modelId;
}
function readReasoning(model, modelId) {
    if (typeof model.reasoning === "boolean")
        return model.reasoning;
    const reasoningEffortSupported = readStringArray(model.reasoning_effort_supported ?? model.reasoningEffortSupported);
    if (reasoningEffortSupported && reasoningEffortSupported.length > 0)
        return true;
    if (Array.isArray(model.capabilities)) {
        return model.capabilities.some((capability) => typeof capability === "string" &&
            ["reasoning", "reasoning_effort", "thinking"].includes(capability.toLowerCase()));
    }
    return isDefaultModelId(modelId);
}
function readInput(model) {
    const values = readArchitectureModalities(model.architecture, "input") ??
        readStringArray(model.input_modalities ?? model.inputModalities) ??
        readStringArray(model.input) ??
        readStringArray(model.modalities);
    if (!values)
        return undefined;
    const supported = new Set(["text", "image", "video", "audio"]);
    const input = values
        .map((value) => value.toLowerCase())
        .filter((value) => supported.has(value));
    return input.length > 0 ? input : undefined;
}
function readOutputModalities(model) {
    return (readArchitectureModalities(model.architecture, "output") ??
        readStringArray(model.output_modalities ?? model.outputModalities));
}
function readArchitectureModalities(raw, direction) {
    if (!isRecord(raw))
        return undefined;
    const snakeKey = `${direction}_modalities`;
    const camelKey = `${direction}Modalities`;
    return readStringArray(raw[snakeKey] ?? raw[camelKey]);
}
function readCost(raw) {
    if (!isRecord(raw))
        return undefined;
    const input = readNumber(raw.input);
    const output = readNumber(raw.output);
    const cacheRead = readNumber(raw.cacheRead) ?? readNumber(raw.cache_read);
    const cacheWrite = readNumber(raw.cacheWrite) ?? readNumber(raw.cache_write);
    if (input === undefined || output === undefined)
        return undefined;
    return {
        input,
        output,
        cacheRead: cacheRead ?? 0,
        cacheWrite: cacheWrite ?? 0,
    };
}
function readString(raw) {
    if (typeof raw !== "string")
        return undefined;
    const value = raw.trim();
    return value.length > 0 ? value : undefined;
}
function readStringArray(raw) {
    if (!Array.isArray(raw))
        return undefined;
    const values = raw
        .map((value) => readString(value))
        .filter((value) => value !== undefined);
    return values.length > 0 ? values : undefined;
}
export function isGrowthCircleFreeApiKey(apiKey) {
    return typeof apiKey === "string" && apiKey.trim().toLowerCase().startsWith("gc-free-");
}
export function isGrowthCircleApiKeyForTier(apiKey, tier) {
    return typeof apiKey === "string" && apiKey.trim().toLowerCase().startsWith(`gc-${tier}-`);
}
export function toGrowthCircleFreeModelId(modelId) {
    return modelId.endsWith(FREE_MODEL_SUFFIX) ? modelId : `${modelId}${FREE_MODEL_SUFFIX}`;
}
function stripGrowthCircleFreeModelSuffix(modelId) {
    return modelId.endsWith(FREE_MODEL_SUFFIX) ? modelId.slice(0, -FREE_MODEL_SUFFIX.length) : modelId;
}
function readNumber(raw) {
    if (typeof raw === "number" && Number.isFinite(raw))
        return raw;
    if (typeof raw !== "string" || raw.trim() === "")
        return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
}
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function defaultLimitsForModel(modelId) {
    return isDefaultModelId(modelId) ? DEFAULT_MODEL_LIMITS : FALLBACK_MODEL_LIMITS;
}
function defaultNameForModel(modelId) {
    if (!isDefaultModelId(modelId))
        return modelId;
    return modelId.endsWith(FREE_MODEL_SUFFIX) ? "GPT-5.5 Free" : "GPT-5.5";
}
function defaultInputForModel(modelId) {
    return isDefaultModelId(modelId) ? ["text", "image"] : ["text"];
}
function isDefaultModelId(modelId) {
    return stripGrowthCircleFreeModelSuffix(modelId.trim().toLowerCase()) === DEFAULT_MODEL_ID;
}
function isGrowthCircleOwner(owner) {
    const normalized = owner.toLowerCase().replace(/[^a-z0-9]/g, "");
    return normalized === "growthcircle" || normalized === "growthcircleid";
}
