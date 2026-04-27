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
  PAID_TEXT_MODEL_REFS,
  TEAM_TEXT_MODEL_REFS,
  applyGrowthCircleDefaults,
  applyGrowthCircleDefaultsForTier,
  fetchGrowthCircleModels,
  growthCircleModelRefsForTier,
  normalizeGrowthCircleModels,
  resolveDynamicGrowthCircleModel,
  resolveGrowthCircleDefaultThinkingLevel,
  supportsGrowthCircleXHighThinking,
} from "../src/provider.js";

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("../openclaw.plugin.json", import.meta.url)), "utf8"),
) as {
  setup: { providers: Array<{ authMethods: string[] }> };
  providerAuthChoices: Array<{ choiceId: string }>;
};

describe("GrowthCircle.id model catalog", () => {
  it("declares only tier-specific setup auth choices in the manifest", () => {
    expect(manifest.setup.providers[0].authMethods).toEqual(["free-api-key", "paid-api-key", "team-api-key"]);
    expect(manifest.providerAuthChoices.map((choice) => choice.choiceId)).toEqual([
      "growthcircle-free-api-key",
      "growthcircle-paid-api-key",
      "growthcircle-team-api-key",
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

  it("exposes medium as the GrowthCircle reasoning default", () => {
    expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: "gpt-5.5" })).toBe("medium");
    expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: "custom", reasoning: true })).toBe("medium");
    expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: "custom", reasoning: false })).toBeNull();
    expect(supportsGrowthCircleXHighThinking({ modelId: "gpt-5.5" })).toBe(true);
  });
});
