# Seeded random chunk/module ids: webpack vs rspack

Some projects want chunk and module ids that are reproducible for one build (same seed gives the same output) but
different for every release (seed = commit sha), so that a patch written against one release stops matching the
next. In webpack this is a ~15 line plugin per id kind.

This repo has that plugin for webpack and the closest equivalent possible in rspack 2.2.9, to show what is missing.

```sh
npm install
npm run repro         # node >= 22.18, runs .ts files directly
node chunk-ids-false.ts   # rspack panics, see below
```

## What `npm run repro` shows

It builds the same small app (entry + 8 dynamic imports) with each bundler, once with the built-in `deterministic`
ids and then with the seeded plugin, for seeds 1, 1 and 2.

| | same seed, same ids | different seed, different ids |
|---|---|---|
| webpack module ids (`compilation.hooks.moduleIds`) | yes | yes |
| webpack chunk ids (`compilation.hooks.chunkIds`) | yes | yes |
| rspack module ids (`compilation.hooks.beforeModuleIds`, `module.id = n`) | yes | yes |
| rspack chunk ids | n/a | **no, nothing can set them** |

Files:

- `random-ids-webpack.ts`: the webpack plugin (`optimization.chunkIds/moduleIds: false`, assigns in the hooks).
- `random-ids-rspack.ts`: the rspack plugin; works for modules only. Modules must be sorted by `identifier` before
  shuffling, because rspack passes them in a different order between runs (the same seed gave different ids without it).
- `chunk-ids-false.ts`: `optimization.chunkIds: false` is accepted and documented as "allowing a custom plugin to
  provide chunk ids instead", but no JS API can provide them. rspack aborts with
  `Should set id before calling expect_id` (exit code 134) instead of reporting an error.

## What is missing in rspack

A way to assign chunk ids from JS, the counterpart of `beforeModuleIds` (#12809). `afterOptimizeChunkIds` (#15372)
was reverted in #15471, and `Chunk.id` is read-only. The smallest possible change would be a `salt` option on the
built-in chunk id plugins, like `DeterministicModuleIdsPlugin` already has.
