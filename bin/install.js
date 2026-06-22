#!/usr/bin/env node
/**
 * Copies this skill (SKILL.md + references/) into the Claude skills directory.
 * Runs on `npx reanimated-claude-skill` (after the package is published) or
 * `node bin/install.js` from a clone.
 *
 * Env overrides:
 *   CLAUDE_SKILLS_DIR   skills dir (default: ~/.claude/skills)
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const PKG_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = process.env.CLAUDE_SKILLS_DIR || path.join(os.homedir(), '.claude', 'skills');
const DEST = path.join(SKILLS_DIR, 'reanimated');

const INCLUDE = ['SKILL.md', 'references', 'README.md', 'LICENSE'];

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) copyRecursive(path.join(src, entry), path.join(dst, entry));
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

try {
  if (!fs.existsSync(path.join(PKG_ROOT, 'SKILL.md'))) {
    console.error('✗ SKILL.md not found next to the installer — aborting.');
    process.exit(1);
  }
  fs.mkdirSync(DEST, { recursive: true });
  for (const item of INCLUDE) {
    const src = path.join(PKG_ROOT, item);
    if (fs.existsSync(src)) copyRecursive(src, path.join(DEST, item));
  }
  console.log('🌀 reanimated skill installed → ' + DEST);
  console.log('✓ Restart Claude Code — it auto-activates on Reanimated tasks.');
} catch (err) {
  console.error('✗ Install failed:', err.message);
  process.exit(1);
}
