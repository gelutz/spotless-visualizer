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

export function renderConfig(app) {
  const { language, state } = app;
  const formatter = findFormatter(language, state.formatter);
  const active = language.steps.filter(s => state.enabled[s.id]);
  const el = document.getElementById("config");

  // The formatter's own options ride along under a key no step can claim.
  const opts = { ...state.opts, formatterOpts: state.formatterOpts[formatter.id] || {} };
  const text = state.build === "gradle"
    ? gradleSnippet(language, formatter, active, opts)
    : mavenSnippet(language, formatter, active, opts);

  // Stashed raw so the copy button hands over text, not the rendered spans.
  el.dataset.raw = text;
  el.innerHTML = text.split("\n")
    .map((l, i) => `<span class="ln" data-n="${i + 1}">${esc(l) || "&nbsp;"}</span>`)
    .join("");
}
