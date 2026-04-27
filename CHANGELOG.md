# Changelog

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
