import { rspack } from "@rspack/core";
import * as fs from "node:fs";
import * as path from "node:path";
import webpack from "webpack";

import { RandomIdsPlugin as RspackRandomIdsPlugin } from "./random-ids-rspack.ts";
import { RandomIdsPlugin as WebpackRandomIdsPlugin } from "./random-ids-webpack.ts";

type Bundler = "webpack" | "rspack";

const root = import.meta.dirname;

function config(bundler: Bundler, seed: number, mode: "random" | "builtin") {
    const out = path.join(root, "out", `${bundler}-${mode}-${seed}`);
    const random = mode === "random";
    return {
        context: root,
        mode: "production" as const,
        entry: "./src/index.js",
        devtool: false as const,
        output: { path: out, filename: "main.js", chunkFilename: "chunk-[id].js", clean: true },
        optimization: {
            minimize: false,
            concatenateModules: false,
            // ids are assigned by the plugin when `random`, otherwise by the built-in algorithm
            moduleIds: random ? (false as const) : ("deterministic" as const),
            // webpack: the plugin assigns chunk ids. rspack: there is no way to, so the built-in algorithm stays
            // (see chunk-ids-false.ts for what happens when rspack is given `chunkIds: false`)
            chunkIds: random && bundler === "webpack" ? (false as const) : ("deterministic" as const),
        },
        plugins: random ? [bundler === "webpack" ? new WebpackRandomIdsPlugin(seed) : new RspackRandomIdsPlugin(seed)] : [],
    };
}

async function build(bundler: Bundler, seed: number, mode: "random" | "builtin") {
    const cfg = config(bundler, seed, mode);
    const run = bundler === "webpack" ? webpack : rspack;
    const stats = await new Promise<any>((resolve, reject) => {
        (run as any)(cfg, (err: Error | null, s: any) => err ? reject(err) : resolve(s));
    });
    if (stats.hasErrors()) {
        return { error: stats.toString({ all: false, errors: true }).split("\n").slice(0, 4).join(" ") };
    }
    const json = stats.toJson({ ids: true, modules: true, chunks: true, assets: false, source: false });
    const moduleIds = (json.modules as Array<{ name?: string; identifier?: string; id: string | number }>)
        .filter(m => m.name?.includes("src/"))
        .map(m => `${path.basename(m.name!.split("?")[0])}=${m.id}`).sort().join(" ");
    const chunkIds = (json.chunks as Array<{ id: string | number; names: string[]; files: string[] }>)
        .map(c => `${c.files[0] ?? c.names[0]}=${c.id}`).sort().join(" ");
    return { chunkIds, moduleIds };
}

const rows: Array<Record<string, unknown>> = [];
for (const bundler of ["webpack", "rspack"] as const) {
    for (const mode of ["builtin", "random"] as const) {
        for (const seed of [1, 1, 2]) {
            rows.push({ bundler, mode, seed, ...await build(bundler, seed, mode) });
        }
    }
}
for (const r of rows) console.log(`${r.bundler} ${r.mode} seed=${r.seed}\n  modules: ${r.moduleIds}\n  chunks:  ${r.chunkIds}`);

function verdict(bundler: Bundler, kind: "chunkIds" | "moduleIds") {
    const [seed1, seed1Again, seed2] = rows.filter(r => r.bundler === bundler && r.mode === "random");
    return `${bundler} ${kind}: same seed -> same ids: ${seed1[kind] === seed1Again[kind]}; different seed -> different ids: ${seed1[kind] !== seed2[kind]}`;
}

console.log("\n" + (["webpack", "rspack"] as const).flatMap(b => (["moduleIds", "chunkIds"] as const).map(k => verdict(b, k))).join("\n"));
