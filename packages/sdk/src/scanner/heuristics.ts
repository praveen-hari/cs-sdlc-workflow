/**
 * Detection heuristics and confidence levels per §7.2.3 and §8.3.2.
 *
 * @module
 */

export type Confidence = 'high' | 'medium' | 'low';

export interface DetectedStack {
  language: string;
  framework?: string;
  runtime?: string;
  database?: string;
  testing?: string;
  styling?: string;
  confidence: Confidence;
}

export interface DetectedModule {
  id: string;
  path: string;
  type: string;
  stack: DetectedStack;
  confidence: Confidence;
}

export interface DetectedArtifacts {
  hasCI: boolean;
  hasTesting: boolean;
  hasDocs: boolean;
  hasDesignSystem: boolean;
}

/** Known framework indicators in package.json dependencies. */
export const FRAMEWORK_INDICATORS: Record<string, { framework: string; type: string }> = {
  'react': { framework: 'react', type: 'frontend' },
  'react-dom': { framework: 'react', type: 'frontend' },
  'next': { framework: 'next', type: 'fullstack' },
  'vue': { framework: 'vue', type: 'frontend' },
  'nuxt': { framework: 'nuxt', type: 'fullstack' },
  'svelte': { framework: 'svelte', type: 'frontend' },
  '@sveltejs/kit': { framework: 'sveltekit', type: 'fullstack' },
  'angular': { framework: 'angular', type: 'frontend' },
  '@angular/core': { framework: 'angular', type: 'frontend' },
  'express': { framework: 'express', type: 'backend' },
  'fastify': { framework: 'fastify', type: 'backend' },
  'hono': { framework: 'hono', type: 'backend' },
  'koa': { framework: 'koa', type: 'backend' },
  'nestjs': { framework: 'nestjs', type: 'backend' },
  '@nestjs/core': { framework: 'nestjs', type: 'backend' },
};

/** Known testing framework indicators. */
export const TESTING_INDICATORS: Record<string, string> = {
  'vitest': 'vitest',
  'jest': 'jest',
  'mocha': 'mocha',
  '@testing-library/react': 'testing-library',
  'cypress': 'cypress',
  'playwright': 'playwright',
  'pytest': 'pytest',
  'xunit': 'xunit',
};

/** Known styling indicators. */
export const STYLING_INDICATORS: Record<string, string> = {
  'tailwindcss': 'tailwind',
  'styled-components': 'styled-components',
  '@emotion/react': 'emotion',
  'sass': 'sass',
};

/** Known database indicators. */
export const DATABASE_INDICATORS: Record<string, string> = {
  'prisma': 'prisma',
  '@prisma/client': 'prisma',
  'drizzle-orm': 'drizzle',
  'typeorm': 'typeorm',
  'sequelize': 'sequelize',
  'mongoose': 'mongodb',
  'mongodb': 'mongodb',
  'pg': 'postgresql',
  'mysql2': 'mysql',
  'better-sqlite3': 'sqlite',
  'sqlite3': 'sqlite',
};

/** Monorepo root indicators per §8.3.1. */
export const MONOREPO_INDICATORS = [
  'pnpm-workspace.yaml',
  'lerna.json',
  'nx.json',
  'turbo.json',
] as const;
