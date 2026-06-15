# gc-provider

OpenClaw and Hermes Agent provider plugins for GrowthCircle.id.

<p>
  <img src="https://raw.githubusercontent.com/Growth-Circle/gc-provider/main/assets/growthcircle-provider-preview.png" alt="GrowthCircle.id provider preview" width="920" />
</p>

`gc-provider` registers GrowthCircle.id as provider `growthcircle` and sends
requests to the OpenAI-compatible endpoint:

```text
https://ai.growthcircle.id/v1
```

The package ships two provider artifacts:

- OpenClaw plugin: `index.ts`, `dist/`, and `openclaw.plugin.json`.
- Hermes Agent plugin: `hermes/plugins/model-providers/growthcircle`.

Both paths read the GrowthCircle model catalog with the API key configured in
the runtime. Free, Paid, and Team keys can expose different models. The model
picker is scoped to GrowthCircle text-inference models, so image, video, audio,
music, unavailable, and non-GrowthCircle models are not added to the chat model
list.

## Requirements

- OpenClaw `2026.5.4` or newer.
- Hermes Agent with user plugins enabled when using the Hermes plugin.
- Node.js `22.19.0` or newer when running the current OpenClaw `latest`
  release line.
- A GrowthCircle API key with one of these prefixes:
  - `gc-free`
  - `gc-paid`
  - `gc-team`

Configure the key in the OpenClaw setup flow, or set it as an environment
variable:

```sh
GROWTHCIRCLE_API_KEY=<your-growthcircle-key>
```

To create a key:

1. Sign in at <https://growthcircle.id/app/ai>.
2. Open **AI Console**.
3. Open the **Key** tab.
4. Generate a key and store it securely. GrowthCircle only shows the key once.

## Install

### Recommended OpenClaw Command

Use this for a new install, a tracked update, or a stale existing copy. It
updates by plugin id first. If OpenClaw has no install record yet, it replaces
the local plugin folder from the unpinned ClawHub track.

```sh
(openclaw plugins update gc-provider || openclaw plugins install clawhub:gc-provider --force) && openclaw plugins enable gc-provider && openclaw gateway restart && openclaw configure --section=model
```

### ClawHub

Use the unpinned ClawHub track when you want OpenClaw to follow newer ClawHub
releases. Use the update-or-replace command below instead of rerunning plain
`install`; plain install is not idempotent and may stop with `plugin already
exists` when a previous copy is already on disk.

```sh
(openclaw plugins update gc-provider || openclaw plugins install clawhub:gc-provider --force)
openclaw plugins enable gc-provider
openclaw gateway restart
openclaw configure --section=model
```

### npm

Use the npm package directly when ClawHub is not available, or when an
environment standardizes on npm package specs:

```sh
openclaw plugins install gc-provider@latest --force
openclaw plugins enable gc-provider
openclaw gateway restart
openclaw configure --section=model
```

### Local Source

For development from this repository:

```sh
npm install
npm test
npm run typecheck
openclaw plugins install -l .
openclaw plugins enable gc-provider
openclaw gateway restart
openclaw configure --section=model
```

### Hermes Agent

For Hermes Agent, install the native `model-provider` plugin into
`$HERMES_HOME/plugins/model-providers/growthcircle`. There is no separate
Hermes registry publish step for this package right now; the Hermes plugin is
distributed inside the npm package and installed with `npx`.

1. Install the plugin from npm:

```sh
npx --yes gc-provider@latest gc-provider-install-hermes
```

2. Add the GrowthCircle key to your shell, service environment, or Hermes
   secret mechanism:

```sh
export GROWTHCIRCLE_API_KEY="<your-growthcircle-key>"
```

3. Confirm the key can see models:

```sh
curl https://ai.growthcircle.id/v1/models \
  -H "Authorization: Bearer $GROWTHCIRCLE_API_KEY"
```

4. Let Hermes validate the install and open model selection:

```sh
hermes doctor
hermes model
```

5. Smoke test with one model returned by `/v1/models`:

```sh
hermes -z "Reply with one short sentence." --provider growthcircle -m gpt-5.5
```

Use the exact model ids returned by `https://ai.growthcircle.id/v1/models` for
the same key. Free keys normally use `-free` model ids, for example
`gpt-5.5-free`.

Local checkout install for development:

```sh
./scripts/install-hermes-plugin.sh
```

Update the Hermes plugin later with the same npm command:

```sh
npx --yes gc-provider@latest gc-provider-install-hermes
```

The installer backs up the previous local Hermes plugin folder before replacing
it.

Uninstall:

```sh
rm -rf "${HERMES_HOME:-$HOME/.hermes}/plugins/model-providers/growthcircle"
```

## Update

OpenClaw does not silently update executable plugins. Update the plugin through
the same source used for the install, then restart the gateway. To preview a
tracked update first:

```sh
openclaw plugins update gc-provider --dry-run
```

### Update a Tracked Install

Use this when OpenClaw already knows where the installed package came from:

```sh
openclaw plugins update gc-provider
openclaw gateway restart
openclaw configure --section=model
```

### Update from npm latest

Use this when the plugin was installed from an unpinned npm spec. `plugins
update` takes the plugin id, not an npm package spec:

```sh
openclaw plugins update gc-provider
openclaw gateway restart
openclaw configure --section=model
```

To switch sources or replace a pinned exact npm version with npm `latest`:

```sh
openclaw plugins install gc-provider@latest --force
openclaw plugins enable gc-provider
openclaw gateway restart
openclaw configure --section=model
```

### Update from ClawHub latest

If the plugin was installed from `clawhub:gc-provider` without a pinned version:

```sh
openclaw plugins update gc-provider
openclaw gateway restart
openclaw configure --section=model
```

To explicitly repair or replace the installed copy from ClawHub:

```sh
openclaw plugins install clawhub:gc-provider --force
openclaw plugins enable gc-provider
openclaw gateway restart
openclaw configure --section=model
```

### Update from Local Source

Use this for a checkout of this repository:

```sh
npm install
npm run build
openclaw plugins install -l . --force
openclaw plugins enable gc-provider
openclaw gateway restart
openclaw configure --section=model
```

### Update All Plugins

```sh
openclaw plugins update --all
openclaw gateway restart
```

Recent OpenClaw versions may also run plugin update checks after `openclaw
update`, depending on how the plugin was installed.

### Repair a Broken or Untracked Install

If OpenClaw says `plugin already exists`, the local plugin directory already
exists and plain install will not overwrite it. Use the repair-safe command:

```sh
(openclaw plugins update gc-provider || openclaw plugins install clawhub:gc-provider --force)
openclaw plugins enable gc-provider
openclaw gateway restart
openclaw configure --section=model
```

If `plugins update` prints `No install record for "gc-provider"`, continue with
the `install clawhub:gc-provider --force` fallback above. That recreates the
OpenClaw install record and replaces only the managed `gc-provider` plugin
folder.

### Uninstall

```sh
openclaw plugins uninstall gc-provider --dry-run
openclaw plugins uninstall gc-provider --force
openclaw gateway restart
```

If uninstall prints `Plugin not found` while
`~/.openclaw/extensions/gc-provider` still exists, first make OpenClaw own that
folder again, then uninstall it:

```sh
openclaw plugins install clawhub:gc-provider --force
openclaw plugins uninstall gc-provider --force
openclaw gateway restart
```

## Verify

After install or update, check the configured GrowthCircle catalog:

```sh
openclaw models list --provider growthcircle
```

The paid and team default model is:

```text
growthcircle/gpt-5.5
```

The free default model is:

```text
growthcircle/gpt-5.5-free
```

Free-tier model ids use the `-free` suffix. For example:

```text
growthcircle/MiniMax-M2.7-free
growthcircle/gpt-5.5-free
```

If OpenClaw prints `plugins.allow is empty`, add this provider to the plugin
allowlist:

```sh
openclaw config set plugins.allow '["gc-provider"]' --strict-json
openclaw gateway restart
```

If other non-bundled plugins are already in use, include them in the same JSON
array instead of replacing the list with only `gc-provider`.

## Model Catalog

GrowthCircle's `/v1/models` endpoint is the source of truth at runtime. The
lists below are the text-inference models currently seeded into OpenClaw setup
for each key tier.

### Free

```text
growthcircle/gpt-5.3-codex-free
growthcircle/gpt-5.4-free
growthcircle/gpt-5.4-mini-free
growthcircle/gpt-5.5-free
growthcircle/claude-haiku-4-5-20251001-free
growthcircle/claude-opus-4-6-free
growthcircle/claude-opus-4-7-free
growthcircle/claude-sonnet-4-6-free
growthcircle/deepseek-v4-flash-free
growthcircle/deepseek-v4-pro-free
growthcircle/gemini-2.5-flash-free
growthcircle/gemini-2.5-flash-lite-free
growthcircle/gemini-2.5-pro-free
growthcircle/gemini-3-flash-preview-free
growthcircle/gemini-3-pro-preview-free
growthcircle/gemini-3.1-pro-preview-free
growthcircle/MiniMax-M2.7-free
growthcircle/MiniMax-M3-free
growthcircle/MiniMax-M2.7-highspeed-free
```

### Paid

```text
growthcircle/gpt-5.3-codex
growthcircle/gpt-5.3-codex-spark
growthcircle/gpt-5.4
growthcircle/gpt-5.4-mini
growthcircle/gpt-5.5
growthcircle/claude-3-5-haiku-latest
growthcircle/claude-haiku-4-5-20251001
growthcircle/claude-haiku-4-5-20251001-thinking
growthcircle/claude-opus-4-5-20251101
growthcircle/claude-opus-4-5-20251101-thinking
growthcircle/claude-opus-4-6
growthcircle/claude-opus-4-6-thinking
growthcircle/claude-opus-4-7
growthcircle/claude-sonnet-4-5-20250929
growthcircle/claude-sonnet-4-5-20250929-thinking
growthcircle/claude-sonnet-4-6
growthcircle/claude-sonnet-4-6-thinking
growthcircle/deepseek-ocr
growthcircle/deepseek-r1-0528
growthcircle/deepseek-r1-250528
growthcircle/deepseek-v3-0324
growthcircle/deepseek-v3.1-terminus
growthcircle/deepseek-v3.2
growthcircle/deepseek-v3.2-exp
growthcircle/deepseek-v4-flash
growthcircle/deepseek-v4-pro
growthcircle/gemini-2.0-flash
growthcircle/gemini-2.5-flash
growthcircle/gemini-2.5-flash-nothinking
growthcircle/gemini-2.5-flash-thinking
growthcircle/gemini-2.5-flash-lite
growthcircle/gemini-2.5-pro
growthcircle/gemini-2.5-pro-nothinking
growthcircle/gemini-2.5-pro-thinking
growthcircle/gemini-3-flash-preview
growthcircle/gemini-3-flash-preview-nothinking
growthcircle/gemini-3-flash-preview-thinking
growthcircle/gemini-3-pro-preview
growthcircle/gemini-3-pro-preview-thinking
growthcircle/gemini-3.1-flash-lite-preview
growthcircle/gemini-3.1-pro-preview
growthcircle/gemini-3.1-pro-preview-thinking
growthcircle/gemini-3.5-flash
growthcircle/glm-4.6
growthcircle/glm-4.7
growthcircle/glm-5
growthcircle/glm-5.1
growthcircle/kimi-k2-instruct
growthcircle/kimi-k2-thinking
growthcircle/kimi-k2.5
growthcircle/MiniMax-M2.7
growthcircle/MiniMax-M3
growthcircle/MiniMax-M2.7-highspeed
```

### Team

```text
growthcircle/gpt-5.3-codex
growthcircle/gpt-5.3-codex-spark
growthcircle/gpt-5.4
growthcircle/gpt-5.4-mini
growthcircle/gpt-5.5
```

## Compatibility

- Minimum OpenClaw version: `2026.5.4`
- Tested OpenClaw SDK target: `2026.6.6`
- Runtime entry: `./dist/index.js`
- Source entry: `./index.ts`

The `2026.5.4` floor is intentional for ClawHub installs. Older OpenClaw builds
can download the legacy ClawHub ZIP archive while validating npm-pack metadata,
which may produce archive integrity errors. Upgrade OpenClaw before installing
the latest `gc-provider`.

## Provider Details

- Plugin id: `gc-provider`
- Runtime id: `gc-provider`
- Provider id: `growthcircle`
- Display name: `GrowthCircle.id`
- API mode: `openai-completions`
- Base URL: `https://ai.growthcircle.id/v1`
- API key env var: `GROWTHCIRCLE_API_KEY`
- Model ref format: `growthcircle/<model-id>`
- Default thinking level: `medium`
- npm package: <https://www.npmjs.com/package/gc-provider>
- Source: <https://github.com/Growth-Circle/gc-provider>

## Security

Do not commit GrowthCircle API keys. Keep local keys in ignored files such as
`.env.local`, or configure them through OpenClaw's auth flow. Rotate any key
that was used in a shared demo, CI log, screenshot, or support thread.
