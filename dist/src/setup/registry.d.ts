import type { Adapter } from "./types.js";
export declare const ADAPTERS: readonly Adapter[];
export declare function findAdapter(id: string): Adapter | undefined;
export declare const ADAPTER_IDS: string[];
/**
 * Clients whose provider settings live only in a GUI or vendor backend. There
 * is no file to write, so they get documentation instead of an adapter.
 */
export declare const MANUAL_CLIENTS: ReadonlyArray<{
    id: string;
    label: string;
    status: "manual" | "unsupported";
    note: string;
}>;
