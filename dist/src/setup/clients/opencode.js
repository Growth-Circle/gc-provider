import { join } from "node:path";
import { BASE_URL, CONTEXT_WINDOW, ENV_VAR, MAX_OUTPUT_TOKENS, PROVIDER_ID, PROVIDER_LABEL, displayNameForModel, } from "../constants.js";
import { getJsoncIn, isUnparseableJsonc, removeJsoncIn, setJsoncIn } from "../edit/jsonc.js";
export function opencodeConfigPath(ctx) {
    const xdg = process.env.XDG_CONFIG_HOME?.trim();
    return join(xdg && xdg.length > 0 ? xdg : join(ctx.home, ".config"), "opencode", "opencode.json");
}
function buildModels(ctx) {
    const models = {};
    for (const modelId of ctx.catalog.modelIds) {
        models[modelId] = {
            name: displayNameForModel(modelId),
            limit: { context: CONTEXT_WINDOW, output: MAX_OUTPUT_TOKENS },
        };
    }
    return models;
}
export const opencodeAdapter = {
    id: "opencode",
    label: "opencode",
    detect: (ctx, probe) => probe.exists(join(ctx.home, ".config", "opencode")) ||
        probe.exists(join(ctx.home, ".opencode")) ||
        probe.hasBinary("opencode"),
    usage: (ctx) => [
        "opencode",
        `Pick the model with  /models  and choose ${PROVIDER_ID}/${ctx.catalog.defaultModelId}.`,
    ],
    install: (ctx, read) => {
        const path = opencodeConfigPath(ctx);
        const before = read(path);
        if (isUnparseableJsonc(before)) {
            return [{ path, before, after: null, summary: [], blocked: "opencode.json is not valid JSON" }];
        }
        const base = ["provider", PROVIDER_ID];
        let text = before;
        if (getJsoncIn(text, ["$schema"]) === undefined) {
            text = setJsoncIn(text, ["$schema"], "https://opencode.ai/config.json");
        }
        text = setJsoncIn(text, [...base, "npm"], "@ai-sdk/openai-compatible");
        text = setJsoncIn(text, [...base, "name"], PROVIDER_LABEL);
        // `{env:VAR}` keeps the key in the environment rather than on disk.
        text = setJsoncIn(text, [...base, "options"], {
            baseURL: BASE_URL,
            apiKey: `{env:${ENV_VAR}}`,
        });
        text = setJsoncIn(text, [...base, "models"], buildModels(ctx));
        if (before === text)
            return [];
        return [
            {
                path,
                before,
                after: text,
                summary: [
                    `provider.${PROVIDER_ID}.npm -> @ai-sdk/openai-compatible`,
                    `options.baseURL -> ${BASE_URL}`,
                    `options.apiKey -> {env:${ENV_VAR}}`,
                    `models -> ${ctx.catalog.modelIds.length} model(s)`,
                ],
            },
        ];
    },
    uninstall: (ctx, read) => {
        const path = opencodeConfigPath(ctx);
        const before = read(path);
        if (before === null || isUnparseableJsonc(before))
            return [];
        const base = ["provider", PROVIDER_ID];
        if (getJsoncIn(before, base) === undefined)
            return [];
        const after = removeJsoncIn(before, base);
        if (after === before)
            return [];
        return [{ path, before, after, summary: [`remove provider.${PROVIDER_ID}`] }];
    },
};
