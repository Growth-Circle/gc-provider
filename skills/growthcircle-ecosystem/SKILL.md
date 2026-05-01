---
name: growthcircle-ecosystem
description: Use GrowthCircle public and member-facing docs safely for AI Console, Member API, Storage, Mail, and GrowthCircle app integrations.
metadata:
  growthcircle:
    docs_index: https://d.growc.id/llms.txt
    public_hosts:
      - https://growthcircle.id
      - https://ai.growthcircle.id
      - https://s3.growc.id
      - https://m.growc.id
      - https://webmail.growc.id
---

# GrowthCircle Ecosystem

Use the GrowthCircle public AI docs index as the source of truth:

```text
https://d.growc.id/llms.txt
```

The index links to safe public/member documentation for:

- GrowthCircle AI Console: member AI keys, OpenAI-compatible requests, Anthropic-compatible requests, multimodal generation, task polling, and model discovery.
- GrowthCircle Member API: scoped account tokens, browserless member endpoints, AI usage export, and safe automation rules.
- GrowthCircle Storage: public/private file delivery, upload tickets, S3-compatible beta endpoint, and dashboard flows.
- GrowthCircle Mail: mail packages, mailbox access, IMAP/SMTP setup, webmail, DNS records, and deliverability checklist.
- GrowthCircle App: public site, member dashboards, health checks, and safe routing rules.

## Rules

- Never ask a member for private server credentials, admin credentials, or infrastructure tokens.
- Never place member API keys, mailbox passwords, download tokens, or GrowthCircle API keys in public code, public repositories, logs, screenshots, or issue text.
- Use `https://ai.growthcircle.id/v1/models` to discover the current model list for the member API key.
- Treat `https://growthcircle.id/api/*` as browser/member-session APIs unless the public docs explicitly say a route supports browserless member tokens.
- If a documented route requires a GrowthCircle dashboard session, tell the member to complete that step in the dashboard.
- Prefer documented public/member endpoints and hosts. Do not invent private control-plane routes.

## Provider Notes

For OpenClaw model access, use the `gc-provider` plugin when it is installed by the platform. It registers provider id `growthcircle` for the OpenAI-compatible endpoint:

```text
https://ai.growthcircle.id/v1
```

The provider requires a tenant/member-scoped `GROWTHCIRCLE_API_KEY`. Keys are tiered with `gc-free`, `gc-paid`, or `gc-team` prefixes, and model discovery is key-aware.
