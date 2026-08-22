import { getLanguage } from "./languages/registry.js";
import { saveToHash } from "./state.js";
import { render, renderPartial, syncTabs } from "./ui/render.js";

/* The app context threaded through every UI module.
 *
 * It exists so no module reaches for a shared mutable global: a renderer gets
 * `app.state` and `app.language` and nothing else. `language` is a getter so it
 * stays correct after a language switch without anyone re-wiring. */
export function createApp(initialState) {
  const app = {
    state: initialState,

    get language() {
      return getLanguage(app.state.language);
    },

    setState(next) {
      app.state = next;
      syncTabs("data-build", "build", next.build);
      syncTabs("data-view", "view", next.view);
      return render(app);
    },

    // Return the render promise so a caller can await a settled pane; nothing
    // in the UI needs to, but tests and future callers do.
    render()        { return render(app); },
    renderPartial() { return renderPartial(app); },
    persist()       { saveToHash(app.state); }
  };
  return app;
}
