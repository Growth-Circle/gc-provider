import {
  DEFAULT_FREE_MODEL_ID,
  DEFAULT_MODEL_ID,
  FREE_TEXT_MODEL_IDS_WITH_SUFFIX,
  PAID_TEXT_MODEL_IDS,
  TEAM_TEXT_MODEL_IDS,
  fetchGrowthCircleModels,
  isGrowthCircleApiKeyForTier,
  type GrowthCircleKeyTier,
} from "../provider.js";
import type { GrowthCircleCatalog } from "./types.js";

const TIERS: readonly GrowthCircleKeyTier[] = ["free", "paid", "team"];

/** Reads the tier from the key prefix (gc-free-/gc-paid-/gc-team-). */
export function resolveGrowthCircleTier(apiKey: string | undefined): GrowthCircleKeyTier | null {
  if (!apiKey) return null;
  return TIERS.find((tier) => isGrowthCircleApiKeyForTier(apiKey, tier)) ?? null;
}

export function staticModelIdsForTier(tier: GrowthCircleKeyTier): string[] {
  if (tier === "free") return [...FREE_TEXT_MODEL_IDS_WITH_SUFFIX];
  if (tier === "team") return [...TEAM_TEXT_MODEL_IDS];
  return [...PAID_TEXT_MODEL_IDS];
}

export function defaultModelIdForTier(tier: GrowthCircleKeyTier): string {
  return tier === "free" ? DEFAULT_FREE_MODEL_ID : DEFAULT_MODEL_ID;
}

/**
 * Picks the model each client should default to.
 *
 * Live catalogs are authoritative but may not contain the tier default (a key
 * can be scoped), so fall back to the first available id rather than writing a
 * model the key cannot call.
 */
export function pickDefaultModelId(modelIds: string[], tier: GrowthCircleKeyTier): string {
  const preferred = defaultModelIdForTier(tier);
  if (modelIds.includes(preferred)) return preferred;
  return modelIds[0] ?? preferred;
}

/**
 * Compares the numbers embedded in a model id, so `claude-sonnet-4-6` sorts
 * above `claude-sonnet-4-5-20250929`. Catalog order is not dependable — a live
 * catalog can return anything — so newest is computed, not assumed.
 */
export function compareModelRecency(a: string, b: string): number {
  const left = a.match(/\d+/gu)?.map(Number) ?? [];
  const right = b.match(/\d+/gu)?.map(Number) ?? [];
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? -1) - (right[i] ?? -1);
    if (diff !== 0) return diff;
  }
  return 0;
}

function newestMatching(modelIds: string[], keyword: string): string | null {
  const matches = modelIds.filter((id) => id.toLowerCase().includes(keyword));
  if (matches.length === 0) return null;
  return [...matches].sort(compareModelRecency).pop() ?? null;
}

/** Claude models only, with "-thinking" variants dropped when alternatives exist. */
function claudePool(modelIds: string[]): string[] {
  const claude = modelIds.filter((id) => id.toLowerCase().startsWith("claude-"));
  const plain = claude.filter((id) => !id.toLowerCase().includes("thinking"));
  return plain.length > 0 ? plain : claude;
}

/**
 * Anthropic Messages requires a Claude model id. Prefer the newest Sonnet, then
 * the newest Claude of any size.
 */
export function pickAnthropicModelId(modelIds: string[]): string | null {
  const pool = claudePool(modelIds);
  if (pool.length === 0) return null;
  return newestMatching(pool, "sonnet") ?? [...pool].sort(compareModelRecency).pop() ?? null;
}

/** Newest Haiku-class model for background calls, falling back to the main pick. */
export function pickAnthropicSmallModelId(modelIds: string[]): string | null {
  const pool = claudePool(modelIds);
  if (pool.length === 0) return null;
  return newestMatching(pool, "haiku") ?? pickAnthropicModelId(modelIds);
}

export function buildCatalogFromModelIds(params: {
  modelIds: string[];
  tier: GrowthCircleKeyTier;
  source: GrowthCircleCatalog["source"];
  fallbackReason?: string;
}): GrowthCircleCatalog {
  const modelIds = Array.from(new Set(params.modelIds)).filter((id) => id.trim().length > 0);
  return {
    tier: params.tier,
    source: params.source,
    ...(params.fallbackReason ? { fallbackReason: params.fallbackReason } : {}),
    modelIds,
    defaultModelId: pickDefaultModelId(modelIds, params.tier),
    anthropicModelId: pickAnthropicModelId(modelIds),
    anthropicSmallModelId: pickAnthropicSmallModelId(modelIds),
  };
}

export type ResolveCatalogOptions = {
  apiKey?: string;
  /** Forces a tier instead of deriving it from the key prefix. */
  tier?: GrowthCircleKeyTier;
  /** Skips the live /models call entirely. */
  offline?: boolean;
  fetchModels?: typeof fetchGrowthCircleModels;
};

/**
 * Live catalog when a key is available, static tier list otherwise.
 *
 * A setup command must never hard-fail because the network is down, so every
 * failure path degrades to the bundled list and records why.
 */
export async function resolveCatalog(options: ResolveCatalogOptions = {}): Promise<GrowthCircleCatalog> {
  const apiKey = options.apiKey?.trim();
  const detectedTier = resolveGrowthCircleTier(apiKey);
  const tier = options.tier ?? detectedTier ?? "paid";

  const staticCatalog = (reason: string): GrowthCircleCatalog =>
    buildCatalogFromModelIds({
      modelIds: staticModelIdsForTier(tier),
      tier,
      source: "static",
      fallbackReason: reason,
    });

  if (!apiKey) return staticCatalog(`${"GROWTHCIRCLE_API_KEY"} is not set`);
  if (options.offline) return staticCatalog("--offline was requested");

  try {
    const fetchModels = options.fetchModels ?? fetchGrowthCircleModels;
    const models = await fetchModels({ apiKey });
    const modelIds = models.map((model) => model.id);
    if (modelIds.length === 0) return staticCatalog("GrowthCircle.id returned an empty model list");
    return buildCatalogFromModelIds({ modelIds, tier, source: "live" });
  } catch (error) {
    return staticCatalog(`live model lookup failed (${describeError(error)})`);
  }
}

/** Error text safe to print: never includes the key, always bounded. */
function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/gc-(free|paid|team)-[A-Za-z0-9_-]+/gu, "gc-***").slice(0, 160);
}
