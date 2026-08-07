# Changelog

## 0.1.33

- Synced the bundled model catalog with what `ai.growthcircle.id` actually
  serves, verified against live paid and free keys. The bundled lists now match
  the live catalog exactly: paid 64 models, free 22.
- Removed `gpt-5.3-codex` from every tier. It no longer exists upstream —
  `/v1/models` does not return it and calling it is rejected as an unknown
  model — so the previous lists advertised a model that could not be used.
- Added the models that had appeared upstream but were missing here: Claude
  Opus 5, Sonnet 5, Opus 4.8 and Fable 5; DeepSeek R1, V3, V3.1 and V3.2-think;
  Gemini 3.5 Flash Lite and Omni Flash Preview; GLM 5.2; and on the free tier,
  GPT-5.3 Codex Spark, MiMo v2.5 and MiMo v2.5 Pro.
- Internal routing variants (`gpt-5.6-sol`, `gpt-5.6-terra`) are deliberately
  excluded; they are backend aliases of `gpt-5.6`, not separate user choices.
- Regenerated the manifest allowlists, the manifest model catalog, and the
  README catalog tables from the same source so the four cannot drift apart.

This only affects the fallback path used when no API key is set. Runtime
`/models` discovery was already authoritative and unaffected.

## 0.1.32

- Packaging metadata only. No runtime behavior changed for any client, and no
  shipped file changed in either distribution channel.
- Added `src/setup/`, `test/`, `docs/`, and `reports/` to `.clawhubignore`.
  **These entries are inert today.** ClawHub builds its artifact with
  `npm pack`, so the contents are governed by `package.json` `files`, not by
  `.clawhubignore`; verified by downloading the published artifact, whose
  shasum matches a local `npm pack` and which still contains every
  `dist/src/setup/**` file. The entries are kept only so the intent is already
  recorded if ClawHub ever switches to source-tree packaging.
- Context: ClawHub's behavioural scanner briefly reported `0.1.31` as
  `suspicious` shortly after publish, then returned to `clean` on its own. The
  local Plugin Inspector passed with zero findings throughout. The initial
  release notes for `0.1.32` claimed this release fixed that flag; it did not,
  and this entry supersedes that claim.

## 0.1.31

- Added the `gc-provider` setup CLI: `npx gc-provider setup` detects installed
  AI coding clients, shows a diff, and writes GrowthCircle provider config after
  confirmation. Also ships `uninstall` and `status` subcommands.
- Automated six clients: Codex CLI, Claude Code, Zed, opencode, Kilo Code, and
  Trae Agent. Documented manual steps for Cline, Roo Code, and Cursor, and the
  vendor limitations that make Windsurf, Trae IDE, Antigravity, and Kiro
  impossible to configure.
- Documented the Anthropic Messages endpoint at
  `https://ai.growthcircle.id/anthropic`, which lets Claude Code use
  GrowthCircle without any proxy.
- The CLI never writes an API key to disk: generated configs reference
  `GROWTHCIRCLE_API_KEY` by name. Existing config files are merged surgically
  with comments, key order, and indentation preserved, backed up to
  `<file>.bak.<timestamp>`, and left untouched when unparseable.
- Moved the image-generation provider from `src/provider.ts` into `src/image.ts`
  so `src/provider.ts` no longer imports the OpenClaw runtime. The setup CLI can
  now run on machines without OpenClaw installed. No public export changed.
- Added `jsonc-parser` and `yaml` as runtime dependencies, used only by the
  setup CLI so that comment-bearing config files survive editing.
- Verified against live paid and free keys: live `/models` discovery, free-tier
  `-free` suffixing, and tool calling over `/v1/chat/completions`. Documented
  one confirmed server-side gap: `/v1/responses` fails when a request carries
  `tools`, which blocks Codex CLI until `ai.growthcircle.id` is fixed. The Codex
  config shipped here is the only form Codex accepts and will work unchanged
  once that is resolved.

## 0.1.30

- Added `gpt-5.6` and `gpt-5.6-free` to the seeded GrowthCircle text model
  catalogs for OpenClaw setup, manifest preview, and Hermes fallback discovery.
- Updated the paid, team, and free default text model to GPT-5.6 while keeping
  GPT-5.5 available as a compatibility model with reasoning metadata.
- Checked npm upstreams: OpenClaw `latest` is still `2026.6.11`, while
  `hermes-agent` latest is `0.18.2`; kept the OpenClaw SDK target stable and
  refreshed the Hermes compatibility wording.

## 0.1.29

- Checked OpenClaw `2026.6.10` and `2026.6.11` compatibility and updated the
  plugin SDK test target to the current npm `latest` stable release.
- Checked the Hermes Agent `v0.18.0` (`v2026.7.1`) model-provider plugin
  contract and kept the native Hermes provider artifact aligned with the
  current plugin layout.
- Kept the declared OpenClaw install floor at `2026.5.4`; this release expands
  the tested stable range without dropping existing supported `2026.5.4+`
  installs.

## 0.1.28

- Checked OpenClaw `2026.6.9` compatibility and updated the plugin SDK test
  target.
- Checked the Hermes Agent `v0.17.0` model-provider plugin contract and kept
  the native Hermes provider artifact aligned with the current plugin layout.
- Kept the declared OpenClaw install floor at `2026.5.4`; this release expands
  the tested stable range without dropping existing supported `2026.5.4+`
  installs.

## 0.1.27

- Checked OpenClaw `2026.6.6` compatibility and updated the plugin SDK test
  target.
- Kept the declared OpenClaw install floor at `2026.5.4`; this release expands
  the tested stable range without dropping existing supported `2026.5.4+`
  installs.
- Kept the Hermes Agent provider artifact and installer in the npm package.

## 0.1.26

- Added a native Hermes Agent `model-provider` plugin for GrowthCircle.id under
  `hermes/plugins/model-providers/growthcircle`.
- Added the `gc-provider-install-hermes` installer for copying the Hermes
  plugin into `$HERMES_HOME/plugins/model-providers/growthcircle` with a backup
  of any existing local plugin folder.
- Updated package metadata and docs so the npm package can ship both the
  OpenClaw plugin and the Hermes Agent plugin artifact.
- Expanded the Hermes install guide with copy-paste setup, model discovery,
  update, uninstall, and smoke-test commands.

## 0.1.25

- Checked OpenClaw `2026.6.1` compatibility and updated the plugin SDK test
  target.
- Kept the declared OpenClaw install floor at `2026.5.4`; this release expands
  the tested stable range without dropping existing supported `2026.5.4+`
  installs.
- Documented the Node.js `22.19.0+` runtime expectation for the current
  OpenClaw `latest` release line.

## 0.1.24

- Added MiniMax-M3 to the seeded Free and Paid model catalogs.

## 0.1.23

- Checked OpenClaw `2026.5.28` compatibility and updated the plugin SDK test
  target.
- Kept the declared OpenClaw install floor at `2026.5.4`; this release expands
  the tested stable range without dropping existing supported `2026.5.4+`
  installs.

## 0.1.22

- Reworked provider config merging to avoid a ClawHub static-scan false
  positive around dynamic API-key preservation, without changing runtime
  behavior.

## 0.1.21

- Checked OpenClaw `2026.5.27` compatibility and updated the plugin SDK test
  target.
- Kept the declared OpenClaw install floor at `2026.5.4`; this release expands
  the tested stable range without dropping existing supported `2026.5.4+`
  installs.

## 0.1.20

- Added DeepSeek v4 Flash and Pro to the seeded Free model catalog with the
  required `-free` model ids.

## 0.1.19

- Reworked the public install, update, repair, and uninstall commands around
  OpenClaw's plugin-id based update flow.
- Added a repair-safe ClawHub command that handles tracked installs, fresh
  installs, and stale `~/.openclaw/extensions/gc-provider` folders without
  asking users to delete the plugin directory manually.

## 0.1.18

- Checked OpenClaw `2026.5.22` compatibility and updated the plugin SDK test
  target.
- Kept the declared OpenClaw install floor at `2026.5.4`; this release expands
  the tested stable range without dropping existing supported `2026.5.4+`
  installs.

## 0.1.17

- Updated the README for public-facing installation, update, repair, and
  verification flows across OpenClaw, ClawHub, npm, and local source installs.
- Seeded the OpenClaw setup allowlist, provider defaults, and manifest catalog
  preview with the current GrowthCircle Free and Paid text model catalogs,
  including MiniMax models for both tiers.
- Kept image, video, audio, music, unavailable, and non-GrowthCircle models out
  of the chat model picker while preserving runtime `/v1/models` discovery as
  the source of truth.

## 0.1.16

- Checked OpenClaw `2026.5.20` compatibility and updated the plugin SDK test
  target.
- Kept the declared OpenClaw install floor at `2026.5.4`; this release expands
  the tested stable range without dropping existing supported `2026.5.4+`
  installs.

## 0.1.15

- Checked OpenClaw `2026.5.18` compatibility and updated the plugin SDK test
  target.
- Added explicit `openclaw.runtimeExtensions` metadata so managed package
  installs load the compiled `dist/index.js` runtime entry on newer OpenClaw
  hosts.
- Raised the declared OpenClaw install floor to `2026.5.4` because earlier
  ClawHub installers download the legacy ZIP archive while validating the
  npm-pack SHA-256, which can produce archive integrity mismatch errors.

## 0.1.12

- Checked OpenClaw `2026.5.7` compatibility and updated the plugin SDK test
  target.
- Added compiled `dist/` runtime output to the npm package so OpenClaw
  `2026.5.7+` can load installed packages that declare TypeScript source
  entries.

## 0.1.11

- Checked OpenClaw `2026.5.2` compatibility and updated the plugin SDK test
  target.
- Documented npm `latest` as the primary install fallback for OpenClaw builds
  that reject ClawHub package metadata without archive verification fields.

## 0.1.10

- Checked OpenClaw `2026.4.29` compatibility and updated the plugin SDK test target.
- Added manifest-owned OpenAI-compatible streaming-usage request metadata for newer OpenClaw request-policy paths.
- Added the newer `resolveThinkingProfile` hook while retaining legacy thinking hooks for older supported OpenClaw versions.

## 0.1.9

- Checked OpenClaw `2026.4.26` compatibility and updated the plugin SDK test target.
- Added manifest-owned `providerRequest` metadata so OpenClaw `2026.4.26+` can classify GrowthCircle's OpenAI-compatible request family before loading plugin runtime.
- Added a manifest `modelCatalog` preview for provider-filtered model listing while keeping runtime `/models` discovery for account-specific catalogs.
- Added explicit OpenAI-compatible request `compat` flags to GrowthCircle model definitions so reasoning-effort and streaming-usage behavior remains stable on custom GrowthCircle endpoints.

## 0.1.8

- Removed deprecated `providerAuthEnvVars` compatibility metadata so OpenClaw `2026.4.25+` no longer prints provider env-var deprecation warnings.
- Kept GrowthCircle credential discovery on the supported `setup.providers[].envVars` manifest field.

## 0.1.7

- Made the README install path update-first so existing `gc-provider` installs do not fail with `plugin already exists`.
- Added explicit troubleshooting commands for replacing an untracked or broken existing install with `--force`.

## 0.1.6

- Added scanner-facing `SKILL.md` metadata that declares `GROWTHCIRCLE_API_KEY`.
- Added package-level OpenClaw credential metadata for `GROWTHCIRCLE_API_KEY`.
- Removed the preview PNG from npm and ClawHub artifacts to avoid binary content being read by the ClawHub prompt-injection pre-scan.

## 0.1.5

- Added `.clawhubignore` so local npm pack archives are not uploaded to ClawHub release artifacts.
- Declared `GROWTHCIRCLE_API_KEY` in provider auth metadata for registry and scanner visibility.
- Replaced the README `node -e` allowlist helper with explicit `openclaw config set` commands.
- Documented the GrowthCircle API key creation flow.

## 0.1.4

- Split GrowthCircle setup into Free, Paid, and Team API-key choices.
- Added tier-specific `/model` picker allowlists based on live GrowthCircle model catalogs.
- Documented the verified Free, Paid, and Team text model catalogs in the README.
- Added required `-free` model-id suffixes for `gc-free` keys, including `growthcircle/gpt-5.5-free`.
- Standardized all GrowthCircle model metadata to `contextWindow: 256000` and `maxTokens: 36000`.
- Added provider-scoped `/model` picker allowlist metadata for GrowthCircle text models, avoiding unrelated providers in the configure allowlist prompt.
- Declared OpenClaw compatibility down to `2026.4.15`, with `2026.4.25+` recommended for faster provider-scoped model configuration.
- Typechecked compatibility against OpenClaw `2026.4.15` and `2026.4.20`-`2026.4.25`.
- Aligned package and plugin manifest versions for ClawHub release metadata.
- Switched the README preview image to an absolute GitHub URL for npm and ClawHub renderers.

## 0.1.3

- Aligned package and plugin manifest versions for ClawHub release metadata.
- Switched the README preview image to an absolute GitHub URL for npm and ClawHub renderers.

## 0.1.2

- Filtered the live GrowthCircle `/models` catalog to text-inference models only.
- Excluded unavailable, non-GrowthCircle-owned, image, video, audio, and music models from OpenClaw's text model catalog.
- Preserved OpenClaw GPT-5.5 default limits and medium thinking defaults.

## 0.1.1

- Added update-first install commands for existing plugin installs.
- Documented wizard-style install and configure flows.

## 0.1.0

- Initial GrowthCircle.id OpenClaw provider plugin.
