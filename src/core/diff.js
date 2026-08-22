/* Line-based diff via longest common subsequence.
 *
 * Used in two places: the diff view, and the blame tracker, which aligns each
 * step's before/after with the same algorithm so surviving lines keep their
 * history. */

export function diffLines(a, b) {
  const n = a.length, m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);

  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ t: "same", text: b[j] }); i++; j++; }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) { out.push({ t: "del", text: a[i] }); i++; }
    else { out.push({ t: "add", text: b[j] }); j++; }
  }
  while (i < n) out.push({ t: "del", text: a[i++] });
  while (j < m) out.push({ t: "add", text: b[j++] });
  return out;
}
