[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=15&duration=2000&pause=2500&color=9E8BF9&vCenter=true&center=true&multiline=true&random=false&width=435&lines=Toggle+a+Spotless+step%2C+see+what+it+does;No+build+step.+Just+open+the+HTML+file)](https://github.com/gelutz/spotless-visualizer)

[![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.java.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![Gradle](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)](https://gradle.org)
[![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)](https://maven.apache.org)

## About This Project

The [Spotless](https://github.com/diffplug/spotless) docs describe steps in prose, so you run a step on
your codebase to find out what it does. This is a single-page tool: toggle steps on the left, watch a
Java file change on the right, copy the `build.gradle` or `pom.xml` snippet that produces what you see.

I built it after guessing at `importOrder` strings and re-running the Gradle task to check, over and
over. Here you toggle and read the diff.

## Getting Started

Open `index.html` in a browser. No build step, no server.

```bash
git clone https://github.com/gelutz/spotless-visualizer.git
cd spotless-visualizer
xdg-open index.html
```

## What It Does

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

## One Caveat

`googleJavaFormat`, `palantirJavaFormat` and `eclipse` are JVM tools, so they can't run in a browser.
I hand-wrote their output as snapshots that swap the base file. They show you the style, not byte-exact
output. The other steps listed above run live on the base you selected.
