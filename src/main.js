import "./styles/index.css";

// Registering a language is a side effect of importing it. This is the only
// place that has to know a language exists; adding Kotlin means adding a line
// here and a folder under languages/.
import "./languages/java/index.js";
import "./languages/typescript/index.js";

import { loadFromHash, defaultState } from "./state.js";
import { createApp } from "./app.js";
import { initTabs, syncTabs } from "./ui/render.js";
import { initModal } from "./ui/modal.js";
import { initTooltip } from "./ui/tooltip.js";
import { initSourceEditor } from "./ui/source-editor.js";
import { renderResult } from "./ui/result-pane.js";

const app = createApp(loadFromHash());

initTabs(app);
initModal();
initTooltip();
initSourceEditor(app);

document.getElementById("btn-restore").addEventListener("click", () => {
  app.state.customSource = null;
  renderResult(app);
});

document.getElementById("btn-copy").addEventListener("click", async () => {
  const btn = document.getElementById("btn-copy");
  try {
    await navigator.clipboard.writeText(document.getElementById("config").dataset.raw);
    btn.textContent = "copied";
  } catch {
    btn.textContent = "copy failed";
  }
  setTimeout(() => { btn.textContent = "copy"; }, 1200);
});

document.getElementById("btn-reset").addEventListener("click", () => {
  app.setState(defaultState(app.state.language));
});

// A shared link can arrive with a non-default build or view tab selected.
syncTabs("data-build", "build", app.state.build);
syncTabs("data-view", "view", app.state.view);
app.render();
