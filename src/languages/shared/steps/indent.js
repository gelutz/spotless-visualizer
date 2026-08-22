import { TAB, SPACE } from "../../../core/chars.js";

export const indent = {
  id: "indent",
  label: "indent (leadingTabsToSpaces)",
  group: "generic",
  doc: "Normalizes leading indentation to spaces or to tabs.",
  opts: [
    { id: "spaces",       type: "bool", def: true },
    { id: "spacesPerTab", type: "int",  def: 4 }
  ],
  apply(src, o) {
    const n = Math.max(1, o.spacesPerTab | 0);
    return src.split("\n").map(line => {
      const m = line.match(/^([ \t]*)(.*)$/);
      // A tab advances to the next multiple of n, it is not worth n columns.
      let width = 0;
      for (const ch of m[1]) width += ch === "\t" ? n - (width % n) : 1;
      const indent = o.spaces
        ? SPACE.repeat(width)
        : TAB.repeat(Math.floor(width / n)) + SPACE.repeat(width % n);
      return indent + m[2];
    }).join("\n");
  },
  gradle: o => o.spaces ? `leadingTabsToSpaces(${o.spacesPerTab})` : "leadingSpacesToTabs()",
  maven:  o => `<indent>\n  <spaces>${o.spaces}</spaces>\n  <spacesPerTab>${o.spacesPerTab}</spacesPerTab>\n</indent>`
};
