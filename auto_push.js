const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const WATCH_DIR = __dirname;
let debounceTimer = null;
const DEBOUNCE_DELAY = 5000; // Wait 5 seconds after last change before pushing

// Directories and patterns to ignore
const IGNORED_PATHS = [
  '.git',
  'node_modules',
  'vendor',
  'storage',
  '.vite',
  'bootstrap/cache',
  'public/storage',
  '.gemini',
  'auto_push.js'
];

const IGNORED_EXTENSIONS = [
  '.tmp',
  '.swp',
  '.log',
  '.gitkeep'
];

function shouldIgnore(filePath) {
  const relativePath = path.relative(WATCH_DIR, filePath);
  
  // Ignore if it matches any ignored path segment
  const pathParts = relativePath.split(path.sep);
  if (pathParts.some(part => IGNORED_PATHS.includes(part))) {
    return true;
  }

  // Ignore by extension
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORED_EXTENSIONS.includes(ext)) {
    return true;
  }

  return false;
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: WATCH_DIR }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Error executing: ${command}]:`, error.message);
        return reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

async function doAutoPush() {
  console.log(`[${new Date().toISOString()}] Changes detected. Preparing auto-push...`);
  try {
    // Check if there are actual changes to commit
    const { stdout: statusOut } = await runCommand('git status --porcelain');
    if (!statusOut.trim()) {
      console.log(`[${new Date().toISOString()}] No changes to commit.`);
      return;
    }

    console.log(`[${new Date().toISOString()}] Staging changes...`);
    await runCommand('git add .');

    const commitMessage = `Auto-commit: updates at ${new Date().toLocaleString('th-TH')}`;
    console.log(`[${new Date().toISOString()}] Committing changes: "${commitMessage}"`);
    await runCommand(`git commit -m "${commitMessage}"`);

    console.log(`[${new Date().toISOString()}] Pushing to GitHub (origin main)...`);
    const { stdout: pushOut } = await runCommand('git push origin main');
    console.log(`[${new Date().toISOString()}] Push successful! GitHub Actions will auto-deploy to Server.`);
    if (pushOut) console.log(pushOut);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Auto-push failed:`, err.message);
  }
}

// Watch directory recursively
console.log(`=== NPC SmartFlow AutoPush Watcher Started ===`);
console.log(`Watching directory: ${WATCH_DIR}`);
console.log(`Waiting for file changes...`);

fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;

  const fullPath = path.join(WATCH_DIR, filename);

  if (shouldIgnore(fullPath)) {
    return;
  }

  // Clear existing timer and set a new one to debounce multiple quick saves
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    doAutoPush();
  }, DEBOUNCE_DELAY);
});
