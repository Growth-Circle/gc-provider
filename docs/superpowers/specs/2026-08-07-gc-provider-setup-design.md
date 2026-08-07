# gc-provider setup — design

Date: 2026-08-07
Status: implemented in 0.1.31

## Problem

Using a GrowthCircle.id key in an AI coding client meant reading that client's
docs, finding its config file, and hand-writing a provider block. Two clients
were already handled by native plugins (OpenClaw, Hermes Agent); every other
client was manual.

## Research findings that shaped the design

### MCP cannot solve this

MCP supplies tools, resources and prompts to a host. It has no mechanism to
change which model the host talks to. No MCP server is part of this design.

### GrowthCircle already speaks three wire formats

Probed by unauthenticated request (401 means the route exists, 404 means it does
not):

| Route | Method | Result |
| --- | --- | --- |
| `/v1/chat/completions` | POST | 401 — exists |
| `/v1/responses` | POST | 401 — exists |
| `/anthropic/v1/messages` | POST | 401 — exists |
| `/v1/images/generations` | POST | 401 — exists |
| `/v1/tasks/:id` | GET | 401 — exists |
| `/v1/models` | GET | documented |
| `/anthropic/v1/messages/count_tokens` | POST | 404 — absent |
| `/v1/embeddings` | POST | 404 — absent |

The Anthropic Messages route was undocumented in this repository. It means
Claude Code works against GrowthCircle with no translation proxy.

### Most clients cannot be automated at all

| Client | Config surface |
| --- | --- |
| Codex CLI | `$CODEX_HOME/<profile>.config.toml` (TOML) |
| Claude Code | `~/.claude/settings.json` (JSON) |
| Zed | `~/.config/zed/settings.json` (JSONC) |
| opencode | `~/.config/opencode/opencode.json` (JSONC) |
| Kilo Code | `~/.config/kilo/kilo.json` (JSONC) |
| Trae Agent | `./trae_config.yaml` (YAML) |
| Cline, Roo, Cursor | GUI only — VS Code/editor internal state |
| Windsurf, Trae IDE, Antigravity, Kiro | No custom base URL at all |

A local proxy was considered and rejected. The four unsupported clients accept
no base URL, so intercepting them requires DNS override plus a self-signed CA in
the system trust store. That degrades TLS trust machine-wide and breaks on any
vendor update. Documented limitations are the honest alternative.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Home | This repo, new `gc-provider` bin | One release train; `gc-provider-install-hermes` set the precedent |
| Key handling | Env var only, never written to a file | Rotation is one change; a leaked config leaks nothing |
| Scope | 6 automated clients, docs for the rest, no proxy | Matches what is actually achievable |
| Merge policy | Surgical merge, backup, diff, confirm | User config files must survive intact |
| Model list | Live `/models` when a key exists, bundled tier list otherwise | Accurate when possible, never fails on a bad network |

## Architecture

Adapters are pure functions. They receive a read callback and return the file
content they want; they never touch disk. All I/O — reading, diffing, backup,
confirmation, writing — lives in `cli.ts`.

```
src/setup/
  cli.ts          orchestration, diff, prompt, backup, write
  context.ts      tier detection, live/static catalog, model picking
  registry.ts     adapter list + documented manual/unsupported clients
  diff.ts         LCS line diff with collapsed context
  constants.ts    endpoints, limits, display names
  types.ts        Adapter, FileEdit, SetupContext, Probe
  clients/        codex, claude-code, zed, opencode, kilo, trae-agent
  edit/           jsonc.ts, yaml.ts — comment-preserving edits
```

```ts
type FileEdit = {
  path: string
  before: string | null   // null = file does not exist
  after: string | null    // null = delete the file
  summary: string[]
  blocked?: string        // set when the file exists but cannot be parsed
}

type Adapter = {
  id: string
  label: string
  usage: (ctx) => string[]
  detect: (ctx, probe) => boolean
  install: (ctx, read) => FileEdit[]
  uninstall: (ctx, read) => FileEdit[]
  extraEnv?: (ctx) => Array<{ name; value; note }>
}
```

Purity is what makes the test suite fixture-based: no temp directories, no
filesystem mocks, and `--dry-run` is free because the write step is simply not
called.

### Supporting refactor

`src/provider.ts` imported `openclaw/plugin-sdk/provider-auth*` at runtime for
image generation. ESM hoists those imports, so any CLI importing the module
would require OpenClaw to be installed. Image generation moved to
`src/image.ts`; `src/provider.ts` now holds only type-only OpenClaw imports,
which are erased at build time. Public exports are unchanged — `index.ts`
re-exports `buildGrowthCircleImageGenerationProvider` from its new home.

## Client-specific constraints

**Codex** — Codex 0.134+ reads `--profile` from a standalone
`$CODEX_HOME/<name>.config.toml`. gc-provider owns that file entirely and never
edits `config.toml`. Beyond tidiness: TOML requires top-level keys to precede
all tables, so appending `model_provider` to an existing `config.toml` would
place it inside the last table.

**Claude Code** — `settings.json` `env` values are literal strings with no
interpolation, and Claude Code reads `ANTHROPIC_AUTH_TOKEN`. The user must
export it; the CLI reports this via `extraEnv`.

**Zed** — provider keys go to the OS keychain, never to `settings.json`. One
manual paste in Zed's UI is unavoidable.

**Kilo** — `{env:VAR}` only resolves in trusted config locations, so the global
`~/.config/kilo/kilo.json` is targeted rather than a project file.

**Trae Agent** — the credential variable name is derived from the provider
field: `provider.upper() + "_API_KEY"` (`trae_agent/utils/config.py`), so
`provider: openai` means `OPENAI_API_KEY`. Precedence is CLI > ENV > config,
which is why `api_key` is written empty. `OPENAI_BASE_URL`, if already exported,
silently overrides the file's `base_url`; this is documented.

## Testing

`test/setup.test.ts`, 57 tests, all fixture-based:

- tier detection and free-suffix rules
- version-aware model recency (`claude-sonnet-4-6` over
  `claude-sonnet-4-5-20250929`) — catalog order is never assumed
- catalog fallback paths, including that a failed lookup never leaks the key
- JSONC and YAML comment/indent preservation, idempotency, parse refusal
- diff rendering, including collapsed context
- every adapter: content, idempotency, uninstall round-trip
- two cross-cutting invariants over all adapters: a second install produces no
  edits, and no generated file ever contains an API key

## Live verification, 2026-08-07

Run against real paid and free keys after implementation.

| Check | Result |
| --- | --- |
| Live `/models`, paid key | 66 models (bundled list has 54) |
| Live `/models`, free key | 24 models, all `-free` suffixed, default `gpt-5.6-free` |
| `/v1/chat/completions` + tools | Working — returns well-formed `tool_calls` |
| `/v1/responses`, plain input | Working |
| `/v1/responses` + tools | **Fails**: `invalid params, function is empty (2013)` |
| `/anthropic/v1/messages` | Routes and maps ids (`claude-sonnet-4-6` -> `...-commandcode`); blocked by upstream Anthropic credit |
| Codex standalone profile defines `[model_providers.*]` | **Yes** — verified on codex `0.147.0`, banner shows `provider: growthcircle` |
| Clean `npm install` of the tarball, no OpenClaw present | CLI runs |

Both design uncertainties are now resolved. The Codex profile question is a
yes. The Anthropic model-id question is a yes for routing.

### Consequence: Codex is blocked server-side

Codex always sends `tools`, and `/v1/responses` fails whenever tools are
present. `wire_api = "chat"` is not an escape hatch — Codex `0.147.0` rejects
that value entirely. The written config is therefore the only valid one, and
Codex will work unchanged once the endpoint is fixed.

## Known gaps

Server-side, worth closing on `ai.growthcircle.id`, in priority order:

1. **`/v1/responses` with `tools`** — blocks Codex CLI entirely. Highest value.
2. `/anthropic/v1/messages/count_tokens` — Claude Code calls it
3. `/v1/embeddings` — Cline and Continue use it for codebase indexing

Client-side:

- Zed on Windows is preview; its config path is unverified against this CLI
- Cline/Roo settings import format is undocumented, so no preset is generated
