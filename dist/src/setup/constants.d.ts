import { BASE_URL, ENV_VAR, PROVIDER_ID, PROVIDER_LABEL } from "../provider.js";
export { BASE_URL, ENV_VAR, PROVIDER_ID, PROVIDER_LABEL };
/**
 * Anthropic Messages endpoint. Clients that speak the Anthropic wire format
 * (Claude Code) append `/v1/messages` to this, giving
 * `https://ai.growthcircle.id/anthropic/v1/messages`.
 */
export declare const ANTHROPIC_BASE_URL = "https://ai.growthcircle.id/anthropic";
/** Banner written into files gc-provider owns outright. */
export declare const MANAGED_HEADER = "Managed by gc-provider. Regenerate: npx gc-provider setup";
export declare const CONTEXT_WINDOW = 256000;
export declare const MAX_OUTPUT_TOKENS = 36000;
/**
 * Vision support, by family. GrowthCircle's GPT-5.x, Claude and Gemini models
 * accept images; the rest are text-only. Declaring vision on a text-only model
 * turns an attached image into a runtime API error, so this stays conservative.
 */
export declare function supportsImages(modelId: string): boolean;
/** Turns `gpt-5.6` into `GPT-5.6`, `claude-sonnet-4-6` into `Claude Sonnet 4 6`. */
export declare function displayNameForModel(modelId: string): string;
