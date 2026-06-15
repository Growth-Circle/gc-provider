---
name: gc-provider
description: GrowthCircle.id OpenClaw and Hermes Agent model-provider plugins for the OpenAI-compatible https://ai.growthcircle.id/v1 endpoint.
metadata:
  openclaw:
    requires:
      env:
        - GROWTHCIRCLE_API_KEY
    primaryEnv: GROWTHCIRCLE_API_KEY
    homepage: https://github.com/Growth-Circle/gc-provider
---

# gc-provider

This package ships native provider artifacts for OpenClaw and Hermes Agent. Both
register GrowthCircle.id as the `growthcircle` model provider.

It requires one provider credential: `GROWTHCIRCLE_API_KEY`. The key is used only
for GrowthCircle.id model discovery and OpenAI-compatible model requests to
`https://ai.growthcircle.id/v1`.

Install and configure through OpenClaw:

```sh
openclaw plugins install clawhub:gc-provider
openclaw plugins enable gc-provider
openclaw gateway restart
openclaw configure --section=model
```

Install into Hermes Agent:

```sh
npx --yes gc-provider@latest gc-provider-install-hermes
export GROWTHCIRCLE_API_KEY="<your-growthcircle-key>"
hermes doctor
hermes model
```
