import { esc } from "../../../core/html.js";

export const cleanthat = {
  id: "cleanthat",
  label: "cleanthat",
  group: "java",
  doc: "Automated refactoring. Illustrative subset here: literal boolean comparison + explicit generic type.",
  opts: [
    { id: "mutator", type: "select", def: "SafeAndConsensual",
      choices: ["SafeAndConsensual", "SafeButNotConsensual", "SafeButControversial"] }
  ],
  apply(src) {
    return src
      .replace(/\s*==\s*true\b/g, "")
      .replace(/\s*!=\s*false\b/g, "")
      .replace(/new\s+(\w+)<[\w.<>, ]+>\(/g, "new $1<>(");
  },
  gradle: o => `cleanthat().addMutator('${o.mutator}')`,
  maven:  o => `<cleanthat>\n  <mutators>\n    <mutator>${esc(o.mutator)}</mutator>\n  </mutators>\n</cleanthat>`
};
