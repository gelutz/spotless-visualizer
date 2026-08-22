import { describe, it, expect } from "vitest";
import { liftFrozenRegions, restoreFrozenRegions, runPipeline, sourceOf, SENTINEL } from "./pipeline.js";
import { traced, blameStep } from "./blame.js";

const OFF = "spotless:off", ON = "spotless:on";

describe("liftFrozenRegions", () => {
  it("leaves source without markers alone", () => {
    const { text, frozen } = liftFrozenRegions("a\nb", OFF, ON);
    expect(text).toBe("a\nb");
    expect(frozen).toEqual([]);
  });

  it("replaces a marked region with a single sentinel line", () => {
    const src = ["a", "// spotless:off", "  KEEP  ", "// spotless:on", "b"].join("\n");
    const { text, frozen } = liftFrozenRegions(src, OFF, ON);
    expect(text).toBe(["a", SENTINEL + "0", "b"].join("\n"));
    expect(frozen[0]).toEqual(["// spotless:off", "  KEEP  ", "// spotless:on"]);
  });

  it("freezes to end of file when the region is never closed", () => {
    const src = ["a", "// spotless:off", "b"].join("\n");
    const { text, frozen } = liftFrozenRegions(src, OFF, ON);
    expect(text).toBe(["a", SENTINEL + "0"].join("\n"));
    expect(frozen[0]).toEqual(["// spotless:off", "b"]);
  });

  it("numbers multiple regions independently", () => {
    const src = ["// spotless:off", "x", "// spotless:on",
                 "mid",
                 "// spotless:off", "y", "// spotless:on"].join("\n");
    const { text, frozen } = liftFrozenRegions(src, OFF, ON);
    expect(text).toBe([SENTINEL + "0", "mid", SENTINEL + "1"].join("\n"));
    expect(frozen).toHaveLength(2);
  });
});

describe("lift + restore round trip", () => {
  it("puts the frozen lines back byte-for-byte", () => {
    const src = ["a", "// spotless:off", "\tKEEP\t ", "// spotless:on", "b"].join("\n");
    const lifted = liftFrozenRegions(src, OFF, ON);
    const back = restoreFrozenRegions(traced(lifted.text), lifted.frozen);
    expect(back.lines.join("\n")).toBe(src);
  });

  it("survives steps that reindent the sentinel line", () => {
    const src = ["// spotless:off", "\tKEEP\t ", "// spotless:on"].join("\n");
    const lifted = liftFrozenRegions(src, OFF, ON);
    // A reindenting step would leave the sentinel with leading whitespace.
    const shifted = traced("    " + lifted.text);
    const back = restoreFrozenRegions(shifted, lifted.frozen);
    expect(back.lines.join("\n")).toBe(src);
  });

  it("credits every restored line to toggleOffOn", () => {
    const src = ["// spotless:off", "KEEP", "// spotless:on"].join("\n");
    const lifted = liftFrozenRegions(src, OFF, ON);
    const back = restoreFrozenRegions(traced(lifted.text), lifted.frozen);
    expect(back.blame.every(b => b.has("toggleOffOn"))).toBe(true);
  });
});

describe("blameStep", () => {
  it("credits a line the step added", () => {
    const before = traced("a\nc");
    const after = blameStep(before, "a\nb\nc", "insert");
    expect([...after.blame[1]]).toEqual(["insert"]);
    expect(after.blame[0].size).toBe(0);
  });

  it("credits a deletion to the surviving line that follows it", () => {
    const before = traced("a\nb\nc");
    const after = blameStep(before, "a\nc", "drop");
    expect(after.lines).toEqual(["a", "c"]);
    expect([...after.blame[1]]).toEqual(["drop"]);
    expect(after.blame[0].size).toBe(0);
  });

  it("credits a trailing deletion to the last surviving line", () => {
    const before = traced("a\nb");
    const after = blameStep(before, "a", "drop");
    expect([...after.blame[0]]).toEqual(["drop"]);
  });

  it("accumulates blame across steps on a surviving line", () => {
    let t = traced("a\nb");
    t = blameStep(t, "a\nB", "upper");
    t = blameStep(t, "a\nB\nc", "append");
    expect([...t.blame[1]]).toEqual(["upper"]);
    expect([...t.blame[2]]).toEqual(["append"]);
  });

  it("attributes nothing when the step is a no-op", () => {
    const before = traced("a\nb");
    const after = blameStep(before, "a\nb", "noop");
    expect(after.blame.every(b => b.size === 0)).toBe(true);
  });
});

/* A stand-in language, so the pipeline is tested without depending on Java's
 * samples or step set. */
const FAKE = {
  id: "fake", label: "Fake", fileName: "f.txt", blockName: "fake",
  formatters: [
    { id: "none", label: "(none)", doc: "", text: "a\nb", gradle: null, maven: null },
    { id: "big",  label: "big()",  doc: "", text: "A\nB", gradle: () => "big()", maven: () => "<big/>" }
  ],
  steps: [
    { id: "shout", label: "shout", group: "g", doc: "", opts: [],
      apply: s => s.toUpperCase(), gradle: () => "", maven: () => "" },
    { id: "toggleOffOn", label: "toggleOffOn", group: "g", doc: "",
      opts: [{ id: "off", type: "text", def: OFF }, { id: "on", type: "text", def: ON }],
      apply: null, gradle: () => "", maven: () => "" }
  ],
  stepGroups: [{ id: "g", title: "G" }]
};

const stateFor = (over = {}) => ({
  language: "fake", formatter: "none", build: "gradle", view: "diff", customSource: null,
  enabled: { shout: false, toggleOffOn: false },
  opts: { shout: {}, toggleOffOn: { off: OFF, on: ON } },
  ...over
});

describe("runPipeline", () => {
  it("returns the source untouched when nothing is enabled", () => {
    const r = runPipeline(FAKE, stateFor());
    expect(r.lines).toEqual(["a", "b"]);
    expect(r.blame.every(b => b.size === 0)).toBe(true);
  });

  it("runs an enabled step and credits it", () => {
    const r = runPipeline(FAKE, stateFor({ enabled: { shout: true, toggleOffOn: false } }));
    expect(r.lines).toEqual(["A", "B"]);
    expect(r.blame.every(b => b.has("shout"))).toBe(true);
  });

  it("shields a frozen region from an enabled step", () => {
    const state = stateFor({
      enabled: { shout: true, toggleOffOn: true },
      customSource: ["a", "// spotless:off", "keep me", "// spotless:on", "b"].join("\n")
    });
    const r = runPipeline(FAKE, state);
    expect(r.lines).toEqual(["A", "// spotless:off", "keep me", "// spotless:on", "B"]);
  });

  it("credits the reformatter for lines no step explains", () => {
    const r = runPipeline(FAKE, stateFor({ formatter: "big" }));
    expect(r.lines).toEqual(["A", "B"]);
    expect(r.blame.every(b => b.has("formatter"))).toBe(true);
  });

  it("does not credit the reformatter on pasted source", () => {
    const r = runPipeline(FAKE, stateFor({ formatter: "big", customSource: "x\ny" }));
    expect(r.lines).toEqual(["x", "y"]);
    expect(r.blame.every(b => b.size === 0)).toBe(true);
  });
});

describe("sourceOf", () => {
  it("diffs a built-in sample against the unformatted baseline", () => {
    const { base, baseline, custom } = sourceOf(FAKE, stateFor({ formatter: "big" }));
    expect(base).toBe("A\nB");
    expect(baseline).toBe("a\nb");
    expect(custom).toBe(false);
  });

  it("diffs pasted source against itself", () => {
    const { base, baseline, custom } = sourceOf(FAKE, stateFor({ customSource: "x" }));
    expect(base).toBe("x");
    expect(baseline).toBe("x");
    expect(custom).toBe(true);
  });
});
