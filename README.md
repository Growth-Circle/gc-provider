# gc-provider

OpenClaw model-provider plugin for GrowthCircle.id.

<p>
  <img src="https://raw.githubusercontent.com/Growth-Circle/gc-provider/main/assets/growthcircle-provider-preview.png" alt="GrowthCircle.id landing page preview" width="920" />
</p>

It registers `GrowthCircle.id` as provider `growthcircle` and uses the OpenAI-compatible endpoint:

```text
https://ai.growthcircle.id/v1
```

Model discovery is auth-aware. The plugin calls `/models` with the configured API key, so `gc-free`, `gc-paid`, and `gc-team` keys can expose different model catalogs without separate provider ids. OpenClaw's model wizard only shows GrowthCircle text-inference models; image, video, audio, music, and unavailable models returned by the catalog are filtered out.

## Install

After installation, the model configuration wizard will show
`GrowthCircle.id` / `growthcircle` in the provider list.

### From ClawHub

Use this after the ClawHub release is approved:

```sh
openclaw plugins install clawhub:gc-provider && openclaw plugins enable gc-provider && openclaw gateway restart && openclaw configure --section=model
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

If OpenClaw prints `plugins.allow is empty`, create an explicit allowlist from
the plugins already enabled in your own config and include `gc-provider`:

```sh
node -e 'const {execFileSync}=require("node:child_process");const entries=JSON.parse(execFileSync("openclaw",["config","get","plugins.entries"],{encoding:"utf8"})||"{}");const ids=Object.entries(entries).filter(([,entry])=>!entry||entry.enabled!==false).map(([id])=>id);if(!ids.includes("gc-provider"))ids.push("gc-provider");execFileSync("openclaw",["config","set","plugins.allow",JSON.stringify(ids),"--strict-json"],{stdio:"inherit"});' && openclaw gateway restart
```

After configuration, you can verify the key-specific model catalog:

```sh
openclaw models list --provider growthcircle
```

The onboarding default is `growthcircle/gpt-5.5`, with OpenClaw's current
GPT-5.5 metadata (`contextWindow: 272000`, `maxTokens: 128000`) and
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
- Default model: `growthcircle/gpt-5.5`
- Default thinking level: `medium`
- Source repo: `https://github.com/Growth-Circle/gc-provider`
- npm: `https://www.npmjs.com/package/gc-provider`

Do not commit API keys. Rotate any key used for public demos or shared testing.
