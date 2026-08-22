/* Helpers shared by the Java import-manipulating steps. */

// The contiguous run of lines from the first `import` to the last. Returns null
// when the file has none.
export function splitImportBlock(src) {
  const lines = src.split("\n");
  let first = -1, last = -1;
  lines.forEach((l, i) => {
    if (/^\s*import\s+/.test(l)) {
      if (first < 0) first = i;
      last = i;
    }
  });
  if (first < 0) return null;
  return { lines, first, last };
}

export function parseImports(lines, first, last) {
  const out = [];
  for (let i = first; i <= last; i++) {
    const m = lines[i].match(/^\s*import\s+(static\s+)?([\w.*]+)\s*;/);
    if (m) out.push({ static: !!m[1], name: m[2] });
  }
  return out;
}

export function renderImport(imp) {
  return "import " + (imp.static ? "static " : "") + imp.name + ";";
}

// Every identifier-ish token outside the import block, used by
// removeUnusedImports to decide whether a simple name is referenced.
export function bodyTokens(lines, first, last) {
  const body = lines.filter((_, i) => i < first || i > last).join("\n");
  return new Set(body.match(/[A-Za-z_$][\w$]*/g) || []);
}
