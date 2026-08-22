import { esc } from "../../../core/html.js";

export const replace = {
  id: "replace",
  label: "replace",
  group: "generic",
  doc: "Plain string replacement. Dumb on purpose - it hits string literals and comments too.",
  opts: [
    { id: "name",        type: "text", def: "Say hello to Spotless" },
    { id: "search",      type: "text", def: "TODO" },
    { id: "replacement", type: "text", def: "FIXME" }
  ],
  apply(src, o) {
    return o.search ? src.split(o.search).join(o.replacement) : src;
  },
  gradle: o => `replace '${o.name}', '${o.search}', '${o.replacement}'`,
  maven:  o => `<replace>\n  <name>${esc(o.name)}</name>\n  <search>${esc(o.search)}</search>\n  <replacement>${esc(o.replacement)}</replacement>\n</replace>`
};
