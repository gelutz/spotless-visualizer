import { describe, it, expect, beforeEach } from "vitest";

// state.js touches `location` and `history` at call time, not import time, so a
// pair of stubs is enough - no DOM environment needed.
globalThis.location = { hash: "" };
globalThis.history = { replaceState: (_a, _b, url) => { globalThis.location.hash = url; } };

const { defaultState, switchLanguage, saveToHash, loadFromHash } = await import("./state.js");
await import("./languages/java/index.js");

describe("defaultState", () => {
  beforeEach(() => { location.hash = ""; });

  it("starts on the first registered language and its baseline formatter", () => {
    const s = defaultState();
    expect(s.language).toBe("java");
    expect(s.formatter).toBe("none");
  });

  it("enables a useful starting set rather than nothing", () => {
    const s = defaultState();
    expect(s.enabled.importOrder).toBe(true);
    expect(s.enabled.removeUnusedImports).toBe(true);
    expect(s.enabled.licenseHeader).toBe(false);
  });

  it("seeds every option with its declared default", () => {
    const s = defaultState();
    expect(s.opts.indent.spacesPerTab).toBe(4);
    expect(s.opts.toggleOffOn.off).toBe("spotless:off");
  });
});

describe("switchLanguage", () => {
  it("rebuilds state for the target language", () => {
    const s = switchLanguage(defaultState(), "java");
    expect(s.language).toBe("java");
    expect(s.customSource).toBeNull();
  });
});

describe("hash round trip", () => {
  beforeEach(() => { location.hash = ""; });

  const roundTrip = state => { saveToHash(state); return loadFromHash(); };

  it("returns defaults when the hash is empty", () => {
    expect(loadFromHash()).toEqual(defaultState());
  });

  it("restores toggles, formatter, build and view", () => {
    const s = defaultState();
    s.formatter = "gjf";
    s.enabled.licenseHeader = true;
    s.enabled.importOrder = false;
    s.build = "maven";
    s.view = "result";
    const back = roundTrip(s);
    expect(back.formatter).toBe("gjf");
    expect(back.enabled.licenseHeader).toBe(true);
    expect(back.enabled.importOrder).toBe(false);
    expect(back.build).toBe("maven");
    expect(back.view).toBe("result");
  });

  it("restores non-default option values", () => {
    const s = defaultState();
    s.opts.importOrder.order = "\\#,java,,";
    s.opts.indent.spacesPerTab = 2;
    const back = roundTrip(s);
    expect(back.opts.importOrder.order).toBe("\\#,java,,");
    expect(back.opts.indent.spacesPerTab).toBe(2);
  });

  it("stores only what differs from the defaults, keeping links short", () => {
    saveToHash(defaultState());
    const short = location.hash.length;
    const s = defaultState();
    s.opts.licenseHeader.content = "// a much longer custom header than the default one";
    saveToHash(s);
    expect(location.hash.length).toBeGreaterThan(short);
  });

  it("excludes pasted source", () => {
    const s = defaultState();
    s.customSource = "class Secret {}";
    const back = roundTrip(s);
    expect(back.customSource).toBeNull();
    expect(location.hash).not.toContain("Secret");
  });

  it("falls back to defaults on a corrupt hash", () => {
    location.hash = "#not-base64-at-all!!";
    expect(loadFromHash()).toEqual(defaultState());
  });

  it("ignores an unknown formatter id from a stale link", () => {
    location.hash = "#" + btoa(JSON.stringify({ l: "java", f: "nope", e: [], o: {} }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(loadFromHash().formatter).toBe("none");
  });

  it("ignores option keys the step does not declare", () => {
    location.hash = "#" + btoa(JSON.stringify({
      l: "java", f: "none", e: [], o: { indent: { spacesPerTab: 2, evil: "x" } }
    })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const back = loadFromHash();
    expect(back.opts.indent.spacesPerTab).toBe(2);
    expect(back.opts.indent.evil).toBeUndefined();
  });

  it("falls back to the only language when the hash names an unknown one", () => {
    location.hash = "#" + btoa(JSON.stringify({ l: "kotlin", f: "none", e: [], o: {} }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(loadFromHash().language).toBe("java");
  });
});
