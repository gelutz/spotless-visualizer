import { esc } from "../core/html.js";
import { openFormatterHelp } from "./modal.js";

function optControl(values, ownerId, opt) {
  const val = values[opt.id];
  const id = `opt-${ownerId}-${opt.id}`;
  let ctrl;
  if (opt.type === "bool") {
    ctrl = `<input type="checkbox" id="${id}" ${val ? "checked" : ""}>`;
  } else if (opt.type === "int") {
    ctrl = `<input type="number" id="${id}" min="1" max="16" value="${esc(val)}">`;
  } else if (opt.type === "select") {
    ctrl = `<select id="${id}">` +
      opt.choices.map(c => `<option ${c === val ? "selected" : ""}>${esc(c)}</option>`).join("") +
      `</select>`;
  } else {
    ctrl = `<input type="text" id="${id}" class="${opt.wide ? "wide" : ""}" value="${esc(val)}">`;
  }
  return `<span class="opt"><label for="${id}">${opt.id}</label>${ctrl}</span>`;
}

// Reading a control back is the same job wherever it lives.
function readOpt(el, opt) {
  return opt.type === "bool" ? el.checked
       : opt.type === "int"  ? parseInt(el.value, 10) || opt.def
       : el.value;
}

const optEvent = opt => (opt.type === "bool" || opt.type === "select" ? "change" : "input");

export function renderSteps(app) {
  const { language, state } = app;
  const host = document.getElementById("steps");
  let html = "";

  html += `<div class="group-title">Reformatter (pick one)</div>`;
  if (language.formatterNote) {
    html += `<div class="group-note">${language.formatterNote}</div>`;
  }
  language.formatters.forEach(f => {
    const on = state.formatter === f.id;
    html += `<div class="step ${on ? "on" : ""}">
      <div class="step-row">
        <input type="radio" name="formatter" id="fmt-${f.id}" value="${f.id}" ${on ? "checked" : ""}>
        <label for="fmt-${f.id}">${esc(f.label)}</label>
        <button class="help" data-help="${f.id}" title="what this formatter does">?</button>
      </div>
      <div class="doc">${esc(f.doc)}</div>
      ${on && f.opts && f.opts.length
        ? `<div class="opts">${f.opts.map(o => optControl(state.formatterOpts[f.id], f.id, o)).join("")}</div>`
        : ""}
    </div>`;
  });

  language.stepGroups.forEach(({ id: groupId, title }) => {
    const steps = language.steps.filter(s => s.group === groupId);
    if (!steps.length) return;
    html += `<div class="group-title">${esc(title)}</div>`;
    steps.forEach(s => {
      const on = state.enabled[s.id];
      html += `<div class="step ${on ? "on" : ""}">
        <div class="step-row">
          <input type="checkbox" id="step-${s.id}" ${on ? "checked" : ""}>
          <label for="step-${s.id}">${esc(s.label)}</label>
        </div>
        <div class="doc">${esc(s.doc)}</div>
        ${s.opts.length ? `<div class="opts">${s.opts.map(o => optControl(state.opts[s.id], s.id, o)).join("")}</div>` : ""}
      </div>`;
    });
  });

  host.innerHTML = html;

  host.querySelectorAll('input[name=formatter]').forEach(el => {
    el.addEventListener("change", () => { state.formatter = el.value; app.render(); });
  });
  language.formatters.forEach(f => {
    (f.opts || []).forEach(o => {
      const el = document.getElementById(`opt-${f.id}-${o.id}`);
      if (!el) return;
      // Same reason as the step options: a full render would rebuild this pane
      // and take the focused field with it.
      el.addEventListener(optEvent(o), () => {
        state.formatterOpts[f.id][o.id] = readOpt(el, o);
        app.renderPartial();
      });
    });
  });
  host.querySelectorAll("button.help").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openFormatterHelp(language, btn.dataset.help);
    });
  });
  language.steps.forEach(s => {
    const box = document.getElementById("step-" + s.id);
    if (!box) return;
    box.addEventListener("change", () => { state.enabled[s.id] = box.checked; app.render(); });
    s.opts.forEach(o => {
      const el = document.getElementById(`opt-${s.id}-${o.id}`);
      if (!el) return;
      el.addEventListener(optEvent(o), () => {
        state.opts[s.id][o.id] = readOpt(el, o);
        // Deliberately not a full render: rebuilding the steps pane here would
        // drop focus out of the field being typed into.
        app.renderPartial();
        el.closest(".step").classList.toggle("on", state.enabled[s.id]);
      });
    });
  });
}
