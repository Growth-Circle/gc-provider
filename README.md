# gc-provider

OpenClaw model-provider plugin for GrowthCircle.id.

<p>
  <img src="https://raw.githubusercontent.com/Growth-Circle/gc-provider/main/assets/growthcircle-provider-preview.png" alt="GrowthCircle.id landing page preview" width="920" />
</p>

It registers `GrowthCircle.id` as provider `growthcircle` and uses the OpenAI-compatible endpoint:

```text
https://ai.growthcircle.id/v1
```

Model discovery is auth-aware. During setup, choose the matching GrowthCircle
key tier: Free (`gc-free`), Paid (`gc-paid`), or Team (`gc-team`). The plugin
calls `/models` with the configured API key, so each tier can expose a different
text model catalog without separate provider ids. OpenClaw's model wizard only
shows GrowthCircle text-inference models; image, video, audio, music, and
unavailable models returned by the catalog are filtered out. Free-tier model ids
use the required `-free` suffix, for example `growthcircle/gpt-5.5-free`.

## Required Credential

This provider requires a GrowthCircle API key. Configure it through the
OpenClaw setup wizard or set:

```sh
GROWTHCIRCLE_API_KEY=<your-growthcircle-key>
```

Supported key prefixes are `gc-free`, `gc-paid`, and `gc-team`.

To get an API key:

1. Sign in at <https://growthcircle.id/app/ai> with your email.
2. Open the magic link sent to your email.
3. Go to **AI Console**.
4. Open the **Key** tab.
5. Generate an API key and store it securely. GrowthCircle only shows the key
   once, so it cannot be read again after you leave the page.

## Tier Model Catalogs

The catalogs below were verified from GrowthCircle `/v1/models` and are exposed
as GrowthCircle text-inference model refs in OpenClaw.

Free keys expose:

```text
growthcircle/MiniMax-M2.7-free
growthcircle/MiniMax-M2.7-highspeed-free
growthcircle/claude-haiku-4-5-20251001-free
growthcircle/claude-opus-4-6-free
growthcircle/claude-opus-4-7-free
growthcircle/claude-sonnet-4-6-free
growthcircle/gemini-2.5-flash-free
growthcircle/gemini-2.5-pro-free
growthcircle/gemini-3-flash-preview-free
growthcircle/gemini-3.1-pro-preview-free
growthcircle/gpt-5.3-codex-free
growthcircle/gpt-5.3-codex-spark-free
growthcircle/gpt-5.4-free
growthcircle/gpt-5.4-mini-free
growthcircle/gpt-5.5-free
```

Paid keys expose:

```text
growthcircle/MiniMax-M2.7
growthcircle/MiniMax-M2.7-highspeed
growthcircle/claude-3-5-haiku-latest
growthcircle/claude-haiku-4-5-20251001
growthcircle/claude-opus-4-6
growthcircle/claude-opus-4-7
growthcircle/claude-sonnet-4-6
growthcircle/gemini-2.5-flash
growthcircle/gemini-2.5-pro
growthcircle/gemini-3-flash-preview
growthcircle/gemini-3.1-pro-preview
growthcircle/gpt-5.3-codex
growthcircle/gpt-5.3-codex-spark
growthcircle/gpt-5.4
growthcircle/gpt-5.4-mini
growthcircle/gpt-5.5
```

Team keys expose:

```text
growthcircle/gpt-5.3-codex
growthcircle/gpt-5.3-codex-spark
growthcircle/gpt-5.4
growthcircle/gpt-5.4-mini
growthcircle/gpt-5.5
```

## Install

After installation, the model configuration wizard will show
`GrowthCircle.id` / `growthcircle` in the provider list.

### From ClawHub

Use this after the ClawHub release is approved:

```sh
openclaw plugins install clawhub:gc-provider && openclaw plugins enable gc-provider && openclaw gateway restart && openclaw configure --section=model
```

### Recommended Upgrade Path

The plugin supports OpenClaw `2026.4.15` or newer. OpenClaw `2026.4.25` or
newer is recommended because older `2026.4.24` builds can fall back to loading
the full OpenClaw model catalog during the `/model` allowlist prompt, which is
slower and can show unrelated providers.

Compatibility has been typechecked against the stable npm releases in this
range: `2026.4.15`, `2026.4.20`, `2026.4.21`, `2026.4.22`, `2026.4.23`,
`2026.4.24`, and `2026.4.25`. No stable `2026.4.16`-`2026.4.19` packages are
published on npm.

```sh
npm install -g openclaw@latest && openclaw plugins update gc-provider && openclaw plugins enable gc-provider && openclaw gateway restart && openclaw configure --section=model
```

### If OpenClaw is not installed yet

```sh
npm install -g openclaw && openclaw plugins install gc-provider --pin && openclaw plugins enable gc-provider && openclaw gateway restart && openclaw configure --section=model
```

### If OpenClaw is already installed

```sh
openclaw plugins install gc-provider --pin && openclaw plugins enable gc-provider && openclaw gateway restart && openclaw configure --section=model
```

### If gc-provider is already installed

```sh
openclaw plugins update gc-provider && openclaw plugins enable gc-provider && openclaw gateway restart && openclaw configure --section=model
```

Use this same command when upgrading from an older version. After the gateway
restarts, reopen the model wizard so OpenClaw refreshes the GrowthCircle model
catalog for the current API key.

### Works for new or existing plugin installs

```sh
(openclaw plugins update gc-provider || openclaw plugins install gc-provider --pin) && openclaw plugins enable gc-provider && openclaw gateway restart && openclaw configure --section=model
```

### Manual steps

```sh
openclaw plugins install gc-provider --pin
openclaw plugins enable gc-provider
openclaw gateway restart
openclaw configure --section=model
```

### Plugin allowlist warning

If OpenClaw prints `plugins.allow is empty`, set an explicit allowlist that
includes every non-bundled plugin you trust. For a fresh install that only needs
this provider, use:

```sh
openclaw config set plugins.allow '["gc-provider"]' --strict-json
openclaw gateway restart
```

If you already use other non-bundled plugins, include them in the same JSON
array instead of replacing the list with only `gc-provider`.

After configuration, you can verify the key-specific model catalog:

```sh
openclaw models list --provider growthcircle
```

The `/model` picker allowlist is provider-scoped to GrowthCircle text models.
The live model catalog remains key-aware: keys with different GrowthCircle
plans can expose different subsets after the gateway refreshes provider auth.

The paid/team onboarding default is `growthcircle/gpt-5.5`; the free onboarding
default is `growthcircle/gpt-5.5-free`. All GrowthCircle text models use
conservative metadata (`contextWindow: 256000`, `maxTokens: 36000`) and
`agents.defaults.thinkingDefault: "medium"` when no thinking default already
exists.

## Local Development Install

From this repository:

```sh
npm install
npm test
npm run typecheck
openclaw plugins install -l .
openclaw plugins enable gc-provider
openclaw plugins inspect gc-provider
```

## Provider Details

- Plugin id: `gc-provider`
- Provider id: `growthcircle`
- Display name: `GrowthCircle.id`
- API mode: `openai-completions`
- Base URL: `https://ai.growthcircle.id/v1`
- API key env var: `GROWTHCIRCLE_API_KEY`
- Model reference format: `growthcircle/<model-id>`
- Default model: `growthcircle/gpt-5.5` for paid/team, `growthcircle/gpt-5.5-free` for free
- Default thinking level: `medium`
- OpenClaw compatibility: `2026.4.15+` (`2026.4.25+` recommended)
- Source repo: `https://github.com/Growth-Circle/gc-provider`
- npm: `https://www.npmjs.com/package/gc-provider`

Do not commit API keys. Rotate any key used for public demos or shared testing.
