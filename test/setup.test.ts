import { beforeEach, describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import {
  buildCatalogFromModelIds,
  compareModelRecency,
  pickAnthropicModelId,
  pickAnthropicSmallModelId,
  pickDefaultModelId,
  resolveCatalog,
  resolveGrowthCircleTier,
  staticModelIdsForTier,
} from "../src/setup/context.js";
import { detectIndent, getJsoncIn, isUnparseableJsonc, removeJsoncIn, setJsoncIn } from "../src/setup/edit/jsonc.js";
import {
  detectYamlIndent,
  getYamlIn,
  isUnparseableYaml,
  removeYamlInPruningParent,
  setYamlIn,
} from "../src/setup/edit/yaml.js";
import { renderDiff } from "../src/setup/diff.js";
import { ADAPTERS, MANUAL_CLIENTS, findAdapter } from "../src/setup/registry.js";
import { claudeCodeAdapter, claudeSettingsPath } from "../src/setup/clients/claude-code.js";
import { codexAdapter, codexProfilePath } from "../src/setup/clients/codex.js";
import { kiloAdapter, kiloConfigPath } from "../src/setup/clients/kilo.js";
import { opencodeAdapter, opencodeConfigPath } from "../src/setup/clients/opencode.js";
import { traeAgentAdapter, traeConfigPath } from "../src/setup/clients/trae-agent.js";
import { zedAdapter, zedSettingsPath } from "../src/setup/clients/zed.js";
import type { ReadFile, SetupContext } from "../src/setup/types.js";
import { ANTHROPIC_BASE_URL } from "../src/setup/constants.js";
import { BASE_URL, ENV_VAR } from "../src/provider.js";

const HOME = "/tmp/gc-test-home";
const CWD = "/tmp/gc-test-project";

function makeContext(overrides: Partial<SetupContext["catalog"]> = {}): SetupContext {
  return {
    home: HOME,
    cwd: CWD,
    catalog: {
      tier: "paid",
      source: "static",
      modelIds: ["gpt-5.6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
      defaultModelId: "gpt-5.6",
      anthropicModelId: "claude-sonnet-4-6",
      anthropicSmallModelId: "claude-haiku-4-5-20251001",
      ...overrides,
    },
  };
}

/** Fake filesystem: adapters are pure, so a map is all the disk they need. */
function reader(files: Record<string, string> = {}): ReadFile {
  return (path: string) => files[path] ?? null;
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("XDG_CONFIG_HOME", "");
  vi.stubEnv("CODEX_HOME", "");
});

describe("tier resolution", () => {
  it("reads the tier from the key prefix", () => {
    expect(resolveGrowthCircleTier("gc-free-abc")).toBe("free");
    expect(resolveGrowthCircleTier("gc-paid-abc")).toBe("paid");
    expect(resolveGrowthCircleTier("gc-team-abc")).toBe("team");
  });

  it("returns null for unknown or missing keys", () => {
    expect(resolveGrowthCircleTier(undefined)).toBeNull();
    expect(resolveGrowthCircleTier("sk-something-else")).toBeNull();
  });

  it("gives free-tier ids the -free suffix", () => {
    expect(staticModelIdsForTier("free").every((id) => id.endsWith("-free"))).toBe(true);
    expect(staticModelIdsForTier("paid").some((id) => id.endsWith("-free"))).toBe(false);
  });
});

describe("model selection", () => {
  it("orders by embedded version numbers, not list position", () => {
    expect(compareModelRecency("claude-sonnet-4-6", "claude-sonnet-4-5-20250929")).toBeGreaterThan(0);
    expect(compareModelRecency("claude-opus-4-7", "claude-opus-4-6")).toBeGreaterThan(0);
    expect(compareModelRecency("gpt-5.6", "gpt-5.6")).toBe(0);
  });

  it("picks the newest Sonnet even when an older one comes first", () => {
    const ids = ["claude-sonnet-4-5-20250929", "claude-sonnet-4-5-20250929-thinking", "claude-sonnet-4-6"];
    expect(pickAnthropicModelId(ids)).toBe("claude-sonnet-4-6");
  });

  it("skips -thinking variants when a plain model exists", () => {
    expect(pickAnthropicModelId(["claude-sonnet-4-6-thinking", "claude-sonnet-4-6"])).toBe("claude-sonnet-4-6");
  });

  it("falls back to a thinking variant when it is the only option", () => {
    expect(pickAnthropicModelId(["claude-opus-4-6-thinking"])).toBe("claude-opus-4-6-thinking");
  });

  it("prefers the newest Haiku for the small model slot", () => {
    const ids = ["claude-3-5-haiku-latest", "claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
    expect(pickAnthropicSmallModelId(ids)).toBe("claude-haiku-4-5-20251001");
  });

  it("returns null when the tier has no Claude models", () => {
    expect(pickAnthropicModelId(["gpt-5.6", "gemini-2.5-pro"])).toBeNull();
    expect(pickAnthropicSmallModelId(["gpt-5.6"])).toBeNull();
  });

  it("falls back to the first available id when the tier default is absent", () => {
    expect(pickDefaultModelId(["glm-5"], "paid")).toBe("glm-5");
    expect(pickDefaultModelId(["gpt-5.6", "glm-5"], "paid")).toBe("gpt-5.6");
  });
});

describe("catalog resolution", () => {
  it("uses the bundled list when no key is set", async () => {
    const catalog = await resolveCatalog({});
    expect(catalog.source).toBe("static");
    expect(catalog.fallbackReason).toContain(ENV_VAR);
    expect(catalog.modelIds.length).toBeGreaterThan(0);
  });

  it("uses the live list when the fetch succeeds", async () => {
    const catalog = await resolveCatalog({
      apiKey: "gc-paid-token",
      fetchModels: async () => [{ id: "only-model" }] as never,
    });
    expect(catalog.source).toBe("live");
    expect(catalog.modelIds).toEqual(["only-model"]);
    expect(catalog.defaultModelId).toBe("only-model");
  });

  it("degrades to the bundled list when the fetch fails", async () => {
    const catalog = await resolveCatalog({
      apiKey: "gc-paid-token",
      fetchModels: async () => {
        throw new Error("network down");
      },
    });
    expect(catalog.source).toBe("static");
    expect(catalog.fallbackReason).toContain("network down");
  });

  it("never leaks the key into the fallback reason", async () => {
    const catalog = await resolveCatalog({
      apiKey: "gc-paid-supersecret",
      fetchModels: async () => {
        throw new Error("bad key gc-paid-supersecret rejected");
      },
    });
    expect(catalog.fallbackReason).not.toContain("supersecret");
    expect(catalog.fallbackReason).toContain("gc-***");
  });

  it("honours an explicit tier over the key prefix", async () => {
    const catalog = await resolveCatalog({ apiKey: "gc-paid-token", tier: "free", offline: true });
    expect(catalog.tier).toBe("free");
    expect(catalog.modelIds.every((id) => id.endsWith("-free"))).toBe(true);
  });

  it("deduplicates ids", () => {
    const catalog = buildCatalogFromModelIds({ modelIds: ["a", "a", "b"], tier: "paid", source: "live" });
    expect(catalog.modelIds).toEqual(["a", "b"]);
  });
});

describe("jsonc editing", () => {
  const withComments = `{
  // keep me
  "theme": "dark",
  "env": { "MINE": "yes" }
}
`;

  it("preserves comments and sibling keys", () => {
    const out = setJsoncIn(withComments, ["env", "ADDED"], "1");
    expect(out).toContain("// keep me");
    expect(out).toContain('"MINE": "yes"');
    expect(getJsoncIn(out, ["env", "ADDED"])).toBe("1");
  });

  it("is idempotent", () => {
    const once = setJsoncIn(withComments, ["env", "ADDED"], "1");
    expect(setJsoncIn(once, ["env", "ADDED"], "1")).toBe(once);
  });

  it("creates a file from nothing", () => {
    const out = setJsoncIn(null, ["a", "b"], 2);
    expect(getJsoncIn(out, ["a", "b"])).toBe(2);
  });

  it("removes a key and leaves the rest alone", () => {
    const out = removeJsoncIn(withComments, ["env", "MINE"]);
    expect(getJsoncIn(out, ["env", "MINE"])).toBeUndefined();
    expect(out).toContain("// keep me");
  });

  it("detects the existing indent width", () => {
    expect(detectIndent('{\n    "a": 1\n}')).toEqual({ tabSize: 4, insertSpaces: true });
    expect(detectIndent('{\n\t"a": 1\n}')).toEqual({ tabSize: 2, insertSpaces: false });
  });

  it("flags broken JSON rather than guessing", () => {
    expect(isUnparseableJsonc('{"a": }')).toBe(true);
    expect(isUnparseableJsonc(withComments)).toBe(false);
    expect(isUnparseableJsonc(null)).toBe(false);
  });
});

describe("yaml editing", () => {
  const source = `# top comment
agents:
    a:
        model: m   # inline comment
models:
    keep_me:
        model: x
`;

  it("preserves comments and indent width", () => {
    const out = setYamlIn(source, ["models", "added"], { model: "y" });
    expect(out).toContain("# top comment");
    expect(out).toContain("# inline comment");
    expect(out).toContain("    a:");
    expect(detectYamlIndent(out)).toBe(4);
  });

  it("prunes the parent map when it becomes empty", () => {
    const one = setYamlIn(null, ["models", "only"], { model: "y" });
    const out = removeYamlInPruningParent(one, ["models", "only"]);
    expect(out).not.toContain("models:");
  });

  it("keeps the parent when siblings remain", () => {
    const out = removeYamlInPruningParent(source, ["models", "keep_me"]);
    expect(getYamlIn(out, ["agents", "a", "model"])).toBe("m");
  });

  it("flags broken YAML rather than guessing", () => {
    expect(isUnparseableYaml("a:\n  - [unclosed\n")).toBe(true);
    expect(isUnparseableYaml(source)).toBe(false);
  });
});

describe("diff rendering", () => {
  it("marks every line as added for a new file", () => {
    expect(renderDiff(null, "a\nb\n")).toEqual(["+ a", "+ b"]);
  });

  it("returns nothing when the content is unchanged", () => {
    expect(renderDiff("same\n", "same\n")).toEqual([]);
  });

  it("collapses untouched regions", () => {
    const before = Array.from({ length: 40 }, (_, i) => `line${i}`).join("\n");
    const after = `${before}\nNEW`;
    const out = renderDiff(before, after);
    expect(out.some((line) => line.startsWith("+ NEW"))).toBe(true);
    expect(out.some((line) => line.includes("tidak disentuh"))).toBe(true);
    expect(out.length).toBeLessThan(12);
  });
});

describe("codex adapter", () => {
  it("writes a standalone profile file, never config.toml", () => {
    const ctx = makeContext();
    const [edit] = codexAdapter.install(ctx, reader());
    expect(edit.path).toBe(join(HOME, ".codex", "growthcircle.config.toml"));
    expect(edit.path).not.toContain("config.toml\0");
    expect(edit.after).toContain('model = "gpt-5.6"');
    expect(edit.after).toContain('model_provider = "growthcircle"');
    expect(edit.after).toContain('wire_api = "responses"');
    expect(edit.after).toContain(`env_key = "${ENV_VAR}"`);
    expect(edit.after).toContain(BASE_URL);
  });

  it("never embeds the key", () => {
    const [edit] = codexAdapter.install(makeContext(), reader());
    expect(edit.after).not.toMatch(/gc-(free|paid|team)-/u);
  });

  it("is idempotent", () => {
    const ctx = makeContext();
    const [edit] = codexAdapter.install(ctx, reader());
    const files = { [codexProfilePath(ctx)]: edit.after as string };
    expect(codexAdapter.install(ctx, reader(files))).toEqual([]);
  });

  it("deletes the profile on uninstall", () => {
    const ctx = makeContext();
    const files = { [codexProfilePath(ctx)]: "anything" };
    const [edit] = codexAdapter.uninstall(ctx, reader(files));
    expect(edit.after).toBeNull();
  });

  it("honours CODEX_HOME", () => {
    vi.stubEnv("CODEX_HOME", "/custom/codex");
    expect(codexProfilePath(makeContext())).toBe("/custom/codex/growthcircle.config.toml");
  });
});

describe("claude-code adapter", () => {
  it("points at the Anthropic Messages base url", () => {
    const ctx = makeContext();
    const [edit] = claudeCodeAdapter.install(ctx, reader());
    expect(getJsoncIn(edit.after, ["env", "ANTHROPIC_BASE_URL"])).toBe(ANTHROPIC_BASE_URL);
    expect(getJsoncIn(edit.after, ["env", "ANTHROPIC_MODEL"])).toBe("claude-sonnet-4-6");
  });

  it("declares the extra env var it needs", () => {
    const extras = claudeCodeAdapter.extraEnv?.(makeContext()) ?? [];
    expect(extras.map((entry) => entry.name)).toContain("ANTHROPIC_AUTH_TOKEN");
    expect(extras[0].value).toBe(`$${ENV_VAR}`);
  });

  it("blocks instead of writing when the tier has no Claude model", () => {
    const ctx = makeContext({ anthropicModelId: null, anthropicSmallModelId: null });
    const [edit] = claudeCodeAdapter.install(ctx, reader());
    expect(edit.blocked).toContain("no Claude model");
    expect(edit.after).toBeNull();
  });

  it("refuses to write over unparseable settings", () => {
    const ctx = makeContext();
    const files = { [claudeSettingsPath(ctx)]: "{ broken" };
    const [edit] = claudeCodeAdapter.install(ctx, reader(files));
    expect(edit.blocked).toBeDefined();
    expect(edit.after).toBeNull();
  });

  it("removes only its own keys on uninstall", () => {
    const ctx = makeContext();
    const [installed] = claudeCodeAdapter.install(ctx, reader({}));
    const seeded = setJsoncIn(installed.after, ["env", "USER_VAR"], "keep");
    const [edit] = claudeCodeAdapter.uninstall(ctx, reader({ [claudeSettingsPath(ctx)]: seeded }));
    expect(getJsoncIn(edit.after, ["env", "USER_VAR"])).toBe("keep");
    expect(getJsoncIn(edit.after, ["env", "ANTHROPIC_BASE_URL"])).toBeUndefined();
  });
});

describe("zed adapter", () => {
  it("writes the openai_compatible provider block", () => {
    const ctx = makeContext();
    const [edit] = zedAdapter.install(ctx, reader());
    const base = ["language_models", "openai_compatible", "growthcircle"];
    expect(getJsoncIn(edit.after, [...base, "api_url"])).toBe(BASE_URL);
    const models = getJsoncIn<Array<Record<string, unknown>>>(edit.after, [...base, "available_models"]);
    expect(models).toHaveLength(3);
    expect(models?.[0]).toMatchObject({ name: "gpt-5.6", max_tokens: 256_000 });
  });

  it("declares vision only for multimodal families", () => {
    const ctx = makeContext({ modelIds: ["gpt-5.6", "deepseek-v4-pro"] });
    const [edit] = zedAdapter.install(ctx, reader());
    const models = getJsoncIn<Array<{ name: string; capabilities: { images: boolean } }>>(edit.after, [
      "language_models",
      "openai_compatible",
      "growthcircle",
      "available_models",
    ]);
    expect(models?.find((m) => m.name === "gpt-5.6")?.capabilities.images).toBe(true);
    expect(models?.find((m) => m.name === "deepseek-v4-pro")?.capabilities.images).toBe(false);
  });

  it("never writes a key into settings.json", () => {
    const [edit] = zedAdapter.install(makeContext(), reader());
    expect(edit.after).not.toContain("api_key");
  });

  it("round-trips uninstall back to the original", () => {
    const ctx = makeContext();
    const original = '{\n  "theme": "One Dark"\n}\n';
    const [installed] = zedAdapter.install(ctx, reader({ [zedSettingsPath(ctx)]: original }));
    const [removed] = zedAdapter.uninstall(ctx, reader({ [zedSettingsPath(ctx)]: installed.after as string }));
    expect(getJsoncIn(removed.after, ["language_models", "openai_compatible", "growthcircle"])).toBeUndefined();
    expect(getJsoncIn(removed.after, ["theme"])).toBe("One Dark");
  });
});

describe("opencode adapter", () => {
  it("references the key by env, never by value", () => {
    const ctx = makeContext();
    const [edit] = opencodeAdapter.install(ctx, reader());
    const options = getJsoncIn<Record<string, string>>(edit.after, ["provider", "growthcircle", "options"]);
    expect(options?.baseURL).toBe(BASE_URL);
    expect(options?.apiKey).toBe(`{env:${ENV_VAR}}`);
  });

  it("uses the openai-compatible ai-sdk package", () => {
    const [edit] = opencodeAdapter.install(makeContext(), reader());
    expect(getJsoncIn(edit.after, ["provider", "growthcircle", "npm"])).toBe("@ai-sdk/openai-compatible");
  });

  it("is idempotent", () => {
    const ctx = makeContext();
    const [edit] = opencodeAdapter.install(ctx, reader());
    const files = { [opencodeConfigPath(ctx)]: edit.after as string };
    expect(opencodeAdapter.install(ctx, reader(files))).toEqual([]);
  });
});

describe("kilo adapter", () => {
  it("writes to the global config so {env:} resolves", () => {
    const ctx = makeContext();
    expect(kiloConfigPath(ctx)).toBe(join(HOME, ".config", "kilo", "kilo.json"));
    const [edit] = kiloAdapter.install(ctx, reader());
    const options = getJsoncIn<Record<string, string>>(edit.after, ["provider", "growthcircle", "options"]);
    expect(options?.apiKey).toBe(`{env:${ENV_VAR}}`);
  });

  it("marks models as tool-capable", () => {
    const [edit] = kiloAdapter.install(makeContext(), reader());
    const models = getJsoncIn<Record<string, { tool_call: boolean }>>(edit.after, [
      "provider",
      "growthcircle",
      "models",
    ]);
    expect(models?.["gpt-5.6"]?.tool_call).toBe(true);
  });
});

describe("trae-agent adapter", () => {
  it("writes to the project directory, not home", () => {
    expect(traeConfigPath(makeContext())).toBe(join(CWD, "trae_config.yaml"));
  });

  it("leaves api_key empty because env wins over the file", () => {
    const ctx = makeContext();
    const [edit] = traeAgentAdapter.install(ctx, reader());
    expect(getYamlIn(edit.after, ["model_providers", "growthcircle", "api_key"])).toBe("");
    expect(getYamlIn(edit.after, ["model_providers", "growthcircle", "provider"])).toBe("openai");
    expect(getYamlIn(edit.after, ["model_providers", "growthcircle", "base_url"])).toBe(BASE_URL);
  });

  it("declares OPENAI_API_KEY, the name trae-agent derives from provider", () => {
    const extras = traeAgentAdapter.extraEnv?.(makeContext()) ?? [];
    expect(extras.map((entry) => entry.name)).toEqual(["OPENAI_API_KEY"]);
  });

  it("keeps unrelated providers on uninstall", () => {
    const ctx = makeContext();
    const original = "model_providers:\n  anthropic:\n    provider: anthropic\n    api_key: mine\n";
    const [installed] = traeAgentAdapter.install(ctx, reader({ [traeConfigPath(ctx)]: original }));
    const [removed] = traeAgentAdapter.uninstall(
      ctx,
      reader({ [traeConfigPath(ctx)]: installed.after as string }),
    );
    expect(getYamlIn(removed.after, ["model_providers", "anthropic", "api_key"])).toBe("mine");
    expect(getYamlIn(removed.after, ["model_providers", "growthcircle"])).toBeUndefined();
    expect(removed.after).not.toContain("models:");
  });
});

describe("registry", () => {
  it("exposes every adapter by id", () => {
    for (const adapter of ADAPTERS) {
      expect(findAdapter(adapter.id)).toBe(adapter);
      expect(findAdapter(adapter.id.toUpperCase())).toBe(adapter);
    }
    expect(findAdapter("nope")).toBeUndefined();
  });

  it("keeps adapter ids unique", () => {
    const ids = ADAPTERS.map((adapter) => adapter.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("documents the clients that cannot be automated", () => {
    const ids = MANUAL_CLIENTS.map((client) => client.id);
    expect(ids).toContain("cursor");
    expect(ids).toContain("kiro");
    expect(MANUAL_CLIENTS.every((client) => client.note.length > 0)).toBe(true);
  });

  it("produces no edits twice in a row for any adapter", () => {
    const ctx = makeContext();
    for (const adapter of ADAPTERS) {
      const edits = adapter.install(ctx, reader());
      const files: Record<string, string> = {};
      for (const edit of edits) {
        if (edit.after !== null) files[edit.path] = edit.after;
      }
      expect(adapter.install(ctx, reader(files))).toEqual([]);
    }
  });

  it("never writes an API key into any generated file", () => {
    const ctx = makeContext();
    for (const adapter of ADAPTERS) {
      for (const edit of adapter.install(ctx, reader())) {
        expect(edit.after ?? "").not.toMatch(/gc-(free|paid|team)-[A-Za-z0-9]/u);
      }
    }
  });
});
