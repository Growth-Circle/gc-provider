export declare function readYaml<T = unknown>(text: string | null): T | undefined;
/** True when the text is present but not valid YAML, meaning we must not write it. */
export declare function isUnparseableYaml(text: string | null): boolean;
export declare function getYamlIn<T = unknown>(text: string | null, path: string[]): T | undefined;
export declare function setYamlIn(text: string | null, path: string[], value: unknown): string;
export declare function removeYamlIn(text: string | null, path: string[]): string;
/**
 * Removes `path` and then its parent map when that leaves the parent empty, so
 * uninstalling does not leave `models: {}` behind in a file we did not create.
 */
export declare function removeYamlInPruningParent(text: string | null, path: string[]): string;
/** Keeps the file's existing indentation width instead of imposing the default. */
export declare function detectYamlIndent(text: string | null): number;
