import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  BASE_URL,
  DEFAULT_FREE_MODEL_REF,
  DEFAULT_MODEL_ID,
  DEFAULT_MODEL_LIMITS,
  DEFAULT_MODEL_REF,
  FREE_TEXT_MODEL_REFS,
  GROWTHCIRCLE_OPENAI_COMPAT,
  PAID_TEXT_MODEL_REFS,
  TEAM_TEXT_MODEL_REFS,
  applyGrowthCircleDefaults,
  applyGrowthCircleDefaultsForTier,
  fetchGrowthCircleModels,
  growthCircleModelRefsForTier,
  normalizeGrowthCircleModels,
  resolveDynamicGrowthCircleModel,
  resolveGrowthCircleDefaultThinkingLevel,
  resolveGrowthCircleThinkingProfile,
  supportsGrowthCircleXHighThinking,
} from "../src/provider.js";

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("../openclaw.plugin.json", import.meta.url)), "utf8"),
) as {
  version: string;
  extensions: string[];
  runtimeExtensions?: string[];
  providerAuthEnvVars?: unknown;
  setup: { providers: Array<{ authMethods: string[]; envVars: string[] }> };
  providerAuthChoices: Array<{
    choiceId: string;
    modelAllowlist?: {
      allowedKeys?: string[];
      initialSelections?: string[];
    };
  }>;
  providerRequest?: {
    providers?: Record<string, { family?: string; openAICompletions?: { supportsStreamingUsage?: boolean } }>;
  };
  modelCatalog?: {
    providers?: Record<string, { baseUrl?: string; api?: string; models?: Array<{ id: string; compat?: unknown }> }>;
    discovery?: Record<string, string>;
  };
};

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as {
  version: string;
  openclaw: {
    extensions: string[];
    runtimeExtensions?: string[];
    compat?: {
      pluginApi?: string;
      minGatewayVersion?: string;
    };
    build?: {
      openclawVersion?: string;
      pluginSdkVersion?: string;
    };
  };
};

const readme = readFileSync(fileURLToPath(new URL("../README.md", import.meta.url)), "utf8");

function modelIdFromRef(ref: string): string {
  return ref.slice(ref.indexOf("/") + 1);
}

describe("GrowthCircle.id model catalog", () => {
  it("declares compiled runtime entry metadata for managed package installs", () => {
    expect(packageJson.version).toBe("0.1.19");
    expect(packageJson.openclaw.extensions).toEqual(["./index.ts"]);
    expect(packageJson.openclaw.runtimeExtensions).toEqual(["./dist/index.js"]);
    expect(packageJson.openclaw.compat).toEqual({
      pluginApi: ">=2026.5.4",
      minGatewayVersion: "2026.5.4",
    });
    expect(packageJson.openclaw.build).toEqual({
      openclawVersion: "2026.5.22",
      pluginSdkVersion: "2026.5.22",
    });
  });

  it("documents repair-safe ClawHub update and uninstall recovery commands", () => {
    expect(readme).toContain(
      "(openclaw plugins update gc-provider || openclaw plugins install clawhub:gc-provider --force)",
    );
    expect(readme).toContain("openclaw plugins uninstall gc-provider --dry-run");
    expect(readme).toContain("openclaw plugins uninstall gc-provider --force");
    expect(readme).toContain(
      "openclaw plugins install clawhub:gc-provider --force\nopenclaw plugins uninstall gc-provider --force",
    );
    expect(readme).not.toContain("openclaw plugins update gc-provider@latest");
    expect(readme).not.toContain(
      "openclaw plugins install clawhub:gc-provider\nopenclaw plugins enable gc-provider",
    );
  });

  it("declares only tier-specific setup auth choices in the manifest", () => {
    expect(manifest.version).toBe(packageJson.version);
    expect(manifest.extensions).toEqual(["./index.ts"]);
    expect(manifest.runtimeExtensions).toEqual(["./dist/index.js"]);
    expect(manifest.setup.providers[0].authMethods).toEqual(["free-api-key", "paid-api-key", "team-api-key"]);
    expect(manifest.setup.providers[0].envVars).toEqual(["GROWTHCIRCLE_API_KEY"]);
    expect(manifest.providerAuthEnvVars).toBeUndefined();
    expect(manifest.providerAuthChoices.map((choice) => choice.choiceId)).toEqual([
      "growthcircle-free-api-key",
      "growthcircle-paid-api-key",
      "growthcircle-team-api-key",
    ]);
    expect(
      manifest.providerAuthChoices.find((choice) => choice.choiceId === "growthcircle-free-api-key")
        ?.modelAllowlist?.allowedKeys,
    ).toEqual(FREE_TEXT_MODEL_REFS);
    expect(
      manifest.providerAuthChoices.find((choice) => choice.choiceId === "growthcircle-paid-api-key")
        ?.modelAllowlist?.allowedKeys,
    ).toEqual(PAID_TEXT_MODEL_REFS);
    expect(
      manifest.providerAuthChoices.find((choice) => choice.choiceId === "growthcircle-team-api-key")
        ?.modelAllowlist?.allowedKeys,
    ).toEqual(TEAM_TEXT_MODEL_REFS);
    expect(
      manifest.providerAuthChoices.find((choice) => choice.choiceId === "growthcircle-free-api-key")
        ?.modelAllowlist?.initialSelections,
    ).toEqual(FREE_TEXT_MODEL_REFS);
    expect(
      manifest.providerAuthChoices.find((choice) => choice.choiceId === "growthcircle-paid-api-key")
        ?.modelAllowlist?.initialSelections,
    ).toEqual(PAID_TEXT_MODEL_REFS);
    expect(
      manifest.providerAuthChoices.find((choice) => choice.choiceId === "growthcircle-team-api-key")
        ?.modelAllowlist?.initialSelections,
    ).toEqual(TEAM_TEXT_MODEL_REFS);
    expect(manifest.providerRequest?.providers?.growthcircle?.family).toBe(
      "growthcircle-openai-compatible",
    );
    expect(manifest.providerRequest?.providers?.growthcircle?.openAICompletions).toEqual({
      supportsStreamingUsage: true,
    });
    expect(manifest.modelCatalog?.providers?.growthcircle).toMatchObject({
      baseUrl: BASE_URL,
      api: "openai-completions",
    });
    expect(manifest.modelCatalog?.discovery?.growthcircle).toBe("runtime");
    expect(
      manifest.modelCatalog?.providers?.growthcircle?.models?.find((model) => model.id === DEFAULT_MODEL_ID),
    ).toMatchObject({
      id: DEFAULT_MODEL_ID,
      compat: GROWTHCIRCLE_OPENAI_COMPAT,
    });
    expect(manifest.modelCatalog?.providers?.growthcircle?.models?.map((model) => model.id)).toEqual([
      ...PAID_TEXT_MODEL_REFS.map(modelIdFromRef),
      ...FREE_TEXT_MODEL_REFS.map(modelIdFromRef),
    ]);
  });

  it("normalizes OpenAI-compatible /models responses", () => {
    const models = normalizeGrowthCircleModels({
      data: [
        {
          id: "gc-free-small",
          name: "GC Free Small",
          capabilities: ["reasoning"],
          input: ["text", "image", "unsupported"],
          context_window: 64_000,
          max_output_tokens: 4096,
          cost: { input: "0.1", output: 0.2, cache_read: 0.01 },
        },
        { id: "gc-free-small", name: "duplicate" },
        { id: "   " },
        { object: "model" },
      ],
    });

    expect(models).toEqual([
      {
        id: "gc-free-small",
        name: "GC Free Small",
        reasoning: true,
        input: ["text", "image"],
        cost: {
          input: 0.1,
          output: 0.2,
          cacheRead: 0.01,
          cacheWrite: 0,
        },
        contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
        maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
        compat: GROWTHCIRCLE_OPENAI_COMPAT,
      },
    ]);
  });

  it("supports array and models response shapes", () => {
    expect(normalizeGrowthCircleModels(["model-a", "model-b"]).map((model) => model.id)).toEqual([
      "model-a",
      "model-b",
    ]);
    expect(
      normalizeGrowthCircleModels({ models: [{ id: "model-c", max_tokens: "1234" }] })[0],
    ).toMatchObject({
      id: "model-c",
      maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
    });
  });

  it("keeps only GrowthCircle text inference models from the live catalog shape", () => {
    const models = normalizeGrowthCircleModels({
      data: [
        {
          id: DEFAULT_MODEL_ID,
          owned_by: "growthcircle",
          unit_type: "token",
          available_for_current_key: true,
          architecture: {
            input_modalities: ["text", "image"],
            output_modalities: ["text"],
          },
          reasoning_effort_supported: ["low", "medium", "high", "xhigh"],
          context_window: 1_050_000,
          max_output_tokens: 128_000,
        },
        {
          id: "sora-2",
          owned_by: "growthcircle",
          unit_type: "video_task",
          architecture: {
            input_modalities: ["text", "image"],
            output_modalities: ["video"],
          },
        },
        {
          id: "gpt-image-2",
          owned_by: "growthcircle",
          unit_type: "image",
          architecture: {
            input_modalities: ["text", "image"],
            output_modalities: ["image"],
          },
        },
        {
          id: "external-token-model",
          owned_by: "openai",
          unit_type: "token",
          architecture: {
            input_modalities: ["text"],
            output_modalities: ["text"],
          },
        },
        {
          id: "unavailable-token-model",
          owned_by: "growthcircle",
          unit_type: "token",
          available_for_current_key: false,
          architecture: {
            input_modalities: ["text"],
            output_modalities: ["text"],
          },
        },
      ],
    });

    expect(models).toEqual([
      expect.objectContaining({
        id: DEFAULT_MODEL_ID,
        reasoning: true,
        input: ["text", "image"],
        contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
        maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
      }),
    ]);
  });

  it("fetches /models with bearer auth without exposing the key in errors", async () => {
    const fetchFn = vi.fn(async () =>
      Response.json({
        data: [{ id: "gc-paid-large" }],
      }),
    );

    const models = await fetchGrowthCircleModels({
      apiKey: "test-key",
      fetchFn,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      `${BASE_URL}/models`,
      expect.objectContaining({
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer test-key",
        },
      }),
    );
    expect(models[0]).toMatchObject({
      id: "gc-paid-large",
      contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
      maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
    });
  });

  it("uses OpenClaw GPT-5.5 defaults for the GrowthCircle default model", () => {
    expect(normalizeGrowthCircleModels({ data: [{ id: DEFAULT_MODEL_ID }] })[0]).toMatchObject({
      id: "gpt-5.5",
      name: "GPT-5.5",
      reasoning: true,
      input: ["text", "image"],
      contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
      maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
    });
  });

  it("normalizes free-tier model ids with the required -free suffix", () => {
    const models = normalizeGrowthCircleModels(
      { data: [{ id: DEFAULT_MODEL_ID }, { id: "gpt-5.4-free" }] },
      { freeModels: true },
    );

    expect(models.map((model) => model.id)).toEqual(["gpt-5.5-free", "gpt-5.4-free"]);
    expect(models[0]).toMatchObject({
      id: "gpt-5.5-free",
      name: "GPT-5.5 Free",
      contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
      maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
    });
  });

  it("throws compact HTTP errors", async () => {
    const fetchFn = vi.fn(async () => new Response("bad", { status: 401 }));

    await expect(fetchGrowthCircleModels({ apiKey: "secret-key", fetchFn })).rejects.toThrow(
      "GrowthCircle.id /models failed with HTTP 401",
    );
  });

  it("resolves arbitrary dynamic model ids through the GrowthCircle transport", () => {
    expect(resolveDynamicGrowthCircleModel("custom-upstream-model")).toMatchObject({
      id: "custom-upstream-model",
      provider: "growthcircle",
      api: "openai-completions",
      baseUrl: BASE_URL,
      input: ["text"],
      compat: GROWTHCIRCLE_OPENAI_COMPAT,
    });
  });

  it("sets the default model and medium thinking during onboarding", () => {
    const config = applyGrowthCircleDefaults({});

    expect(config.agents?.defaults?.model).toEqual({
      primary: DEFAULT_MODEL_REF,
    });
    expect(config.agents?.defaults?.thinkingDefault).toBe("medium");
    expect(config.models?.providers?.growthcircle?.models[0]).toMatchObject({
      id: DEFAULT_MODEL_ID,
      contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
      maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
    });
  });

  it("sets tier-specific model picker defaults", () => {
    expect(applyGrowthCircleDefaultsForTier({}, "free").agents?.defaults?.model).toEqual({
      primary: DEFAULT_FREE_MODEL_REF,
    });
    expect(growthCircleModelRefsForTier("free")).toEqual(FREE_TEXT_MODEL_REFS);
    expect(growthCircleModelRefsForTier("paid")).toEqual(PAID_TEXT_MODEL_REFS);
    expect(growthCircleModelRefsForTier("team")).toEqual(TEAM_TEXT_MODEL_REFS);
  });

  it("seeds the configured provider catalog and /model allowlist with all tier text models", () => {
    const freeConfig = applyGrowthCircleDefaultsForTier({}, "free");
    const paidConfig = applyGrowthCircleDefaultsForTier({}, "paid");
    const teamConfig = applyGrowthCircleDefaultsForTier({}, "team");

    expect(Object.keys(freeConfig.agents?.defaults?.models ?? {})).toEqual(
      expect.arrayContaining(FREE_TEXT_MODEL_REFS),
    );
    expect(Object.keys(paidConfig.agents?.defaults?.models ?? {})).toEqual(
      expect.arrayContaining(PAID_TEXT_MODEL_REFS),
    );
    expect(Object.keys(teamConfig.agents?.defaults?.models ?? {})).toEqual(
      expect.arrayContaining(TEAM_TEXT_MODEL_REFS),
    );

    expect(
      freeConfig.models?.providers?.growthcircle?.models?.map((model) => model.id),
    ).toEqual(expect.arrayContaining(FREE_TEXT_MODEL_REFS.map(modelIdFromRef)));
    expect(
      paidConfig.models?.providers?.growthcircle?.models?.map((model) => model.id),
    ).toEqual(expect.arrayContaining(PAID_TEXT_MODEL_REFS.map(modelIdFromRef)));
    expect(
      teamConfig.models?.providers?.growthcircle?.models?.map((model) => model.id),
    ).toEqual(expect.arrayContaining(TEAM_TEXT_MODEL_REFS.map(modelIdFromRef)));

    expect(freeConfig.models?.providers?.growthcircle?.models?.map((model) => model.id)).toContain(
      "MiniMax-M2.7-free",
    );
    expect(paidConfig.models?.providers?.growthcircle?.models?.map((model) => model.id)).toContain(
      "MiniMax-M2.7",
    );
  });

  it("exposes medium as the GrowthCircle reasoning default", () => {
    expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: "gpt-5.5" })).toBe("medium");
    expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: "custom", reasoning: true })).toBe("medium");
    expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: "custom", reasoning: false })).toBeNull();
    expect(supportsGrowthCircleXHighThinking({ modelId: "gpt-5.5" })).toBe(true);
    expect(resolveGrowthCircleThinkingProfile({ modelId: "gpt-5.5" })).toEqual({
      levels: [
        { id: "off" },
        { id: "minimal" },
        { id: "low" },
        { id: "medium" },
        { id: "high" },
        { id: "xhigh" },
      ],
      defaultLevel: "medium",
    });
    expect(resolveGrowthCircleThinkingProfile({ modelId: "custom", reasoning: true })).toEqual({
      levels: [{ id: "off" }, { id: "minimal" }, { id: "low" }, { id: "medium" }, { id: "high" }],
      defaultLevel: "medium",
    });
  });
});
