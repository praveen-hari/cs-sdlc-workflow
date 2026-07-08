/**
 * Stack detection per §7.2.2 and §7.2.3.
 *
 * Scans a project directory for config files to detect
 * language, framework, runtime, testing, database, styling.
 *
 * @module
 */

import { join } from 'node:path';
import { readFile, readdir, stat } from 'node:fs/promises';
import type { DetectedStack, DetectedArtifacts } from './heuristics.js';
import {
  FRAMEWORK_INDICATORS,
  TESTING_INDICATORS,
  STYLING_INDICATORS,
  DATABASE_INDICATORS,
} from './heuristics.js';

/**
 * Detect the technology stack of a project at the given path.
 */
export async function detectStack(projectPath: string): Promise<DetectedStack | null> {
  // Try each detector in priority order
  const detectors: Array<() => Promise<DetectedStack | null>> = [
    () => detectNodeProject(projectPath),
    () => detectDotnetProject(projectPath),
    () => detectPythonProject(projectPath),
    () => detectGoProject(projectPath),
    () => detectRustProject(projectPath),
    () => detectJavaProject(projectPath),
  ];

  for (const detect of detectors) {
    const result = await detect();
    if (result) return result;
  }

  // Fallback: scan file extensions
  return detectFromFileExtensions(projectPath);
}

/**
 * Detect existing project artifacts (CI, tests, docs, design system).
 */
export async function detectArtifacts(projectPath: string): Promise<DetectedArtifacts> {
  const checks = await Promise.all([
    exists(join(projectPath, '.github', 'workflows')),
    exists(join(projectPath, '.gitlab-ci.yml')),
    exists(join(projectPath, 'Jenkinsfile')),
    hasTestFiles(projectPath),
    exists(join(projectPath, 'docs')),
    exists(join(projectPath, 'ADR')),
    exists(join(projectPath, 'adr')),
    exists(join(projectPath, '.designs')),
  ]);

  return {
    hasCI: checks[0] || checks[1] || checks[2],
    hasTesting: checks[3],
    hasDocs: checks[4] || checks[5] || checks[6],
    hasDesignSystem: checks[7],
  };
}

// ─── Language Detectors ─────────────────────────────────────────────────────

async function detectNodeProject(projectPath: string): Promise<DetectedStack | null> {
  const pkgPath = join(projectPath, 'package.json');
  let pkg: Record<string, unknown>;
  try {
    const raw = await readFile(pkgPath, 'utf-8');
    pkg = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }

  const allDeps = {
    ...(pkg['dependencies'] as Record<string, string> | undefined),
    ...(pkg['devDependencies'] as Record<string, string> | undefined),
  };

  // Detect TypeScript vs JavaScript
  const isTypeScript = 'typescript' in allDeps ||
    await exists(join(projectPath, 'tsconfig.json'));
  const language = isTypeScript ? 'typescript' : 'javascript';

  // Detect framework
  let framework: string | undefined;
  for (const [dep, info] of Object.entries(FRAMEWORK_INDICATORS)) {
    if (dep in allDeps) {
      framework = info.framework;
      break;
    }
  }

  // Detect runtime
  let runtime: string | undefined;
  if (await exists(join(projectPath, 'bun.lockb'))) {
    runtime = 'bun';
  } else if (await exists(join(projectPath, 'deno.json')) || await exists(join(projectPath, 'deno.jsonc'))) {
    runtime = 'deno';
  } else {
    runtime = 'node';
  }

  // Detect testing
  let testing: string | undefined;
  for (const [dep, name] of Object.entries(TESTING_INDICATORS)) {
    if (dep in allDeps) {
      testing = name;
      break;
    }
  }

  // Detect styling
  let styling: string | undefined;
  for (const [dep, name] of Object.entries(STYLING_INDICATORS)) {
    if (dep in allDeps) {
      styling = name;
      break;
    }
  }

  // Detect database
  let database: string | undefined;
  for (const [dep, name] of Object.entries(DATABASE_INDICATORS)) {
    if (dep in allDeps) {
      database = name;
      break;
    }
  }

  return {
    language,
    confidence: 'high',
    ...(framework && { framework }),
    ...(runtime && { runtime }),
    ...(testing && { testing }),
    ...(styling && { styling }),
    ...(database && { database }),
  };
}

async function detectDotnetProject(projectPath: string): Promise<DetectedStack | null> {
  // Look for *.csproj or *.sln
  try {
    const files = await readdir(projectPath);
    const csproj = files.find((f) => f.endsWith('.csproj'));
    const sln = files.find((f) => f.endsWith('.sln'));

    if (!csproj && !sln) return null;

    let framework: string | undefined;
    if (csproj) {
      try {
        const content = await readFile(join(projectPath, csproj), 'utf-8');
        if (content.includes('Microsoft.AspNetCore')) {
          framework = 'aspnet';
        }
        // Detect .NET version
        const tfmMatch = content.match(/<TargetFramework>net(\d+\.\d+)<\/TargetFramework>/);
        if (tfmMatch) {
          framework = `dotnet-${tfmMatch[1]}`;
        }
      } catch { /* ignore read errors */ }
    }

    return {
      language: 'csharp',
      confidence: 'high',
      ...(framework && { framework }),
      testing: 'xunit',
    };
  } catch {
    return null;
  }
}

async function detectPythonProject(projectPath: string): Promise<DetectedStack | null> {
  const hasPyproject = await exists(join(projectPath, 'pyproject.toml'));
  const hasRequirements = await exists(join(projectPath, 'requirements.txt'));
  const hasSetupPy = await exists(join(projectPath, 'setup.py'));

  if (!hasPyproject && !hasRequirements && !hasSetupPy) return null;

  let framework: string | undefined;
  let database: string | undefined;

  // Try to detect framework from pyproject.toml or requirements.txt
  try {
    let content = '';
    if (hasPyproject) {
      content = await readFile(join(projectPath, 'pyproject.toml'), 'utf-8');
    } else if (hasRequirements) {
      content = await readFile(join(projectPath, 'requirements.txt'), 'utf-8');
    }
    const lower = content.toLowerCase();
    if (lower.includes('fastapi')) framework = 'fastapi';
    else if (lower.includes('django')) framework = 'django';
    else if (lower.includes('flask')) framework = 'flask';

    if (lower.includes('sqlalchemy')) database = 'sqlalchemy';
    else if (lower.includes('psycopg')) database = 'postgresql';
  } catch { /* ignore */ }

  return {
    language: 'python',
    confidence: 'high',
    ...(framework && { framework }),
    ...(database && { database }),
    testing: 'pytest',
  };
}

async function detectGoProject(projectPath: string): Promise<DetectedStack | null> {
  if (!(await exists(join(projectPath, 'go.mod')))) return null;

  let framework: string | undefined;
  try {
    const content = await readFile(join(projectPath, 'go.mod'), 'utf-8');
    if (content.includes('github.com/gin-gonic/gin')) framework = 'gin';
    else if (content.includes('github.com/gofiber/fiber')) framework = 'fiber';
    else if (content.includes('github.com/labstack/echo')) framework = 'echo';
  } catch { /* ignore */ }

  return {
    language: 'go',
    confidence: 'high',
    ...(framework && { framework }),
  };
}

async function detectRustProject(projectPath: string): Promise<DetectedStack | null> {
  if (!(await exists(join(projectPath, 'Cargo.toml')))) return null;

  let framework: string | undefined;
  try {
    const content = await readFile(join(projectPath, 'Cargo.toml'), 'utf-8');
    if (content.includes('actix-web')) framework = 'actix';
    else if (content.includes('axum')) framework = 'axum';
    else if (content.includes('rocket')) framework = 'rocket';
  } catch { /* ignore */ }

  return {
    language: 'rust',
    confidence: 'high',
    ...(framework && { framework }),
  };
}

async function detectJavaProject(projectPath: string): Promise<DetectedStack | null> {
  const hasPom = await exists(join(projectPath, 'pom.xml'));
  const hasGradle = await exists(join(projectPath, 'build.gradle')) ||
    await exists(join(projectPath, 'build.gradle.kts'));

  if (!hasPom && !hasGradle) return null;

  let framework: string | undefined;
  try {
    if (hasPom) {
      const content = await readFile(join(projectPath, 'pom.xml'), 'utf-8');
      if (content.includes('spring-boot')) framework = 'spring-boot';
    } else if (hasGradle) {
      const gradleFile = await exists(join(projectPath, 'build.gradle.kts'))
        ? 'build.gradle.kts' : 'build.gradle';
      const content = await readFile(join(projectPath, gradleFile), 'utf-8');
      if (content.includes('spring-boot')) framework = 'spring-boot';
    }
  } catch { /* ignore */ }

  return {
    language: 'java',
    confidence: 'high',
    ...(framework && { framework }),
  };
}

async function detectFromFileExtensions(projectPath: string): Promise<DetectedStack | null> {
  try {
    const files = await readdir(projectPath);
    if (files.some((f) => f.endsWith('.ts') || f.endsWith('.tsx'))) {
      return { language: 'typescript', confidence: 'medium' };
    }
    if (files.some((f) => f.endsWith('.js') || f.endsWith('.jsx'))) {
      return { language: 'javascript', confidence: 'medium' };
    }
    if (files.some((f) => f.endsWith('.py'))) {
      return { language: 'python', confidence: 'medium' };
    }
    if (files.some((f) => f.endsWith('.go'))) {
      return { language: 'go', confidence: 'medium' };
    }
    if (files.some((f) => f.endsWith('.rs'))) {
      return { language: 'rust', confidence: 'medium' };
    }
    if (files.some((f) => f.endsWith('.java') || f.endsWith('.kt'))) {
      return { language: 'java', confidence: 'medium' };
    }
    if (files.some((f) => f.endsWith('.cs'))) {
      return { language: 'csharp', confidence: 'medium' };
    }
  } catch { /* ignore */ }

  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function hasTestFiles(projectPath: string): Promise<boolean> {
  const testDirs = ['tests', 'test', '__tests__', 'spec'];
  for (const dir of testDirs) {
    if (await exists(join(projectPath, dir))) return true;
  }
  // Check for *.test.* or *.spec.* in src/
  try {
    const srcFiles = await readdir(join(projectPath, 'src'));
    if (srcFiles.some((f) => f.includes('.test.') || f.includes('.spec.'))) return true;
  } catch { /* ignore */ }
  return false;
}
