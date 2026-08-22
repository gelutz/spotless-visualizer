import { describe, it, expect } from "vitest";
import { diffLines } from "./diff.js";

const shape = rows => rows.map(r => r.t[0]).join("");
const texts = (rows, t) => rows.filter(r => r.t === t).map(r => r.text);

describe("diffLines", () => {
  it("returns nothing for two empty inputs", () => {
    expect(diffLines([], [])).toEqual([]);
  });

  it("marks identical input as all same", () => {
    const rows = diffLines(["a", "b"], ["a", "b"]);
    expect(shape(rows)).toBe("ss");
  });

  it("reports every line added when the left side is empty", () => {
    const rows = diffLines([], ["a", "b"]);
    expect(shape(rows)).toBe("aa");
    expect(texts(rows, "add")).toEqual(["a", "b"]);
  });

  it("reports every line deleted when the right side is empty", () => {
    const rows = diffLines(["a", "b"], []);
    expect(shape(rows)).toBe("dd");
  });

  it("keeps the common prefix and suffix around an insertion", () => {
    const rows = diffLines(["a", "c"], ["a", "b", "c"]);
    expect(shape(rows)).toBe("sas");
    expect(texts(rows, "add")).toEqual(["b"]);
  });

  it("emits the deletion before the addition on a replaced line", () => {
    const rows = diffLines(["a", "x", "c"], ["a", "y", "c"]);
    expect(shape(rows)).toBe("sdas");
    expect(texts(rows, "del")).toEqual(["x"]);
    expect(texts(rows, "add")).toEqual(["y"]);
  });

  it("finds the longest common subsequence, not just a prefix match", () => {
    const rows = diffLines(["a", "b", "c", "d"], ["a", "c", "d"]);
    expect(texts(rows, "del")).toEqual(["b"]);
    expect(texts(rows, "add")).toEqual([]);
  });

  it("reconstructs the right-hand side from same + add rows", () => {
    const a = ["one", "two", "three", "four"];
    const b = ["one", "TWO", "three", "five", "four"];
    const rows = diffLines(a, b);
    expect(rows.filter(r => r.t !== "del").map(r => r.text)).toEqual(b);
    expect(rows.filter(r => r.t !== "add").map(r => r.text)).toEqual(a);
  });
});
