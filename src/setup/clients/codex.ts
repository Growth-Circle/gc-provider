import { join } from "node:path";
import { BASE_URL, ENV_VAR, MANAGED_HEADER, PROVIDER_ID, PROVIDER_LABEL } from "../constants.js";
import type { Adapter, FileEdit, SetupContext } from "../types.js";

export const PROFILE_NAME = "growthcircle";

export function codexHome(ctx: SetupContext): string {
  return process.env.CODEX_HOME?.trim() || join(ctx.home, ".codex");
}

export function codexProfilePath(ctx: SetupContext): string {
  return join(codexHome(ctx), `${PROFILE_NAME}.config.toml`);
}

/**
 * Codex 0.134+ reads `--profile <name>` from a standalone
 * `$CODEX_HOME/<name>.config.toml`, so gc-provider owns that file outright and
 * never edits the user's config.toml. That matters beyond tidiness: TOML
 * top-level keys must precede every table, so appending `model_provider` to an
 * existing config.toml would land it inside whichever table happened to be last.
 */
function renderProfile(ctx: SetupContext): string {
  const { catalog } = ctx;
  return `# ${MANAGED_HEADER}
# Use with: codex --profile ${PROFILE_NAME}
model = "${catalog.defaultModelId}"
model_provider = "${PROVIDER_ID}"

[model_providers.${PROVIDER_ID}]
name = "${PROVIDER_LABEL}"
base_url = "${BASE_URL}"
env_key = "${ENV_VAR}"
wire_api = "responses"
`;
}

export const codexAdapter: Adapter = {
  id: "codex",
  label: "Codex CLI",

  detect: (ctx, probe) => probe.exists(codexHome(ctx)) || probe.hasBinary("codex"),

  usage: () => [
    `codex --profile ${PROFILE_NAME}`,
    `To make it the default, set  model_provider = "${PROVIDER_ID}"  in ~/.codex/config.toml.`,
  ],

  install: (ctx, read): FileEdit[] => {
    const path = codexProfilePath(ctx);
    const before = read(path);
    const after = renderProfile(ctx);
    if (before === after) return [];
    return [
      {
        path,
        before,
        after,
        summary: [
          `profile "${PROFILE_NAME}" -> ${catalogLabel(ctx)}`,
          `wire_api = "responses" (GrowthCircle.id serves /v1/responses)`,
          `key read from $${ENV_VAR}, not stored in this file`,
        ],
      },
    ];
  },

  uninstall: (ctx, read): FileEdit[] => {
    const path = codexProfilePath(ctx);
    const before = read(path);
    if (before === null) return [];
    return [
      {
        path,
        before,
        after: null,
        summary: [`delete profile "${PROFILE_NAME}"`],
      },
    ];
  },
};

function catalogLabel(ctx: SetupContext): string {
  return ctx.catalog.defaultModelId;
}
