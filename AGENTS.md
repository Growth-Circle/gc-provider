## RULE UTAMA - Production Disk Safety

SERVER INI ADALAH SERVER PRODUCTION ACTIVE DAN DIPAKAI OLEH RIBUAN MEMBER. Jangan pernah menghapus data atau memformat VM/disk tanpa persetujuan eksplisit dari Rama. Untuk migrasi storage, ikuti `docs/PRODUCTION_DISK_SAFETY.md` dan gunakan jalur aman/rollback.

# gc-provider Agent Guide

Last updated: 2026-04-28

This repository publishes the GrowthCircle.id provider plugin for OpenClaw. Use
this file as the canonical operating guide for AI agents and maintainers working
in this repo.

## Project Snapshot

- Package: `gc-provider`
- Plugin id / runtime id: `gc-provider`
- Provider id: `growthcircle`
- Provider label: `GrowthCircle.id`
- Endpoint: `https://ai.growthcircle.id/v1`
- Main entrypoint: `index.ts`
- Provider implementation: `src/provider.ts`
- Manifest: `openclaw.plugin.json`
- Tests: `test/provider.test.ts`
- Distribution: npm + ClawHub + GitHub releases

## Compatibility Policy

The plugin currently supports OpenClaw `2026.4.15+`.

When updating OpenClaw integration:

1. Keep backward compatibility with the declared minimum unless intentionally
   bumping the minimum in `package.json`, `README.md`, `CHANGELOG.md`, and
   `openclaw.plugin.json`-related metadata.
2. Prefer additive manifest metadata over runtime-only behavior so new OpenClaw
   setup/model-listing paths can work before plugin runtime loads.
3. Verify both the newest OpenClaw version and at least one older supported
   version before release.

Recommended compatibility check set:

```sh
npm run typecheck
npm test
npm run prepublishOnly
npm pack --dry-run
```

For broader OpenClaw compatibility checks, temporarily install versions with
`npm install --no-save openclaw@<version>`, then run typecheck + tests. Restore
`package-lock.json` to the intended release SDK version afterwards.

## Source of Truth

Keep these files aligned:

- `package.json`
  - npm package version
  - `openclaw.compat`
  - `openclaw.build.openclawVersion`
  - `openclaw.build.pluginSdkVersion`
  - `devDependencies.openclaw`
- `package-lock.json`
  - locked OpenClaw SDK version
- `openclaw.plugin.json`
  - manifest version
  - provider auth choices
  - setup metadata
  - provider request metadata
  - model catalog preview
- `src/provider.ts`
  - runtime catalog normalization
  - defaults and model refs
  - OpenAI-compatible model compat flags
- `README.md`
  - install/upgrade commands
  - compatibility wording
- `CHANGELOG.md`
  - release notes for every published version

Do not bump one of these without checking the rest.

## GrowthCircle Model Rules

- Paid/team default model: `growthcircle/gpt-5.5`
- Free default model: `growthcircle/gpt-5.5-free`
- Free-tier model ids must use the `-free` suffix.
- Keep model refs tier-specific:
  - free: `FREE_TEXT_MODEL_REFS`
  - paid: `PAID_TEXT_MODEL_REFS`
  - team: `TEAM_TEXT_MODEL_REFS`
- Runtime `/models` discovery must filter out non-text inference models, such
  as image, video, audio, music, unavailable, or non-GrowthCircle-owned models.
- Do not expose API keys in errors, logs, tests, or release notes.

## OpenAI-Compatible Request Compatibility

GrowthCircle.id uses an OpenAI-compatible endpoint. Keep the runtime model
compatibility flags explicit unless OpenClaw introduces a safer manifest/runtime
contract:

- `supportsDeveloperRole: true`
- `supportsReasoningEffort: true`
- `supportsStrictMode: true`
- `supportsUsageInStreaming: true`
- `maxTokensField: "max_completion_tokens"`

If these flags change, update both runtime model definitions and manifest model
catalog preview rows, then extend tests.

## Manifest Rules

`openclaw.plugin.json` is not just descriptive. Newer OpenClaw control-plane
flows read it before loading plugin runtime.

Keep these fields intentional:

- `setup.providers[].envVars` must include `GROWTHCIRCLE_API_KEY`.
- Do not reintroduce deprecated `providerAuthEnvVars` unless required for a
  deliberate compatibility rollback.
- `providerAuthChoices` must stay aligned with the auth methods registered in
  `index.ts`.
- `providerRequest.providers.growthcircle.family` should identify GrowthCircle
  as an OpenAI-compatible provider family for request policy diagnostics.
- `modelCatalog` should be a stable preview only. Runtime `/models` discovery
  remains authoritative for account-specific catalogs.

## Testing Expectations

Before committing code changes:

```sh
npm run typecheck
npm test
```

Before publishing:

```sh
npm run prepublishOnly
npm pack --dry-run
```

Tests should cover:

- manifest auth/setup metadata
- model normalization and filtering
- free-tier suffix behavior
- default onboarding config
- request compatibility metadata
- compact/safe error handling

## Release Workflow

Use this checklist for every public release.

1. Update version in:
   - `package.json`
   - `package-lock.json`
   - `openclaw.plugin.json`
2. Update `CHANGELOG.md` with a new section.
3. Update README compatibility/install/update wording if behavior changed. Keep the default ClawHub install unversioned and unpinned so `openclaw plugins update` can follow newer releases.
4. Run:
   ```sh
   npm run prepublishOnly
   npm pack --dry-run
   ```
5. Commit:
   ```sh
   git add .
   git commit -m "chore: release vX.Y.Z"
   git push origin main
   ```
6. Publish npm:
   ```sh
   npm publish --access public
   npm view gc-provider version dist-tags --json
   ```
7. Create GitHub tag and release:
   ```sh
   git tag -a vX.Y.Z -m "gc-provider X.Y.Z"
   git push origin vX.Y.Z
   gh release create vX.Y.Z --title "GrowthCircle.id Provider for OpenClaw vX.Y.Z" --notes-file <release-notes.md>
   ```
8. Publish ClawHub from the immutable tag:
   ```sh
   clawhub package publish "$PWD" \
     --family code-plugin \
     --version X.Y.Z \
     --source-repo Growth-Circle/gc-provider \
     --source-commit "$(git rev-parse HEAD)" \
     --source-ref vX.Y.Z \
     --tags latest
   ```
9. Verify ClawHub:
   ```sh
   clawhub package inspect gc-provider --json
   ```

## User Update Policy

Do not implement silent self-update behavior inside the provider plugin. Plugin
updates install executable code and should remain operator-controlled through
OpenClaw's managed update path.

Recommended user-facing commands:

```sh
# New installs: unversioned ClawHub track, update-friendly
openclaw plugins install clawhub:gc-provider

# Existing installs: move pinned npm installs back to latest
openclaw plugins update gc-provider@latest

# Maintenance window / scheduled update
openclaw plugins update --all && openclaw gateway restart
```

Avoid documenting `--pin` for the default ClawHub install path. Exact versions
are useful for rollback or locked environments, but they should not be the
default GrowthCircle.id recommendation because they do not naturally follow
newer releases.

## GitHub Release Style

Release notes should look professional and GrowthCircle-branded. Include:

- Short product-focused summary
- Highlights
- Compatibility table
- Installation/upgrade commands
- Validation checklist
- Distribution links/versions
- Source tag and commit when useful

Avoid raw internal-only notes as the full release body. Keep the changelog
technical; keep GitHub releases polished and user-facing.

## Safety and Maintenance Notes

- Never commit secrets or API keys.
- Keep npm package contents small. Check `npm pack --dry-run` before publishing.
- Do not include binary preview assets in npm/ClawHub artifacts unless there is
  a clear reason and scanner implications are understood.
- Prefer small, targeted changes over broad refactors.
- If adding new OpenClaw SDK imports, verify they exist across the supported
  compatibility range or guard the change appropriately.
- If ClawHub scan status is `pending` immediately after publish, that is normal;
  inspect again later if needed.
