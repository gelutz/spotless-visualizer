import { getLanguage, listLanguages } from "./languages/registry.js";

/* Application state, plus its round-trip through the URL hash.
 *
 * The whole value of this tool is a configuration you arrived at by toggling.
 * Keeping it in the hash means a refresh does not lose it and a link carries it
 * to someone else. `customSource` is deliberately excluded - pasted source does
 * not belong in a URL. */

// The steps most people want on before they touch anything. Referenced by id
// so a language that lacks one of these simply does not get it.
const DEFAULT_ON = [
  "removeUnusedImports", "importOrder",
  "trimTrailingWhitespace", "endWithNewline", "toggleOffOn"
];

export function defaultState(languageId = listLanguages()[0].id) {
  const language = getLanguage(languageId);
  // customSource === null means "use the built-in sample for the picked
  // reformatter"; a string means the user pasted their own source.
  const s = {
    language: language.id,
    formatter: language.formatters[0].id,
    enabled: {}, opts: {},
    build: "gradle", view: "diff",
    customSource: null
  };
  for (const step of language.steps) {
    s.enabled[step.id] = DEFAULT_ON.includes(step.id);
    s.opts[step.id] = {};
    for (const o of step.opts) s.opts[step.id][o.id] = o.def;
  }
  return s;
}

/* Switching language keeps nothing but the language itself: the enabled map and
 * the option values are keyed by step id, and two languages need not share any.
 * Rebuilding from defaults is both correct and what you want - a fresh language
 * should look like a fresh page. */
export function switchLanguage(state, languageId) {
  return defaultState(languageId);
}

/* Hash encoding.
 *
 * Only the option values that differ from their default are stored, so a
 * default config produces a short hash and adding a new option to a step does
 * not invalidate existing links. */
function encode(state) {
  const language = getLanguage(state.language);
  const opts = {};
  for (const step of language.steps) {
    const diff = {};
    for (const o of step.opts) {
      const v = state.opts[step.id]?.[o.id];
      if (v !== undefined && v !== o.def) diff[o.id] = v;
    }
    if (Object.keys(diff).length) opts[step.id] = diff;
  }
  return {
    l: state.language,
    f: state.formatter,
    e: language.steps.filter(s => state.enabled[s.id]).map(s => s.id),
    o: opts,
    b: state.build,
    v: state.view
  };
}

function decode(raw) {
  const language = getLanguage(raw.l);
  const s = defaultState(language.id);

  if (language.formatters.some(f => f.id === raw.f)) s.formatter = raw.f;
  if (Array.isArray(raw.e)) {
    for (const step of language.steps) s.enabled[step.id] = raw.e.includes(step.id);
  }
  if (raw.o && typeof raw.o === "object") {
    for (const step of language.steps) {
      const stored = raw.o[step.id];
      if (!stored) continue;
      // Only accept option ids the step actually declares, so a stale link
      // cannot inject keys into the options object.
      for (const o of step.opts) {
        if (stored[o.id] !== undefined) s.opts[step.id][o.id] = stored[o.id];
      }
    }
  }
  if (raw.b === "gradle" || raw.b === "maven") s.build = raw.b;
  if (["diff", "result", "source"].includes(raw.v)) s.view = raw.v;
  return s;
}

// base64url, so the hash survives copy-paste without percent-encoding noise.
function toHash(obj) {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromHash(hash) {
  const b64 = hash.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeURIComponent(escape(atob(b64))));
}

export function saveToHash(state) {
  try {
    const hash = "#" + toHash(encode(state));
    if (location.hash !== hash) history.replaceState(null, "", hash);
  } catch {
    // A hash we cannot write is not worth breaking the page over.
  }
}

// Anything malformed falls back to a fresh default state rather than throwing
// on boot - a bad link should still open a working page.
export function loadFromHash() {
  const hash = location.hash.slice(1);
  if (!hash) return defaultState();
  try {
    return decode(fromHash(hash));
  } catch {
    return defaultState();
  }
}
