declare const _default: {
    id: string;
    name: string;
    description: string;
    configSchema: import("openclaw/plugin-sdk/plugin-entry").OpenClawPluginConfigSchema;
    register: NonNullable<import("openclaw/plugin-sdk/plugin-entry").OpenClawPluginDefinition["register"]>;
} & Pick<import("openclaw/plugin-sdk/plugin-entry").OpenClawPluginDefinition, "kind" | "reload" | "nodeHostCommands" | "securityAuditCollectors">;
export default _default;
export { BASE_URL, DEFAULT_MODEL, DEFAULT_FREE_MODEL, DEFAULT_FREE_IMAGE_MODEL_REF, DEFAULT_FREE_MODEL_REF, DEFAULT_IMAGE_MODEL_ID, DEFAULT_IMAGE_MODEL_REF, DEFAULT_MODEL_ID, DEFAULT_MODEL_REF, DEFAULT_MODEL_LIMITS, DEFAULT_TEAM_IMAGE_MODEL_REF, ENV_VAR, FREE_TEXT_MODEL_REFS, FALLBACK_MODEL_LIMITS, IMAGE_MODEL_REFS, KNOWN_TEXT_MODEL_REFS, PAID_TEXT_MODEL_REFS, PLUGIN_DESCRIPTION, PLUGIN_ID, PLUGIN_NAME, PROVIDER_ID, PROVIDER_LABEL, TEAM_TEXT_MODEL_REFS, applyGrowthCircleDefaultsForTier, buildGrowthCircleImageGenerationProvider, fetchGrowthCircleModels, growthCircleDefaultImageModelRefForTier, normalizeGrowthCircleImageModelIds, normalizeGrowthCircleModels, resolveDynamicGrowthCircleModel, resolveGrowthCircleDefaultThinkingLevel, resolveGrowthCircleThinkingProfile, supportsGrowthCircleXHighThinking, } from "./src/provider.js";
