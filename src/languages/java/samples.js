/* ------------------------------------------------------------------ *
 * Sample Java, one per "big formatter" variant.
 *
 * The real googleJavaFormat / palantirJavaFormat / eclipse steps are full
 * Java reformatters and cannot run in a browser, so these are hand-written
 * illustrative snapshots. Every other step is a real implementation that
 * runs on top of whichever variant is selected.
 * ------------------------------------------------------------------ */

import { TAB as T, SPACE as SP } from "../../core/chars.js";

// `none`: deliberately messy. Trips every cheap step at once.
export const SAMPLE_NONE = [
  "package com.example.demo;",
  "",
  "import java.util.List;",
  "import static org.junit.jupiter.api.Assertions.assertEquals;",
  "import com.example.util.Strings;",
  "import java.util.Date;",
  "import java.util.ArrayList;" + SP + SP,
  "import javax.annotation.Nullable;",
  "import com.google.common.collect.ImmutableList;",
  "import static java.util.Objects.requireNonNull;",
  "",
  "public class Example {",
  T + "private final List<String> items = new ArrayList<String>();",
  "",
  T + "@Nullable",
  T + "private String name;" + SP,
  "",
  T + "@Override",
  T + "public String toString() {",
  "        return \"Example: TODO fix this\";",
  T + "}",
  "",
  T + "public void add(String item, boolean flag) {",
  T + T + "requireNonNull(item);",
  T + T + "if (flag == true) {",
  T + T + T + "items.add(Strings.trim(item));" + SP + SP + SP,
  T + T + "}",
  T + "}",
  "",
  T + "// spotless:off",
  T + "private static final int[] MATRIX = {",
  T + T + "1,   0,   0,",
  T + T + "0,   1,   0,   // TODO alignment kept on purpose" + SP,
  T + T + "0,   0,   1 };",
  T + "// spotless:on",
  "",
  T + "public void check() {",
  T + T + "assertEquals(1, ImmutableList.of(\"a\").size());",
  T + "}",
  "}"
].join("\n"); // note: no trailing newline

// googleJavaFormat(): 2-space indent, annotations kept on own lines, imports
// left alone (gjf does not reorder them unless importOrder runs).
export const SAMPLE_GJF = [
  "package com.example.demo;",
  "",
  "import java.util.List;",
  "import static org.junit.jupiter.api.Assertions.assertEquals;",
  "import com.example.util.Strings;",
  "import java.util.Date;",
  "import java.util.ArrayList;",
  "import javax.annotation.Nullable;",
  "import com.google.common.collect.ImmutableList;",
  "import static java.util.Objects.requireNonNull;",
  "",
  "public class Example {",
  "  private final List<String> items = new ArrayList<String>();",
  "",
  "  @Nullable",
  "  private String name;",
  "",
  "  @Override",
  "  public String toString() {",
  "    return \"Example: TODO fix this\";",
  "  }",
  "",
  "  public void add(String item, boolean flag) {",
  "    requireNonNull(item);",
  "    if (flag == true) {",
  "      items.add(Strings.trim(item));",
  "    }",
  "  }",
  "",
  "  // spotless:off",
  "  private static final int[] MATRIX = {",
  "    1,   0,   0,",
  "    0,   1,   0,   // TODO alignment kept on purpose",
  "    0,   0,   1 };",
  "  // spotless:on",
  "",
  "  public void check() {",
  "    assertEquals(1, ImmutableList.of(\"a\").size());",
  "  }",
  "}",
  ""
].join("\n");

// googleJavaFormat().aosp(): same, 4-space indent.
export const SAMPLE_AOSP = SAMPLE_GJF
  .split("\n")
  .map(l => {
    const m = l.match(/^( +)(.*)$/);
    return m ? SP.repeat(m[1].length * 2) + m[2] : l;
  })
  .join("\n");

// palantirJavaFormat(): 4-space indent, Palantir keeps a blank line after the
// class declaration off and hugs the field block the same way; differences vs
// AOSP show up mostly on long lines, which this sample does not have.
export const SAMPLE_PALANTIR = SAMPLE_AOSP;

// eclipse(): 4-space indent (default Eclipse profile uses tabs, but the
// bundled diffplug default config emits spaces) and keeps array init on one
// line when it fits.
export const SAMPLE_ECLIPSE = SAMPLE_AOSP
  .replace(
    "    private static final int[] MATRIX = {\n        1,   0,   0,\n        0,   1,   0,   // TODO alignment kept on purpose\n        0,   0,   1 };",
    "    private static final int[] MATRIX = {\n        1,   0,   0,\n        0,   1,   0,   // TODO alignment kept on purpose\n        0,   0,   1\n    };");
