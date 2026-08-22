import { describe, it, expect, beforeEach } from "vitest";

// state.js touches `location` and `history` at call time, not import time, so a
// pair of stubs is enough - no DOM environment needed.
globalThis.location = { hash: "" };
globalThis.history = { replaceState: (_a, _b, url) => { globalThis.location.hash = url; } };

const { defaultState, switchLanguage, saveToHash, loadFromHash } = await import("./state.js");
const { registerLanguage, getLanguage } = await import("./languages/registry.js");
await import("./languages/java/index.js");

/* Java's formatters declare no options, so a language that does is needed to
 * exercise the formatter-option half of the round trip. */
registerLanguage({
  id: "opted", label: "Opted", fileName: "f.ts", blockName: "opted",
  formatters: [
    { id: "none", label: "(none)", doc: "", text: "a", gradle: null, maven: null },
    { id: "real", label: "real()", doc: "", text: "", gradle: () => "", maven: () => "",
      opts: [{ id: "width", type: "int", def: 80 }, { id: "semi", type: "bool", def: true }],
      run: async s => s }
  ],
  steps: [], stepGroups: [{ id: "g", title: "G" }]
});

/* A language off the JVM entirely: its config pane offers only the file its own
 * formatter reads, so "gradle" is not a build target it has. */
registerLanguage({
  id: "nativeOnly", label: "NativeOnly", fileName: "f.ts", blockName: "n",
  builds: ["native"],
  formatters: [{ id: "none", label: "(none)", doc: "", text: "a", gradle: null, maven: null }],
  steps: [], stepGroups: [{ id: "g", title: "G" }]
});

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

  // Java's formatters declare none, but the map still has an entry per
  // formatter so a lookup never lands on undefined.
  it("gives every formatter an options bag", () => {
    const s = defaultState();
    expect(Object.keys(s.formatterOpts).sort()).toEqual(["aosp", "eclipse", "gjf", "none", "palantir"]);
    expect(s.formatterOpts.gjf).toEqual({});
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

  it("restores non-default formatter options", () => {
    const s = defaultState("opted");
    s.formatter = "real";
    s.formatterOpts.real.width = 120;
    const back = roundTrip(s);
    expect(back.formatter).toBe("real");
    expect(back.formatterOpts.real.width).toBe(120);
    expect(back.formatterOpts.real.semi).toBe(true);
  });

  it("ignores formatter options a stale link invented", () => {
    const s = defaultState("opted");
    s.formatter = "real";
    saveToHash(s);
    const raw = JSON.parse(decodeURIComponent(escape(atob(
      location.hash.slice(1).replace(/-/g, "+").replace(/_/g, "/")))));
    raw.fo = { width: 120, nonsense: 1 };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(raw))))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    location.hash = "#" + b64;
    const back = loadFromHash();
    expect(back.formatterOpts.real.width).toBe(120);
    expect(back.formatterOpts.real.nonsense).toBeUndefined();
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

describe("build target", () => {
  it("defaults to the first target the language declares", () => {
    expect(defaultState("java").build).toBe("gradle");
    expect(defaultState("nativeOnly").build).toBe("native");
  });

  it("round-trips a target the language offers", () => {
    const s = defaultState("java");
    s.build = "maven";
    saveToHash(s);
    expect(loadFromHash().build).toBe("maven");
  });

  it("drops a target the language does not offer, rather than rendering a dead tab", () => {
    const s = defaultState("java");
    s.build = "maven";
    saveToHash(s);
    // Hand-edit the encoded language so the link claims Maven for a native-only one.
    const raw = JSON.parse(decodeURIComponent(escape(atob(
      location.hash.slice(1).replace(/-/g, "+").replace(/_/g, "/")))));
    raw.l = "nativeOnly";
    location.hash = "#" + btoa(unescape(encodeURIComponent(JSON.stringify(raw))))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(loadFromHash().build).toBe("native");
  });

  it("resets the target when switching to a language that lacks it", () => {
    const s = defaultState("java");
    s.build = "maven";
    expect(switchLanguage(s, "nativeOnly").build).toBe("native");
  });

  it("never leaves a target outside the language's own row", () => {
    // The invariant the config pane relies on: whatever build is set, the
    // language offers it, so the active tab and the rendered pane agree.
    for (const id of ["java", "nativeOnly", "opted"]) {
      const st = defaultState(id);
      expect(getLanguage(id).builds).toContain(st.build);
    }
  });
});
