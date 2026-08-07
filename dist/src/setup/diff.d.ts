export type DiffOp = {
    kind: "add" | "del" | "ctx";
    text: string;
};
export declare function diffLines(before: string, after: string): DiffOp[];
/**
 * Renders the change as prefixed lines, keeping `context` unchanged lines
 * around each edit and collapsing the rest into a count so the user can see at
 * a glance that the untouched parts of their config stayed untouched.
 */
export declare function renderDiff(before: string | null, after: string, options?: {
    context?: number;
}): string[];
