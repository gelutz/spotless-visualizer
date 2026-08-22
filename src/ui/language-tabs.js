import { esc } from "../core/html.js";
import { listLanguages } from "../languages/registry.js";
import { switchLanguage } from "../state.js";

/* The language tab row. With one language registered this renders a single
 * active tab - dead UI for now, on purpose: it is the seam a second language
 * plugs into, and having it visible keeps the layout honest about where a
 * Kotlin or Scala tab would land. */
export function renderLanguageTabs(app) {
  const host = document.getElementById("languages");
  const languages = listLanguages();

  host.innerHTML = `<span class="lang-label">language</span>` +
    languages.map(l =>
      `<button class="tab ${l.id === app.state.language ? "active" : ""}" ` +
      `data-language="${esc(l.id)}">${esc(l.label)}</button>`
    ).join("");

  host.querySelectorAll("[data-language]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.language === app.state.language) return;
      app.setState(switchLanguage(app.state, btn.dataset.language));
    });
  });
}
