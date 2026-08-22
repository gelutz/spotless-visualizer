import { esc } from "../../../core/html.js";

export const licenseHeader = {
  id: "licenseHeader",
  label: "licenseHeader",
  group: "java",
  doc: "Inserts (or updates) a header above the delimiter. $YEAR expands to the current year.",
  opts: [
    { id: "content",   type: "text", def: "/* (C)$YEAR MyCompany */", wide: true },
    { id: "delimiter", type: "text", def: "package " }
  ],
  apply(src, o) {
    const header = o.content.replace(/\$YEAR/g, String(new Date().getFullYear()));
    const lines = src.split("\n");
    const at = lines.findIndex(l => l.startsWith(o.delimiter));
    if (at < 0) return header + "\n" + src;
    // Drop anything already above the delimiter, then insert.
    return header + "\n" + lines.slice(at).join("\n");
  },
  gradle: o => `licenseHeader '${o.content}'` + (o.delimiter === "package " ? "" : `, '${o.delimiter}'`),
  maven:  o => `<licenseHeader>\n  <content>${esc(o.content)}</content>` +
               (o.delimiter === "package " ? "" : `\n  <delimiter>${esc(o.delimiter)}</delimiter>`) +
               `\n</licenseHeader>`
};
