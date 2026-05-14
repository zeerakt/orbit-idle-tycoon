import { mkdirSync, copyFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

/*
 * Simple build script for Orbit Idle Tycoon.
 *
 * This script creates a `dist` directory and copies the top-level
 * index.html and style.css files as well as all files from the
 * `src` directory. Because the project uses native ES modules in
 * the browser there is no bundling step required – copying the
 * files is sufficient. Additional build steps such as minification
 * or image processing could be added here in the future.
 */

const SRC_DIR = new URL('./src', import.meta.url).pathname;
const DIST_DIR = new URL('./dist', import.meta.url).pathname;

function copyRecursive(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stats = statSync(srcPath);
    if (stats.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Ensure dist directory exists
mkdirSync(DIST_DIR, { recursive: true });

// Copy static files
copyFileSync(new URL('./index.html', import.meta.url).pathname, join(DIST_DIR, 'index.html'));
copyFileSync(new URL('./style.css', import.meta.url).pathname, join(DIST_DIR, 'style.css'));

// Copy source files
copyRecursive(SRC_DIR, join(DIST_DIR, 'src'));

console.log('Build complete');
