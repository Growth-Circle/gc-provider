import { describe, expect, it, vi } from "vitest";
import {
  BASE_URL,
  DEFAULT_MODEL_ID,
  DEFAULT_MODEL_LIMITS,
  DEFAULT_MODEL_REF,
  applyGrowthCircleDefaults,
  fetchGrowthCircleModels,
  normalizeGrowthCircleModels,
  resolveDynamicGrowthCircleModel,
  resolveGrowthCircleThinkingProfile,
} from "../src/provider.js";

describe("GrowthCircle.id model catalog", () => {
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
        contextWindow: 64_000,
        maxTokens: 4096,
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
      maxTokens: 1234,
    });
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
      contextWindow: 128_000,
      maxTokens: 8_192,
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

  it("exposes medium as the GrowthCircle reasoning default", () => {
    expect(resolveGrowthCircleThinkingProfile({ modelId: "gpt-5.5" })).toMatchObject({
      defaultLevel: "medium",
    });
    expect(resolveGrowthCircleThinkingProfile({ modelId: "custom", reasoning: true })).toMatchObject({
      defaultLevel: "medium",
    });
    expect(resolveGrowthCircleThinkingProfile({ modelId: "custom", reasoning: false })).toBeNull();
  });
});
