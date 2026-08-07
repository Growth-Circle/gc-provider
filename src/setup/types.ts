import type { GrowthCircleKeyTier } from "../provider.js";

/** Where the model list came from, so the CLI can say so out loud. */
export type CatalogSource = "live" | "static";

export type GrowthCircleCatalog = {
  tier: GrowthCircleKeyTier;
  source: CatalogSource;
  /** Reason the live fetch was skipped or failed. Present only when source is "static". */
  fallbackReason?: string;
  /** Text model ids, already tier-normalized (free ids carry the -free suffix). */
  modelIds: string[];
  /** Preferred default for OpenAI-compatible clients. */
  defaultModelId: string;
  /** Preferred model id for the Anthropic Messages endpoint, or null when the tier has none. */
  anthropicModelId: string | null;
  /** Small/fast Anthropic model for background tasks, or null. */
  anthropicSmallModelId: string | null;
};

export type SetupContext = {
  catalog: GrowthCircleCatalog;
  /** Absolute home directory. Injected so tests never touch a real home. */
  home: string;
  /** Absolute working directory, for project-scoped configs like trae_config.yaml. */
  cwd: string;
};

/**
 * A single file the CLI will write. Adapters produce these and never touch disk;
 * reading, diffing, backing up and writing all happen in one place in cli.ts.
 */
export type FileEdit = {
  path: string;
  /** Current file content, or null when the file does not exist yet. */
  before: string | null;
  /** Desired content, or null to delete the file. */
  after: string | null;
  /** Human-readable bullets describing what changed. */
  summary: string[];
  /**
   * Set when the file exists but could not be parsed. The CLI refuses to write
   * these rather than risk clobbering a config it does not understand.
   */
  blocked?: string;
};

/** Filesystem questions an adapter may ask while detecting. */
export type Probe = {
  exists: (path: string) => boolean;
  hasBinary: (name: string) => boolean;
};

/** Reads a file for planning. Returns null when the file is absent. */
export type ReadFile = (path: string) => string | null;

export type Adapter = {
  id: string;
  label: string;
  /** Shown after a successful setup: how the user actually selects GrowthCircle. */
  usage: (ctx: SetupContext) => string[];
  /** True when this client looks installed on this machine. */
  detect: (ctx: SetupContext, probe: Probe) => boolean;
  /** Files this adapter would create or modify. Pure: no disk access. */
  install: (ctx: SetupContext, read: ReadFile) => FileEdit[];
  /** Reverses install. Returns [] when there is nothing to remove. */
  uninstall: (ctx: SetupContext, read: ReadFile) => FileEdit[];
  /** Extra environment variables this client needs beyond GROWTHCIRCLE_API_KEY. */
  extraEnv?: (ctx: SetupContext) => Array<{ name: string; value: string; note: string }>;
};
