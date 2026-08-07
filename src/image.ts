import type {
  GeneratedImageAsset,
  ImageGenerationProvider,
  ImageGenerationRequest,
} from "openclaw/plugin-sdk/image-generation";
import { isProviderApiKeyConfigured } from "openclaw/plugin-sdk/provider-auth";
import { resolveApiKeyForProvider } from "openclaw/plugin-sdk/provider-auth-runtime";
import {
  BASE_URL,
  DEFAULT_FREE_IMAGE_MODEL_ID,
  DEFAULT_IMAGE_MODEL_ID,
  PROVIDER_ID,
  PROVIDER_LABEL,
  TEAM_IMAGE_MODEL_IDS,
  growthCircleDefaultImageModelRefForApiKey,
  isGrowthCircleFreeApiKey,
  isRecord,
  readString,
} from "./provider.js";

type GrowthCircleImageGenerationProvider = ImageGenerationProvider & {
  capabilities: ImageGenerationProvider["capabilities"] & {
    output?: {
      formats: string[];
    };
  };
};

type GrowthCircleImageGenerationRequest = ImageGenerationRequest & {
  outputFormat?: string;
};

export function buildGrowthCircleImageGenerationProvider(): ImageGenerationProvider {
  const provider: GrowthCircleImageGenerationProvider = {
    id: PROVIDER_ID,
    label: "GrowthCircle.id",
    defaultModel: DEFAULT_IMAGE_MODEL_ID,
    models: [...TEAM_IMAGE_MODEL_IDS, DEFAULT_FREE_IMAGE_MODEL_ID],
    isConfigured: ({ agentDir }) =>
      isProviderApiKeyConfigured({
        provider: PROVIDER_ID,
        agentDir,
      }),
    capabilities: {
      generate: {
        maxCount: 4,
        supportsSize: true,
        supportsAspectRatio: true,
      },
      edit: {
        enabled: false,
      },
      geometry: {
        aspectRatios: ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
      },
      output: {
        formats: ["png", "jpeg", "webp"],
      },
    },
    async generateImage(req) {
      const auth = await resolveApiKeyForProvider({
        provider: PROVIDER_ID,
        cfg: req.cfg,
        agentDir: req.agentDir,
        store: req.authStore,
      });
      if (!auth.apiKey) throw new Error(`${PROVIDER_LABEL} API key missing`);
      if ((req.inputImages?.length ?? 0) > 0) {
        throw new Error(`${PROVIDER_LABEL} image editing is not enabled yet; use text-to-image generation only.`);
      }

      const model = normalizeGrowthCircleImageModel(req.model, auth.apiKey);
      const payload = await createGrowthCircleImageTask({
        req,
        apiKey: auth.apiKey,
        model,
      });
      const finalPayload = await resolveGrowthCircleImagePayload({
        payload,
        apiKey: auth.apiKey,
        timeoutMs: req.timeoutMs,
      });
      const images = await extractGrowthCircleGeneratedImages(finalPayload);
      if (images.length === 0) throw new Error(`${PROVIDER_LABEL} image generation response missing image data`);

      return {
        images,
        model,
        metadata: buildGrowthCircleImageMetadata(finalPayload),
      };
    },
  };
  return provider;
}

async function createGrowthCircleImageTask(params: {
  req: ImageGenerationRequest;
  apiKey: string;
  model: string;
}): Promise<unknown> {
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.req.prompt,
    n: params.req.count ?? 1,
    size: resolveGrowthCircleImageSize(params.req),
  };
  const outputFormat = (params.req as GrowthCircleImageGenerationRequest).outputFormat;
  if (outputFormat) body.response_format = outputFormat === "jpeg" ? "url" : outputFormat;

  const response = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(params.req.timeoutMs ?? 120_000),
  });

  const payload = await readJsonOrText(response);
  if (!response.ok) throw new Error(`${PROVIDER_LABEL} image generation failed HTTP ${response.status}: ${growthCircleErrorMessage(payload)}`);
  return payload;
}

async function resolveGrowthCircleImagePayload(params: {
  payload: unknown;
  apiKey: string;
  timeoutMs?: number;
}): Promise<unknown> {
  const taskId = extractGrowthCircleTaskId(params.payload);
  if (!taskId) return params.payload;

  const timeoutMs = params.timeoutMs ?? 180_000;
  const started = Date.now();
  let lastPayload: unknown = params.payload;
  while (Date.now() - started < timeoutMs) {
    await delay(2_000);
    const response = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(taskId)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      signal: AbortSignal.timeout(Math.min(30_000, timeoutMs)),
    });
    const payload = await readJsonOrText(response);
    if (!response.ok) throw new Error(`${PROVIDER_LABEL} task polling failed HTTP ${response.status}: ${growthCircleErrorMessage(payload)}`);
    lastPayload = payload;
    const status = extractGrowthCircleTaskStatus(payload);
    if (status && ["failed", "error", "cancelled", "canceled"].includes(status)) {
      throw new Error(`${PROVIDER_LABEL} image task ${status}: ${growthCircleErrorMessage(payload)}`);
    }
    if (!status || ["succeeded", "success", "completed", "complete", "done"].includes(status)) {
      const images = await extractGrowthCircleGeneratedImages(payload);
      if (images.length > 0) return payload;
    }
  }

  throw new Error(`${PROVIDER_LABEL} image task timed out: ${growthCircleErrorMessage(lastPayload)}`);
}

function normalizeGrowthCircleImageModel(modelRef: string | undefined, apiKey: string): string {
  const trimmed = modelRef?.trim() || growthCircleDefaultImageModelRefForApiKey(apiKey);
  const modelId = trimmed.startsWith(`${PROVIDER_ID}/`) ? trimmed.slice(PROVIDER_ID.length + 1) : trimmed;
  if (isGrowthCircleFreeApiKey(apiKey)) return DEFAULT_FREE_IMAGE_MODEL_ID;
  if (modelId === DEFAULT_FREE_IMAGE_MODEL_ID) return DEFAULT_IMAGE_MODEL_ID;
  if (modelId === "gpt-image-2") return DEFAULT_IMAGE_MODEL_ID;
  return modelId || DEFAULT_IMAGE_MODEL_ID;
}

function resolveGrowthCircleImageSize(req: ImageGenerationRequest): string {
  const size = req.size?.trim();
  if (size && /^\d+x\d+$/iu.test(size)) return size;

  const aspectRatio = req.aspectRatio?.trim() || (size && /^\d+:\d+$/u.test(size) ? size : undefined);
  switch (aspectRatio) {
    case "2:3":
      return "1024x1536";
    case "3:2":
      return "1536x1024";
    case "3:4":
      return "1024x1365";
    case "4:3":
      return "1365x1024";
    case "4:5":
      return "1024x1280";
    case "5:4":
      return "1280x1024";
    case "9:16":
      return "1024x1820";
    case "16:9":
      return "1820x1024";
    case "21:9":
      return "1792x768";
    case "1:1":
    default:
      return "1024x1024";
  }
}

function extractGrowthCircleTaskId(payload: unknown): string | undefined {
  for (const value of candidateRecords(payload)) {
    const id = readString(value.task_id) ?? readString(value.taskId) ?? readString(value.id);
    const object = readString(value.object);
    if (id && (!object || object.toLowerCase().includes("task"))) return id;
  }
  return undefined;
}

function extractGrowthCircleTaskStatus(payload: unknown): string | undefined {
  for (const value of candidateRecords(payload)) {
    const status = readString(value.status) ?? readString(value.state);
    if (status) return status.toLowerCase();
  }
  return undefined;
}

async function extractGrowthCircleGeneratedImages(payload: unknown): Promise<GeneratedImageAsset[]> {
  const entries = extractImageEntries(payload);
  const images: GeneratedImageAsset[] = [];
  let index = 0;
  for (const entry of entries) {
    const image = await imageEntryToAsset(entry, index + 1);
    if (!image) continue;
    images.push(image);
    index += 1;
  }
  return images;
}

function extractImageEntries(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const direct = [payload.data, payload.images, payload.output, payload.result, payload.response];
  for (const value of direct) {
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = extractImageEntries(value);
      if (nested.length > 0) return nested;
    }
  }
  if (readString(payload.url) || readString(payload.image_url) || readString(payload.b64_json) || readString(payload.base64)) {
    return [payload];
  }
  return [];
}

async function imageEntryToAsset(entry: unknown, index: number): Promise<GeneratedImageAsset | null> {
  if (typeof entry === "string") return imageStringToAsset(entry, index);
  if (!isRecord(entry)) return null;
  const b64 = readString(entry.b64_json) ?? readString(entry.base64) ?? readString(entry.image_base64);
  if (b64) return base64ToAsset(b64, index);
  const url = readString(entry.url) ?? readString(entry.image_url) ?? readString(entry.asset_url);
  if (!url) return null;
  return imageStringToAsset(url, index);
}

async function imageStringToAsset(value: string, index: number): Promise<GeneratedImageAsset | null> {
  if (value.startsWith("data:")) {
    const match = /^data:([^;,]+);base64,(.+)$/su.exec(value);
    if (!match) return null;
    return base64ToAsset(match[2] ?? "", index, match[1]);
  }
  if (/^[A-Za-z0-9+/=\r\n]+$/u.test(value) && value.length > 128) return base64ToAsset(value, index);

  const response = await fetch(value, { method: "GET", signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${PROVIDER_LABEL} image asset download failed HTTP ${response.status}`);
  const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType,
    fileName: `growthcircle-image-${index}.${imageExtensionForMimeType(mimeType)}`,
  };
}

function base64ToAsset(value: string, index: number, mimeType = "image/png"): GeneratedImageAsset {
  return {
    buffer: Buffer.from(value.replace(/\s+/gu, ""), "base64"),
    mimeType,
    fileName: `growthcircle-image-${index}.${imageExtensionForMimeType(mimeType)}`,
  };
}

function imageExtensionForMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  if (normalized.includes("webp")) return "webp";
  return "png";
}

function candidateRecords(payload: unknown): Record<string, unknown>[] {
  if (!isRecord(payload)) return [];
  const records = [payload];
  for (const key of ["result", "response", "task"] as const) {
    if (isRecord(payload[key])) records.push(payload[key]);
  }
  return records;
}

async function readJsonOrText(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function growthCircleErrorMessage(payload: unknown): string {
  if (typeof payload === "string") return payload.slice(0, 500);
  for (const record of candidateRecords(payload)) {
    const message = readString(record.message) ?? readString(record.error) ?? readString(record.detail) ?? readString(record.code);
    if (message) return message;
    if (isRecord(record.error)) {
      const nested = readString(record.error.message) ?? readString(record.error.code);
      if (nested) return nested;
    }
  }
  return "unknown error";
}

function buildGrowthCircleImageMetadata(payload: unknown): Record<string, unknown> | undefined {
  if (!isRecord(payload)) return undefined;
  const metadata: Record<string, unknown> = {};
  const taskId = extractGrowthCircleTaskId(payload);
  const status = extractGrowthCircleTaskStatus(payload);
  if (taskId) metadata.taskId = taskId;
  if (status) metadata.status = status;
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
