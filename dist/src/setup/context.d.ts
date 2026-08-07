import { fetchGrowthCircleModels, type GrowthCircleKeyTier } from "../provider.js";
import type { GrowthCircleCatalog } from "./types.js";
/** Reads the tier from the key prefix (gc-free-/gc-paid-/gc-team-). */
export declare function resolveGrowthCircleTier(apiKey: string | undefined): GrowthCircleKeyTier | null;
export declare function staticModelIdsForTier(tier: GrowthCircleKeyTier): string[];
export declare function defaultModelIdForTier(tier: GrowthCircleKeyTier): string;
/**
 * Picks the model each client should default to.
 *
 * Live catalogs are authoritative but may not contain the tier default (a key
 * can be scoped), so fall back to the first available id rather than writing a
 * model the key cannot call.
 */
export declare function pickDefaultModelId(modelIds: string[], tier: GrowthCircleKeyTier): string;
/**
 * Compares the numbers embedded in a model id, so `claude-sonnet-4-6` sorts
 * above `claude-sonnet-4-5-20250929`. Catalog order is not dependable — a live
 * catalog can return anything — so newest is computed, not assumed.
 */
export declare function compareModelRecency(a: string, b: string): number;
/**
 * Anthropic Messages requires a Claude model id. Prefer the newest Sonnet, then
 * the newest Claude of any size.
 */
export declare function pickAnthropicModelId(modelIds: string[]): string | null;
/** Newest Haiku-class model for background calls, falling back to the main pick. */
export declare function pickAnthropicSmallModelId(modelIds: string[]): string | null;
export declare function buildCatalogFromModelIds(params: {
    modelIds: string[];
    tier: GrowthCircleKeyTier;
    source: GrowthCircleCatalog["source"];
    fallbackReason?: string;
}): GrowthCircleCatalog;
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
export declare function resolveCatalog(options?: ResolveCatalogOptions): Promise<GrowthCircleCatalog>;
