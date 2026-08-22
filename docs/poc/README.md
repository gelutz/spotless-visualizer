# Proof-of-concept scripts

Runnable checks behind every "runs in a browser" claim in
`../typescript-support.md`. They use the Node distributions of the same
packages, because the browser and Node builds share one API - only the
entry point differs (`@biomejs/js-api/web` vs `/nodejs`).

```bash
npm i prettier@3 @biomejs/js-api @biomejs/wasm-nodejs \
      eslint-linter-browserify @typescript-eslint/parser typescript
node prettier.mjs                  # formats TS, options honoured
node biome.mjs                     # formats + lints TS via WASM (v6 projectKey API)
node eslint.mjs                    # autofixes TS with the browser Linter
node eslint-type-aware-fails.mjs   # shows type-aware rules cannot work: no filesystem
```

`eslint-type-aware-fails.mjs` is meant to fail. It is the evidence for the
sharpest limitation in the doc.
