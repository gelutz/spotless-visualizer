import { esc } from "../core/html.js";

/* Formatter help modal: the reformatters are the one thing this page cannot
 * actually run, so the "?" spells out what the real step would do. */

export function openFormatterHelp(language, id) {
  const f = language.formatters.find(x => x.id === id);
  if (!f || !f.details) return;
  const d = f.details;

  let html = `<h4>What it does</h4><p>${esc(d.summary)}</p>`;
  if (d.rules.length) {
    html += `<h4>Concretely</h4><ul>` +
      d.rules.map(r => `<li>${esc(r)}</li>`).join("") + `</ul>`;
  }
  if (d.opts.length) {
    html += `<h4>Common options</h4>` +
      d.opts.map(([call, what]) =>
        `<div class="opt-row"><code>${esc(call)}</code><span>${esc(what)}</span></div>`).join("");
  }
  if (d.note) html += `<div class="note">${esc(d.note)}</div>`;
  if (f.id !== "none") {
    html += `<div class="note">The panel on the right shows a hand-written snapshot of roughly ` +
            `this formatter's output, not its real result &mdash; ${esc(f.label)} needs a JVM. ` +
            `Every other step is genuinely executed on top of it.</div>`;
  }

  document.getElementById("modal-title").textContent = f.label;
  document.getElementById("modal-body").innerHTML = html;
  document.getElementById("modal").hidden = false;
  document.getElementById("modal-close").focus();
}

export function closeFormatterHelp() {
  document.getElementById("modal").hidden = true;
}

export function initModal() {
  document.getElementById("modal-close").addEventListener("click", closeFormatterHelp);
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeFormatterHelp();      // click the backdrop
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFormatterHelp();
  });
}
