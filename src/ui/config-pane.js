import { esc, indentBlock } from "../core/html.js";
import { findFormatter } from "../core/pipeline.js";

// Pinned so the snippet you copy is one that actually resolves.
const GRADLE_PLUGIN_VERSION = "7.0.2";
const MAVEN_PLUGIN_VERSION = "2.44.4";

/* Spotless infers the file set for some languages and demands it for others -
 * TypeScript has no convention to fall back on, so its block is invalid
 * without an explicit target. */
function blockBody(language, formatter, active, opts, emit) {
  const body = [];
  if (language.target) body.push(emit === "gradle"
    ? `target '${language.target}'`
    : `<includes>\n  <include>${esc(language.target)}</include>\n</includes>`);
  if (formatter && formatter[emit]) body.push(formatter[emit](opts.formatterOpts));
  active.forEach(s => body.push(s[emit](opts[s.id])));
  return body;
}

function gradleSnippet(language, formatter, active, opts) {
  const body = blockBody(language, formatter, active, opts, "gradle");
  return [
    "// build.gradle  (truncated)",
    "plugins {",
    // Only the languages that are a Gradle plugin get one. TypeScript is not.
    ...(language.gradlePlugin ? [`    id '${language.gradlePlugin}'`] : []),
    `    id 'com.diffplug.spotless' version '${GRADLE_PLUGIN_VERSION}'`,
    "}",
    "",
    "spotless {",
    `    ${language.blockName} {`,
    body.length ? indentBlock(body.join("\n"), "        ") : "        // no steps enabled",
    "    }",
    "}"
  ].join("\n");
}

function mavenSnippet(language, formatter, active, opts) {
  const body = blockBody(language, formatter, active, opts, "maven");
  return [
    "<!-- pom.xml  (truncated) -->",
    "<plugin>",
    "  <groupId>com.diffplug.spotless</groupId>",
    "  <artifactId>spotless-maven-plugin</artifactId>",
    `  <version>${MAVEN_PLUGIN_VERSION}</version>`,
    "  <configuration>",
    `    <${language.blockName}>`,
    body.length ? indentBlock(body.join("\n"), "      ") : "      <!-- no steps enabled -->",
    `    </${language.blockName}>`,
    "  </configuration>",
    "</plugin>"
  ].join("\n");
}

/* Steps a whole-file reformatter already does on its way through. Prettier and
 * Biome both reprint from the AST, which normalises trailing whitespace and the
 * final newline whether you ask or not - so listing these as "unsupported"
 * would be wrong. They are satisfied, just not by a line of config. */
const SUBSUMED_BY_REFORMAT = ["trimTrailingWhitespace", "endWithNewline", "indent"];

/* The config a language's own tooling reads, for the languages nobody drives
 * through a JVM build. This is not a Spotless block at all: it is the file the
 * formatter discovers by itself, plus the command that applies it.
 *
 * The steps pane keeps working, but a Spotless step is not always expressible
 * here: some the reformatter already covers, and some exist only in Spotless.
 * Both get said out loud rather than silently dropped. */
function nativeSnippet(language, formatter, active, opts) {
  const config = formatter.native?.(opts.formatterOpts);
  if (!config) {
    return [
      "# no reformatter selected",
      "#",
      "# Pick prettier() or biome() above to see the config file it reads.",
      `# Nothing here runs through Gradle or Maven - ${language.label} tooling`,
      "# is driven by npm scripts, not a JVM build."
    ].join("\n");
  }

  const tool = formatter.label.replace(/\(\)$/, "");
  // The config file is emitted verbatim so the copy button yields something
  // valid - .prettierrc.json and biome.json are JSON, which has no comments,
  // so every remark goes above the file rather than inside it.
  const notes = [`# ${config.file}`];

  const covered = active.filter(s => SUBSUMED_BY_REFORMAT.includes(s.id));
  const spotlessOnly = active.filter(s => !SUBSUMED_BY_REFORMAT.includes(s.id));

  if (covered.length) {
    notes.push(`# ${tool} already does this on every reprint, no setting needed:`);
    covered.forEach(s => notes.push(`#   ${s.label}`));
  }
  if (spotlessOnly.length) {
    notes.push(`# Spotless-only - ${tool} has no equivalent, these need Spotless`, "# or a lint rule:");
    spotlessOnly.forEach(s => notes.push(`#   ${s.label}`));
  }

  const lines = [notes.join("\n"), "", config.text];
  if (config.run) lines.push("", `# ${config.run}`);
  return lines.join("\n");
}

export function renderConfig(app) {
  const { language, state } = app;
  const formatter = findFormatter(language, state.formatter);
  const active = language.steps.filter(s => state.enabled[s.id]);
  const el = document.getElementById("config");

  // The formatter's own options ride along under a key no step can claim.
  const opts = { ...state.opts, formatterOpts: state.formatterOpts[formatter.id] || {} };
  const snippet = {
    gradle: gradleSnippet,
    maven:  mavenSnippet,
    native: nativeSnippet
  }[state.build] || gradleSnippet;
  const text = snippet(language, formatter, active, opts);

  // Stashed raw so the copy button hands over text, not the rendered spans.
  el.dataset.raw = text;
  el.innerHTML = text.split("\n")
    .map((l, i) => `<span class="ln" data-n="${i + 1}">${esc(l) || "&nbsp;"}</span>`)
    .join("");
}
