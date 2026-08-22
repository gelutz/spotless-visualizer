import { esc } from "../../../core/html.js";
import { splitImportBlock, parseImports, renderImport } from "../helpers.js";

export const importOrder = {
  id: "importOrder",
  label: "importOrder",
  group: "java",
  doc: "Sorts imports into groups. Comma-separated; empty slot = catch-all, \\# prefix = static.",
  opts: [
    { id: "order",         type: "text", def: "java|javax,,\\#", wide: true },
    { id: "wildcardsLast", type: "bool", def: false },
    { id: "semanticSort",  type: "bool", def: false }
  ],
  apply(src, o) {
    const blk = splitImportBlock(src);
    if (!blk) return src;
    const { lines, first, last } = blk;
    const imports = parseImports(lines, first, last);

    const groups = o.order.split(",").map(g => g.trim());
    const buckets = groups.map(() => []);
    const catchAllIdx = groups.findIndex(g => g === "");
    const staticCatchAll = groups.findIndex(g => g === "\\#" || g === "#");

    const score = (g, imp) => {
      const isStatic = g.startsWith("\\#") || g.startsWith("#");
      if (isStatic !== imp.static) return -1;
      const prefixes = g.replace(/^\\?#/, "").split("|").filter(Boolean);
      if (!prefixes.length) return 0;                    // bare catch-all for this staticness
      let best = -1;
      for (const p of prefixes) {
        if (imp.name === p || imp.name.startsWith(p + ".")) best = Math.max(best, p.length);
      }
      return best;
    };

    for (const imp of imports) {
      let bestIdx = -1, bestScore = -1;
      groups.forEach((g, i) => {
        const s = score(g, imp);
        if (s > bestScore) { bestScore = s; bestIdx = i; }
      });
      if (bestScore <= 0) {
        bestIdx = imp.static
          ? (staticCatchAll >= 0 ? staticCatchAll : (catchAllIdx >= 0 ? catchAllIdx : 0))
          : (catchAllIdx >= 0 ? catchAllIdx : 0);
      }
      buckets[bestIdx].push(imp);
    }

    const cmp = (a, b) => {
      if (o.wildcardsLast) {
        const aw = a.name.endsWith(".*"), bw = b.name.endsWith(".*");
        if (aw !== bw) return aw ? 1 : -1;
      }
      if (o.semanticSort) {
        // Sort by package first, then by simple name.
        const ap = a.name.split("."), bp = b.name.split(".");
        const apk = ap.slice(0, -1).join("."), bpk = bp.slice(0, -1).join(".");
        if (apk !== bpk) return apk < bpk ? -1 : 1;
        return ap[ap.length - 1] < bp[bp.length - 1] ? -1 : 1;
      }
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    };

    const rendered = [];
    buckets.forEach(b => {
      if (!b.length) return;
      if (rendered.length) rendered.push("");
      b.sort(cmp).forEach(i => rendered.push(renderImport(i)));
    });

    return lines.slice(0, first).concat(rendered, lines.slice(last + 1)).join("\n");
  },
  gradle: o => {
    const args = o.order.split(",").map(g => `'${g.trim()}'`).join(", ");
    let s = `importOrder(${args})`;
    if (o.wildcardsLast) s += "\n// wildcardsLast is Maven-only in this visualizer";
    return s;
  },
  maven: o => {
    let s = `<importOrder>\n  <order>${esc(o.order)}</order>`;
    if (o.wildcardsLast) s += `\n  <wildcardsLast>true</wildcardsLast>`;
    if (o.semanticSort)  s += `\n  <semanticSort>true</semanticSort>`;
    return s + `\n</importOrder>`;
  }
};
