import { esc } from "../../../core/html.js";

// Type annotations recognized out of the box. Spotless ships a longer list;
// this is the subset that shows up in the sample plus the common checker ones.
const KNOWN_TYPE_ANNOTATIONS = [
  "Nullable", "NonNull", "Nonnull", "Untainted", "Tainted",
  "ReadOnly", "Immutable", "Interned", "GuardedBy", "Positive",
  "MonotonicNonNull", "Initialized", "PolyNull", "KeyFor"
];

export const formatAnnotations = {
  id: "formatAnnotations",
  label: "formatAnnotations",
  group: "java",
  doc: "Pulls type annotations back onto the line of the type they annotate.",
  opts: [
    { id: "addTypeAnnotation", type: "text", def: "" }
  ],
  apply(src, o) {
    const known = new Set(KNOWN_TYPE_ANNOTATIONS);
    (o.addTypeAnnotation || "").split(",").map(s => s.trim()).filter(Boolean)
      .forEach(a => known.add(a.replace(/^@/, "")));

    const lines = src.split("\n");
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(\s*)@(\w+)(\([^)]*\))?\s*$/);
      if (m && known.has(m[2]) && i + 1 < lines.length && lines[i + 1].trim()) {
        const next = lines[i + 1].replace(/^\s*/, "");
        out.push(m[1] + "@" + m[2] + (m[3] || "") + " " + next);
        i++;                                             // consumed the next line too
        continue;
      }
      out.push(lines[i]);
    }
    return out.join("\n");
  },
  gradle: o => o.addTypeAnnotation
    ? `formatAnnotations().addTypeAnnotation('${o.addTypeAnnotation}')`
    : "formatAnnotations()",
  maven:  o => o.addTypeAnnotation
    ? `<formatAnnotations>\n  <addedTypeAnnotations>\n    <annotation>${esc(o.addTypeAnnotation)}</annotation>\n  </addedTypeAnnotations>\n</formatAnnotations>`
    : "<formatAnnotations/>"
};
