export const endWithNewline = {
  id: "endWithNewline",
  label: "endWithNewline",
  group: "generic",
  doc: "Guarantees exactly one newline at end of file.",
  opts: [],
  apply(src) {
    return src.replace(/\n*$/, "") + "\n";
  },
  gradle: () => "endWithNewline()",
  maven:  () => "<endWithNewline/>"
};
