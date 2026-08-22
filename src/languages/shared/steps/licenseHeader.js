import { esc } from "../../../core/html.js";

/* Spotless treats the delimiter as a regex for every language, not as a literal
 * prefix. Java's `package ` hid that - it is a regex that matches itself - but
 * TypeScript's `(import|const|declare|export|var) ` does not survive a
 * startsWith. */
function matcher(delimiter) {
  try {
    const re = new RegExp("^(?:" + delimiter + ")");
    return line => re.test(line);
  } catch {
    // A delimiter typed into a text input is a half-written regex most of the
    // time. Falling back to a literal match keeps the pane rendering.
    return line => line.startsWith(delimiter);
  }
}

/* Built per language rather than shared as one object: the delimiter default
 * differs, and both emitters compare against it to decide whether the second
 * argument is worth writing out at all. */
export function licenseHeaderFor({ delimiter, group = "generic" }) {
  return {
    id: "licenseHeader",
    label: "licenseHeader",
    group,
    doc: "Inserts (or updates) a header above the delimiter. $YEAR expands to the current year. " +
         "The delimiter is a regex, matched at the start of a line.",
    opts: [
      { id: "content",   type: "text", def: "/* (C)$YEAR MyCompany */", wide: true },
      { id: "delimiter", type: "text", def: delimiter, wide: true }
    ],
    apply(src, o) {
      const header = o.content.replace(/\$YEAR/g, String(new Date().getFullYear()));
      const lines = src.split("\n");
      const at = lines.findIndex(matcher(o.delimiter));
      if (at < 0) return header + "\n" + src;
      // Drop anything already above the delimiter, then insert.
      return header + "\n" + lines.slice(at).join("\n");
    },
    gradle: o => `licenseHeader '${o.content}'` + (o.delimiter === delimiter ? "" : `, '${o.delimiter}'`),
    maven:  o => `<licenseHeader>\n  <content>${esc(o.content)}</content>` +
                 (o.delimiter === delimiter ? "" : `\n  <delimiter>${esc(o.delimiter)}</delimiter>`) +
                 `\n</licenseHeader>`
  };
}
