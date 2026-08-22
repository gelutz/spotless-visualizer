/* Prettier, really running.
 *
 * Lazy because the three modules are ~300 KB gzipped and most visits never
 * pick a TypeScript formatter. The promise is cached, not the module, so
 * concurrent keystrokes share one import rather than racing it. */
let loading = null;

function load() {
  if (!loading) {
    loading = Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/estree"),
      import("prettier/plugins/typescript")
    ]).then(([prettier, estree, ts]) => ({ prettier, estree: estree.default || estree, ts: ts.default || ts }));
  }
  return loading;
}

export async function runPrettier(src, opts) {
  const { prettier, estree, ts } = await load();
  return prettier.format(src, {
    parser: "typescript",
    // Both are required: `typescript` parses, `estree` prints. Without estree
    // it fails at print time with an error that names neither.
    plugins: [estree, ts],
    ...opts
  });
}
