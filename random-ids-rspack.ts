import type { Compiler } from "@rspack/core";

import { shuffled } from "./seeded-shuffle.ts";

/**
 * The closest equivalent rspack allows today.
 *
 * Modules: works through `compilation.hooks.beforeModuleIds` + `module.id = ...`
 * (with `optimization.moduleIds: false`). Modules must be sorted by identifier first, because rspack
 * passes them in a different order between runs.
 *
 * Chunks: there is no way to do the same. `optimization.chunkIds: false` is accepted, but there is no
 * hook to assign ids and `Chunk.id` is read-only, so with `false` the chunks simply get no usable ids.
 * This is what this issue asks for.
 */
export class RandomIdsPlugin {
    private readonly seed: number;

    public constructor(seed: number) {
        this.seed = seed;
    }

    public apply(compiler: Compiler): void {
        compiler.hooks.compilation.tap("RandomIdsPlugin", compilation => {
            compilation.hooks.beforeModuleIds.tap("RandomIdsPlugin", modules => {
                shuffled(modules, m => m.identifier, this.seed).forEach((module, i) => {
                    // `id` is a setter that rspack tracks; it is not declared as writable in the typings
                    (module as { id: string | number | null }).id = i;
                });
            });

            // The hook webpack plugins use for chunk ids does not exist in rspack:
            // (compilation.hooks as Record<string, unknown>).chunkIds === undefined
        });
    }
}
