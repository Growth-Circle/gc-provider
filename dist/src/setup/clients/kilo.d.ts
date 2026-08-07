import type { Adapter, SetupContext } from "../types.js";
/**
 * Written to the global config on purpose: Kilo only resolves `{env:VAR}` in
 * trusted locations, and a project-level kilo.json would leave the key
 * unresolved.
 */
export declare function kiloConfigPath(ctx: SetupContext): string;
export declare const kiloAdapter: Adapter;
