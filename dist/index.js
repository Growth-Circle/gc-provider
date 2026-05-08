import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";
import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
import { BASE_URL, ENV_VAR, FREE_TEXT_MODEL_REFS, PAID_TEXT_MODEL_REFS, TEAM_TEXT_MODEL_REFS, PLUGIN_DESCRIPTION, PLUGIN_ID, PLUGIN_NAME, PROVIDER_ID, PROVIDER_LABEL, applyGrowthCircleDefaultsForTier, fetchGrowthCircleModels, growthCircleDefaultModelRefForTier, resolveDynamicGrowthCircleModel, resolveGrowthCircleDefaultThinkingLevel, resolveGrowthCircleThinkingProfile, supportsGrowthCircleXHighThinking, } from "./src/provider.js";
function createGrowthCircleAuthMethod(params) {
    const defaultModelRef = growthCircleDefaultModelRefForTier(params.tier);
    return createProviderApiKeyAuthMethod({
        providerId: PROVIDER_ID,
        methodId: `${params.tier}-api-key`,
        label: params.label,
        hint: params.hint,
        optionKey: "growthcircleApiKey",
        flagName: "--growthcircle-api-key",
        envVar: ENV_VAR,
        promptMessage: `Enter your GrowthCircle.id ${params.tier} API key`,
        defaultModel: defaultModelRef,
        expectedProviders: [PROVIDER_ID, `gc-${params.tier}`],
        applyConfig: (cfg) => applyGrowthCircleDefaultsForTier(cfg, params.tier),
        wizard: {
            choiceId: `growthcircle-${params.tier}-api-key`,
            choiceLabel: `${params.label}`,
            choiceHint: params.hint,
            groupId: "growthcircle",
            groupLabel: PROVIDER_LABEL,
            onboardingScopes: ["text-inference"],
            modelAllowlist: {
                allowedKeys: params.allowedKeys,
                initialSelections: [defaultModelRef],
                message: `${PROVIDER_LABEL} ${params.tier} models in /model picker (multi-select)`,
            },
            modelSelection: {
                promptWhenAuthChoiceProvided: true,
                allowKeepCurrent: true,
            },
        },
    });
}
export default definePluginEntry({
    id: PLUGIN_ID,
    name: PLUGIN_NAME,
    description: PLUGIN_DESCRIPTION,
    register(api) {
        const providerRegistration = {
            id: PROVIDER_ID,
            label: PROVIDER_LABEL,
            docsPath: "/providers/growthcircle",
            envVars: [ENV_VAR],
            auth: [
                createGrowthCircleAuthMethod({
                    tier: "free",
                    label: "GrowthCircle.id Free API key",
                    hint: "Use a gc-free key. Free-tier model ids use the -free suffix.",
                    allowedKeys: FREE_TEXT_MODEL_REFS,
                }),
                createGrowthCircleAuthMethod({
                    tier: "paid",
                    label: "GrowthCircle.id Paid API key",
                    hint: "Use a gc-paid key.",
                    allowedKeys: PAID_TEXT_MODEL_REFS,
                }),
                createGrowthCircleAuthMethod({
                    tier: "team",
                    label: "GrowthCircle.id Team API key",
                    hint: "Use a gc-team key.",
                    allowedKeys: TEAM_TEXT_MODEL_REFS,
                }),
            ],
            catalog: {
                order: "simple",
                run: async (ctx) => {
                    const { apiKey } = ctx.resolveProviderApiKey(PROVIDER_ID);
                    if (!apiKey)
                        return null;
                    return {
                        provider: {
                            baseUrl: BASE_URL,
                            apiKey,
                            api: "openai-completions",
                            models: await fetchGrowthCircleModels({ apiKey }),
                        },
                    };
                },
            },
            resolveDynamicModel: (ctx) => resolveDynamicGrowthCircleModel(ctx.modelId),
            resolveDefaultThinkingLevel: (ctx) => resolveGrowthCircleDefaultThinkingLevel({
                modelId: ctx.modelId,
                reasoning: ctx.reasoning,
            }),
            supportsXHighThinking: (ctx) => supportsGrowthCircleXHighThinking({
                modelId: ctx.modelId,
            }),
            resolveThinkingProfile: (ctx) => resolveGrowthCircleThinkingProfile({
                modelId: ctx.modelId,
                reasoning: ctx.reasoning,
            }),
            buildMissingAuthMessage: () => `GrowthCircle.id requires ${ENV_VAR} or an auth profile. Run openclaw onboard --auth-choice growthcircle-free-api-key, growthcircle-paid-api-key, or growthcircle-team-api-key; or set ${ENV_VAR}.`,
            buildUnknownModelHint: () => `Run openclaw models list --provider ${PROVIDER_ID} with a valid GrowthCircle.id key; available models depend on the key tier.`,
            normalizeTransport: (ctx) => {
                if (ctx.baseUrl === BASE_URL) {
                    return { api: "openai-completions", baseUrl: BASE_URL };
                }
                return null;
            },
            ...buildProviderReplayFamilyHooks({
                family: "openai-compatible",
            }),
        };
        api.registerProvider(providerRegistration);
    },
});
export { BASE_URL, DEFAULT_MODEL, DEFAULT_FREE_MODEL, DEFAULT_FREE_MODEL_REF, DEFAULT_MODEL_ID, DEFAULT_MODEL_REF, DEFAULT_MODEL_LIMITS, ENV_VAR, FREE_TEXT_MODEL_REFS, FALLBACK_MODEL_LIMITS, KNOWN_TEXT_MODEL_REFS, PAID_TEXT_MODEL_REFS, PLUGIN_DESCRIPTION, PLUGIN_ID, PLUGIN_NAME, PROVIDER_ID, PROVIDER_LABEL, TEAM_TEXT_MODEL_REFS, applyGrowthCircleDefaultsForTier, fetchGrowthCircleModels, normalizeGrowthCircleModels, resolveDynamicGrowthCircleModel, resolveGrowthCircleDefaultThinkingLevel, resolveGrowthCircleThinkingProfile, supportsGrowthCircleXHighThinking, } from "./src/provider.js";
