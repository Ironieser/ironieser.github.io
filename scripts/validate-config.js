#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const CONFIG = path.join(ROOT, 'config');
const errors = [];

function fail(message) { errors.push(message); }
function readJson(name) { return JSON.parse(fs.readFileSync(path.join(CONFIG, name), 'utf8')); }
function duplicates(values) { return values.filter((value, index) => values.indexOf(value) !== index); }

const content = readJson('content.json');
const site = yaml.load(fs.readFileSync(path.join(CONFIG, 'site.yaml'), 'utf8')) || {};
const roadmapPath = path.join(CONFIG, 'roadmap.yaml');
if (!fs.existsSync(roadmapPath)) fail('config/roadmap.yaml missing; run npm run migrate-config');
const roadmap = fs.existsSync(roadmapPath)
  ? (yaml.load(fs.readFileSync(roadmapPath, 'utf8')) || {})
  : null;

for (const key of ['personal', 'research', 'news', 'publications', 'experience', 'education', 'service']) {
  if (content[key] == null) fail(`content.json missing "${key}"`);
}
if (!site.seo) fail('site.yaml missing "seo"');
if (!roadmap) fail('roadmap config missing');

if (roadmap) {
  const phases = roadmap.phases || [];
  const filters = roadmap.filters || [];
  const nodes = roadmap.nodes || [];
  const phaseIds = phases.map(item => item.id);
  const stageIds = new Set(phases.flatMap(item => item.stageIds || []));
  const filterIds = new Set(filters.map(item => item.id));
  const nodeIds = nodes.map(item => item.id);
  duplicates(phaseIds).forEach(id => fail(`duplicate phase id: ${id}`));
  duplicates(nodeIds).forEach(id => fail(`duplicate roadmap node id: ${id}`));

  const groups = new Map(phases.map(phase => [phase.id, new Set((phase.groups || []).map(group => group.id))]));
  const stageToPhase = new Map();
  phases.forEach(phase => (phase.stageIds || []).forEach(stage => stageToPhase.set(stage, phase.id)));

  const publicationUrls = new Set();
  Object.values(content.publications || {}).flat().forEach(pub => {
    (pub.links || []).forEach(link => {
      if (link && link.url) publicationUrls.add(String(link.url).replace(/\/$/, ''));
    });
  });

  nodes.forEach(node => {
    if (!node.id) fail('roadmap node without id');
    (node.stages || []).forEach(stage => {
      if (!stageIds.has(stage)) fail(`${node.id}: unknown stage "${stage}"`);
    });
    (node.tags || []).forEach(tag => {
      if (!filterIds.has(tag)) fail(`${node.id}: unknown filter tag "${tag}"`);
    });
    if (node.group) {
      const phaseId = [...(node.stages || [])].map(stage => stageToPhase.get(stage)).filter(Boolean).pop();
      if (!phaseId || !groups.get(phaseId)?.has(node.group)) {
        fail(`${node.id}: group "${node.group}" does not exist in its primary phase`);
      }
    }
    if (node.paper_url && !publicationUrls.has(String(node.paper_url).replace(/\/$/, ''))) {
      fail(`${node.id}: paper_url does not match a publication link`);
    }
  });
}

if (errors.length) {
  errors.forEach(error => console.error(`✗ ${error}`));
  process.exit(1);
}
console.log('✓ Config validation passed');
