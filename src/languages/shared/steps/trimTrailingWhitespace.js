export const trimTrailingWhitespace = {
  id: "trimTrailingWhitespace",
  label: "trimTrailingWhitespace",
  group: "generic",
  doc: "Strips whitespace at end of every line.",
  opts: [],
  apply(src) {
    return src.split("\n").map(l => l.replace(/[ \t]+$/, "")).join("\n");
  },
  gradle: () => "trimTrailingWhitespace()",
  maven:  () => "<trimTrailingWhitespace/>"
};
