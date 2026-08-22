import { SAMPLE_NONE, SAMPLE_TSFMT } from "./samples.js";
import { runPrettier } from "./runners/prettier.js";
import { runBiome, BIOME_DOWNLOAD_MB, isBiomeArmed, armBiome } from "./runners/biome.js";

/* Reformatter choices for TypeScript. The first entry is the baseline every
 * diff is measured against, so it must be the unformatted sample.
 *
 * Two of these carry a `run` and genuinely execute: Prettier and Biome are
 * JavaScript, so the pane shows their real output rather than a snapshot -
 * on your own pasted source too. tsfmt keeps the Java treatment, because it
 * wraps a Node CLI that reads config off disk.
 *
 * Spotless treats the reformatters as mutually exclusive - configuring two in
 * one block is a configuration error - which is why this is a single-select. */

// Prettier's option names and defaults, verified against its own reference.
// Deliberately not shared with Biome's: the two drift (printWidth/lineWidth,
// trailingComma/trailingCommas, arrowParens/arrowParentheses), and one shared
// id would silently emit the wrong config for whichever tool did not own it.
const PRETTIER_OPTS = [
  { id: "printWidth",    type: "int",    def: 80 },
  { id: "tabWidth",      type: "int",    def: 2 },
  { id: "useTabs",       type: "bool",   def: false },
  { id: "semi",          type: "bool",   def: true },
  { id: "singleQuote",   type: "bool",   def: false },
  { id: "bracketSpacing", type: "bool",  def: true },
  { id: "trailingComma", type: "select", def: "all",       choices: ["all", "es5", "none"] },
  { id: "arrowParens",   type: "select", def: "always",    choices: ["always", "avoid"] },
  { id: "quoteProps",    type: "select", def: "as-needed", choices: ["as-needed", "consistent", "preserve"] }
];

// Biome's equivalents. Note it defaults to tabs where Prettier defaults to spaces.
const BIOME_OPTS = [
  { id: "indentStyle",      type: "select", def: "tab",     choices: ["tab", "space"] },
  { id: "indentWidth",      type: "int",    def: 2 },
  { id: "lineWidth",        type: "int",    def: 80 },
  { id: "quoteStyle",       type: "select", def: "double",  choices: ["double", "single"] },
  { id: "semicolons",       type: "select", def: "always",  choices: ["always", "asNeeded"] },
  { id: "trailingCommas",   type: "select", def: "all",     choices: ["all", "es5", "none"] },
  { id: "arrowParentheses", type: "select", def: "always",  choices: ["always", "asNeeded"] },
  { id: "quoteProperties",  type: "select", def: "asNeeded", choices: ["asNeeded", "preserve"] },
  { id: "bracketSpacing",   type: "bool",   def: true }
];

// Spotless feeds Prettier content with no filename to sniff, so the parser has
// to be named explicitly. Same trap as Biome's language('ts').
const prettierConfig = o => [
  "'parser': 'typescript'",
  `'printWidth': ${o.printWidth}`,
  `'tabWidth': ${o.tabWidth}`,
  `'useTabs': ${o.useTabs}`,
  `'semi': ${o.semi}`,
  `'singleQuote': ${o.singleQuote}`,
  `'bracketSpacing': ${o.bracketSpacing}`,
  `'trailingComma': '${o.trailingComma}'`,
  `'arrowParens': '${o.arrowParens}'`,
  `'quoteProps': '${o.quoteProps}'`
].join(", ");

export const TYPESCRIPT_FORMATTERS = [
  {
    id: "none", label: "(none)", text: SAMPLE_NONE, gradle: null, maven: null,
    doc: "No reformatter. Only the cheap steps below run.",
    details: {
      summary: "Leaves layout exactly as written. Useful for seeing what the small, " +
               "surgical steps do on their own without a whole-file reformat on top.",
      rules: [
        "Indentation, line breaks and alignment are whatever the sample already has.",
        "Only the steps you tick below are applied.",
        "This is also what real Spotless does if your typescript {} block has no reformatter step."
      ],
      opts: [],
      note: "Most projects do run one reformatter. Mixing two is an error - Spotless will " +
            "complain if you configure e.g. prettier() and biome() in the same block."
    }
  },
  {
    id: "prettier", label: "prettier()", text: SAMPLE_NONE,
    doc: "The usual TypeScript formatter. Runs for real here, on your own source too.",
    opts: PRETTIER_OPTS,
    run: runPrettier,
    gradle: o => `prettier()\n  .config([${prettierConfig(o)}])`,
    maven:  o => `<prettier>\n  <config>\n` +
      `    <parser>typescript</parser>\n` +
      `    <printWidth>${o.printWidth}</printWidth>\n` +
      `    <tabWidth>${o.tabWidth}</tabWidth>\n` +
      `    <useTabs>${o.useTabs}</useTabs>\n` +
      `    <semi>${o.semi}</semi>\n` +
      `    <singleQuote>${o.singleQuote}</singleQuote>\n` +
      `    <bracketSpacing>${o.bracketSpacing}</bracketSpacing>\n` +
      `    <trailingComma>${o.trailingComma}</trailingComma>\n` +
      `    <arrowParens>${o.arrowParens}</arrowParens>\n` +
      `    <quoteProps>${o.quoteProps}</quoteProps>\n` +
      `  </config>\n</prettier>`,
    details: {
      summary: "Prettier reprints the file from its parsed AST: it throws away your line breaks " +
               "and re-derives them to fit the print width. What it will not touch is semantics - " +
               "it moves no code, renames nothing and deletes no imports.",
      rules: [
        "printWidth is a target, not a hard limit - a long string or identifier will overflow it.",
        "objectWrap defaults to 'preserve': a { that you already put on its own line stays expanded.",
        "Comments are kept but may move to stay attached to the node they document.",
        "It does not sort or remove imports. Pair it with an eslint() step for that.",
        "Idempotent: formatting already-formatted output changes nothing."
      ],
      opts: [
        ["prettier('3.9.6')", "pin the Prettier version"],
        ["config(['parser': 'typescript', ...])", "inline options, the form emitted on the left"],
        ["configFile('.prettierrc.yml')", "read options from a file - Spotless does NOT auto-discover it"],
        ["npmExecutable('/path/to/npm')", "point Spotless at the npm it should use"]
      ],
      note: "Two Spotless-specific traps: it does not pick up a .prettierrc on its own, you must " +
            "pass configFile explicitly; and Prettier `overrides` are not supported through it. " +
            "The parser must be set because Spotless feeds content without a filename to sniff. " +
            "Options not shown here (experimentalTernaries, objectWrap, endOfLine, the JSX and " +
            "Vue-only ones) still work in a real build."
    }
  },
  {
    id: "biome", label: "biome()", text: SAMPLE_NONE,
    doc: `Fast Rust formatter. Runs for real here, but downloads ~${BIOME_DOWNLOAD_MB} MB of WASM first.`,
    opts: BIOME_OPTS,
    run: runBiome,
    // Shown in place of the output until the user accepts the download.
    gate: { armed: isBiomeArmed, arm: armBiome,
            prompt: `biome() really runs here, but it is ${BIOME_DOWNLOAD_MB} MB of WebAssembly ` +
                    `that has to download first.`,
            action: `download ~${BIOME_DOWNLOAD_MB} MB and run biome()` },
    gradle: o => `biome('2.1.0')\n  .configPath('config')\n  .language('ts')` +
      `\n// config/biome.json: ${JSON.stringify(biomeJson(o))}`,
    maven:  o => `<biome>\n  <version>2.1.0</version>\n  <configPath>config</configPath>\n` +
      `  <language>ts</language>\n</biome>\n` +
      `<!-- config/biome.json: ${JSON.stringify(biomeJson(o))} -->`,
    details: {
      summary: "Biome is a formatter and linter written in Rust, shipping as a single native " +
               "binary - it is the one step here that needs no Node in a real build. Its output " +
               "is close to Prettier's by design, but not identical, and its defaults differ.",
      rules: [
        "Defaults to tabs, where Prettier defaults to two spaces.",
        "Option names differ from Prettier's throughout: lineWidth, trailingCommas, quoteStyle.",
        "Formatting and linting are separate: biome() in Spotless is the formatter only.",
        "Like Prettier it reprints from the AST and does not reorder or remove imports.",
        "In this page it is WebAssembly, which is why it has to download before it can run."
      ],
      opts: [
        ["biome('2.1.0')", "pin the Biome version"],
        ["configPath('config')", "DIRECTORY holding biome.json - not the file itself"],
        ["language('ts')", "required: Spotless passes no filename, so Biome cannot infer the parser"],
        ["pathToExe('/path/to/biome')", "use an already-installed binary instead of downloading one"]
      ],
      note: "configPath takes the directory containing biome.json, which catches people out. " +
            "Options not shown here - lineEnding, attributePosition, expand, bracketSameLine, " +
            "operatorLinebreak - all work in a real build."
    }
  },
  {
    id: "tsfmt", label: "tsfmt()", text: SAMPLE_TSFMT,
    doc: "Legacy. Wraps a Node CLI that reads config off disk, so this one is a snapshot.",
    gradle: () => `tsfmt('7.2.2')\n  .tsconfigFile('tsconfig.json')`,
    maven:  () => `<tsfmt>\n  <version>7.2.2</version>\n  <tsconfigFile>tsconfig.json</tsconfigFile>\n</tsfmt>`,
    details: {
      summary: "Wraps the typescript-formatter npm package, which drives the TypeScript language " +
               "service's own formatter. It normalises spacing and indentation and little else - " +
               "it will not change your quotes, insert semicolons or re-wrap a long line.",
      rules: [
        "Reads its settings from tsconfig.json, tslint.json, vscode.json or tsfmt.json.",
        "Under Spotless auto-discovery does not work: every path must be given explicitly.",
        "Much smaller in scope than Prettier or Biome - it is a spacing pass, not a reprint.",
        "Built on TSLint, which is deprecated, so the whole tool is effectively legacy."
      ],
      opts: [
        ["tsfmt('7.2.2')", "pin the typescript-formatter version"],
        ["config(['indentSize': 1, 'convertTabsToSpaces': true])", "inline settings"],
        ["tsconfigFile('tsconfig.json')", "the usual source of settings"],
        ["tslintFile('tslint.json')", "TSLint rules that affect formatting"],
        ["vscodeFile('vscode.json') / tsfmtFile('tsfmt.json')", "the other two config sources"]
      ],
      note: "Prefer prettier() or biome() for new projects. tsfmt is documented here because " +
            "Spotless still offers it, not because it is a good default."
    }
  }
];

// What the configPath directory would contain. Emitted as a comment beside the
// step, since Spotless points Biome at a file rather than taking inline config.
function biomeJson(o) {
  return {
    formatter: { indentStyle: o.indentStyle, indentWidth: o.indentWidth, lineWidth: o.lineWidth },
    javascript: { formatter: {
      quoteStyle: o.quoteStyle, semicolons: o.semicolons, trailingCommas: o.trailingCommas,
      arrowParentheses: o.arrowParentheses, quoteProperties: o.quoteProperties,
      bracketSpacing: o.bracketSpacing
    } }
  };
}
