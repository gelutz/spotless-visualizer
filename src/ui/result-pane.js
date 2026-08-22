import { esc, visibleWs } from "../core/html.js";
import { diffLines } from "../core/diff.js";
import { runPipeline, sourceOf, findFormatter } from "../core/pipeline.js";

// Human-readable "what changed this line", built from a blame set.
function blameTitle(app, ids) {
  const { language, state } = app;
  if (!ids || !ids.size) return "";
  const parts = [];
  ids.forEach(id => {
    if (id === "formatter") {
      const f = findFormatter(language, state.formatter);
      parts.push(f.label + "\n    " + f.doc);
      return;
    }
    const step = language.steps.find(s => s.id === id);
    if (!step) return;
    const o = state.opts[id];
    const shown = step.opts
      .filter(opt => o[opt.id] !== "" && o[opt.id] !== false)
      .map(opt => "    " + opt.id + " = " + o[opt.id]);
    parts.push(step.label + (shown.length ? "\n" + shown.join("\n") : ""));
  });
  return parts.join("\n\n");
}

/* Chrome around the result pane: the editor itself, the "custom" badge, the
 * restore button and the warning shown when a reformatter is picked but cannot
 * run on pasted source. */
export function renderSourcePane(app) {
  const { language, state } = app;
  const editing = state.view === "source";
  const custom = state.customSource !== null;
  const ta = document.getElementById("source");
  const pre = document.getElementById("result");
  const note = document.getElementById("src-note");

  pre.hidden = editing;
  ta.hidden = !editing;
  document.getElementById("result-body").classList.toggle("editing", editing);

  // Only push text in when the textarea is not the thing being typed into,
  // otherwise we would fight the caret on every keystroke.
  if (document.activeElement !== ta) {
    const want = custom ? state.customSource : sourceOf(language, state).base;
    if (ta.value !== want) ta.value = want;
  }

  document.getElementById("src-badge").hidden = !custom;
  document.getElementById("btn-restore").hidden = !custom;
  document.getElementById("src-name").textContent = custom ? "your source" : language.fileName;

  const fmt = findFormatter(language, state.formatter);
  if (custom && fmt && fmt.id !== "none") {
    note.hidden = false;
    note.innerHTML = `<b>${esc(fmt.label)}</b> is not applied here. Real ${esc(language.label)} ` +
      `reformatters can't run in a browser, so on your own source only the steps below ` +
      `actually run. It is still written into the config on the left.`;
  } else if (custom) {
    note.hidden = false;
    note.innerHTML = `Formatting <b>your source</b>. Edits re-run the pipeline as you type; ` +
      `the diff is against what you pasted.`;
  } else {
    note.hidden = true;
  }
}

export function renderResult(app) {
  const { language, state } = app;
  const before = sourceOf(language, state).baseline;
  const res = runPipeline(language, state);
  const after = res.lines.join("\n");
  const el = document.getElementById("result");

  const attr = ids => {
    const t = blameTitle(app, ids);
    return t ? ` data-blame="${esc(t)}"` : "";
  };

  renderSourcePane(app);
  if (state.view === "source") return;                     // textarea is showing instead

  let html = "";
  if (state.view === "result") {
    res.lines.forEach((line, idx) => {
      html += `<span class="ln" data-n="${idx + 1}"${attr(res.blame[idx])}>${visibleWs(line) || "&nbsp;"}</span>`;
    });
  } else {
    const rows = diffLines(before.split("\n"), res.lines);
    let n = 0, j = 0;
    rows.forEach(r => {
      let ids;
      if (r.t === "del") {
        // A removed line has no slot in `blame`; borrow the surviving neighbour's,
        // which is exactly where the removal was credited.
        ids = res.blame[j] || res.blame[j - 1];
      } else {
        ids = res.blame[j];
        j++;
      }
      const num = r.t === "del" ? "" : String(++n);
      html += `<span class="ln ${r.t}" data-n="${num}"${r.t === "same" ? "" : attr(ids)}>${visibleWs(r.text) || "&nbsp;"}</span>`;
    });
  }
  if (after.endsWith("\n")) {
    html += `<span class="ln eof" data-n="">↵ file ends with newline</span>`;
  } else {
    html += `<span class="ln eof" data-n="">✘ no trailing newline</span>`;
  }
  el.innerHTML = html;
}
