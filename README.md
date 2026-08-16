[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=15&duration=2000&pause=2500&color=9E8BF9&vCenter=true&center=true&multiline=true&random=false&width=435&lines=Toggle+a+Spotless+step%2C+see+what+it+does;No+build+step.+Just+open+the+HTML+file)](https://github.com/gelutz/spotless-visualizer)

[![java logo](https://skillicons.dev/icons?i=java)](https://www.java.com)  [![javascript logo](https://skillicons.dev/icons?i=js)](https://developer.mozilla.org/docs/Web/JavaScript)  [![html logo](https://skillicons.dev/icons?i=html)](https://developer.mozilla.org/docs/Web/HTML)  [![css logo](https://skillicons.dev/icons?i=css)](https://developer.mozilla.org/docs/Web/CSS)  [![gradle logo](https://skillicons.dev/icons?i=gradle)](https://gradle.org)  [![maven logo](https://skillicons.dev/icons?i=maven)](https://maven.apache.org)

## 🧼 About This Project

The [Spotless](https://github.com/diffplug/spotless) docs describe steps in prose, so you run a step on
your codebase to find out what it does. This is a single-page tool: toggle steps on the left, watch a
Java file change on the right, copy the `build.gradle` or `pom.xml` snippet that produces what you see.

I built it after guessing at `importOrder` strings and re-running the Gradle task to check, over and
over. Here you toggle and read the diff.

## 🚀 Getting Started

Open `index.html` in a browser. No build step, no server.

```bash
git clone https://github.com/gelutz/spotless-visualizer.git
cd spotless-visualizer
xdg-open index.html
```

## 🛠️ What It Does

- **Pick a base formatter**: `googleJavaFormat()`, `.aosp()`, `palantirJavaFormat()`, `eclipse()`, or none.
- **Toggle steps and tweak their options**: each step gives you its own knobs, like `importOrder`'s
  order string, `wildcardsLast` and `semanticSort`, or `cleanthat`'s mutator.
- **Read the diff**: the result pane shows a line diff against the original, or the finished file alone.
- **Copy the config**: `build.gradle` and `pom.xml` snippets track whatever you toggled on.

Steps implemented in JS, running on top of whichever base you pick:

| | |
|---|---|
| `importOrder` | `removeUnusedImports` |
| `licenseHeader` | `formatAnnotations` |
| `cleanthat` | `replace` |
| `replaceRegex` | `indent` (leadingTabsToSpaces) |
| `trimTrailingWhitespace` | `endWithNewline` |
| `toggleOffOn` | |

## ⚠️ One Caveat

`googleJavaFormat`, `palantirJavaFormat` and `eclipse` are JVM tools, so they can't run in a browser.
I hand-wrote their output as snapshots that swap the base file. They show you the style, not byte-exact
output. The other steps listed above run live on the base you selected.
