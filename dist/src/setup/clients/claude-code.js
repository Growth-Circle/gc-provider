import { join } from "node:path";
import { ANTHROPIC_BASE_URL, ENV_VAR } from "../constants.js";
import { getJsoncIn, isUnparseableJsonc, removeJsoncIn, setJsoncIn } from "../edit/jsonc.js";
const KEYS = ["ANTHROPIC_BASE_URL", "ANTHROPIC_MODEL", "ANTHROPIC_SMALL_FAST_MODEL"];
export function claudeSettingsPath(ctx) {
    return join(ctx.home, ".claude", "settings.json");
}
export const claudeCodeAdapter = {
    id: "claude-code",
    label: "Claude Code",
    detect: (ctx, probe) => probe.exists(join(ctx.home, ".claude")) || probe.hasBinary("claude"),
    usage: () => ["claude", "Verify the endpoint with  /status  inside Claude Code."],
    // Claude Code speaks the Anthropic Messages wire format and reads its
    // credential from ANTHROPIC_AUTH_TOKEN. settings.json `env` values are
    // literal strings with no interpolation, so the token cannot be aliased here
    // and has to be exported by the user.
    extraEnv: () => [
        {
            name: "ANTHROPIC_AUTH_TOKEN",
            value: `$${ENV_VAR}`,
            note: "Claude Code reads its key from this variable, not GROWTHCIRCLE_API_KEY.",
        },
    ],
    install: (ctx, read) => {
        const path = claudeSettingsPath(ctx);
        const before = read(path);
        if (isUnparseableJsonc(before)) {
            return [{ path, before, after: null, summary: [], blocked: "settings.json is not valid JSON" }];
        }
        const { anthropicModelId, anthropicSmallModelId } = ctx.catalog;
        if (!anthropicModelId) {
            return [
                {
                    path,
                    before,
                    after: null,
                    summary: [],
                    blocked: `no Claude model available on the ${ctx.catalog.tier} tier`,
                },
            ];
        }
        let text = before;
        text = setJsoncIn(text, ["env", "ANTHROPIC_BASE_URL"], ANTHROPIC_BASE_URL);
        text = setJsoncIn(text, ["env", "ANTHROPIC_MODEL"], anthropicModelId);
        if (anthropicSmallModelId) {
            text = setJsoncIn(text, ["env", "ANTHROPIC_SMALL_FAST_MODEL"], anthropicSmallModelId);
        }
        if (before === text)
            return [];
        return [
            {
                path,
                before,
                after: text,
                summary: [
                    `env.ANTHROPIC_BASE_URL -> ${ANTHROPIC_BASE_URL}`,
                    `env.ANTHROPIC_MODEL -> ${anthropicModelId}`,
                    ...(anthropicSmallModelId ? [`env.ANTHROPIC_SMALL_FAST_MODEL -> ${anthropicSmallModelId}`] : []),
                ],
            },
        ];
    },
    uninstall: (ctx, read) => {
        const path = claudeSettingsPath(ctx);
        const before = read(path);
        if (before === null || isUnparseableJsonc(before))
            return [];
        let text = before;
        const removed = [];
        for (const key of KEYS) {
            if (getJsoncIn(text, ["env", key]) === undefined)
                continue;
            text = removeJsoncIn(text, ["env", key]);
            removed.push(`env.${key}`);
        }
        if (removed.length === 0)
            return [];
        return [{ path, before, after: text, summary: removed.map((key) => `remove ${key}`) }];
    },
};
