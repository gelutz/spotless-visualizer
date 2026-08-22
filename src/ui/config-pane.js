import { esc, indentBlock } from "../core/html.js";
import { findFormatter } from "../core/pipeline.js";

// Pinned so the snippet you copy is one that actually resolves.
const GRADLE_PLUGIN_VERSION = "7.0.2";
const MAVEN_PLUGIN_VERSION = "2.44.4";

function gradleSnippet(language, formatter, active, opts) {
  const body = [];
  if (formatter && formatter.gradle) body.push(formatter.gradle());
  active.forEach(s => body.push(s.gradle(opts[s.id])));
  return [
    "// build.gradle  (truncated)",
    "plugins {",
    "    id 'java'",
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
  const body = [];
  if (formatter && formatter.maven) body.push(formatter.maven());
  active.forEach(s => body.push(s.maven(opts[s.id])));
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

  const text = state.build === "gradle"
    ? gradleSnippet(language, formatter, active, state.opts)
    : mavenSnippet(language, formatter, active, state.opts);

  // Stashed raw so the copy button hands over text, not the rendered spans.
  el.dataset.raw = text;
  el.innerHTML = text.split("\n")
    .map((l, i) => `<span class="ln" data-n="${i + 1}">${esc(l) || "&nbsp;"}</span>`)
    .join("");
}
