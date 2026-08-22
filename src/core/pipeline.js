import { diffLines } from "./diff.js";
import { traced, blameStep } from "./blame.js";

/* toggleOffOn, the way Spotless does it: the frozen regions are lifted out and
 * replaced by a one-line sentinel, the whole file is then formatted as usual
 * (so steps like removeUnusedImports still see the entire body), and the
 * regions are put back verbatim afterwards. */

// Shaped like a comment with no leading or trailing whitespace, so trimming
// and re-indenting steps leave it untouched and we can find it again at the end.
export const SENTINEL = "//SPOTLESS_OFF_REGION_";

export function liftFrozenRegions(src, off, on) {
  const frozen = [];
  const out = [];
  let buf = null;
  for (const line of src.split("\n")) {
    if (buf === null && line.includes(off)) {
      buf = [line];
    } else if (buf !== null) {
      buf.push(line);
      if (line.includes(on)) {
        out.push(SENTINEL + frozen.length);
        frozen.push(buf);
        buf = null;
      }
    } else {
      out.push(line);
    }
  }
  if (buf !== null) {                                      // unterminated off region
    out.push(SENTINEL + frozen.length);
    frozen.push(buf);
  }
  return { text: out.join("\n"), frozen };
}

// Put the lifted regions back where their sentinel ended up, crediting every
// restored line to toggleOffOn.
export function restoreFrozenRegions(t, frozen) {
  const lines = [], blame = [];
  t.lines.forEach((line, i) => {
    const m = line.match(new RegExp("^\\s*" + SENTINEL + "(\\d+)\\s*$"));
    if (!m) { lines.push(line); blame.push(t.blame[i]); return; }
    frozen[Number(m[1])].forEach(f => {
      lines.push(f);
      blame.push(new Set(["toggleOffOn"]));
    });
  });
  return { lines, blame };
}

/* The text the pipeline starts from, and what the diff is measured against.
 *
 * Two kinds of reformatter. Some really run here - Prettier and Biome are
 * JavaScript and TypeScript is their own language - and they carry a `run`.
 * The rest are JVM or Node tools that cannot execute in a browser at all, and
 * ship a hand-written `text` snapshot instead.
 *
 * A `run` formatter is applied to whatever the user is looking at, pasted
 * source included. A snapshot one can only be swapped in for the built-in
 * sample; on pasted source there is nothing to swap, so only the cheap steps
 * run.
 *
 * The baseline is the unformatted text either way, which is what makes the
 * reformatter's own effect show up as changed lines.
 *
 * Async because `run` is: Prettier's format() returns a promise and Biome's
 * WASM loads on demand. */
export async function sourceOf(language, state) {
  const formatter = findFormatter(language, state.formatter);
  const custom = state.customSource !== null;
  const baseline = custom ? state.customSource : language.formatters[0].text;

  if (!formatter.run) {
    return { base: custom ? state.customSource : formatter.text, baseline, custom, error: null };
  }

  // Source mid-edit is unparseable more often than not, and a real reformatter
  // throws on it. Falling back to the unformatted text keeps the pane showing
  // something; the message is handed up so the UI can say why.
  try {
    return { base: await formatter.run(baseline, state.formatterOpts?.[formatter.id] || {}),
             baseline, custom, error: null };
  } catch (e) {
    return { base: baseline, baseline, custom, error: e.message || String(e) };
  }
}

export function findFormatter(language, id) {
  return language.formatters.find(f => f.id === id) || language.formatters[0];
}

/* Runs the enabled steps over the source, tracking which step produced each
 * line. Everything it needs comes from `language` and `state` - the only thing
 * it reaches outside for is a formatter's own `run`. */
export async function runPipeline(language, state, resolved = null) {
  const formatter = findFormatter(language, state.formatter);
  // The reformatter is resolved as one async stage up front; the step fold
  // below stays synchronous, since every step is a cheap string transform.
  // A caller that already has the resolved source passes it in rather than
  // paying for a second run of it.
  const { base, baseline, custom, error } = resolved || await sourceOf(language, state);

  const active = language.steps.filter(s => state.enabled[s.id] && typeof s.apply === "function");
  const fold = src => active.reduce(
    (acc, s) => blameStep(acc, s.apply(acc.lines.join("\n"), state.opts[s.id]), s.id),
    traced(src));

  const toggle = state.enabled.toggleOffOn ? state.opts.toggleOffOn : null;
  let result;
  if (toggle) {
    const lifted = liftFrozenRegions(base, toggle.off, toggle.on);
    result = restoreFrozenRegions(fold(lifted.text), lifted.frozen);
  } else {
    result = fold(base);
  }

  // The chosen reformatter is itself a change vs the unformatted text. A
  // snapshot one only ran for the built-in sample; a `run` one ran either way.
  if (formatter.id !== "none" && (!custom || formatter.run)) {
    const vsRaw = diffLines(baseline.split("\n"), result.lines);
    let k = 0;
    for (const r of vsRaw) {
      if (r.t === "del") continue;
      // Only credit the reformatter when no cheap step already explains the
      // line - otherwise it would tag nearly everything and drown the detail.
      if (r.t === "add" && !result.blame[k].size) result.blame[k].add("formatter");
      k++;
    }
  }
  // Carried so the pane can report a reformatter that refused to parse.
  result.error = error;
  return result;
}
