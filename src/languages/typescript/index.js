import { registerLanguage } from "../registry.js";
import { GENERIC_STEPS } from "../shared/steps/index.js";
import { licenseHeaderFor } from "../shared/steps/licenseHeader.js";
import { TYPESCRIPT_FORMATTERS } from "./formatters.js";

/* TypeScript has no package statement, so the header goes above whatever
 * declaration comes first. Spotless's own README uses exactly this. */
const licenseHeader = licenseHeaderFor({
  delimiter: "(import|const|declare|export|var) ",
  group: "typescript"
});

export const typescript = registerLanguage({
  id: "typescript",
  label: "TypeScript",
  fileName: "Example.ts",
  blockName: "typescript",
  // Nobody adds Gradle or Maven to a TypeScript project to run Prettier, so the
  // config pane shows the files these tools actually read instead of a Spotless
  // block. Spotless does support typescript {}, but not in a repo that has no
  // JVM build to hang it off.
  builds: ["native"],
  // Mandatory here: unlike java {}, Spotless infers no file set for typescript
  // {} and the block is invalid without it.
  target: "src/**/*.ts",
  formatters: TYPESCRIPT_FORMATTERS,
  steps: [licenseHeader, ...GENERIC_STEPS],
  stepGroups: [
    { id: "typescript", title: "TypeScript steps" },
    { id: "generic",    title: "Generic steps" }
  ],
  // The opposite of Java's note, and the reason this language is here at all.
  formatterNote: "prettier() and biome() really run &mdash; what you see is their actual output, " +
    "on your own pasted source too. tsfmt() needs Node, so it stays a hand-written snapshot."
});
