# GrowthCircle.id Hermes Agent Provider

This directory is a Hermes Agent `model-provider` plugin for GrowthCircle.id.
It registers the provider id `growthcircle` and uses:

```text
https://ai.growthcircle.id/v1
```

## Install

```sh
npx --yes gc-provider@latest gc-provider-install-hermes
```

The installer copies this plugin to:

```text
$HERMES_HOME/plugins/model-providers/growthcircle
```

If `HERMES_HOME` is not set, Hermes normally uses:

```text
~/.hermes
```

## Configure And Verify

```sh
export GROWTHCIRCLE_API_KEY="<your-growthcircle-key>"

curl https://ai.growthcircle.id/v1/models \
  -H "Authorization: Bearer $GROWTHCIRCLE_API_KEY"

hermes doctor
hermes model
```

Run a direct smoke test with a model returned by `/v1/models`:

```sh
hermes -z "Reply with one short sentence." --provider growthcircle -m gpt-5.5
```

Free keys must use model ids returned by `/v1/models`, usually with the
`-free` suffix such as `gpt-5.5-free`.

## Update

Run the same installer again:

```sh
npx --yes gc-provider@latest gc-provider-install-hermes
```

The installer backs up the previous local plugin folder before replacing it.

## Local Development

From a `gc-provider` checkout:

```sh
./scripts/install-hermes-plugin.sh
```
