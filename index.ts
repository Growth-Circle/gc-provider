import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";
import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
import {
  BASE_URL,
  DEFAULT_MODEL,
  DEFAULT_MODEL_ID,
  DEFAULT_MODEL_LIMITS,
  DEFAULT_MODEL_REF,
  ENV_VAR,
  FALLBACK_MODEL_LIMITS,
  PLUGIN_DESCRIPTION,
  PLUGIN_ID,
  PLUGIN_NAME,
  PROVIDER_ID,
  PROVIDER_LABEL,
  applyGrowthCircleDefaults,
  fetchGrowthCircleModels,
  resolveDynamicGrowthCircleModel,
  resolveGrowthCircleThinkingProfile,
} from "./src/provider.js";

export default definePluginEntry({
  id: PLUGIN_ID,
  name: PLUGIN_NAME,
  description: PLUGIN_DESCRIPTION,
  register(api) {
    api.registerProvider({
      id: PROVIDER_ID,
      label: PROVIDER_LABEL,
      docsPath: "/providers/growthcircle",
      envVars: [ENV_VAR],
      auth: [
        createProviderApiKeyAuthMethod({
          providerId: PROVIDER_ID,
          methodId: "api-key",
          label: "GrowthCircle.id API key",
          hint: "Use a gc-free, gc-paid, or gc-team key from GrowthCircle.id.",
          optionKey: "growthcircleApiKey",
          flagName: "--growthcircle-api-key",
          envVar: ENV_VAR,
          promptMessage: "Enter your GrowthCircle.id API key",
          defaultModel: DEFAULT_MODEL_REF,
          applyConfig: applyGrowthCircleDefaults,
          wizard: {
            choiceId: "growthcircle-api-key",
            choiceLabel: "GrowthCircle.id API key",
            choiceHint: "Use a gc-free, gc-paid, or gc-team key.",
            groupId: "growthcircle",
            groupLabel: PROVIDER_LABEL,
            onboardingScopes: ["text-inference"],
            modelSelection: {
              promptWhenAuthChoiceProvided: true,
              allowKeepCurrent: true,
            },
          },
        }),
      ],
      catalog: {
        order: "simple",
        run: async (ctx) => {
          const { apiKey } = ctx.resolveProviderApiKey(PROVIDER_ID);
          if (!apiKey) return null;

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
      resolveThinkingProfile: (ctx) =>
        resolveGrowthCircleThinkingProfile({
          modelId: ctx.modelId,
          reasoning: ctx.reasoning,
        }),
      buildMissingAuthMessage: () =>
        `GrowthCircle.id requires ${ENV_VAR} or an auth profile. Run openclaw onboard --auth-choice growthcircle-api-key, or set ${ENV_VAR}.`,
      buildUnknownModelHint: () =>
        `Run openclaw models list --provider ${PROVIDER_ID} with a valid GrowthCircle.id key; available models depend on the key tier.`,
      normalizeTransport: (ctx) => {
        if (ctx.baseUrl === BASE_URL) {
          return { api: "openai-completions", baseUrl: BASE_URL };
        }
        return null;
      },
      ...buildProviderReplayFamilyHooks({
        family: "openai-compatible",
      }),
    });
  },
});

export {
  BASE_URL,
  DEFAULT_MODEL,
  DEFAULT_MODEL_ID,
  DEFAULT_MODEL_LIMITS,
  DEFAULT_MODEL_REF,
  ENV_VAR,
  FALLBACK_MODEL_LIMITS,
  PLUGIN_DESCRIPTION,
  PLUGIN_ID,
  PLUGIN_NAME,
  PROVIDER_ID,
  PROVIDER_LABEL,
  applyGrowthCircleDefaults,
  fetchGrowthCircleModels,
  normalizeGrowthCircleModels,
  resolveDynamicGrowthCircleModel,
  resolveGrowthCircleThinkingProfile,
} from "./src/provider.js";
