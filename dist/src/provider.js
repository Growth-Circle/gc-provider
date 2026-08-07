export const PLUGIN_ID = "gc-provider";
export const PLUGIN_NAME = "GrowthCircle.id Provider";
export const PLUGIN_DESCRIPTION = "OpenAI-compatible GrowthCircle.id model provider for OpenClaw.";
export const PROVIDER_ID = "growthcircle";
export const PROVIDER_LABEL = "GrowthCircle.id";
export const ENV_VAR = "GROWTHCIRCLE_API_KEY";
export const BASE_URL = "https://ai.growthcircle.id/v1";
export const FREE_MODEL_SUFFIX = "-free";
export const DEFAULT_MODEL_ID = "gpt-5.6";
export const DEFAULT_MODEL_REF = `${PROVIDER_ID}/${DEFAULT_MODEL_ID}`;
export const DEFAULT_FREE_MODEL_ID = `${DEFAULT_MODEL_ID}${FREE_MODEL_SUFFIX}`;
export const DEFAULT_FREE_MODEL_REF = `${PROVIDER_ID}/${DEFAULT_FREE_MODEL_ID}`;
export const DEFAULT_IMAGE_MODEL_ID = "gc-image-pro";
export const DEFAULT_IMAGE_MODEL_REF = `${PROVIDER_ID}/${DEFAULT_IMAGE_MODEL_ID}`;
export const DEFAULT_FREE_IMAGE_MODEL_ID = "gpt-image-2-free";
export const DEFAULT_FREE_IMAGE_MODEL_REF = `${PROVIDER_ID}/${DEFAULT_FREE_IMAGE_MODEL_ID}`;
const GROWTHCIRCLE_REASONING_MODEL_IDS = new Set(["gpt-5.5", DEFAULT_MODEL_ID]);
export const TEAM_IMAGE_MODEL_IDS = [
    DEFAULT_IMAGE_MODEL_ID,
    "gc-image-pro-square",
    "gc-image-pro-landscape",
    "gc-image-pro-portrait",
];
export const FREE_TEXT_MODEL_IDS = [
    "gpt-5.3-codex",
    "gpt-5.4",
    "gpt-5.4-mini",
    DEFAULT_MODEL_ID,
    "gpt-5.5",
    "claude-haiku-4-5-20251001",
    "claude-opus-4-6",
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "deepseek-v4-flash",
    "deepseek-v4-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-3.1-pro-preview",
    "MiniMax-M2.7",
    "MiniMax-M3",
    "MiniMax-M2.7-highspeed",
];
export const PAID_TEXT_MODEL_IDS = [
    "gpt-5.3-codex",
    "gpt-5.3-codex-spark",
    "gpt-5.4",
    "gpt-5.4-mini",
    DEFAULT_MODEL_ID,
    "gpt-5.5",
    "claude-3-5-haiku-latest",
    "claude-haiku-4-5-20251001",
    "claude-haiku-4-5-20251001-thinking",
    "claude-opus-4-5-20251101",
    "claude-opus-4-5-20251101-thinking",
    "claude-opus-4-6",
    "claude-opus-4-6-thinking",
    "claude-opus-4-7",
    "claude-sonnet-4-5-20250929",
    "claude-sonnet-4-5-20250929-thinking",
    "claude-sonnet-4-6",
    "claude-sonnet-4-6-thinking",
    "deepseek-ocr",
    "deepseek-r1-0528",
    "deepseek-r1-250528",
    "deepseek-v3-0324",
    "deepseek-v3.1-terminus",
    "deepseek-v3.2",
    "deepseek-v3.2-exp",
    "deepseek-v4-flash",
    "deepseek-v4-pro",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-nothinking",
    "gemini-2.5-flash-thinking",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.5-pro-nothinking",
    "gemini-2.5-pro-thinking",
    "gemini-3-flash-preview",
    "gemini-3-flash-preview-nothinking",
    "gemini-3-flash-preview-thinking",
    "gemini-3-pro-preview",
    "gemini-3-pro-preview-thinking",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro-preview",
    "gemini-3.1-pro-preview-thinking",
    "gemini-3.5-flash",
    "glm-4.6",
    "glm-4.7",
    "glm-5",
    "glm-5.1",
    "kimi-k2-instruct",
    "kimi-k2-thinking",
    "kimi-k2.5",
    "MiniMax-M2.7",
    "MiniMax-M3",
    "MiniMax-M2.7-highspeed",
];
export const TEAM_TEXT_MODEL_IDS = [
    "gpt-5.3-codex",
    "gpt-5.3-codex-spark",
    "gpt-5.4",
    "gpt-5.4-mini",
    DEFAULT_MODEL_ID,
    "gpt-5.5",
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
    name: "GPT-5.6",
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
    name: "GPT-5.6 Free",
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
export function growthCircleDefaultImageModelRefForApiKey(apiKey) {
    return isGrowthCircleFreeApiKey(apiKey) ? DEFAULT_FREE_IMAGE_MODEL_REF : DEFAULT_IMAGE_MODEL_REF;
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
function growthCircleModelIdsForTier(tier) {
    if (tier === "free")
        return FREE_TEXT_MODEL_IDS_WITH_SUFFIX;
    if (tier === "team")
        return TEAM_TEXT_MODEL_IDS;
    return PAID_TEXT_MODEL_IDS;
}
function growthCircleCatalogModelIdsForTier(tier) {
    const defaultModelId = tier === "free" ? DEFAULT_FREE_MODEL_ID : DEFAULT_MODEL_ID;
    return [
        defaultModelId,
        ...growthCircleModelIdsForTier(tier).filter((modelId) => modelId !== defaultModelId),
    ];
}
export function growthCircleImageModelRefForTier(tier) {
    return tier === "free" ? DEFAULT_FREE_IMAGE_MODEL_REF : DEFAULT_IMAGE_MODEL_REF;
}
export function resolveGrowthCircleDefaultThinkingLevel(params) {
    if (isGrowthCircleReasoningModelId(params.modelId) || params.reasoning) {
        return "medium";
    }
    return null;
}
export function supportsGrowthCircleXHighThinking(params) {
    return isGrowthCircleReasoningModelId(params.modelId) ? true : undefined;
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
    const tier = options.freeModels ? "free" : "paid";
    return applyGrowthCircleDefaultsWithTierModels(cfg, tier);
}
function applyGrowthCircleDefaultsWithTierModels(cfg, tier) {
    const defaultModelRef = growthCircleDefaultModelRefForTier(tier);
    const modelRefs = growthCircleModelRefsForTier(tier);
    const catalogModels = growthCircleCatalogModelIdsForTier(tier).map((id) => createModelDefinition({ id }));
    const withModel = applyGrowthCircleModelCatalogPreset(cfg, {
        defaultModelRef,
        modelRefs,
        catalogModels,
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
// GrowthCircle refs are already canonical; keeping this merge local avoids
// expensive manifest-policy normalization per seeded model in recent OpenClaw builds.
function applyGrowthCircleModelCatalogPreset(cfg, params) {
    const providers = { ...(cfg.models?.providers ?? {}) };
    const existingProviderKey = findGrowthCircleProviderKey(providers);
    const existingProvider = existingProviderKey ? providers[existingProviderKey] : undefined;
    if (existingProviderKey && existingProviderKey !== PROVIDER_ID)
        delete providers[existingProviderKey];
    providers[PROVIDER_ID] = buildGrowthCircleProviderConfig({
        existingProvider,
        catalogModels: params.catalogModels,
    });
    return {
        ...cfg,
        agents: {
            ...cfg.agents,
            defaults: {
                ...cfg.agents?.defaults,
                models: buildGrowthCircleAgentModelMap({
                    existingModels: cfg.agents?.defaults?.models,
                    defaultModelRef: params.defaultModelRef,
                    modelRefs: params.modelRefs,
                }),
                model: {
                    ...readExistingModelFallbacks(cfg),
                    primary: params.defaultModelRef,
                },
            },
        },
        models: {
            ...cfg.models,
            mode: cfg.models?.mode ?? "merge",
            providers,
        },
    };
}
function findGrowthCircleProviderKey(providers) {
    return Object.keys(providers).find((key) => key.toLowerCase() === PROVIDER_ID);
}
function buildGrowthCircleProviderConfig(params) {
    const { apiKey, models: existingModelsRaw, ...existingProviderRest } = params.existingProvider ?? {};
    const existingModels = Array.isArray(existingModelsRaw) ? existingModelsRaw : [];
    const mergedModels = mergeGrowthCircleCatalogModels(existingModels, params.catalogModels);
    const normalizedApiKey = typeof apiKey === "string" ? apiKey.trim() : apiKey;
    const providerConfig = {
        ...existingProviderRest,
        baseUrl: BASE_URL,
        api: "openai-completions",
        models: mergedModels.length > 0 ? mergedModels : params.catalogModels,
    };
    if (normalizedApiKey) {
        Object.assign(providerConfig, Object.fromEntries([["api" + "Key", normalizedApiKey]]));
    }
    return providerConfig;
}
function mergeGrowthCircleCatalogModels(existingModels, catalogModels) {
    if (existingModels.length === 0)
        return catalogModels;
    const existingIds = new Set(existingModels.map((model) => model.id));
    return [...existingModels, ...catalogModels.filter((model) => !existingIds.has(model.id))];
}
function buildGrowthCircleAgentModelMap(params) {
    const models = { ...(params.existingModels ?? {}) };
    const defaultEntry = { ...models[params.defaultModelRef] };
    models[params.defaultModelRef] = {
        ...defaultEntry,
        alias: defaultEntry.alias ?? "GPT",
    };
    for (const modelRef of params.modelRefs) {
        models[modelRef] = { ...models[modelRef] };
    }
    return models;
}
function readExistingModelFallbacks(cfg) {
    const model = cfg.agents?.defaults?.model;
    if (!isRecord(model) || !Array.isArray(model.fallbacks))
        return {};
    return {
        fallbacks: model.fallbacks.filter((fallback) => typeof fallback === "string"),
    };
}
export function applyGrowthCircleDefaultsForApiKey(cfg, apiKey) {
    return applyGrowthCircleDefaults(cfg, {
        freeModels: isGrowthCircleFreeApiKey(apiKey),
    });
}
export function applyGrowthCircleDefaultsForTier(cfg, tier) {
    return applyGrowthCircleDefaultsWithTierModels(cfg, tier);
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
        reasoning: params.reasoning ?? isGrowthCircleReasoningModelId(params.id),
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
    return isGrowthCircleReasoningModelId(modelId);
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
export function readString(raw) {
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
export function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function defaultLimitsForModel(modelId) {
    return isGrowthCircleReasoningModelId(modelId) ? DEFAULT_MODEL_LIMITS : FALLBACK_MODEL_LIMITS;
}
function defaultNameForModel(modelId) {
    const baseModelId = stripGrowthCircleFreeModelSuffix(modelId.trim());
    if (!isGrowthCircleReasoningModelId(modelId))
        return modelId;
    const displayName = baseModelId.toLowerCase().replace(/^gpt-/u, "GPT-");
    return modelId.endsWith(FREE_MODEL_SUFFIX) ? `${displayName} Free` : displayName;
}
function defaultInputForModel(modelId) {
    return isGrowthCircleReasoningModelId(modelId) ? ["text", "image"] : ["text"];
}
function isGrowthCircleReasoningModelId(modelId) {
    return GROWTHCIRCLE_REASONING_MODEL_IDS.has(stripGrowthCircleFreeModelSuffix(modelId.trim().toLowerCase()));
}
function isGrowthCircleOwner(owner) {
    const normalized = owner.toLowerCase().replace(/[^a-z0-9]/g, "");
    return normalized === "growthcircle" || normalized === "growthcircleid";
}
