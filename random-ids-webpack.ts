import type { Compiler } from "webpack";

import { shuffled } from "./seeded-shuffle.ts";

/**
 * Works in webpack because `compilation.hooks.chunkIds` and `compilation.hooks.moduleIds` exist and
 * `chunk.id` / `chunkGraph.setModuleId()` can be used to assign ids from a plugin.
 * Requires `optimization: { chunkIds: false, moduleIds: false }`.
 */
export class RandomIdsPlugin {
    private readonly seed: number;

    public constructor(seed: number) {
        this.seed = seed;
    }

    public apply(compiler: Compiler): void {
        compiler.hooks.compilation.tap("RandomIdsPlugin", compilation => {
            compilation.hooks.chunkIds.tap("RandomIdsPlugin", chunks => {
                shuffled(chunks, c => c.name ?? [...compilation.chunkGraph.getChunkModulesIterable(c)].map(m => m.identifier()).sort().join("|"), this.seed)
                    .forEach((chunk, i) => {
                        chunk.id = i;
                        chunk.ids = [i];
                    });
            });
            compilation.hooks.moduleIds.tap("RandomIdsPlugin", modules => {
                shuffled(modules, m => m.identifier(), this.seed)
                    .forEach((module, i) => compilation.chunkGraph.setModuleId(module, i));
            });
        });
    }
}
