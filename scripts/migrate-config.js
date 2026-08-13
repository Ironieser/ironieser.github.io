#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const CONFIG = path.join(ROOT, 'config');
const dryRun = process.argv.includes('--dry-run');
const noBackup = process.argv.includes('--no-backup');
const META_KEYS = new Set(['_template_info', '_scholar_sync']);
const SITE_KEYS = new Set(['seo', 'visitor_map', 'redirects', 'copyright_start_year']);

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function readYaml(file) {
  return fs.existsSync(file) ? (yaml.load(fs.readFileSync(file, 'utf8')) || {}) : null;
}

function backup(file) {
  if (noBackup || !fs.existsSync(file)) return;
  const target = `${file}.bak-v1.9`;
  if (!fs.existsSync(target) && !dryRun) fs.copyFileSync(file, target);
}

function write(file, content) {
  console.log(`${dryRun ? '[dry-run] ' : ''}write ${path.relative(ROOT, file)}`);
  if (dryRun) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  backup(file);
  fs.writeFileSync(file, content, 'utf8');
}

function moveRootFile(names, targetName) {
  const target = path.join(CONFIG, targetName);
  if (fs.existsSync(target)) return;
  const source = names.map(name => path.join(ROOT, name)).find(fs.existsSync);
  if (!source) return;
  console.log(`${dryRun ? '[dry-run] ' : ''}move ${path.basename(source)} -> config/${targetName}`);
  if (!dryRun) {
    fs.mkdirSync(CONFIG, { recursive: true });
    fs.copyFileSync(source, target);
    fs.renameSync(source, `${source}.bak-v1.9`);
  }
}

function splitLegacy(legacy) {
  const content = {};
  const meta = {};
  const site = {};
  Object.entries(legacy || {}).forEach(([key, value]) => {
    if (META_KEYS.has(key)) meta[key] = value;
    else if (SITE_KEYS.has(key)) site[key] = value;
    else content[key] = value;
  });
  return { content, meta, site };
}

function main() {
  fs.mkdirSync(CONFIG, { recursive: true });
  moveRootFile(['config.content.json', 'content.json'], 'content.json');
  moveRootFile(['config.meta.json', 'meta.json'], 'meta.json');
  moveRootFile(['config.site.yaml', 'site.yaml'], 'site.yaml');

  const contentPath = path.join(CONFIG, 'content.json');
  const metaPath = path.join(CONFIG, 'meta.json');
  const sitePath = path.join(CONFIG, 'site.yaml');
  const roadmapPath = path.join(CONFIG, 'roadmap.yaml');
  const legacyCandidates = [path.join(ROOT, 'config.json'), path.join(CONFIG, 'config.json')];
  const fullLegacyPath = legacyCandidates.find(file => {
    const data = readJson(file);
    return data && data.personal && data.publications;
  });

  let content = readJson(contentPath);
  let meta = readJson(metaPath) || {};
  let site = readYaml(sitePath) || {};

  if (!content && fullLegacyPath) {
    console.log(`split legacy config: ${path.relative(ROOT, fullLegacyPath)}`);
    const split = splitLegacy(readJson(fullLegacyPath));
    content = split.content;
    meta = { ...split.meta, ...meta };
    site = { ...split.site, ...site };
    if (!dryRun) {
      backup(fullLegacyPath);
      if (path.dirname(fullLegacyPath) === ROOT) {
        fs.renameSync(fullLegacyPath, `${fullLegacyPath}.migrated-v1.9`);
      }
    }
  }

  if (!content) throw new Error('No content configuration found to migrate.');

  if (content.research_roadmap && !fs.existsSync(roadmapPath)) {
    write(roadmapPath, yaml.dump(content.research_roadmap, { noRefs: true, lineWidth: 120, noCompatMode: true }));
  }
  delete content.research_roadmap;

  if (content.copyright_start_year != null && site.copyright_start_year == null) {
    site.copyright_start_year = content.copyright_start_year;
  }
  delete content.copyright_start_year;

  write(contentPath, `${JSON.stringify(content, null, 2)}\n`);
  write(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  write(sitePath, yaml.dump(site, { noRefs: true, lineWidth: 120, noCompatMode: true }));
  console.log('✓ Config migration complete. Run: npm run validate && npm run build');
}

try {
  main();
} catch (error) {
  console.error(`✗ Migration failed: ${error.message}`);
  process.exit(1);
}
