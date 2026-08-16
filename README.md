# Spotless Config Visualizer

Toggle [Spotless](https://github.com/diffplug/spotless) steps on the left, see what they do to a
Java file on the right, and copy the equivalent `build.gradle` or `pom.xml` snippet.

Open `index.html` in a browser. No build step, no dependencies.

**Caveat:** the big reformatters (`googleJavaFormat`, `palantirJavaFormat`, `eclipse`) can't run in
a browser, so those are hand-written illustrative snapshots that swap the base file. Every other
step — `importOrder`, `removeUnusedImports`, `licenseHeader`, `formatAnnotations`, `cleanthat`,
`replace`, `replaceRegex`, `indent`, `trimTrailingWhitespace`, `endWithNewline`, `toggleOffOn` —
is really implemented in JS and runs on top of whichever base you pick.
