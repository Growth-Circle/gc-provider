# gc-provider

GrowthCircle.id for your AI coding tools — one command, no manual config editing.

<p>
  <img src="https://raw.githubusercontent.com/Growth-Circle/gc-provider/main/assets/growthcircle-provider-preview.png" alt="GrowthCircle.id provider preview" width="920" />
</p>

```sh
export GROWTHCIRCLE_API_KEY="<your-growthcircle-key>"
npx gc-provider setup
```

That detects the AI coding clients installed on your machine, shows you exactly
what it will change, and writes the provider config after you confirm.

## What GrowthCircle.id speaks

`ai.growthcircle.id` serves three wire formats, which is why so many different
tools can talk to it directly with no proxy in between:

| Wire format | Endpoint | Used by |
| --- | --- | --- |
| OpenAI Chat Completions | `https://ai.growthcircle.id/v1` | OpenClaw, Zed, opencode, Kilo, Cline, Roo, Cursor, Trae Agent, Hermes |
| OpenAI Responses | `https://ai.growthcircle.id/v1` | Codex CLI |
| Anthropic Messages | `https://ai.growthcircle.id/anthropic` | Claude Code |

Model discovery is always `GET https://ai.growthcircle.id/v1/models`.

### Verified endpoint status

Checked against a live paid key on 2026-08-07:

| Path | Tool calling | Status |
| --- | --- | --- |
| `/v1/chat/completions` | yes | Working — returns proper `tool_calls` |
| `/v1/responses` | no tools | Working |
| `/v1/responses` | with tools | **Broken upstream** — see the Codex note below |
| `/anthropic/v1/messages` | — | Routes correctly; blocked by upstream Anthropic credit |

Every client except Codex CLI uses `/v1/chat/completions`, which is fully
working.

## Client support

| Client | How | Status |
| --- | --- | --- |
| **Codex CLI** | `npx gc-provider setup codex` | Automated — blocked by a server-side bug, see below |
| **Claude Code** | `npx gc-provider setup claude-code` | Automated |
| **Zed** | `npx gc-provider setup zed` | Automated (key pasted once in Zed's UI) |
| **opencode** | `npx gc-provider setup opencode` | Automated |
| **Kilo Code** | `npx gc-provider setup kilo` | Automated |
| **Trae Agent (CLI)** | `npx gc-provider setup trae-agent` | Automated (per project) |
| **OpenClaw** | `openclaw plugins install clawhub:gc-provider` | Native plugin |
| **Hermes Agent** | `npx gc-provider gc-provider-install-hermes` | Native plugin |
| **Cline** | Settings panel | Manual — no config file to write |
| **Roo Code** | Settings panel | Manual — no config file to write |
| **Cursor** | Settings → Models | Manual, with caveats |
| **Windsurf** | — | Not supported by the vendor |
| **Trae IDE** | — | Not supported ([Trae-AI/Trae#2076](https://github.com/Trae-AI/Trae/issues/2076)) |
| **Antigravity** | — | Not supported by the vendor |
| **Kiro** | — | Not supported ([kirodotdev/Kiro#9367](https://github.com/kirodotdev/Kiro/issues/9367)) |

"Manual" and "Not supported" are limits of those products, not of GrowthCircle.
Neither Cline, Roo, Cursor, Windsurf, Trae IDE, Antigravity nor Kiro exposes a
provider config file that a CLI could safely write.

There is no MCP server in this package, and there will not be one: MCP adds
tools and resources to a host, it cannot change which model a host talks to.

## Requirements

- Node.js `20` or newer for the setup CLI (`22.19.0`+ for the OpenClaw plugin on
  the current `latest` release line).
- A GrowthCircle API key with one of these prefixes: `gc-free`, `gc-paid`,
  `gc-team`.

To create a key:

1. Sign in at <https://growthcircle.id/app/ai>.
2. Open **AI Console**.
3. Open the **Key** tab.
4. Generate a key and store it securely. GrowthCircle only shows the key once.

Then export it, and add the line to `~/.bashrc` or `~/.zshrc` so it survives a
new shell:

```sh
export GROWTHCIRCLE_API_KEY="<your-growthcircle-key>"
```

Verify the key works before configuring anything:

```sh
curl https://ai.growthcircle.id/v1/models \
  -H "Authorization: Bearer $GROWTHCIRCLE_API_KEY"
```

The key tier decides the model list. Free keys use `-free` model ids, for
example `gpt-5.6-luna-free`.

---

# The setup CLI

```sh
npx gc-provider setup [client...]       # write provider config (default)
npx gc-provider uninstall [client...]   # remove exactly what setup wrote
npx gc-provider status                  # what is detected and configured
```

Client names: `codex`, `claude-code`, `zed`, `opencode`, `kilo`, `trae-agent`.
With no name, every detected client is targeted.

| Option | Effect |
| --- | --- |
| `-y`, `--yes` | Apply without the confirmation prompt |
| `-n`, `--dry-run` | Print the diff and exit without writing |
| `--all` | Target every client, not only the detected ones |
| `--offline` | Skip the live `/models` lookup, use the bundled catalog |
| `--tier free\|paid\|team` | Force a tier instead of reading the key prefix |
| `-h`, `--help` | Usage |
| `-V`, `--version` | Version |

### How it behaves

**Your API key is never written to a config file.** Every generated config
references the environment variable by name (`env_key`, `{env:...}`), so
rotating a key means changing one export, and a leaked config file leaks
nothing.

**Existing config is merged, not replaced.** Only the GrowthCircle block is
inserted or updated. Comments, key order, and indentation width in your files
are preserved — including the comments in a hand-tuned Zed `settings.json`.

**Every modified file is backed up first** to `<file>.bak.<timestamp>`.

**Re-running changes nothing.** A second `setup` with the same catalog reports
`Nothing to do`.

**Unparseable files are refused, not overwritten.** If a config file is not
valid JSON or YAML, that client is skipped with a message.

**The network is never required.** With a key set, the live `/models` list is
used. Without one, or if the lookup fails, the bundled tier list is used and the
CLI says which it chose.

### Example

```console
$ npx gc-provider setup codex
GrowthCircle.id  tier=paid  models=64  live catalog from GrowthCircle.id
default model: gpt-5.6-sol

Codex CLI  create ~/.codex/growthcircle.config.toml
  · profile "growthcircle" -> gpt-5.6-sol
  · wire_api = "responses" (GrowthCircle.id serves /v1/responses)
  · key read from $GROWTHCIRCLE_API_KEY, not stored in this file
  + # Managed by gc-provider. Regenerate: npx gc-provider setup
  + model = "gpt-5.6-sol"
  + model_provider = "growthcircle"
  + [model_providers.growthcircle]
  + base_url = "https://ai.growthcircle.id/v1"
  + wire_api = "responses"

Apply the change(s) above? [y/N]
```

---

# Per-client instructions

## Codex CLI

**Install**

```sh
npx gc-provider setup codex
```

Writes `~/.codex/growthcircle.config.toml` — a standalone profile file that
gc-provider owns outright. Your `~/.codex/config.toml` is never touched, so your
existing default model and project trust settings stay exactly as they are.

**Use**

```sh
codex --profile growthcircle
```

To make GrowthCircle the default for every Codex session instead, add these two
lines to the **top** of `~/.codex/config.toml`, above the first `[table]` header:

```toml
model = "gpt-5.6-sol"
model_provider = "growthcircle"
```

TOML requires top-level keys to precede all tables. Appending them to the bottom
of the file puts them inside whichever table came last, which silently does the
wrong thing — this is why gc-provider writes a separate profile file instead.

**Update**

```sh
npx gc-provider@latest setup codex
```

**Uninstall**

```sh
npx gc-provider uninstall codex
```

Deletes the profile file. If you also edited `config.toml` by hand, remove the
`model_provider = "growthcircle"` line yourself.

**Requires** Codex `0.134.0` or newer for standalone profile files. Verified
against `0.147.0`: the profile loads and Codex reports `provider: growthcircle`.

### Current limitation — Codex does not complete requests yet

The configuration above is correct and is the only one Codex accepts, but Codex
sessions currently fail against GrowthCircle with:

```text
invalid params, function is empty (2013)
```

Verified cause: `POST /v1/responses` succeeds with a plain input but fails as
soon as a request carries `tools`. Codex always sends tools, so every Codex
session hits it. This is a GrowthCircle server-side translation bug, not a
configuration problem, and it needs a fix on `ai.growthcircle.id`.

`wire_api = "chat"` is not a workaround: Codex `0.147.0` rejects it outright
with *"`wire_api = "chat"` is no longer supported"*
([openai/codex#7782](https://github.com/openai/codex/discussions/7782)).

The adapter ships now so that Codex starts working the moment the endpoint is
fixed, with no change needed on your machine. Until then, use any of the other
supported clients — they all run on `/v1/chat/completions`, where tool calling
is verified working.

## Claude Code

**Install**

```sh
npx gc-provider setup claude-code
export ANTHROPIC_AUTH_TOKEN="$GROWTHCIRCLE_API_KEY"
```

Writes three keys into the `env` block of `~/.claude/settings.json`:
`ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`, `ANTHROPIC_SMALL_FAST_MODEL`.

The second command is required and cannot be automated away. Claude Code reads
its credential from `ANTHROPIC_AUTH_TOKEN`, and `settings.json` `env` values are
literal strings with no variable interpolation, so the token cannot be aliased
inside the file. Add both exports to your shell profile.

**Use**

```sh
claude
```

Run `/status` inside Claude Code to confirm the endpoint.

**Update**

```sh
npx gc-provider@latest setup claude-code
```

**Uninstall**

```sh
npx gc-provider uninstall claude-code
unset ANTHROPIC_AUTH_TOKEN
```

Only the three keys gc-provider added are removed; the rest of your
`settings.json` is left alone. Remove the exports from your shell profile too.

**Note** Claude Code calls `/v1/messages/count_tokens`, which GrowthCircle does
not serve yet. Claude Code degrades gracefully, but token counts shown in the UI
may be estimates.

## Zed

**Install**

```sh
npx gc-provider setup zed
```

Writes `language_models.openai_compatible.growthcircle` into
`~/.config/zed/settings.json` (or `$XDG_CONFIG_HOME/zed/settings.json`), with the
full model list and per-model capabilities.

**Use**

Open Zed, run `agent: open settings` from the command palette, select
**GrowthCircle.id**, and paste your API key once.

Zed stores provider keys in the operating system keychain and never in
`settings.json`. That one paste cannot be scripted away, and it is the reason
gc-provider does not put a key in the file.

**Update**

```sh
npx gc-provider@latest setup zed
```

Refreshes the model list. The key stays in the keychain and is not affected.

**Uninstall**

```sh
npx gc-provider uninstall zed
```

Then remove the stored key from Zed's agent settings panel.

## opencode

**Install**

```sh
npx gc-provider setup opencode
```

Writes `provider.growthcircle` into `~/.config/opencode/opencode.json`, using
`@ai-sdk/openai-compatible` and `"apiKey": "{env:GROWTHCIRCLE_API_KEY}"`.

**Use**

```sh
opencode
```

Run `/models` and pick `growthcircle/gpt-5.6-sol`.

**Update**

```sh
npx gc-provider@latest setup opencode
```

**Uninstall**

```sh
npx gc-provider uninstall opencode
```

## Kilo Code

**Install**

```sh
npx gc-provider setup kilo
```

Writes `provider.growthcircle` into `~/.config/kilo/kilo.json`.

This goes to the **global** config on purpose. Kilo only resolves `{env:VAR}`
references in trusted locations; a project-level `kilo.json` would leave the key
unresolved.

**Use**

Select `growthcircle/gpt-5.6-sol` in the Kilo model picker.

**Update**

```sh
npx gc-provider@latest setup kilo
```

**Uninstall**

```sh
npx gc-provider uninstall kilo
```

## Trae Agent (CLI)

This is ByteDance's `trae-agent` command line tool, which is a **different
product from Trae IDE**. Trae IDE is not supported; see below.

**Install**

```sh
cd /path/to/your/project
npx gc-provider setup trae-agent
export OPENAI_API_KEY="$GROWTHCIRCLE_API_KEY"
```

Writes `model_providers.growthcircle` and `models.growthcircle_model` into
`./trae_config.yaml`. Trae Agent reads its config from the working directory, so
run this once per project.

The `OPENAI_API_KEY` export is not a mistake. Trae Agent derives the credential
variable name from the provider field — `provider: openai` becomes
`OPENAI_API_KEY` — and environment values take priority over the file, which is
why `api_key` is left empty in the generated YAML.

**Two things to watch:**

- If you also use the real OpenAI API, this export will point that traffic at
  GrowthCircle too. Scope it per project or per shell.
- If `OPENAI_BASE_URL` is already exported for something else, it silently
  overrides the `base_url` written into the file.

**Use**

```sh
trae-cli run --model growthcircle_model "your task"
```

**Update**

```sh
npx gc-provider@latest setup trae-agent
```

**Uninstall**

```sh
npx gc-provider uninstall trae-agent
```

Removes both blocks and prunes the parent maps if they end up empty. Other
providers in the file are untouched.

## Cline

No config file exists to write; Cline keeps provider settings in VS Code's
internal state.

**Install**

1. Open the Cline panel and click the settings gear.
2. **API Provider** → `OpenAI Compatible`.
3. **Base URL** → `https://ai.growthcircle.id/v1`
4. **API Key** → your GrowthCircle key.
5. **Model ID** → `gpt-5.6-sol` (or `MiniMax-M3-free` on a free key).
6. Save.

**Update** Reopen the same panel and change the Model ID. Cline can re-fetch the
list from `/v1/models` once the Base URL and key are set.

**Uninstall** In the same panel, switch **API Provider** back to your previous
choice and clear the API Key field.

## Roo Code

Identical to Cline — Roo also stores provider settings in VS Code state.

**Install**

1. Open Roo Code settings.
2. **API Provider** → `OpenAI Compatible`.
3. **Base URL** → `https://ai.growthcircle.id/v1`
4. **API Key** → your GrowthCircle key.
5. **Model** → `gpt-5.6-sol`.

**Update** Change the model in the same panel.

**Uninstall** Switch the API Provider back and clear the key.

## Cursor

Works, but with real limitations you should know before switching.

**Install**

1. **Settings → Models**.
2. Scroll to the **OpenAI** section.
3. Enable **Override OpenAI Base URL** → `https://ai.growthcircle.id/v1`
4. **OpenAI API Key** → your GrowthCircle key.
5. Add a custom model name, for example `gpt-5.6-sol`.
6. Click **Verify**.

**Known limitations, all on Cursor's side:**

- Tab completion and Apply-from-chat stay on Cursor's own backend regardless.
- Cursor's bundled models stop working while the override is enabled.
- Attaching an image to a chat fails; Cursor falls back to `api.openai.com`,
  which rejects a GrowthCircle key.

**Update** Add or rename custom model entries in the same panel.

**Uninstall** Disable **Override OpenAI Base URL**, clear the API key, and
delete the custom model entries.

## Not supported

These clients provide no way to point at a custom endpoint. A local proxy does
not help either: none of them accepts a base URL at all, so intercepting them
would require overriding DNS and installing a self-signed certificate authority
into your system trust store. That weakens TLS on your whole machine, and this
package will not ship it.

| Client | Reason | Track it |
| --- | --- | --- |
| Windsurf | BYOK does not expose a custom base URL | — |
| Trae IDE | No custom `baseURL` field | [Trae-AI/Trae#2076](https://github.com/Trae-AI/Trae/issues/2076) |
| Antigravity | BYOK accepts Gemini/Anthropic keys only; custom endpoint keys do not route | [Google AI forum](https://discuss.ai.google.dev/t/how-to-properly-configure-custom-openai-compatible-models-in-antigravity-ide/168654) |
| Kiro | No BYOK support | [kirodotdev/Kiro#9367](https://github.com/kirodotdev/Kiro/issues/9367) |

For Trae IDE specifically, use **Trae Agent (CLI)** instead — it is fully
supported and documented above.

---

# OpenClaw plugin

`gc-provider` registers GrowthCircle.id as provider `growthcircle` in OpenClaw,
with tier-aware auth methods, live catalog discovery, thinking-level support,
and image generation.

## Install

### Recommended command

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

### Local source

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

## Update

OpenClaw does not silently update executable plugins. Update the plugin through
the same source used for the install, then restart the gateway. To preview a
tracked update first:

```sh
openclaw plugins update gc-provider --dry-run
```

### Tracked install

```sh
openclaw plugins update gc-provider
openclaw gateway restart
openclaw configure --section=model
```

### From npm latest

`plugins update` takes the plugin id, not an npm package spec:

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

### From ClawHub latest

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

### From local source

```sh
npm install
npm run build
openclaw plugins install -l . --force
openclaw plugins enable gc-provider
openclaw gateway restart
openclaw configure --section=model
```

### All plugins

```sh
openclaw plugins update --all
openclaw gateway restart
```

### Repair a broken or untracked install

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

## Uninstall

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

```sh
openclaw models list --provider growthcircle
```

The paid and team default model is `growthcircle/gpt-5.6-sol`; the free default is
`growthcircle/MiniMax-M3-free`.

If OpenClaw prints `plugins.allow is empty`, add this provider to the plugin
allowlist:

```sh
openclaw config set plugins.allow '["gc-provider"]' --strict-json
openclaw gateway restart
```

If other non-bundled plugins are already in use, include them in the same JSON
array instead of replacing the list with only `gc-provider`.

---

# Hermes Agent plugin

The Hermes plugin is a native `model-provider` plugin installed into
`$HERMES_HOME/plugins/model-providers/growthcircle`. It is distributed inside the
npm package; there is no separate Hermes registry publish step.

## Install

```sh
npx --yes gc-provider@latest gc-provider-install-hermes
export GROWTHCIRCLE_API_KEY="<your-growthcircle-key>"
hermes doctor
hermes model
```

Smoke test with a model returned by `/v1/models`:

```sh
hermes -z "Reply with one short sentence." --provider growthcircle -m gpt-5.6-sol
```

Local checkout install for development:

```sh
./scripts/install-hermes-plugin.sh
```

## Update

```sh
npx --yes gc-provider@latest gc-provider-install-hermes
```

The installer backs up the previous local Hermes plugin folder before replacing
it.

## Uninstall

```sh
rm -rf "${HERMES_HOME:-$HOME/.hermes}/plugins/model-providers/growthcircle"
```

---

# Platform notes

Config paths shown above are for Linux and macOS. The setup CLI honours
`XDG_CONFIG_HOME` and `CODEX_HOME` when they are set, which covers most custom
layouts.

On Windows, the CLI resolves paths under your user profile the same way. Codex
CLI, Claude Code, and opencode follow that layout. Zed on Windows is still in
preview and its config location has not been verified against this CLI — check
the generated path with `npx gc-provider setup zed --dry-run` before applying.

Run `npx gc-provider status` on any platform to see the exact paths that would
be used.

# Troubleshooting

**`No supported client detected`** — nothing gc-provider automates is installed.
Use `--all` to write configs anyway, or name a client explicitly.

**`Not a TTY; re-run with --yes`** — you piped the command or ran it in CI. Add
`--yes` to skip the confirmation prompt.

**`... is not valid JSON`** — the client's config file has a syntax error.
gc-provider refuses to overwrite a file it cannot parse. Fix the file, then
re-run.

**`no Claude model available on the free tier`** — Claude Code needs a Claude
model, and the resolved catalog contained none. Check `--tier` or your key.

**`invalid params, function is empty (2013)` in Codex** — the known server-side
Responses-API bug described in the Codex section. Not fixable from your machine.

**`insufficient credits` / `Insufficient Balance`** — GrowthCircle's upstream
account for that specific model family is out of credit. Try another model
family; the error names which one failed.

**Authentication errors after setup** — confirm the variable is exported in the
shell that launches the client, not just the one that ran setup:

```sh
echo "${GROWTHCIRCLE_API_KEY:+set}"
```

**Restoring a config** — every modified file was backed up next to itself:

```sh
ls ~/.claude/settings.json.bak.*
```

# Model catalog

GrowthCircle's `/v1/models` endpoint is the source of truth at runtime. The
lists below are the text-inference models currently seeded for each key tier.

### Free

```text
growthcircle/laguna-s-2.1-free
growthcircle/qwen3.7-flash-free
growthcircle/gpt-5.6-luna-free
growthcircle/muse-spark-1.2-contributor-free
growthcircle/step-3.5-flash-free
growthcircle/deepseek-v4-flash-free
growthcircle/mimo-v2.5-free
growthcircle/hy3-free
growthcircle/Step-3.7-Flash-free
growthcircle/MiniMax-M2.5-free
growthcircle/MiniMax-M2.7-free
growthcircle/MiniMax-M3-free
```

### Paid

```text
growthcircle/gpt-5.4
growthcircle/gpt-5.4-mini
growthcircle/gpt-5.6-sol
growthcircle/gpt-5.6-terra
growthcircle/gpt-5.5
growthcircle/claude-3-5-haiku-latest
growthcircle/claude-fable-5
growthcircle/claude-haiku-4-5-20251001
growthcircle/claude-haiku-4-5-20251001-thinking
growthcircle/claude-opus-4-5-20251101
growthcircle/claude-opus-4-5-20251101-thinking
growthcircle/claude-opus-4-6
growthcircle/claude-opus-4-6-thinking
growthcircle/claude-opus-4-7
growthcircle/claude-opus-4-8
growthcircle/claude-opus-5
growthcircle/claude-sonnet-4-5-20250929
growthcircle/claude-sonnet-4-5-20250929-thinking
growthcircle/claude-sonnet-4-6
growthcircle/claude-sonnet-4-6-thinking
growthcircle/claude-sonnet-5
growthcircle/deepseek-ocr
growthcircle/deepseek-r1
growthcircle/deepseek-r1-0528
growthcircle/deepseek-r1-250528
growthcircle/deepseek-v3
growthcircle/deepseek-v3-0324
growthcircle/deepseek-v3.1
growthcircle/deepseek-v3.1-terminus
growthcircle/deepseek-v3.2
growthcircle/deepseek-v3.2-exp
growthcircle/deepseek-v3.2-think
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
growthcircle/gemini-3.5-flash-lite
growthcircle/gemini-omni-flash-preview
growthcircle/glm-4.6
growthcircle/glm-4.7
growthcircle/glm-5
growthcircle/glm-5.1
growthcircle/glm-5.2
growthcircle/kimi-k2-instruct
growthcircle/kimi-k2-thinking
growthcircle/kimi-k2.5
growthcircle/MiniMax-M2.7
growthcircle/MiniMax-M3
growthcircle/MiniMax-M2.7-highspeed
growthcircle/qwen3.7-flash
growthcircle/gpt-5.6-luna
growthcircle/muse-spark-1.2-contributor
growthcircle/step-3.5-flash
growthcircle/mimo-v2.5
growthcircle/hy3
```

### Team

```text
growthcircle/gpt-5.4
growthcircle/gpt-5.4-mini
growthcircle/gpt-5.6-sol
growthcircle/gpt-5.5
```

# Compatibility

- Minimum OpenClaw version: `2026.5.4`
- Tested OpenClaw SDK target: `2026.6.11`
- Checked skipped stable releases: OpenClaw `2026.6.10` and `2026.6.11`
- Hermes Agent model-provider layout checked against `hermes-agent@0.18.2`
- Codex CLI standalone profiles require `0.134.0`+ (verified against `0.147.0`)
- Runtime entry: `./dist/index.js`
- Source entry: `./index.ts`
- Setup CLI entry: `./dist/src/setup/cli.js`

The `2026.5.4` floor is intentional for ClawHub installs. Older OpenClaw builds
can download the legacy ClawHub ZIP archive while validating npm-pack metadata,
which may produce archive integrity errors. Upgrade OpenClaw before installing
the latest `gc-provider`.

# Provider details

- Plugin id: `gc-provider`
- Runtime id: `gc-provider`
- Provider id: `growthcircle`
- Display name: `GrowthCircle.id`
- API mode: `openai-completions`
- Base URL: `https://ai.growthcircle.id/v1`
- Anthropic Messages base URL: `https://ai.growthcircle.id/anthropic`
- API key env var: `GROWTHCIRCLE_API_KEY`
- Model ref format: `growthcircle/<model-id>`
- Default thinking level: `medium`
- npm package: <https://www.npmjs.com/package/gc-provider>
- Source: <https://github.com/Growth-Circle/gc-provider>

# Security

The setup CLI never writes an API key into a config file. Configs reference
`GROWTHCIRCLE_API_KEY` by name so that rotating a key is a single change and a
shared config file discloses nothing.

Do not commit GrowthCircle API keys. Keep local keys in ignored files such as
`.env.local`, or configure them through OpenClaw's auth flow. Rotate any key
that was used in a shared demo, CI log, screenshot, or support thread.

Two clients need the key under a second variable name, which is a constraint of
those tools rather than a choice made here:

- Claude Code reads `ANTHROPIC_AUTH_TOKEN`.
- Trae Agent reads `OPENAI_API_KEY`, derived from its `provider: openai` field.

# License

MIT
