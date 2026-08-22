# TypeScript support

Research notes for adding `typescript` as a second language to the visualizer.
Written before the code exists, so the wiring has something exact to target.

Every claim about what runs in a browser was checked by running it, not by
reading docs. Versions tested: `prettier@3.9.6`, `@biomejs/js-api@6.0.0` +
`@biomejs/wasm-web@2.5.10`, `eslint-linter-browserify@10.9.0`,
`@typescript-eslint/parser@8.67.0`.

## The short version

The Java language module exists because **no** Java reformatter runs in a
browser - `googleJavaFormat`, `palantirJavaFormat` and `eclipse` are all JVM
tools, so `src/languages/java/samples.js` ships hand-written snapshots of what
they *would* produce.

TypeScript is the opposite case. Two of the three reformatters are real
JavaScript and run for real in the browser:

| Spotless step | Runs in browser? | How |
|---|---|---|
| `prettier()` | **yes** | `prettier/standalone` + the `estree` and `typescript` plugins |
| `biome()` | **yes** | `@biomejs/wasm-web` through `@biomejs/js-api/web` |
| `eslint()` | **partly** | `eslint-linter-browserify` + `@typescript-eslint/parser`; syntax rules only, no type-aware rules |
| `tsfmt()` | no | wraps the `typescript-formatter` npm CLI; needs Node |

So TypeScript can do something Java cannot: the reformatter pane can show a
**real** result instead of a snapshot. That is the main design consequence
below.

## What Spotless actually offers for TypeScript

The `typescript` block, per the Spotless Gradle and Maven READMEs. Note that
`target` is mandatory for TypeScript - Spotless does not infer it the way it
does for Java.

```gradle
spotless {
  typescript {
    target 'src/**/*.ts'

    tsfmt()
    prettier()
    eslint()
    biome()

    licenseHeader '/* (C) $YEAR */', '(import|const|declare|export|var) '
  }
}
```

The generic steps (`replace`, `replaceRegex`, `indent`, `trimTrailingWhitespace`,
`endWithNewline`, `toggleOffOn`, `licenseHeader`) all apply to `typescript` too,
and the visualizer already implements them - they are language-agnostic string
transforms. **They port over for free.** Only the reformatter row is new work.

One Spotless rule matters for the UI: the reformatters are mutually exclusive in
practice. Configuring `prettier()` and `biome()` in the same block is a
configuration error, exactly like mixing `googleJavaFormat` and `eclipse`. The
existing single-select reformatter control is therefore the right shape - keep
it.

### `licenseHeader` needs a different delimiter

For Java the delimiter is `package `. TypeScript has no package statement, so
the delimiter must be a regex matching whatever comes first:

```gradle
licenseHeader '/* (C) $YEAR */', '(import|const|declare|export|var) '
```

The current step's `apply` uses `lines.findIndex(l => l.startsWith(o.delimiter))`
- a literal prefix match. That is wrong for TypeScript, where the delimiter is a
regex alternation. **This is a real code change**, not just a different default:
the step needs to treat `delimiter` as a regex when the language says so. See
"Wiring notes" below.

---

## Reformatter 1: `prettier()` - runs for real

The recommended default. Small, fast, no WASM, and it is what most TypeScript
projects actually use.

```js
import * as prettier from "prettier/standalone";
import estree from "prettier/plugins/estree";
import tsPlugin from "prettier/plugins/typescript";

const out = await prettier.format(src, {
  parser: "typescript",
  plugins: [estree, tsPlugin],   // required: standalone loads no plugins itself
  ...opts,
});
```

Two things to know before wiring:

- **`format()` is async.** The pipeline in `src/core/pipeline.js` is synchronous
  (`active.reduce(...)`). This is the single biggest structural change - see
  "Wiring notes".
- **Both plugins are required.** `estree` does the printing, `typescript` does
  the parsing. Omitting `estree` fails at print time, which is a confusing error.

Cost: ~1.2 MB raw / **~300 KB gzipped** for all three files. Lazy-load them when
the user first picks a TypeScript formatter and it is a non-issue.

### Prettier options

Verified defaults from the Prettier options reference. The ones that actually
change TypeScript output are marked ✅ - those are the ones worth exposing as
step controls; the rest are for other languages or edge cases.

| Option | Default | Values | Effect |
|---|---|---|---|
| ✅ `printWidth` | `80` | int | Wrap column |
| ✅ `tabWidth` | `2` | int | Spaces per indent level |
| ✅ `useTabs` | `false` | bool | Indent with tabs |
| ✅ `semi` | `true` | bool | Trailing semicolons |
| ✅ `singleQuote` | `false` | bool | `'` over `"` |
| ✅ `quoteProps` | `"as-needed"` | `as-needed` \| `consistent` \| `preserve` | When to quote object keys |
| ✅ `trailingComma` | `"all"` | `all` \| `es5` \| `none` | Trailing commas in multiline |
| ✅ `bracketSpacing` | `true` | bool | `{ a }` vs `{a}` |
| ✅ `arrowParens` | `"always"` | `always` \| `avoid` | `(x) => x` vs `x => x` |
| ✅ `objectWrap` | `"preserve"` | `preserve` \| `collapse` | Honour your object line breaks |
| ✅ `endOfLine` | `"lf"` | `lf` \| `crlf` \| `cr` \| `auto` | Line endings |
| ✅ `experimentalTernaries` | `false` | bool | New ternary formatting |
| ✅ `experimentalOperatorPosition` | `"end"` | `start` \| `end` | Operator side on wrap |
| `jsxSingleQuote` | `false` | bool | JSX only |
| `bracketSameLine` | `false` | bool | JSX/HTML only |
| `singleAttributePerLine` | `false` | bool | JSX/HTML only |
| `htmlWhitespaceSensitivity` | `"css"` | `css` \| `strict` \| `ignore` | HTML only |
| `vueIndentScriptAndStyle` | `false` | bool | Vue only |
| `proseWrap` | `"preserve"` | `always` \| `never` \| `preserve` | Markdown only |
| `embeddedLanguageFormatting` | `"auto"` | `off` \| `auto` | Format code in template literals |
| `requirePragma` | `false` | bool | Only format files marked `@format` |
| `insertPragma` | `false` | bool | Insert `@format` marker |
| `checkIgnorePragma` | `false` | bool | Skip files marked `@noprettier` |
| `rangeStart` / `rangeEnd` | `0` / `Infinity` | int | Partial format |
| `parser` | - | `typescript` | Fixed by us |
| `filepath` | - | string | Not needed, we set `parser` |

Suggested visible controls: `printWidth`, `tabWidth`, `useTabs`, `semi`,
`singleQuote`, `trailingComma`, `arrowParens`, `bracketSpacing`, `quoteProps`.
That is the set people actually argue about; the rest can live in the `?` modal.

### Spotless config it maps to

```gradle
prettier()
  .config(['parser': 'typescript', 'printWidth': 100, 'singleQuote': true])
```
```gradle
prettier('3.9.6').configFile('.prettierrc.yml')
```
```xml
<prettier>
  <version>3.9.6</version>
  <config><parser>typescript</parser><printWidth>100</printWidth></config>
</prettier>
```

Caveats worth putting in the `?` modal: Spotless does **not** auto-discover
`.prettierrc` - you must pass `configFile` explicitly. Prettier `overrides` are
not supported through Spotless. And `parser: 'typescript'` must be set, because
Spotless feeds content without a filename for Prettier to sniff.

---

## Reformatter 2: `biome()` - runs for real, but heavy

Biome is the one Spotless step here that needs **no Node at all** in a real
build - it ships as a native binary. In the browser it is WASM.

```js
import { Biome } from "@biomejs/js-api/web";

const biome = new Biome();                       // v6: plain constructor
const { projectKey } = biome.openProject("/");   // v6: everything is project-scoped
biome.applyConfiguration(projectKey, config);
const { content } = biome.formatContent(projectKey, src, { filePath: "Example.ts" });
```

The v6 API differs from every blog post and from `@biomejs/js-api` v0.x/v1.x:

- `Biome.create({ distribution })` is **gone** from the per-distribution entry
  points. Import `@biomejs/js-api/web` and use `new Biome()`. The `Distribution`
  enum only exists on the root `.` entry.
- `openProject()` must be called first, and its `projectKey` is the **first
  argument** to `applyConfiguration`, `formatContent` and `lintContent`. Calling
  `applyConfiguration(config)` without it fails with a WASM error
  (`invalid type ... expected a nonzero usize`) that names nothing useful.
- `filePath` is how Biome picks the parser. It must end in `.ts`.

**The cost is the problem: 44 MB raw, ~10.7 MB gzipped WASM.** That is roughly
35× the whole Prettier path. It must be lazy-loaded strictly on demand, behind a
visible "this will download ~11 MB" affordance, or the page stops being the
"just open the HTML file" tool the README promises. If that is unacceptable,
Biome falls back to the Java treatment: a pre-baked snapshot in `samples.js`.

Biome also lints: `lintContent(projectKey, src, { filePath, fixFileMode: "safeFixes" })`
returns fixed content plus diagnostics. That is a possible second step rather
than part of the reformatter.

### Biome options

Global block, then the JavaScript/TypeScript overrides. Defaults verified
against the Biome configuration reference. Note Biome defaults to **tabs**,
unlike Prettier.

| `formatter.*` | Default | Values |
|---|---|---|
| `indentStyle` | `"tab"` | `tab` \| `space` |
| `indentWidth` | `2` | int |
| `lineWidth` | `80` | int |
| `lineEnding` | `"lf"` | `lf` \| `crlf` \| `cr` \| `auto` |
| `formatWithErrors` | `false` | bool |
| `attributePosition` | `"auto"` | `auto` \| `multiline` |
| `bracketSpacing` | `true` | bool |
| `expand` | `"auto"` | `auto` \| `always` \| `never` |
| `trailingNewline` | `true` | bool |

| `javascript.formatter.*` | Default | Values |
|---|---|---|
| `quoteStyle` | `"double"` | `single` \| `double` |
| `jsxQuoteStyle` | `"double"` | `single` \| `double` |
| `quoteProperties` | `"asNeeded"` | `asNeeded` \| `preserve` |
| `trailingCommas` | `"all"` | `all` \| `es5` \| `none` |
| `semicolons` | `"always"` | `always` \| `asNeeded` |
| `arrowParentheses` | `"always"` | `always` \| `asNeeded` |
| `bracketSameLine` | `false` | bool |
| `bracketSpacing` | `true` | bool |
| `attributePosition` | `"auto"` | `auto` \| `multiline` |
| `expand` | `"auto"` | `auto` \| `always` \| `never` |
| `operatorLinebreak` | `"after"` | `after` \| `before` |
| `indentStyle` / `indentWidth` / `lineWidth` / `lineEnding` | inherit global | as above |

Note the naming drift from Prettier - `lineWidth` not `printWidth`,
`trailingCommas` not `trailingComma`, `arrowParentheses` not `arrowParens`,
`quoteStyle` not `singleQuote`. Do not share option ids between the two steps.

### Spotless config it maps to

```gradle
biome('2.1.0')
  .configPath('path/config/dir')   // directory holding biome.json, not the file
  .language('ts')
```
```xml
<biome>
  <version>2.1.0</version>
  <configPath>path/config/dir</configPath>
  <language>ts</language>
</biome>
```

`configPath` is a **directory** containing `biome.json`, which surprises people.
`language('ts')` is needed because Spotless passes content without a filename,
so Biome cannot infer the parser - the same trap as Prettier's `parser`.

---

## Reformatter 3: `eslint()` - partly, and the limit is sharp

This one needs care, because the honest answer is "the half you probably want
works, the half people ask about does not".

`eslint-linter-browserify` is a browser build of ESLint's `Linter` class.
Paired with `@typescript-eslint/parser` it parses and autofixes TypeScript:

```js
import { Linter } from "eslint-linter-browserify";
import * as tsParser from "@typescript-eslint/parser";

const linter = new Linter();
const config = [{
  files: ["**/*.ts"],
  languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: "latest", sourceType: "module" } },
  rules: { semi: ["error", "always"], quotes: ["error", "double"] },
}];
const { output, fixed, messages } = linter.verifyAndFix(src, config, { filename: "Example.ts" });
```

Verified working: `verifyAndFix` on TypeScript source returned corrected output
for `semi` and `quotes`, and correctly left the non-autofixable `eqeqeq` as a
remaining message.

### The limit

**Type-aware rules cannot work.** Setting `parserOptions.project` makes
typescript-eslint build a real `ts.Program`, which reads `tsconfig.json` and the
source files from disk. In a browser there is no disk. Tested directly - it
returns:

```
Parsing error: Cannot read file '/…/tsconfig.json'.
```

So the whole `@typescript-eslint` type-checked tier is out:
`no-floating-promises`, `no-unsafe-assignment`, `await-thenable`,
`strict-boolean-expressions`, and every other rule needing the checker. Only
syntactic rules run.

This matters because **Spotless's own `eslint()` docs say configuration is
mandatory and the typical config is `standard-with-typescript` with
`project: './tsconfig.json'`** - i.e. the documented happy path is exactly the
part that cannot run here.

Second limit: only ESLint's **built-in** rules are bundled. Any
`eslint-plugin-*` (including `@typescript-eslint/eslint-plugin` rules) would
have to be bundled explicitly, one by one.

Cost: ~4 MB raw / ~800 KB gzipped for the linter, plus ~1.6 MB gzipped for the
`typescript` library the parser depends on.

### Recommendation

Model `eslint()` as a **step**, not a reformatter - it is a fixer, not a
whole-file reformatter, and it composes with Prettier the way real projects use
it. Expose a small set of autofixable built-in rules as toggles, and state the
type-aware limitation plainly in the `?` modal. Do not silently produce
different output from a real build.

### Spotless config it maps to

```gradle
eslint('8.30.0')
  .configJs('''
    {
      env: { browser: true, es2021: true },
      extends: 'standard-with-typescript',
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module', project: './tsconfig.json' }
    }
  ''')
  .tsconfigFile('tsconfig.json')
```

`configFile(...)` is the alternative to `configJs`. Either way one is required.
ESLint always needs a real Node toolchain in the build; `npmExecutable` /
`nodeExecutable` / `npmInstallCache` tune how Spotless finds it.

---

## Reformatter 4: `tsfmt()` - no

Wraps the `typescript-formatter` npm package, which is a Node CLI reading
`tsconfig.json` / `tslint.json` / `vscode.json` / `tsfmt.json` off disk. Nothing
about it works in a browser, and unlike Prettier it has no standalone build.
Snapshot only.

Options are pass-through to `typescript-formatter`, keyed by its config files:

```gradle
tsfmt('7.2.2')
  .config(['indentSize': 1, 'convertTabsToSpaces': true])
  .tsconfigFile('tsconfig.json')
  .tslintFile('tslint.json')
  .vscodeFile('vscode.json')
  .tsfmtFile('tsfmt.json')
```

Auto-discovery does not work under Spotless; paths must be explicit. `tsfmt` is
also effectively legacy - it is built on TSLint, which is deprecated. Document
it for completeness, rank it last in the UI.

---

## Wiring notes

Things the current core cannot do yet. Listed because they are the actual work,
and the first is not optional.

### 1. The pipeline must go async

`runPipeline` is synchronous. Prettier's `format()` returns a Promise, and
Biome's WASM module loads asynchronously. Either:

- make `runPipeline` `async` and `await` each step's `apply`, letting sync steps
  return plain values (`await` on a non-Promise is fine), or
- keep the sync pipeline for cheap steps and treat the reformatter as a separate
  async stage resolved before `runPipeline` runs.

The second is closer to the current design: `sourceOf()` already separates "the
text the pipeline starts from" from the baseline. A real reformatter just makes
`base` something computed rather than looked up. It also keeps `blameStep`
untouched.

### 2. `sourceOf()` assumes reformatters are fake

The current comment says the reformatters "cannot run in a browser", and
`sourceOf` returns `formatter.text` - a snapshot - and refuses to run them on
pasted source. For TypeScript that restriction should lift: with pasted source
and Prettier or Biome selected, the reformatter **can** run. That is a strictly
better experience and the main reason to add TypeScript at all.

Suggest a per-formatter flag, e.g. `run: async (src, opts) => string`, present
for Prettier/Biome and absent for tsfmt. `sourceOf` uses `run` when it exists
and falls back to the `text` snapshot when it does not. Java is unaffected -
none of its formatters get a `run`.

### 3. `formatters[0]` must still be the unformatted sample

The registry contract says the baseline is `formatters[0]` and must be the
unformatted text. Keep a `(none)` entry as the TypeScript baseline, same as Java.

### 4. `licenseHeader` delimiter is a regex here

As noted above, `startsWith` is wrong for `(import|const|declare|export|var) `.
Make the step compile the delimiter as a regex (Spotless itself treats it as a
regex for every language, including Java - `package ` just happens to be a
regex that matches itself). Fixing it properly improves Java too.

### 5. Blame attribution

`runPipeline` credits the reformatter only for lines no cheap step explains, and
only when `!custom`. Once the reformatter really runs on pasted source, drop the
`!custom` condition for languages whose formatter has `run`.

## Proposed module layout

Mirrors `src/languages/java/`:

```
src/languages/typescript/
  index.js        registerLanguage({ id: "typescript", ... })
  samples.js      SAMPLE_NONE + snapshots for tsfmt (and Biome, if not lazy-loading WASM)
  formatters.js   none | prettier | biome | tsfmt, each with doc/details/gradle/maven
  steps.js        eslint + the TS-specific bits; generic steps come from core
  runners/
    prettier.js   lazy import of prettier/standalone + plugins
    biome.js      lazy import of @biomejs/js-api/web
    eslint.js     lazy import of eslint-linter-browserify + ts parser
```

Registration values for the registry contract:

```js
registerLanguage({
  id: "typescript",
  label: "TypeScript",
  fileName: "Example.ts",
  blockName: "typescript",
  formatters: TS_FORMATTERS,   // [0] is the unformatted baseline
  steps: TS_STEPS,
  stepGroups: [
    { id: "typescript", title: "TypeScript-specific" },
    { id: "generic",    title: "Generic" },
  ],
});
```

One thing the registry does not yet carry: TypeScript's `target` is mandatory in
Spotless, so the generated Gradle/Maven snippet needs a `target 'src/**/*.ts'`
line that Java does not emit. Worth adding an optional `target` field to the
language record rather than special-casing the emitter.

## Sources

- [Spotless Gradle plugin README](https://github.com/diffplug/spotless/blob/main/plugin-gradle/README.md)
- [Spotless Maven plugin README](https://github.com/diffplug/spotless/blob/main/plugin-maven/README.md)
- [Prettier options](https://prettier.io/docs/options)
- [Prettier in the browser](https://prettier.io/docs/browser)
- [Biome configuration reference](https://biomejs.dev/reference/configuration/)
- [@biomejs/js-api](https://github.com/biomejs/biome/tree/main/packages/@biomejs/js-api)
- [typescript-eslint parser](https://typescript-eslint.io/packages/parser/)
- [typescript-eslint browser support issue #7123](https://github.com/typescript-eslint/typescript-eslint/issues/7123)
