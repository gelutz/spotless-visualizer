import { renderSteps } from "./steps-pane.js";
import { renderConfig } from "./config-pane.js";
import { renderResult } from "./result-pane.js";
import { renderLanguageTabs } from "./language-tabs.js";
import { renderBuildTabs } from "./build-tabs.js";

/* Two render depths.
 *
 * `render` rebuilds everything, including the steps pane. `renderPartial` skips
 * the steps pane, which is what option inputs need: rebuilding that pane
 * replaces the element being typed into and the caret goes with it. */

/* The cheap panes paint immediately and the result pane catches up on its own.
 * A `run` reformatter can take a lazy import to resolve the first time, and
 * blocking the controls behind it would make every one of them feel broken. */
export function render(app) {
  renderLanguageTabs(app);
  renderBuildTabs(app);
  renderSteps(app);
  renderConfig(app);
  app.persist();
  return renderResult(app);
}

export function renderPartial(app) {
  renderConfig(app);
  app.persist();
  return renderResult(app);
}

// The view tab row lives in the static markup, so it is wired once rather than
// rebuilt on every render. The build row is not: its tabs depend on the
// language, so build-tabs.js rebuilds and rewires it per render.
export function initTabs(app) {
  document.querySelectorAll(".tab[data-view]").forEach(t => {
    t.addEventListener("click", () => {
      app.state.view = t.dataset.view;
      syncTabs("data-view", "view", app.state.view);
      app.persist();
      renderResult(app);
    });
  });
}

// Reflects state back onto the static tab rows - needed after a reset and after
// hydrating from a shared link, where the active tab may not be the default.
export function syncTabs(attr, key, value) {
  document.querySelectorAll(`.tab[${attr}]`).forEach(x =>
    x.classList.toggle("active", x.dataset[key] === value));
}
