import { type JSONPath } from "jsonc-parser";
export type JsoncPath = JSONPath;
/** Parses JSON with comments and trailing commas. Returns undefined when unparseable. */
export declare function readJsonc<T = unknown>(text: string | null): T | undefined;
/** True when the text is present but not valid JSONC, meaning we must not write it. */
export declare function isUnparseableJsonc(text: string | null): boolean;
export declare function getJsoncIn<T = unknown>(text: string | null, path: JsoncPath): T | undefined;
/** Replaces the value at `path`, creating intermediate objects as needed. */
export declare function setJsoncIn(text: string | null, path: JsoncPath, value: unknown): string;
/** Deletes the property at `path`. A no-op when it is already absent. */
export declare function removeJsoncIn(text: string | null, path: JsoncPath): string;
/**
 * Matches the file's existing indentation so an inserted block does not look
 * foreign next to hand-written settings.
 */
export declare function detectIndent(source: string): {
    tabSize: number;
    insertSpaces: boolean;
};
