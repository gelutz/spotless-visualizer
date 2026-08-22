import { esc } from "../../../core/html.js";
import { splitImportBlock, bodyTokens } from "../helpers.js";

export const removeUnusedImports = {
  id: "removeUnusedImports",
  label: "removeUnusedImports",
  group: "java",
  doc: "Drops imports whose simple name never appears in the file body.",
  opts: [
    { id: "engine", type: "select", def: "google-java-format",
      choices: ["google-java-format", "cleanthat-javaparser-unnecessaryimport"] }
  ],
  apply(src) {
    const blk = splitImportBlock(src);
    if (!blk) return src;
    const { lines, first, last } = blk;
    const used = bodyTokens(lines, first, last);
    const kept = [];
    for (let i = first; i <= last; i++) {
      const m = lines[i].match(/^\s*import\s+(static\s+)?([\w.*]+)\s*;/);
      if (!m) continue;                                  // blank line inside the block
      const simple = m[2].split(".").pop();
      if (simple === "*" || used.has(simple)) kept.push(lines[i].replace(/\s+$/, ""));
    }
    return lines.slice(0, first).concat(kept, lines.slice(last + 1)).join("\n");
  },
  gradle: o => o.engine === "google-java-format"
    ? "removeUnusedImports()"
    : `removeUnusedImports('${o.engine}')`,
  maven:  o => o.engine === "google-java-format"
    ? "<removeUnusedImports/>"
    : `<removeUnusedImports>\n  <engine>${esc(o.engine)}</engine>\n</removeUnusedImports>`
};
