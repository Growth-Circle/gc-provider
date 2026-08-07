import { join } from "node:path";
import { BASE_URL, CONTEXT_WINDOW, MAX_OUTPUT_TOKENS, PROVIDER_ID, displayNameForModel, supportsImages, } from "../constants.js";
import { getJsoncIn, isUnparseableJsonc, removeJsoncIn, setJsoncIn } from "../edit/jsonc.js";
export function zedConfigDir(ctx) {
    const xdg = process.env.XDG_CONFIG_HOME?.trim();
    return join(xdg && xdg.length > 0 ? xdg : join(ctx.home, ".config"), "zed");
}
export function zedSettingsPath(ctx) {
    return join(zedConfigDir(ctx), "settings.json");
}
function buildAvailableModels(ctx) {
    return ctx.catalog.modelIds.map((modelId) => ({
        name: modelId,
        display_name: displayNameForModel(modelId),
        max_tokens: CONTEXT_WINDOW,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        capabilities: {
            tools: true,
            images: supportsImages(modelId),
        },
    }));
}
export const zedAdapter = {
    id: "zed",
    label: "Zed",
    detect: (ctx, probe) => probe.exists(zedConfigDir(ctx)) || probe.hasBinary("zed"),
    // Zed keeps provider credentials in the OS keychain, never in settings.json,
    // so the key has to be pasted once in the UI. Nothing gc-provider writes can
    // remove that step.
    usage: () => [
        "Open Zed, run  agent: open settings,  pick GrowthCircle.id and paste the API key once.",
        "Zed stores that key in your system keychain, not in settings.json.",
    ],
    install: (ctx, read) => {
        const path = zedSettingsPath(ctx);
        const before = read(path);
        if (isUnparseableJsonc(before)) {
            return [{ path, before, after: null, summary: [], blocked: "settings.json is not valid JSON" }];
        }
        const base = ["language_models", "openai_compatible", PROVIDER_ID];
        let text = before;
        text = setJsoncIn(text, [...base, "api_url"], BASE_URL);
        text = setJsoncIn(text, [...base, "available_models"], buildAvailableModels(ctx));
        if (before === text)
            return [];
        return [
            {
                path,
                before,
                after: text,
                summary: [
                    `language_models.openai_compatible.${PROVIDER_ID}.api_url -> ${BASE_URL}`,
                    `available_models -> ${ctx.catalog.modelIds.length} model(s)`,
                ],
            },
        ];
    },
    uninstall: (ctx, read) => {
        const path = zedSettingsPath(ctx);
        const before = read(path);
        if (before === null || isUnparseableJsonc(before))
            return [];
        const base = ["language_models", "openai_compatible", PROVIDER_ID];
        if (getJsoncIn(before, base) === undefined)
            return [];
        const after = removeJsoncIn(before, base);
        if (after === before)
            return [];
        return [
            {
                path,
                before,
                after,
                summary: [`remove language_models.openai_compatible.${PROVIDER_ID}`],
            },
        ];
    },
};
