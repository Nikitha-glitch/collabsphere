const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const ignoredDirs = new Set(['.git', 'node_modules', '.firebase']);
const failures = [];

function walk(dir, matcher, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, matcher, results);
    } else if (matcher(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function rel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function checkHtml(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const label = rel(filePath);

  const required = [
    ['<!DOCTYPE html>', /<!doctype html>/i],
    ['<html lang="en">', /<html[^>]*\blang=["']en["']/i],
    ['viewport meta tag', /<meta[^>]*name=["']viewport["'][^>]*>/i],
    ['page title', /<title>[^<]+<\/title>/i],
  ];

  for (const [name, regex] of required) {
    if (!regex.test(source)) {
      failures.push(`${label}: missing ${name}`);
    }
  }

  const tags = source.match(/<\/?(html|head|body|nav|main|section|div|form|button|a|script|style|textarea|select|option|label|input|h1|h2|h3|h4|p|span|ul|li)\b[^>]*>/gi) || [];
  const stack = [];
  const voidTags = new Set(['input']);

  for (const tag of tags) {
    const match = tag.match(/^<\/?([a-z0-9]+)/i);
    if (!match) continue;

    const name = match[1].toLowerCase();
    if (voidTags.has(name) || tag.endsWith('/>')) continue;

    if (!tag.startsWith('</')) {
      stack.push({ name, tag });
      continue;
    }

    const last = stack.pop();
    if (!last || last.name !== name) {
      failures.push(`${label}: mismatched closing tag ${tag}`);
      return;
    }
  }

  if (stack.length > 0) {
    failures.push(`${label}: unclosed tag <${stack[stack.length - 1].name}>`);
  }
}

function checkJavaScript(filePath) {
  const result = spawnSync(process.execPath, ['--check', filePath], {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    failures.push(`${rel(filePath)}: ${result.stderr.trim() || result.stdout.trim()}`);
  }
}

for (const file of walk(root, (filePath) => filePath.endsWith('.html'))) {
  checkHtml(file);
}

for (const file of walk(root, (filePath) => filePath.endsWith('.js'))) {
  checkJavaScript(file);
}

if (failures.length > 0) {
  console.error('Project validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Project validation passed.');
