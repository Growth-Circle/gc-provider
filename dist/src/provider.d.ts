import type { ModelDefinitionConfig } from "openclaw/plugin-sdk/provider-model-types";
import type { ImageGenerationProvider } from "openclaw/plugin-sdk/image-generation";
import type { OpenClawConfig, ProviderRuntimeModel } from "openclaw/plugin-sdk/plugin-entry";
export declare const PLUGIN_ID = "gc-provider";
export declare const PLUGIN_NAME = "GrowthCircle.id Provider";
export declare const PLUGIN_DESCRIPTION = "OpenAI-compatible GrowthCircle.id model provider for OpenClaw.";
export declare const PROVIDER_ID = "growthcircle";
export declare const PROVIDER_LABEL = "GrowthCircle.id";
export declare const ENV_VAR = "GROWTHCIRCLE_API_KEY";
export declare const BASE_URL = "https://ai.growthcircle.id/v1";
export declare const FREE_MODEL_SUFFIX = "-free";
export declare const DEFAULT_MODEL_ID = "gpt-5.5";
export declare const DEFAULT_MODEL_REF = "growthcircle/gpt-5.5";
export declare const DEFAULT_FREE_MODEL_ID = "gpt-5.5-free";
export declare const DEFAULT_FREE_MODEL_REF = "growthcircle/gpt-5.5-free";
export declare const DEFAULT_IMAGE_MODEL_ID = "gpt-image-2";
export declare const DEFAULT_IMAGE_MODEL_REF = "growthcircle/gpt-image-2";
export declare const DEFAULT_FREE_IMAGE_MODEL_ID = "gpt-image-2-free";
export declare const DEFAULT_FREE_IMAGE_MODEL_REF = "growthcircle/gpt-image-2-free";
export declare const DEFAULT_TEAM_IMAGE_MODEL_ID = "gc-image-pro";
export declare const DEFAULT_TEAM_IMAGE_MODEL_REF = "growthcircle/gc-image-pro";
export declare const IMAGE_MODEL_IDS: readonly ["gpt-image-2", "gpt-image-2-free", "gc-image-pro", "gc-image-pro-square", "gc-image-pro-landscape", "gc-image-pro-portrait", "gpt-image-1", "gpt-image-1-mini"];
export declare const IMAGE_MODEL_REFS: string[];
export declare const FREE_TEXT_MODEL_IDS: readonly ["MiniMax-M2.7", "MiniMax-M2.7-highspeed", "claude-haiku-4-5-20251001", "claude-opus-4-6", "claude-opus-4-7", "claude-sonnet-4-6", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-flash-preview", "gemini-3.1-pro-preview", "gpt-5.3-codex", "gpt-5.3-codex-spark", "gpt-5.4", "gpt-5.4-mini", "gpt-5.5"];
export declare const PAID_TEXT_MODEL_IDS: readonly ["MiniMax-M2.7", "MiniMax-M2.7-highspeed", "claude-3-5-haiku-latest", "claude-haiku-4-5-20251001", "claude-opus-4-6", "claude-opus-4-7", "claude-sonnet-4-6", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-flash-preview", "gemini-3.1-pro-preview", "gpt-5.3-codex", "gpt-5.3-codex-spark", "gpt-5.4", "gpt-5.4-mini", "gpt-5.5"];
export declare const TEAM_TEXT_MODEL_IDS: readonly ["gpt-5.3-codex", "gpt-5.3-codex-spark", "gpt-5.4", "gpt-5.4-mini", "gpt-5.5"];
export declare const FREE_TEXT_MODEL_IDS_WITH_SUFFIX: string[];
export declare const FREE_TEXT_MODEL_REFS: string[];
export declare const PAID_TEXT_MODEL_REFS: string[];
export declare const TEAM_TEXT_MODEL_REFS: string[];
export declare const KNOWN_TEXT_MODEL_IDS: ("gpt-5.5" | "MiniMax-M2.7" | "MiniMax-M2.7-highspeed" | "claude-haiku-4-5-20251001" | "claude-opus-4-6" | "claude-opus-4-7" | "claude-sonnet-4-6" | "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-3-flash-preview" | "gemini-3.1-pro-preview" | "gpt-5.3-codex" | "gpt-5.3-codex-spark" | "gpt-5.4" | "gpt-5.4-mini" | "claude-3-5-haiku-latest")[];
export declare const KNOWN_TEXT_MODEL_REFS: string[];
export declare const DEFAULT_MODEL_LIMITS: {
    readonly contextWindow: 256000;
    readonly maxTokens: 36000;
};
export declare const FALLBACK_MODEL_LIMITS: {
    readonly contextWindow: 256000;
    readonly maxTokens: 36000;
};
export declare const GROWTHCIRCLE_OPENAI_COMPAT: ModelDefinitionConfig["compat"];
export declare const DEFAULT_MODEL: ModelDefinitionConfig;
export declare const DEFAULT_FREE_MODEL: ModelDefinitionConfig;
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
export type GrowthCircleKeyTier = "free" | "paid" | "team";
type GrowthCircleThinkingLevelId = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";
export type GrowthCircleThinkingProfile = {
    levels: Array<{
        id: GrowthCircleThinkingLevelId;
    }>;
    defaultLevel?: GrowthCircleThinkingLevelId | null;
};
export declare function fetchGrowthCircleModels({ apiKey, fetchFn, timeoutMs, }: FetchGrowthCircleModelsOptions): Promise<ModelDefinitionConfig[]>;
export declare function normalizeGrowthCircleModels(body: unknown, options?: NormalizeGrowthCircleModelsOptions): ModelDefinitionConfig[];
export declare function normalizeGrowthCircleImageModelIds(body: unknown): string[];
export declare function buildGrowthCircleImageGenerationProvider(): ImageGenerationProvider;
export declare function resolveDynamicGrowthCircleModel(modelId: string): ProviderRuntimeModel;
export declare function growthCircleDefaultModelRefForApiKey(apiKey: unknown): string;
export declare function growthCircleDefaultModelRefForTier(tier: GrowthCircleKeyTier): string;
export declare function growthCircleDefaultImageModelRefForTier(tier: GrowthCircleKeyTier): string;
export declare function growthCircleModelRefsForTier(tier: GrowthCircleKeyTier): string[];
export declare function resolveGrowthCircleDefaultThinkingLevel(params: {
    modelId: string;
    reasoning?: boolean;
}): "medium" | null;
export declare function supportsGrowthCircleXHighThinking(params: {
    modelId: string;
}): boolean | undefined;
export declare function resolveGrowthCircleThinkingProfile(params: {
    modelId: string;
    reasoning?: boolean;
}): GrowthCircleThinkingProfile;
export declare function applyGrowthCircleDefaults(cfg: OpenClawConfig, options?: NormalizeGrowthCircleModelsOptions): OpenClawConfig;
export declare function applyGrowthCircleDefaultsForApiKey(cfg: OpenClawConfig, apiKey: unknown): OpenClawConfig;
export declare function applyGrowthCircleDefaultsForTier(cfg: OpenClawConfig, tier: GrowthCircleKeyTier): OpenClawConfig;
export declare function isGrowthCircleFreeApiKey(apiKey: unknown): boolean;
export declare function isGrowthCircleApiKeyForTier(apiKey: unknown, tier: GrowthCircleKeyTier): boolean;
export declare function toGrowthCircleFreeModelId(modelId: string): string;
export {};
