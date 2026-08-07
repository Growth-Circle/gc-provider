import type { Adapter, SetupContext } from "../types.js";
export declare const MODEL_ENTRY = "growthcircle_model";
/** trae-agent reads trae_config.yaml from the working directory. */
export declare function traeConfigPath(ctx: SetupContext): string;
export declare const traeAgentAdapter: Adapter;
