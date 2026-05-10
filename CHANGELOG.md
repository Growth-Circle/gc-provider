# Changelog

## Unreleased

- Added GrowthCircle image-generation provider support for OpenClaw's built-in
  `image_generate` text-to-image flow through OpenAI-compatible
  `/images/generations`.
- Added tier-aware image-generation defaults: free keys use
  `growthcircle/gpt-image-2-free`, paid keys use `growthcircle/gpt-image-2`,
  and team/patungan keys use `growthcircle/gc-image-pro`.
- Added provider manifest contract metadata and tests for image model
  filtering/capabilities.
- Mapped ratio-like image sizes such as `1:1` to concrete GrowthCircle sizes
  such as `1024x1024` before sending requests.

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
