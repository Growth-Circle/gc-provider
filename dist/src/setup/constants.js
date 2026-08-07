import { BASE_URL, ENV_VAR, PROVIDER_ID, PROVIDER_LABEL } from "../provider.js";
export { BASE_URL, ENV_VAR, PROVIDER_ID, PROVIDER_LABEL };
/**
 * Anthropic Messages endpoint. Clients that speak the Anthropic wire format
 * (Claude Code) append `/v1/messages` to this, giving
 * `https://ai.growthcircle.id/anthropic/v1/messages`.
 */
export const ANTHROPIC_BASE_URL = "https://ai.growthcircle.id/anthropic";
/** Banner written into files gc-provider owns outright. */
export const MANAGED_HEADER = "Managed by gc-provider. Regenerate: npx gc-provider setup";
export const CONTEXT_WINDOW = 256_000;
export const MAX_OUTPUT_TOKENS = 36_000;
/**
 * Vision support, by family. GrowthCircle's GPT-5.x, Claude and Gemini models
 * accept images; the rest are text-only. Declaring vision on a text-only model
 * turns an attached image into a runtime API error, so this stays conservative.
 */
export function supportsImages(modelId) {
    const id = modelId.toLowerCase();
    return id.startsWith("gpt-5.") || id.startsWith("claude-") || id.startsWith("gemini-");
}
/** Turns `gpt-5.6` into `GPT-5.6`, `claude-sonnet-4-6` into `Claude Sonnet 4 6`. */
export function displayNameForModel(modelId) {
    const free = modelId.endsWith("-free");
    const base = free ? modelId.slice(0, -"-free".length) : modelId;
    const pretty = base
        .split("-")
        .map((part) => (/^gpt$/iu.test(part) ? "GPT" : /^\d/u.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join(" ");
    return free ? `${pretty} (Free)` : pretty;
}
