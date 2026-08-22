import { renderSteps } from "./steps-pane.js";
import { renderConfig } from "./config-pane.js";
import { renderResult } from "./result-pane.js";
import { renderLanguageTabs } from "./language-tabs.js";

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

// The build/view tab rows live in the static markup, so they are wired once
// rather than rebuilt on every render.
export function initTabs(app) {
  document.querySelectorAll(".tab[data-build]").forEach(t => {
    t.addEventListener("click", () => {
      app.state.build = t.dataset.build;
      syncTabs("data-build", "build", app.state.build);
      renderConfig(app);
      app.persist();
    });
  });

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
