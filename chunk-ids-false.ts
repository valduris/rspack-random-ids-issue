// `optimization.chunkIds: false` is accepted by rspack's config types and documented as
// "allowing a custom plugin to provide chunk ids instead", but no JS API can provide them.
import { rspack } from "@rspack/core";
import * as path from "node:path";

const root = import.meta.dirname;

rspack({
    context: root,
    mode: "production",
    entry: "./src/index.js",
    output: { path: path.join(root, "out", "rspack-chunk-ids-false"), chunkFilename: "chunk-[id].js" },
    optimization: { minimize: false, chunkIds: false },
}, (error, stats) => {
    console.log("callback reached", { error: error?.message, hasErrors: stats?.hasErrors() });
});
