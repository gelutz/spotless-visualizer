import { esc } from "../core/html.js";
import { renderConfig } from "./config-pane.js";

/* The build-target tab row.
 *
 * Rebuilt per render rather than wired once in the static markup, because which
 * targets exist is a property of the language: Java offers Gradle and Maven,
 * TypeScript offers the config file its own formatter reads. A language with a
 * single target still gets its tab, so the pane always says what you are
 * looking at. */
const BUILD_LABELS = {
  gradle: "build.gradle",
  maven:  "pom.xml",
  native: "config file"
};

export function renderBuildTabs(app) {
  const host = document.getElementById("builds");
  if (!host) return;
  const builds = app.language.builds;

  // A language switch can leave a target the new language does not offer -
  // "maven" carried over to TypeScript. Correct it here, where the row is built,
  // so the active tab and the pane can never disagree about what is selected.
  if (!builds.includes(app.state.build)) app.state.build = builds[0];

  host.innerHTML = builds.map(b =>
    `<button class="tab ${b === app.state.build ? "active" : ""}" ` +
    `data-build="${esc(b)}">${esc(BUILD_LABELS[b] || b)}</button>`
  ).join("");

  host.querySelectorAll("[data-build]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.build === app.state.build) return;
      app.state.build = btn.dataset.build;
      renderBuildTabs(app);
      renderConfig(app);
      app.persist();
    });
  });
}
