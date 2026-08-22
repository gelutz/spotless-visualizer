import { renderSourcePane, renderResult } from "./result-pane.js";

export function initSourceEditor(app) {
  const ta = document.getElementById("source");

  // Typing marks the source as custom and re-runs the pipeline. renderResult
  // skips the diff render while the editor is open, so this stays cheap.
  ta.addEventListener("input", () => {
    app.state.customSource = ta.value;
    renderSourcePane(app);
  });

  // A textarea would otherwise move focus out of the field on Tab, which is
  // useless when the thing you are pasting is indented source.
  ta.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || e.ctrlKey || e.altKey || e.metaKey) return;
    e.preventDefault();
    const { selectionStart: a, selectionEnd: b, value } = ta;
    ta.value = value.slice(0, a) + "\t" + value.slice(b);
    ta.selectionStart = ta.selectionEnd = a + 1;
    app.state.customSource = ta.value;
    renderSourcePane(app);
  });

  // Leaving the editor is when the diff is worth recomputing.
  ta.addEventListener("blur", () => renderResult(app));
}
