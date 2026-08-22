/* Biome, really running - as ~10.7 MB gzipped of WASM.
 *
 * That size is why it is loaded strictly on demand and never on boot: the
 * page's whole promise is that you open it and it works. */
let loading = null;

export const BIOME_DOWNLOAD_MB = 11;

/* The download is the size of a video, on a page whose whole promise is that
 * you open it and it works. So it is opt-in: until this is called, selecting
 * Biome shows the prompt instead of fetching anything. */
let armed = false;
export const isBiomeArmed = () => armed || loading !== null;
export function armBiome() { armed = true; }

export class BiomeNotArmed extends Error {
  constructor() { super(`biome() needs a ~${BIOME_DOWNLOAD_MB} MB download before it can run`); }
}

function load() {
  if (!loading) {
    loading = import("@biomejs/js-api/web").then(async ({ Biome }) => {
      // v6 differs from every example written against v0.x/v1.x: no
      // Biome.create({distribution}), and everything is project-scoped.
      const biome = new Biome();
      const { projectKey } = biome.openProject("/");
      return { biome, projectKey };
    });
  }
  return loading;
}

export async function runBiome(src, opts) {
  if (!isBiomeArmed()) throw new BiomeNotArmed();
  const { biome, projectKey } = await load();
  // projectKey is the FIRST argument to every call below. Omitting it throws
  // `invalid type ... expected a nonzero usize`, which names nothing useful.
  biome.applyConfiguration(projectKey, configOf(opts));
  // Biome picks its parser off the extension - Spotless has the same trap,
  // which is why its biome() step needs language('ts').
  return biome.formatContent(projectKey, src, { filePath: "Example.ts" }).content;
}

// Biome splits the knobs across a global block and a JavaScript-specific one.
export function configOf(o) {
  return {
    formatter: {
      indentStyle: o.indentStyle,
      indentWidth: o.indentWidth,
      lineWidth: o.lineWidth
    },
    javascript: {
      formatter: {
        quoteStyle: o.quoteStyle,
        semicolons: o.semicolons,
        trailingCommas: o.trailingCommas,
        arrowParentheses: o.arrowParentheses,
        bracketSpacing: o.bracketSpacing,
        quoteProperties: o.quoteProperties
      }
    }
  };
}
