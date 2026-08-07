import { applyEdits, modify, parse } from "jsonc-parser";
/** Parses JSON with comments and trailing commas. Returns undefined when unparseable. */
export function readJsonc(text) {
    if (!text || text.trim().length === 0)
        return undefined;
    const errors = [];
    const value = parse(text, errors, { allowTrailingComma: true, disallowComments: false });
    if (errors.length > 0)
        return undefined;
    return value;
}
/** True when the text is present but not valid JSONC, meaning we must not write it. */
export function isUnparseableJsonc(text) {
    if (!text || text.trim().length === 0)
        return false;
    return readJsonc(text) === undefined;
}
export function getJsoncIn(text, path) {
    const root = readJsonc(text);
    if (root === undefined)
        return undefined;
    let current = root;
    for (const segment of path) {
        if (current === null || typeof current !== "object")
            return undefined;
        current = current[segment];
    }
    return current;
}
/** Replaces the value at `path`, creating intermediate objects as needed. */
export function setJsoncIn(text, path, value) {
    const source = normalizeSource(text);
    const edits = modify(source, path, value, {
        formattingOptions: formattingOptionsFor(source),
    });
    return ensureTrailingNewline(applyEdits(source, edits));
}
/** Deletes the property at `path`. A no-op when it is already absent. */
export function removeJsoncIn(text, path) {
    const source = normalizeSource(text);
    if (getJsoncIn(source, path) === undefined)
        return ensureTrailingNewline(source);
    const edits = modify(source, path, undefined, {
        formattingOptions: formattingOptionsFor(source),
    });
    return ensureTrailingNewline(applyEdits(source, edits));
}
function normalizeSource(text) {
    if (!text || text.trim().length === 0)
        return "{}\n";
    return text;
}
function formattingOptionsFor(source) {
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
export function detectIndent(source) {
    for (const line of source.split(/\r?\n/u)) {
        if (line.trim().length === 0)
            continue;
        const match = /^([ \t]+)/u.exec(line);
        if (!match)
            continue;
        const indent = match[1] ?? "";
        if (indent.startsWith("\t"))
            return { tabSize: 2, insertSpaces: false };
        return { tabSize: indent.length, insertSpaces: true };
    }
    return { tabSize: 2, insertSpaces: true };
}
function ensureTrailingNewline(text) {
    return text.endsWith("\n") ? text : `${text}\n`;
}
