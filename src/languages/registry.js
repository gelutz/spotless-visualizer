/* The language registry.
 *
 * A language is everything the app needs to visualize Spotless for one file
 * type. Registering one is the only thing adding Kotlin, Scala or JavaScript
 * should require - no core or UI file has to change.
 *
 *   registerLanguage({
 *     id:         "java",             // stable key, used in state and the URL hash
 *     label:      "Java",             // shown on the language tab
 *     fileName:   "Example.java",     // shown in the result pane head
 *     blockName:  "java",             // spotless { <blockName> { } } / <configuration><blockName>
 *     formatters: [...],              // reformatter choices, [0] MUST be the "none" baseline
 *     steps:      [...],              // ordered; the pipeline runs them in this order
 *     stepGroups: [{ id, title }]     // group headings in the steps pane
 *   })
 *
 * Optional alongside those:
 *
 *     target:        "src/**\/*.ts"   // emitted as a target/includes line, for the
 *                                     // languages where Spotless cannot infer the file set
 *     gradlePlugin:  "java"           // extra `id '...'` line in the Gradle plugins block
 *     formatterNote: "..."            // HTML shown above the reformatter list, since the
 *                                     // reason the formatters are what they are is per-language
 *
 * A formatter is { id, label, doc, text, gradle, maven, details }, plus two
 * optional fields for the ones that really execute here: `opts`, declared like
 * a step's, and `run(src, opts) -> Promise<string>`. With a `run` the pane
 * shows a real result, pasted source included; without one, `text` is a
 * hand-written snapshot of what the real tool would produce. `gradle`/`maven`
 * are null for the "none" entry, which emits no config line. `formatters[0]`
 * is the baseline every diff is measured against, so it must be the
 * unformatted sample.
 *
 * A step is { id, label, group, doc, opts, apply, gradle, maven }, where
 * `apply(src, opts) -> src` and `group` matches a stepGroups id. `apply` may be
 * null for a step the pipeline implements itself (toggleOffOn).
 */

const languages = new Map();

export function registerLanguage(lang) {
  for (const key of ["id", "label", "fileName", "blockName", "formatters", "steps", "stepGroups"]) {
    if (lang[key] === undefined) throw new Error(`language "${lang.id}" is missing ${key}`);
  }
  if (!lang.formatters.length) throw new Error(`language "${lang.id}" has no formatters`);
  if (languages.has(lang.id)) throw new Error(`language "${lang.id}" is already registered`);
  languages.set(lang.id, lang);
  return lang;
}

export function getLanguage(id) {
  return languages.get(id) || listLanguages()[0];
}

export function listLanguages() {
  return [...languages.values()];
}
