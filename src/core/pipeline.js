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
 * With the built-in sample the reformatter is a pre-baked snapshot, so the
 * pipeline starts from that snapshot while the diff baseline stays the raw,
 * unformatted sample - that is what makes the reformatter's own effect show up
 * as changed lines.
 *
 * With pasted source there is no snapshot to swap in: the real reformatters are
 * whole language parsers and cannot run in a browser. So source and baseline are
 * both the user's text, and only the cheap steps actually run. */
export function sourceOf(language, state) {
  if (state.customSource !== null) {
    return { base: state.customSource, baseline: state.customSource, custom: true };
  }
  const formatter = findFormatter(language, state.formatter);
  return { base: formatter.text, baseline: language.formatters[0].text, custom: false };
}

export function findFormatter(language, id) {
  return language.formatters.find(f => f.id === id) || language.formatters[0];
}

/* Runs the enabled steps over the source, tracking which step produced each
 * line. Pure: everything it needs comes from `language` and `state`. */
export function runPipeline(language, state) {
  const formatter = findFormatter(language, state.formatter);
  const { base, custom } = sourceOf(language, state);

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

  // The chosen reformatter is itself a change vs the unformatted sample.
  // Only meaningful for the built-in sample - on pasted source no reformatter ran.
  if (formatter.id !== "none" && !custom) {
    const vsRaw = diffLines(language.formatters[0].text.split("\n"), result.lines);
    let k = 0;
    for (const r of vsRaw) {
      if (r.t === "del") continue;
      // Only credit the reformatter when no cheap step already explains the
      // line - otherwise it would tag nearly everything and drown the detail.
      if (r.t === "add" && !result.blame[k].size) result.blame[k].add("formatter");
      k++;
    }
  }
  return result;
}
