import { diffLines } from "./diff.js";

/* Blame: which steps touched which lines.
 *
 * A "traced" value is { lines: string[], blame: Set<stepId>[] } - one blame set
 * per line. Each step runs on the plain text, then the before/after are aligned
 * with the same LCS used by the diff view so surviving lines keep their history
 * and lines the step introduced get credited to it. Deletions are credited to
 * the line that lands next to them, so a hover on the following line still
 * explains what removed its neighbour. */

export function traced(text) {
  const lines = text.split("\n");
  return { lines, blame: lines.map(() => new Set()) };
}

export function blameStep(before, afterText, stepId) {
  const after = afterText.split("\n");
  const rows = diffLines(before.lines, after);
  const blame = [];
  let i = 0, j = 0;
  let pending = false;                                     // a deletion waiting to be attributed

  for (const r of rows) {
    if (r.t === "same") {
      const set = new Set(before.blame[i]);
      if (pending) { set.add(stepId); pending = false; }
      blame.push(set);
      i++; j++;
    } else if (r.t === "del") {
      pending = true;                                      // credited to the next surviving line
      i++;
    } else {
      blame.push(new Set([stepId]));
      pending = false;
      j++;
    }
  }
  if (pending && blame.length) blame[blame.length - 1].add(stepId);
  return { lines: after, blame };
}
