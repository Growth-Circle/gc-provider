import { join } from "node:path";
import { BASE_URL, ENV_VAR, MAX_OUTPUT_TOKENS, PROVIDER_ID } from "../constants.js";
import { getYamlIn, isUnparseableYaml, removeYamlInPruningParent, setYamlIn, } from "../edit/yaml.js";
export const MODEL_ENTRY = "growthcircle_model";
/** trae-agent reads trae_config.yaml from the working directory. */
export function traeConfigPath(ctx) {
    return join(ctx.cwd, "trae_config.yaml");
}
export const traeAgentAdapter = {
    id: "trae-agent",
    label: "Trae Agent (CLI)",
    detect: (ctx, probe) => probe.exists(traeConfigPath(ctx)) || probe.hasBinary("trae-cli"),
    usage: () => [
        `trae-cli run --model ${MODEL_ENTRY} "your task"`,
        "Written to ./trae_config.yaml, so run gc-provider setup inside each project.",
    ],
    /**
     * trae-agent derives its credential variable from the `provider` field:
     * `provider.upper() + "_API_KEY"` (utils/config.py). With `provider: openai`
     * that is OPENAI_API_KEY, and env beats the file (CLI > ENV > config), which
     * is why api_key stays empty here.
     *
     * The same rule applies to OPENAI_BASE_URL: if it is already exported for a
     * different service it will silently override the base_url written below.
     */
    extraEnv: () => [
        {
            name: "OPENAI_API_KEY",
            value: `$${ENV_VAR}`,
            note: "Trae Agent derives this name from provider: openai. It overrides the empty api_key in the file.",
        },
    ],
    install: (ctx, read) => {
        const path = traeConfigPath(ctx);
        const before = read(path);
        if (isUnparseableYaml(before)) {
            return [{ path, before, after: null, summary: [], blocked: "trae_config.yaml is not valid YAML" }];
        }
        let text = before;
        text = setYamlIn(text, ["model_providers", PROVIDER_ID], {
            provider: "openai",
            base_url: BASE_URL,
            api_key: "",
        });
        text = setYamlIn(text, ["models", MODEL_ENTRY], {
            model_provider: PROVIDER_ID,
            model: ctx.catalog.defaultModelId,
            max_tokens: MAX_OUTPUT_TOKENS,
            temperature: 0.5,
            max_retries: 10,
            parallel_tool_calls: true,
        });
        if (before === text)
            return [];
        return [
            {
                path,
                before,
                after: text,
                summary: [
                    `model_providers.${PROVIDER_ID}.base_url -> ${BASE_URL}`,
                    `models.${MODEL_ENTRY}.model -> ${ctx.catalog.defaultModelId}`,
                    `api_key left empty; key comes from $OPENAI_API_KEY`,
                ],
            },
        ];
    },
    uninstall: (ctx, read) => {
        const path = traeConfigPath(ctx);
        const before = read(path);
        if (before === null || isUnparseableYaml(before))
            return [];
        let text = before;
        const removed = [];
        if (getYamlIn(text, ["model_providers", PROVIDER_ID]) !== undefined) {
            text = removeYamlInPruningParent(text, ["model_providers", PROVIDER_ID]);
            removed.push(`model_providers.${PROVIDER_ID}`);
        }
        if (getYamlIn(text, ["models", MODEL_ENTRY]) !== undefined) {
            text = removeYamlInPruningParent(text, ["models", MODEL_ENTRY]);
            removed.push(`models.${MODEL_ENTRY}`);
        }
        if (removed.length === 0)
            return [];
        return [{ path, before, after: text, summary: removed.map((key) => `remove ${key}`) }];
    },
};
