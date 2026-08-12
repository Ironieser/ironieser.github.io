/**
 * Build a slim ECharts bundle (only the modules the visitor map needs) +
 * an ISO-2-indexed, coordinate-simplified world map, both self-hosted.
 *
 * Usage:  node scripts/build-echarts-slim.js
 * Requires (dev only):  npm i -D echarts esbuild
 * Source world geojson: Natural Earth 110m admin_0 countries (ISO_A2).
 *
 * Outputs:
 *   assets/js/vendor/echarts-slim.js   (~515KB raw / ~172KB gzip)
 *   assets/js/vendor/echarts-world.js  (~165KB raw / ~51KB gzip)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const VENDOR = path.join(ROOT, 'assets/js/vendor');

// 1) Slim ECharts via esbuild
const entry = path.join(ROOT, '_echarts-entry.js');
fs.writeFileSync(entry, `
import * as echarts from 'echarts/core';
import { MapChart, EffectScatterChart } from 'echarts/charts';
import { GeoComponent, VisualMapComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([MapChart, EffectScatterChart, GeoComponent, VisualMapComponent, TooltipComponent, CanvasRenderer]);
window.echarts = echarts;
`);
try {
  execSync(`npx esbuild "${entry}" --bundle --minify --format=iife --outfile="${path.join(VENDOR, 'echarts-slim.js')}"`, { cwd: ROOT, stdio: 'inherit' });
} finally {
  fs.unlinkSync(entry);
}

// 2) ISO-2-indexed simplified world map (input: a Natural Earth 110m geojson path arg, default /tmp/ne110.json)
const NE = process.argv[2] || '/tmp/ne110.json';
if (fs.existsSync(NE)) {
  const d = JSON.parse(fs.readFileSync(NE, 'utf8'));
  // Prefer a clean 2-letter ISO code. Natural Earth sometimes stores '-99'
  // (disputed) or composite codes like 'CN-TW' in ISO_A2; fall back to ISO_A2_EH
  // so e.g. Taiwan resolves to 'TW' and colours correctly. (HK/MO have no
  // separate polygon at 110m — they appear as dots via lat/lon instead.)
  const clean = (a) => (typeof a === 'string' && /^[A-Z]{2}$/.test(a) ? a : null);
  const iso2 = (p) => clean(p.ISO_A2) || clean(p.ISO_A2_EH);
  const round = (c, n = 2) => (typeof c === 'number' ? Math.round(c * 10 ** n) / 10 ** n : c.map((x) => round(x, n)));
  const out = { type: 'FeatureCollection', features: [] };
  for (const ft of d.features) {
    const code = iso2(ft.properties);
    if (!code) continue;
    out.features.push({
      type: 'Feature',
      properties: { name: code }, // ECharts indexes by 'name' -> use ISO2 so /api codes match directly
      geometry: { type: ft.geometry.type, coordinates: round(ft.geometry.coordinates, 2) },
    });
  }
  fs.writeFileSync(path.join(VENDOR, 'echarts-world.js'), 'window.__ECHARTS_WORLD__=' + JSON.stringify(out) + ';');
  console.log(`world map: ${out.features.length} countries`);
} else {
  console.log(`(skipped world map: ${NE} not found; pass the Natural Earth 110m geojson path as arg)`);
}
