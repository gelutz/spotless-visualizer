import { esc } from "../../../core/html.js";

export const toggleOffOn = {
  id: "toggleOffOn",
  label: "toggleOffOn",
  group: "generic",
  doc: "Freezes regions between the markers - every other step skips them.",
  opts: [
    { id: "off", type: "text", def: "spotless:off" },
    { id: "on",  type: "text", def: "spotless:on" }
  ],
  // Not a transform: the pipeline lifts the frozen regions out before running
  // anything and puts them back after. See core/pipeline.js.
  apply: null,
  gradle: o => (o.off === "spotless:off" && o.on === "spotless:on")
    ? "toggleOffOn()"
    : `toggleOffOn('${o.off}', '${o.on}')`,
  maven:  o => (o.off === "spotless:off" && o.on === "spotless:on")
    ? "<toggleOffOn/>"
    : `<toggleOffOn>\n  <off>${esc(o.off)}</off>\n  <on>${esc(o.on)}</on>\n</toggleOffOn>`
};
