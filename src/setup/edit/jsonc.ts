import { applyEdits, modify, parse, type JSONPath, type ParseError } from "jsonc-parser";

// jsonc-parser is used instead of JSON.parse/stringify on purpose: these files
// belong to the user. Zed's settings.json in particular is usually full of
// comments, and round-tripping through JSON.stringify would silently delete
// them and reformat every untouched line.

export type JsoncPath = JSONPath;

/** Parses JSON with comments and trailing commas. Returns undefined when unparseable. */
export function readJsonc<T = unknown>(text: string | null): T | undefined {
  if (!text || text.trim().length === 0) return undefined;
  const errors: ParseError[] = [];
  const value = parse(text, errors, { allowTrailingComma: true, disallowComments: false }) as T | undefined;
  if (errors.length > 0) return undefined;
  return value;
}

/** True when the text is present but not valid JSONC, meaning we must not write it. */
export function isUnparseableJsonc(text: string | null): boolean {
  if (!text || text.trim().length === 0) return false;
  return readJsonc(text) === undefined;
}

export function getJsoncIn<T = unknown>(text: string | null, path: JsoncPath): T | undefined {
  const root = readJsonc<Record<string, unknown>>(text);
  if (root === undefined) return undefined;
  let current: unknown = root;
  for (const segment of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[segment as string];
  }
  return current as T | undefined;
}

/** Replaces the value at `path`, creating intermediate objects as needed. */
export function setJsoncIn(text: string | null, path: JsoncPath, value: unknown): string {
  const source = normalizeSource(text);
  const edits = modify(source, path, value, {
    formattingOptions: formattingOptionsFor(source),
  });
  return ensureTrailingNewline(applyEdits(source, edits));
}

/** Deletes the property at `path`. A no-op when it is already absent. */
export function removeJsoncIn(text: string | null, path: JsoncPath): string {
  const source = normalizeSource(text);
  if (getJsoncIn(source, path) === undefined) return ensureTrailingNewline(source);
  const edits = modify(source, path, undefined, {
    formattingOptions: formattingOptionsFor(source),
  });
  return ensureTrailingNewline(applyEdits(source, edits));
}

function normalizeSource(text: string | null): string {
  if (!text || text.trim().length === 0) return "{}\n";
  return text;
}

function formattingOptionsFor(source: string) {
  const { tabSize, insertSpaces } = detectIndent(source);
  return {
    tabSize,
    insertSpaces,
    eol: source.includes("\r\n") ? "\r\n" : "\n",
  };
}

/**
 * Matches the file's existing indentation so an inserted block does not look
 * foreign next to hand-written settings.
 */
export function detectIndent(source: string): { tabSize: number; insertSpaces: boolean } {
  for (const line of source.split(/\r?\n/u)) {
    if (line.trim().length === 0) continue;
    const match = /^([ \t]+)/u.exec(line);
    if (!match) continue;
    const indent = match[1] ?? "";
    if (indent.startsWith("\t")) return { tabSize: 2, insertSpaces: false };
    return { tabSize: indent.length, insertSpaces: true };
  }
  return { tabSize: 2, insertSpaces: true };
}

function ensureTrailingNewline(text: string): string {
  return text.endsWith("\n") ? text : `${text}\n`;
}
