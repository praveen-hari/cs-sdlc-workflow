import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const isProduction = process.argv.includes('--production');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'es2022',
  sourcemap: !isProduction,
  minify: isProduction,
  treeShaking: true,
  // prompt-tsx JSX
  jsx: 'transform',
  jsxFactory: 'vscpp',
  jsxFragment: 'vscppf',
};

// Copy webview assets to dist
function copyWebviewAssets() {
  const webviewSrc = resolve(__dirname, 'webview');
  const webviewDist = resolve(__dirname, 'dist', 'webview');

  if (existsSync(webviewSrc)) {
    mkdirSync(webviewDist, { recursive: true });
    cpSync(webviewSrc, webviewDist, { recursive: true });
    console.log('✓ Copied webview assets');
  }
}

async function main() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    copyWebviewAssets();
    console.log('👀 Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    copyWebviewAssets();
    console.log('✓ Build complete');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
