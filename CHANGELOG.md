# Changelog

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
