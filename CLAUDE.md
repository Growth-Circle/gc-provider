# Claude Guide for gc-provider

Use [AGENTS.md](AGENTS.md) as the canonical repository guide.

Claude-specific reminders:

- Keep GrowthCircle.id brand wording polished and professional in public docs,
  README updates, changelogs, and GitHub release notes.
- Before changing provider behavior, read `AGENTS.md`, `src/provider.ts`,
  `openclaw.plugin.json`, and `test/provider.test.ts`.
- Preserve backward compatibility with OpenClaw `2026.4.15+` unless explicitly
  asked to bump the minimum supported version.
- Always run `npm run typecheck` and `npm test` before proposing or committing
  code changes.
- For releases, follow the Release Workflow in `AGENTS.md` and publish ClawHub
  from an immutable GitHub tag, not from a moving branch.
