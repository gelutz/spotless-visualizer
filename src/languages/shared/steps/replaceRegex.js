import { esc } from "../../../core/html.js";

export const replaceRegex = {
  id: "replaceRegex",
  label: "replaceRegex",
  group: "generic",
  doc: "Regex replacement with $1-style backreferences.",
  opts: [
    { id: "name",        type: "text", def: "No empty lines after brace" },
    { id: "searchRegex", type: "text", def: "\\{\\n\\n", wide: true },
    { id: "replacement", type: "text", def: "{\\n" }
  ],
  apply(src, o) {
    if (!o.searchRegex) return src;
    try {
      const pattern = o.searchRegex.replace(/\\n/g, "\n");
      const repl = o.replacement.replace(/\\n/g, "\n");
      return src.replace(new RegExp(pattern, "gm"), repl);
    } catch {
      return src;                                        // invalid regex mid-typing
    }
  },
  gradle: o => `replaceRegex '${o.name}', '${o.searchRegex}', '${o.replacement}'`,
  maven:  o => `<replaceRegex>\n  <name>${esc(o.name)}</name>\n  <searchRegex>${esc(o.searchRegex)}</searchRegex>\n  <replacement>${esc(o.replacement)}</replacement>\n</replaceRegex>`
};
