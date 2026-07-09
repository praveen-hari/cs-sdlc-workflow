import * as esbuild from 'esbuild';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const isProduction = process.argv.includes('--production');

// ── Extension host bundle (Node.js, CJS) ─────────────────────────────────
/** @type {import('esbuild').BuildOptions} */
const extensionBuildOptions = {
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
  // prompt-tsx JSX (for extension host)
  jsx: 'transform',
  jsxFactory: 'vscpp',
  jsxFragment: 'vscppf',
};

// ── Webview UI bundle (Browser, ESM, Preact) ──────────────────────────────
/** @type {import('esbuild').BuildOptions} */
const webviewBuildOptions = {
  entryPoints: ['webview-ui/src/index.tsx'],
  bundle: true,
  outfile: 'dist/webview/webview.js',
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  sourcemap: !isProduction,
  minify: isProduction,
  treeShaking: true,
  // Preact JSX
  jsx: 'automatic',
  jsxImportSource: 'preact',
  // CSS bundling
  loader: { '.css': 'css' },
};

async function main() {
  if (isWatch) {
    const [extCtx, webCtx] = await Promise.all([
      esbuild.context(extensionBuildOptions),
      esbuild.context(webviewBuildOptions),
    ]);
    await Promise.all([extCtx.watch(), webCtx.watch()]);
    console.log('👀 Watching extension + webview...');
  } else {
    await Promise.all([
      esbuild.build(extensionBuildOptions),
      esbuild.build(webviewBuildOptions),
    ]);
    console.log('✓ Extension + Webview build complete');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
