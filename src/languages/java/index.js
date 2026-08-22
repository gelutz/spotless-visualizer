import { registerLanguage } from "../registry.js";
import { GENERIC_STEPS } from "../shared/steps/index.js";
import { JAVA_FORMATTERS } from "./formatters.js";
import { JAVA_STEPS } from "./steps/index.js";

export const java = registerLanguage({
  id: "java",
  label: "Java",
  fileName: "Example.java",
  blockName: "java",
  formatters: JAVA_FORMATTERS,
  // Java-specific steps run before the generic ones: reordering imports before
  // trimming whitespace is the order Spotless itself documents.
  steps: [...JAVA_STEPS, ...GENERIC_STEPS],
  stepGroups: [
    { id: "java",    title: "Java steps" },
    { id: "generic", title: "Generic steps" }
  ],
  // Shown above the reformatter list. Language-specific because the reason the
  // formatters are snapshots is language-specific (they need a JVM).
  formatterNote: "Real formatters can't run in a browser &mdash; these are hand-written " +
    "illustrative snapshots. Every step below is really executed on top of the one you pick."
});
