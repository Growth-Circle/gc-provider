import { parseDocument } from "yaml";
// The Document API is used rather than parse/stringify so comments and key
// order in a user's trae_config.yaml survive the round trip.
export function readYaml(text) {
    const doc = parseYamlDocument(text);
    if (!doc || doc.errors.length > 0)
        return undefined;
    return doc.toJS();
}
/** True when the text is present but not valid YAML, meaning we must not write it. */
export function isUnparseableYaml(text) {
    if (!text || text.trim().length === 0)
        return false;
    const doc = parseYamlDocument(text);
    return !doc || doc.errors.length > 0;
}
export function getYamlIn(text, path) {
    let current = readYaml(text);
    for (const key of path) {
        if (current === null || typeof current !== "object")
            return undefined;
        current = current[key];
    }
    return current;
}
export function setYamlIn(text, path, value) {
    const doc = ensureMappingDocument(text);
    doc.setIn(path, value);
    return render(doc, text);
}
export function removeYamlIn(text, path) {
    const doc = ensureMappingDocument(text);
    if (doc.getIn(path) !== undefined)
        doc.deleteIn(path);
    return render(doc, text);
}
/**
 * Removes `path` and then its parent map when that leaves the parent empty, so
 * uninstalling does not leave `models: {}` behind in a file we did not create.
 */
export function removeYamlInPruningParent(text, path) {
    const next = removeYamlIn(text, path);
    if (path.length < 2)
        return next;
    const parentPath = path.slice(0, -1);
    const parent = getYamlIn(next, parentPath);
    if (parent && typeof parent === "object" && Object.keys(parent).length === 0) {
        return removeYamlIn(next, parentPath);
    }
    return next;
}
function render(doc, original) {
    return doc.toString({ lineWidth: 0, indent: detectYamlIndent(original) });
}
/** Keeps the file's existing indentation width instead of imposing the default. */
export function detectYamlIndent(text) {
    if (!text)
        return 2;
    for (const line of text.split(/\r?\n/u)) {
        const match = /^( +)\S/u.exec(line);
        if (match)
            return Math.max(1, (match[1] ?? "  ").length);
    }
    return 2;
}
function parseYamlDocument(text) {
    if (text === null)
        return null;
    return parseDocument(text);
}
/**
 * Returns a document guaranteed to have a mapping at the root, so setIn can
 * create nested keys in a brand new file.
 */
function ensureMappingDocument(text) {
    const doc = parseDocument(text && text.trim().length > 0 ? text : "");
    if (doc.contents === null) {
        doc.contents = doc.createNode({});
    }
    return doc;
}
