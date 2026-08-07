import { join } from "node:path";
import { BASE_URL, CONTEXT_WINDOW, ENV_VAR, MAX_OUTPUT_TOKENS, PROVIDER_ID, PROVIDER_LABEL, displayNameForModel, } from "../constants.js";
import { getJsoncIn, isUnparseableJsonc, removeJsoncIn, setJsoncIn } from "../edit/jsonc.js";
/**
 * Written to the global config on purpose: Kilo only resolves `{env:VAR}` in
 * trusted locations, and a project-level kilo.json would leave the key
 * unresolved.
 */
export function kiloConfigPath(ctx) {
    const xdg = process.env.XDG_CONFIG_HOME?.trim();
    return join(xdg && xdg.length > 0 ? xdg : join(ctx.home, ".config"), "kilo", "kilo.json");
}
function buildModels(ctx) {
    const models = {};
    for (const modelId of ctx.catalog.modelIds) {
        models[modelId] = {
            name: displayNameForModel(modelId),
            tool_call: true,
            limit: { context: CONTEXT_WINDOW, output: MAX_OUTPUT_TOKENS },
        };
    }
    return models;
}
export const kiloAdapter = {
    id: "kilo",
    label: "Kilo Code",
    detect: (ctx, probe) => probe.exists(join(ctx.home, ".config", "kilo")) || probe.hasBinary("kilo"),
    usage: (ctx) => [
        `Select ${PROVIDER_ID}/${ctx.catalog.defaultModelId} in the Kilo model picker.`,
    ],
    install: (ctx, read) => {
        const path = kiloConfigPath(ctx);
        const before = read(path);
        if (isUnparseableJsonc(before)) {
            return [{ path, before, after: null, summary: [], blocked: "kilo.json is not valid JSON" }];
        }
        const base = ["provider", PROVIDER_ID];
        let text = before;
        if (getJsoncIn(text, ["$schema"]) === undefined) {
            text = setJsoncIn(text, ["$schema"], "https://app.kilo.ai/config.json");
        }
        text = setJsoncIn(text, [...base, "name"], PROVIDER_LABEL);
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
                    `provider.${PROVIDER_ID}.options.baseURL -> ${BASE_URL}`,
                    `options.apiKey -> {env:${ENV_VAR}}`,
                    `models -> ${ctx.catalog.modelIds.length} model(s)`,
                ],
            },
        ];
    },
    uninstall: (ctx, read) => {
        const path = kiloConfigPath(ctx);
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
