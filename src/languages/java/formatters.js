import {
  SAMPLE_NONE, SAMPLE_GJF, SAMPLE_AOSP, SAMPLE_PALANTIR, SAMPLE_ECLIPSE
} from "./samples.js";

/* Reformatter choices for Java. The first entry is the baseline every diff is
 * measured against, so it must be the unformatted sample.
 *
 * `text` is a hand-written snapshot of what the real formatter would produce -
 * these are JVM tools and cannot run in a browser. `details` drives the "?"
 * help modal, which is where the real behaviour is spelled out. */

export const JAVA_FORMATTERS = [
  {
    id: "none", label: "(none)", text: SAMPLE_NONE, gradle: null, maven: null,
    doc: "No reformatter. Only the cheap steps below run.",
    details: {
      summary: "Leaves layout exactly as written. Useful for seeing what the small, " +
               "surgical steps do on their own without a whole-file reformat on top.",
      rules: [
        "Indentation, line breaks and alignment are whatever the sample already has.",
        "Only the steps you tick below are applied.",
        "This is also what real Spotless does if your java {} block has no reformatter step."
      ],
      opts: [],
      note: "Most projects do run one reformatter. Mixing two is an error - Spotless will " +
            "complain if you configure e.g. googleJavaFormat and eclipse in the same block."
    }
  },
  {
    id: "gjf", label: "googleJavaFormat()", text: SAMPLE_GJF,
    doc: "Google Java Style: 2-space indent, 100-col limit.",
    gradle: () => "googleJavaFormat()",
    maven:  () => "<googleJavaFormat/>",
    details: {
      summary: "Runs google-java-format, the formatter behind Google Java Style. It throws away " +
               "your existing line breaks entirely and re-derives them from the parsed AST, so " +
               "the output is fully deterministic: two files with identical syntax trees format " +
               "to byte-identical text.",
      rules: [
        "2-space indent for blocks, 4-space continuation indent for wrapped expressions.",
        "100-column line limit. Anything longer is broken at the outermost fitting point.",
        "One statement per line; K&R braces; braces required even on single-statement if bodies.",
        "Blank lines you wrote are collapsed to at most one; a blank line is inserted between members.",
        "Annotations on classes/methods/fields go on their own line. Parameter and type-use " +
          "annotations stay inline.",
        "No column alignment - it will not line up your `=` signs or array elements.",
        "Import statements are NOT sorted or removed. Add importOrder / removeUnusedImports for that.",
        "Javadoc is reflowed only if you opt in with formatJavadoc()."
      ],
      opts: [
        ["googleJavaFormat('1.28.0')", "pin the formatter version (default follows the Spotless release)"],
        ["reflowLongStrings()", "split over-long string literals across lines with +"],
        ["formatJavadoc(true)", "reflow Javadoc bodies too (off by default)"],
        ["skipJavadocFormatting()", "explicitly leave all Javadoc alone"]
      ],
      note: "Needs JDK 11+ to run, and on JDK 16+ Spotless has to add --add-exports flags to reach " +
            "internal javac APIs. Fails hard on source it cannot parse, so a syntax error stops the build."
    }
  },
  {
    id: "aosp", label: "googleJavaFormat().aosp()", text: SAMPLE_AOSP,
    doc: "Same formatter, AOSP variant: 4-space indent.",
    gradle: () => "googleJavaFormat().aosp()",
    maven:  () => "<googleJavaFormat>\n  <style>AOSP</style>\n</googleJavaFormat>",
    details: {
      summary: "Identical engine to googleJavaFormat(), switched to the Android Open Source Project " +
               "style variant. The only differences are the indent widths - every other rule about " +
               "line breaking, braces and blank lines is the same.",
      rules: [
        "4-space indent for blocks (vs 2 in the Google variant).",
        "8-space continuation indent for wrapped expressions (vs 4).",
        "Same 100-column limit, same brace style, same annotation placement.",
        "Because the indent is wider, lines wrap sooner than under the Google variant."
      ],
      opts: [
        ["googleJavaFormat().aosp()", "Gradle: chained call"],
        ["<style>AOSP</style>", "Maven: style tag inside <googleJavaFormat>"],
        ["googleJavaFormat('1.28.0').aosp()", "version pin plus the variant"]
      ],
      note: "Pick this if your codebase is Android or already on a 4-space convention. Switching " +
            "between GOOGLE and AOSP re-wraps the whole repo, so it makes for a noisy commit."
    }
  },
  {
    id: "palantir", label: "palantirJavaFormat()", text: SAMPLE_PALANTIR,
    doc: "Palantir fork of google-java-format: 4-space indent, different line breaking.",
    gradle: () => "palantirJavaFormat()",
    maven:  () => "<palantirJavaFormat/>",
    details: {
      summary: "A fork of google-java-format that keeps the deterministic AST-based approach but " +
               "retunes the line-breaking heuristics for readability on wide, chained code - " +
               "builders, streams and long generic signatures.",
      rules: [
        "4-space indent, 120-column limit (google-java-format uses 100).",
        "Prefers breaking a whole chain onto one-call-per-line rather than filling each line up.",
        "Keeps short lambdas and short method bodies on a single line where gjf would explode them.",
        "Less aggressive about splitting method arguments; tries to keep an argument list intact.",
        "Same guarantees otherwise: idempotent, ignores your original line breaks, no alignment.",
        "Also does not touch imports - pair it with importOrder / removeUnusedImports."
      ],
      opts: [
        ["palantirJavaFormat('2.50.0')", "pin the formatter version"],
        ["style('GOOGLE')", "use google-java-format's 100-col style through the Palantir engine"],
        ["formatJavadoc(true)", "reflow Javadoc (2.39.0+)"]
      ],
      note: "Output is close to, but not the same as, google-java-format - the two cannot be mixed " +
            "across a repo without a full reformat. Requires JDK 11+."
    }
  },
  {
    id: "eclipse", label: "eclipse()", text: SAMPLE_ECLIPSE,
    doc: "Eclipse JDT formatter, driven by an exported Eclipse profile.",
    gradle: () => "eclipse()",
    maven:  () => "<eclipse/>",
    details: {
      summary: "Runs the same formatter the Eclipse IDE uses (JDT). Unlike the Google/Palantir " +
               "family it is fully configurable - roughly 300 knobs in an exported XML profile - " +
               "and it respects some of your existing formatting instead of rebuilding every line.",
      rules: [
        "Behaviour is whatever the profile says. With no configFile you get Eclipse's built-in defaults.",
        "Defaults are 4-space indent (the IDE default is tabs; Spotless's bundled default emits spaces).",
        "Can preserve existing line breaks in places, so output is not purely a function of the AST.",
        "Can do column alignment - lining up field assignments or array initialisers - which the " +
          "Google-family formatters refuse to do.",
        "Honours //$FALL-THROUGH$ style tags and the off/on tags configured in the profile.",
        "Also does not sort or remove imports on its own."
      ],
      opts: [
        ["eclipse('4.36')", "pin the JDT version"],
        ["configFile('eclipse-formatter.xml')", "an exported Eclipse profile - the usual way to drive it"],
        ["configProperties('''...''')", "inline org.eclipse.jdt.core.formatter.* properties"],
        ["<file>${project.basedir}/eclipse.xml</file>", "Maven equivalent of configFile"]
      ],
      note: "Export the profile from Eclipse: Preferences > Java > Code Style > Formatter > Export All. " +
            "Different JDT versions can format the same file differently, so pin the version if you " +
            "care about reproducible builds across machines."
    }
  }
];
