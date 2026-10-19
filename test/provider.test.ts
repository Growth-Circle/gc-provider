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
  GROWTHCIRCLE_WILDCARD_MODEL_REF,
  PAID_TEXT_MODEL_REFS,
  TEAM_DEFAULT_MODEL_REF,
  TEAM_TEXT_MODEL_IDS,
  TEAM_TEXT_MODEL_REFS,
  applyGrowthCircleDefaults,
  applyGrowthCircleDefaultsForTier,
  fetchGrowthCircleModels,
  growthCircleModelRefsForTier,
  growthCircleFallbackModelsForTier,
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
  files?: string[];
  bin?: Record<string, string>;
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
const hermesProvider = readFileSync(
  fileURLToPath(new URL("../hermes/plugins/model-providers/growthcircle/__init__.py", import.meta.url)),
  "utf8",
);
const hermesPluginYaml = readFileSync(
  fileURLToPath(new URL("../hermes/plugins/model-providers/growthcircle/plugin.yaml", import.meta.url)),
  "utf8",
);
const hermesInstaller = readFileSync(
  fileURLToPath(new URL("../scripts/install-hermes-plugin.sh", import.meta.url)),
  "utf8",
);

const EXPECTED_FREE_TEXT_MODEL_REFS = [
  "growthcircle/gpt-5.6-luna-free",
];

function modelIdFromRef(ref: string): string {
  return ref.slice(ref.indexOf("/") + 1);
}

describe("GrowthCircle.id model catalog", () => {
  it("declares compiled runtime entry metadata for managed package installs", () => {
    expect(packageJson.version).toBe("0.1.37");
    expect(packageJson.files).toEqual(
      expect.arrayContaining([
        "hermes/plugins/model-providers/growthcircle/__init__.py",
        "hermes/plugins/model-providers/growthcircle/plugin.yaml",
        "hermes/plugins/model-providers/growthcircle/README.md",
        "scripts/install-hermes-plugin.sh",
      ]),
    );
    expect(packageJson.bin).toEqual({
      "gc-provider": "dist/src/setup/cli.js",
      "gc-provider-install-hermes": "scripts/install-hermes-plugin.sh",
    });
    expect(packageJson.openclaw.extensions).toEqual(["./index.ts"]);
    expect(packageJson.openclaw.runtimeExtensions).toEqual(["./dist/index.js"]);
    expect(packageJson.openclaw.compat).toEqual({
      pluginApi: ">=2026.5.4",
      minGatewayVersion: "2026.5.4",
    });
    expect(packageJson.openclaw.build).toEqual({
      openclawVersion: "2026.6.11",
      pluginSdkVersion: "2026.6.11",
    });
  });

  it("ships a Hermes Agent model-provider plugin and installer", () => {
    expect(hermesPluginYaml).toContain("kind: model-provider");
    expect(hermesPluginYaml).toContain('version: "0.1.37"');
    expect(hermesProvider).toContain("register_provider(growthcircle)");
    expect(hermesProvider).toContain('env_vars=(ENV_VAR,)');
    expect(hermesProvider).toContain('base_url=BASE_URL');
    expect(hermesProvider).toContain("base_url: str | None = None");
    expect(hermesProvider).toContain("effective_base_url = base_url or self.base_url");
    expect(hermesProvider).toContain('default_aux_model=""');
    expect(hermesProvider).toContain('unit_type');
    expect(hermesProvider).toContain('output_modalities');
    expect(hermesInstaller).toContain('HERMES_HOME="${HERMES_HOME:-${HOME}/.hermes}"');
    expect(hermesInstaller).toContain('hermes plugins enable "model-providers/${PLUGIN_NAME}"');
    expect(hermesInstaller).toContain("BACKUP_DIR=");
  });

  it("documents repair-safe ClawHub update and uninstall recovery commands", () => {
    expect(readme).toContain("Tested OpenClaw SDK target: `2026.6.11`");
    expect(readme).toContain("OpenClaw `2026.6.10` and `2026.6.11`");
    expect(readme).toContain("Hermes Agent model-provider layout checked against `hermes-agent@0.18.2`");
    expect(readme).toContain(
      "(openclaw plugins update gc-provider || openclaw plugins install clawhub:gc-provider --force)",
    );
    expect(readme).toContain("openclaw plugins uninstall gc-provider --dry-run");
    expect(readme).toContain("openclaw plugins uninstall gc-provider --force");
    expect(readme).toMatch(
      /openclaw plugins install clawhub:gc-provider --force\r?\nopenclaw plugins uninstall gc-provider --force/,
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
    const teamOnlyModelIds = TEAM_TEXT_MODEL_REFS.filter((ref) => !PAID_TEXT_MODEL_REFS.includes(ref)).map(
      modelIdFromRef,
    );
    expect(manifest.modelCatalog?.providers?.growthcircle?.models?.map((model) => model.id)).toEqual([
      ...PAID_TEXT_MODEL_REFS.map(modelIdFromRef),
      ...teamOnlyModelIds,
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

  it("uses GPT-5.6 Sol defaults for the GrowthCircle default model", () => {
    expect(normalizeGrowthCircleModels({ data: [{ id: DEFAULT_MODEL_ID }] })[0]).toMatchObject({
      id: "gpt-5.6-sol",
      name: "GPT-5.6-sol",
      reasoning: true,
      input: ["text", "image"],
      contextWindow: DEFAULT_MODEL_LIMITS.contextWindow,
      maxTokens: DEFAULT_MODEL_LIMITS.maxTokens,
    });
    expect(normalizeGrowthCircleModels({ data: [{ id: "gpt-5.5" }] })[0]).toMatchObject({
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
      { data: [{ id: "gpt-5.6-luna" }, { id: "MiniMax-M3-free" }] },
      { freeModels: true },
    );

    expect(models.map((model) => model.id)).toEqual(["gpt-5.6-luna-free", "MiniMax-M3-free"]);
    expect(models[0]).toMatchObject({
      id: "gpt-5.6-luna-free",
      name: "GPT-5.6-luna Free",
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
    expect(FREE_TEXT_MODEL_REFS).toEqual(EXPECTED_FREE_TEXT_MODEL_REFS);
    expect(growthCircleModelRefsForTier("paid")).toEqual(PAID_TEXT_MODEL_REFS);
    expect(growthCircleModelRefsForTier("team")).toEqual(TEAM_TEXT_MODEL_REFS);
    expect(FREE_TEXT_MODEL_REFS).toEqual(["growthcircle/gpt-5.6-luna-free"]);
    expect(PAID_TEXT_MODEL_REFS).toContain("growthcircle/gpt-5.6-luna");
    expect(PAID_TEXT_MODEL_REFS).toContain("growthcircle/qwen3.7-flash");
    expect(TEAM_TEXT_MODEL_REFS).not.toContain("growthcircle/gpt-5.6-luna-free");
    for (const model of ["qwen3.7-flash", "gpt-5.6-luna", "muse-spark-1.2-contributor", "step-3.5-flash", "deepseek-v4-flash", "mimo-v2.5", "hy3"]) {
      expect(PAID_TEXT_MODEL_REFS).toContain(`growthcircle/${model}`);
      if (model === "gpt-5.6-luna") {
        expect(FREE_TEXT_MODEL_REFS).toContain(`growthcircle/${model}-free`);
      } else {
        expect(FREE_TEXT_MODEL_REFS).not.toContain(`growthcircle/${model}-free`);
      }
      if (model === "gpt-5.6-luna") {
        expect(TEAM_TEXT_MODEL_REFS).toContain(`growthcircle/${model}`);
      } else {
        expect(TEAM_TEXT_MODEL_REFS).not.toContain(`growthcircle/${model}`);
      }
    }
  });

  it("uses the verified tier fallback when live discovery is unavailable", () => {
    expect(growthCircleFallbackModelsForTier("free").map((model) => `growthcircle/${model.id}`).sort()).toEqual(
      [...EXPECTED_FREE_TEXT_MODEL_REFS].sort(),
    );
    expect(growthCircleFallbackModelsForTier("paid")[0]?.id).toBe("gpt-5.6-sol");
    expect(growthCircleFallbackModelsForTier("team")[0]?.id).toBe("gpt-6.1-sol");
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

    expect(freeConfig.models?.providers?.growthcircle?.models?.map((model) => model.id)).toEqual([
      "gpt-5.6-luna-free",
    ]);
    expect(paidConfig.models?.providers?.growthcircle?.models?.map((model) => model.id)).toContain(
      "MiniMax-M2.7",
    );
    expect(paidConfig.models?.providers?.growthcircle?.models?.map((model) => model.id)).toContain(
      "MiniMax-M3",
    );
    expect(paidConfig.models?.providers?.growthcircle?.models?.map((model) => model.id)).toContain(
      "deepseek-v4-flash",
    );
    expect(paidConfig.models?.providers?.growthcircle?.models?.map((model) => model.id)).toContain(
      "deepseek-v4-pro",
    );
  });

  it("AC-CAT-001: sets gpt-6.1-sol as the team default model", () => {
    expect(TEAM_DEFAULT_MODEL_REF).toBe("growthcircle/gpt-6.1-sol");
    expect(applyGrowthCircleDefaultsForTier({}, "team").agents?.defaults?.model).toEqual({
      primary: "growthcircle/gpt-6.1-sol",
    });
    expect(applyGrowthCircleDefaultsForTier({}, "paid").agents?.defaults?.model).toEqual({
      primary: DEFAULT_MODEL_REF,
    });
  });

  it("AC-CAT-002: lists exactly the 7 team models in code, manifest, Hermes fallback and README", () => {
    const expected = [
      "gpt-6.1-sol",
      "gpt-6-sol",
      "gpt-6-luna",
      "gpt-6-astra",
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
    ];
    expect([...TEAM_TEXT_MODEL_IDS]).toEqual(expected);
    const teamChoice = manifest.providerAuthChoices.find((choice) => choice.choiceId === "growthcircle-team-api-key");
    expect(teamChoice?.modelAllowlist?.allowedKeys).toEqual(TEAM_TEXT_MODEL_REFS);
    expect(teamChoice?.modelAllowlist?.initialSelections).toEqual(TEAM_TEXT_MODEL_REFS);
    const hermesTeam = /TEAM_FALLBACK_MODELS = \(([^)]*)\)/u.exec(hermesProvider)?.[1] ?? "";
    expect([...hermesTeam.matchAll(/"([^"]+)"/gu)].map((match) => match[1])).toEqual(expected);
    const readmeTeam = /### Team\s+```text\s+([^`]*)```/u.exec(readme)?.[1] ?? "";
    expect(readmeTeam.trim().split(/\s+/u)).toEqual(TEAM_TEXT_MODEL_REFS);
    expect(growthCircleModelRefsForTier("team")).toEqual(TEAM_TEXT_MODEL_REFS);
  });

  it("AC-CAT-003: keeps retired ids out of every team list", () => {
    const teamChoice = manifest.providerAuthChoices.find((choice) => choice.choiceId === "growthcircle-team-api-key");
    const hermesTeam = /TEAM_FALLBACK_MODELS = \(([^)]*)\)/u.exec(hermesProvider)?.[1] ?? "";
    for (const retired of ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.6"]) {
      expect(TEAM_TEXT_MODEL_IDS as readonly string[]).not.toContain(retired);
      expect(TEAM_TEXT_MODEL_REFS).not.toContain(`growthcircle/${retired}`);
      expect(teamChoice?.modelAllowlist?.allowedKeys).not.toContain(`growthcircle/${retired}`);
      expect(teamChoice?.modelAllowlist?.initialSelections).not.toContain(`growthcircle/${retired}`);
      expect(hermesTeam).not.toContain(`"${retired}"`);
    }
  });

  it("treats gpt-6 models as reasoning models", () => {
    for (const id of ["gpt-6.1-sol", "gpt-6-sol", "gpt-6-luna", "gpt-6-astra"]) {
      expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: id })).toBe("medium");
      expect(supportsGrowthCircleXHighThinking({ modelId: id })).toBe(true);
    }
  });

  it("AC-ALW-001: adds the growthcircle/* wildcard for every tier", () => {
    expect(GROWTHCIRCLE_WILDCARD_MODEL_REF).toBe("growthcircle/*");
    for (const tier of ["free", "paid", "team"] as const) {
      const config = applyGrowthCircleDefaultsForTier({}, tier);
      expect(config.agents?.defaults?.models).toHaveProperty("growthcircle/*", {});
      expect(Object.keys(config.agents?.defaults?.models ?? {})).toEqual(
        expect.arrayContaining(growthCircleModelRefsForTier(tier)),
      );
    }
  });

  it("AC-ALW-002: replaces a retired team primary and drops retired fallbacks", () => {
    const config = applyGrowthCircleDefaultsForTier(
      {
        agents: {
          defaults: {
            model: { primary: "growthcircle/gpt-5.5", fallbacks: ["growthcircle/gpt-5.4", "growthcircle/gpt-6-luna"] },
            models: { "growthcircle/gpt-5.5": {}, "growthcircle/gpt-5.4-mini": {}, "growthcircle/gpt-5.6": {} },
          },
        },
      } as never,
      "team",
    );
    expect(config.agents?.defaults?.model).toEqual({
      primary: "growthcircle/gpt-6.1-sol",
      fallbacks: ["growthcircle/gpt-6-luna"],
    });
    const allowlist = Object.keys(config.agents?.defaults?.models ?? {});
    for (const retired of ["gpt-5.5", "gpt-5.4-mini", "gpt-5.6"]) {
      expect(allowlist).not.toContain(`growthcircle/${retired}`);
    }
  });

  it("only cleans bare gpt-5.6 and gpt-5.3-codex for paid keys", () => {
    const config = applyGrowthCircleDefaultsForTier(
      {
        agents: {
          defaults: {
            model: { fallbacks: ["growthcircle/gpt-5.5", "growthcircle/gpt-5.6", "growthcircle/gpt-5.3-codex"] },
            models: { "growthcircle/gpt-5.6": {}, "growthcircle/gpt-5.3-codex": {} },
          },
        },
      } as never,
      "paid",
    );
    expect(config.agents?.defaults?.model).toEqual({
      primary: DEFAULT_MODEL_REF,
      fallbacks: ["growthcircle/gpt-5.5"],
    });
    const allowlist = Object.keys(config.agents?.defaults?.models ?? {});
    expect(allowlist).toContain("growthcircle/gpt-5.5");
    expect(allowlist).not.toContain("growthcircle/gpt-5.6");
    expect(allowlist).not.toContain("growthcircle/gpt-5.3-codex");
  });

  it("AC-ALW-003: leaves other providers' refs unchanged and in order", () => {
    const config = applyGrowthCircleDefaultsForTier(
      {
        agents: {
          defaults: {
            model: {
              primary: "growthcircle/gpt-5.5",
              fallbacks: ["google/gemini-3-pro", "growthcircle/gpt-5.5", "openai/gpt-5.5", "anthropic/claude-opus-4-6"],
            },
            models: { "google/gemini-3-pro": { alias: "G" }, "openai/gpt-5.5": {} },
          },
        },
      } as never,
      "team",
    );
    expect(config.agents?.defaults?.model).toEqual({
      primary: "growthcircle/gpt-6.1-sol",
      fallbacks: ["google/gemini-3-pro", "openai/gpt-5.5", "anthropic/claude-opus-4-6"],
    });
    expect(config.agents?.defaults?.models?.["google/gemini-3-pro"]).toEqual({ alias: "G" });
    expect(config.agents?.defaults?.models).toHaveProperty("openai/gpt-5.5");
  });

  it("AC-ALW-004: applying defaults twice is idempotent", () => {
    for (const tier of ["free", "paid", "team"] as const) {
      const once = applyGrowthCircleDefaultsForTier(
        {
          agents: {
            defaults: { model: { primary: "growthcircle/gpt-5.5", fallbacks: ["growthcircle/gpt-5.4", "google/x"] } },
          },
        } as never,
        tier,
      );
      expect(applyGrowthCircleDefaultsForTier(once, tier)).toEqual(once);
    }
  });

  it("exposes medium as the GrowthCircle reasoning default", () => {
    expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: "gpt-5.6-sol" })).toBe("medium");
    expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: "gpt-5.5" })).toBe("medium");
    expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: "custom", reasoning: true })).toBe("medium");
    expect(resolveGrowthCircleDefaultThinkingLevel({ modelId: "custom", reasoning: false })).toBeNull();
    expect(supportsGrowthCircleXHighThinking({ modelId: "gpt-5.6-sol" })).toBe(true);
    expect(supportsGrowthCircleXHighThinking({ modelId: "gpt-5.5" })).toBe(true);
    expect(resolveGrowthCircleThinkingProfile({ modelId: "gpt-5.6-sol" })).toEqual({
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
