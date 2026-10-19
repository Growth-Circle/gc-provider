# Plan: gc-provider 0.1.37 — katalog Team GPT-6 + allowlist yang tidak basi

## Bukti singkat (live + kode)

- npm dan ClawHub sama-sama masih `0.1.33` (npm `versions` berhenti di 0.1.33;
  `clawhub package inspect gc-provider` → `latestVersion: 0.1.33`, 17 installs).
  Commit `0.1.34`–`0.1.36` hanya ada di GitHub, tidak pernah dipublish.
- Maintainer npm hanya `ramaaditya49`. Mesin ini belum login npm (`ENEEDAUTH`).
- `src/provider.ts` `TEAM_TEXT_MODEL_IDS` = `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.6-sol`,
  `gpt-5.5`. Tidak ada keluarga gpt-6. `gpt-5.5` sudah dimatikan untuk Patungan
  (growthcircle-id `c2eca05a`), `gpt-5.4*` ditolak gateway (`MODEL_NOT_ALLOWED_FOR_PLAN`).
- Model yang benar-benar dilayani key team (gateway `usage_logs`, 3 hari, status 200):
  `gpt-6.1-sol`, `gpt-6-sol`, `gpt-6-luna`, `gpt-6-astra`, `gpt-5.6-sol`,
  `gpt-5.6-terra`, `gpt-5.6-luna` (+ `gc-image-pro*`).
- `index.ts` catalog runtime sudah fetch `/v1/models` per key (fallback ke daftar
  bundled). Jadi **katalog provider** sudah dinamis.
- Yang statis adalah **allowlist agent**: `applyGrowthCircleModelCatalogPreset`
  menulis `agents.defaults.models[<ref>]` dari `growthCircleModelRefsForTier` saat
  onboarding, dan auth method team memakai `allowedKeys: TEAM_TEXT_MODEL_REFS`.
  OpenClaw menolak `/model` untuk ref yang tidak ada di situ
  ("Model … is not available for this agent").
- Merge saat ini hanya menambah: ref lama (`gpt-5.5`, `gpt-5.6`) dan fallback lama
  tidak pernah dibersihkan, sementara `primary` ditimpa default tier.
- Kasus nyata: VPS member (OpenClaw 2026.9.2, gc-provider 0.1.33) — primary
  `growthcircle/gpt-5.5`, tidak ada gpt-6 di allowlist; diperbaiki manual 19 Okt.
- Dok OpenClaw: `agents.defaults.models["provider/*"]` adalah pola resmi untuk
  provider dinamis (contoh vLLM), model baru muncul tanpa edit allowlist.
- `openclaw plugins update` tidak otomatis; member harus menjalankannya.

## Keputusan terkunci

- Provider id tetap `growthcircle`, base URL `https://ai.growthcircle.id/v1`.
- Minimum OpenClaw tetap `2026.5.4` kecuali wildcard terbukti tidak didukung di
  versi itu (lihat Risiko).
- Setup CLI (`src/setup/`) tidak disentuh.
- Rilis mengikuti Release Workflow di `AGENTS.md` (npm → tag → ClawHub dari tag).
- Server GrowthCircle / gateway tidak diubah di plan ini.

## Wave A — Katalog & allowlist

### A1. Katalog Team diperbarui
**Files:** `src/provider.ts`, `openclaw.plugin.json`, `hermes/plugins/model-providers/growthcircle/__init__.py`, `README.md`, `test/provider.test.ts`
**Pendekatan:** `TEAM_TEXT_MODEL_IDS` = 7 model team di atas; default team =
`gpt-6.1-sol`; `gpt-6*` masuk `GROWTHCIRCLE_REASONING_MODEL_IDS`. Manifest
allowlist/catalog dan fallback Hermes digenerate dari sumber yang sama.
**EARS**
- **AC-CAT-001:** When a team key is configured, the system shall set the default model to `growthcircle/gpt-6.1-sol`.
- **AC-CAT-002:** The system shall list exactly the 7 team text models in `TEAM_TEXT_MODEL_IDS`, the manifest team `allowedKeys`, and the Hermes team fallback.
- **AC-CAT-003 — Unwanted:** If a model id is `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`, or bare `gpt-5.6`, then the system shall not include it in any team list.

### A2. Allowlist wildcard + pembersihan ref basi
**Files:** `src/provider.ts`, `index.ts`, `test/provider.test.ts`
**Pendekatan:** saat apply defaults, tulis `agents.defaults.models["growthcircle/*"] = {}`
selain ref tier (ref eksplisit tetap untuk alias/metadata). Hapus dari
`agents.defaults.models`, `model.primary`, dan `model.fallbacks` hanya ref
`growthcircle/<id>` yang ada di daftar retired (`gpt-5.5`, `gpt-5.4`,
`gpt-5.4-mini`, `gpt-5.6`, `gpt-5.3-codex`) untuk tier team/paid sesuai kebijakan
gateway. Ref provider lain tidak disentuh.
**EARS**
- **AC-ALW-001:** When defaults are applied for any tier, the system shall add `growthcircle/*` to `agents.defaults.models`.
- **AC-ALW-002:** When a team config contains `growthcircle/gpt-5.5` as primary or fallback, the system shall replace the primary with the tier default and drop the retired fallback.
- **AC-ALW-003 — Unwanted:** If a fallback or allowlist entry belongs to another provider (e.g. `google/…`), then the system shall keep it unchanged and in order.
- **AC-ALW-004 — Unwanted:** If defaults are applied twice, then the system shall produce an identical config (idempotent).

## Wave B — Verifikasi di OpenClaw nyata

### B1. Uji di VPS member (OpenClaw 2026.9.2) dengan izin
**Files:** —
**Pendekatan:** pasang tarball lokal (`npm pack`) via `openclaw plugins install <tgz> --force`,
jalankan `openclaw configure --section=model`, backup config dulu, restore jika gagal.
**EARS**
- **AC-E2E-001:** When the updated plugin is installed and configure is run with the team key, `/model growthcircle/gpt-6-luna` shall be accepted without editing `openclaw.json` by hand.
- **AC-E2E-002:** When a model that is not in the bundled list is returned by `/v1/models`, the system shall make it selectable via the wildcard (checked by `openclaw models list --agent <id> --provider growthcircle`).
- **AC-E2E-003 — Unwanted:** If the install or configure fails, then the original `openclaw.json` shall be restored from backup and channels shall report OK.

## Wave C — Rilis

### C1. Publish 0.1.37
**Files:** `package.json`, `package-lock.json`, `openclaw.plugin.json`, `CHANGELOG.md`, `README.md`
**Pendekatan:** Release Workflow `AGENTS.md` langkah 1–9. Publish npm/ClawHub
dijalankan oleh pemegang akses (lihat Pertanyaan 1).
**EARS**
- **AC-REL-001:** When the release is done, `npm view gc-provider version` and `clawhub package inspect gc-provider` shall both report `0.1.37`.
- **AC-REL-002:** The system shall pass `npm run prepublishOnly` and `npm pack --dry-run` before publish.
- **AC-REL-003 — Unwanted:** If `npm run prepublishOnly` fails, then the release shall stop before any publish.

## Urutan implementasi & gate

A1 → A2 (file sama, berurutan) → `npm run typecheck` + `npm test` hijau →
B1 di VPS → C1. Pengumuman WhatsApp dikirim hanya setelah AC-REL-001 PASS.

## Out of scope

- Katalog Paid/Free (tetap dari discovery runtime; hanya ref retired yang dibersihkan).
- Generator config di `/app/ai` growthcircle.id dan pesan error gateway (plan terpisah).
- Pemisahan provider free/team untuk member yang memasang dua key.

## Risiko

- **MEDIUM** — wildcard `growthcircle/*` di `agents.defaults.models` didokumentasikan
  di OpenClaw terbaru; belum terbukti di 2026.5.4. Mitigasi: ref eksplisit tetap
  ditulis, wildcard hanya tambahan; uji di 2026.9.2 (B1).
- **MEDIUM** — pembersihan ref mengubah primary member. Dibatasi ke daftar retired
  dan hanya provider `growthcircle`.
- **LOW** — tidak ada uang/auth/migrasi server yang berubah.

## Go / No-Go rilis

- [ ] AC-CAT, AC-ALW PASS (tests)
- [ ] AC-E2E-001..003 PASS di VPS
- [ ] Akses publish npm + ClawHub tersedia
- [ ] CHANGELOG + README diperbarui
