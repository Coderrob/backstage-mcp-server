/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { generateManifest } from './generate-manifest.js';

const originalDirectory = process.cwd();
const temporaryDirectories: string[] = [];

afterEach(async () => {
  process.chdir(originalDirectory);
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

/** Creates and tracks an isolated temporary directory. */
async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'backstage-manifest-'));
  temporaryDirectories.push(directory);
  return directory;
}

describe('generateManifest', () => {
  it('should write the runtime manifest to an explicit path', async () => {
    const directory = await temporaryDirectory();
    const outputPath = join(directory, 'manifest.json');
    await generateManifest(outputPath);
    expect(JSON.parse(await readFile(outputPath, 'utf8'))).toMatchObject({
      server: { name: 'backstage-mcp-server' },
      features: expect.arrayContaining([expect.objectContaining({ name: 'get_entities' })]),
    });
  });

  it('should default to tools-manifest.json in the working directory', async () => {
    const directory = await temporaryDirectory();
    process.chdir(directory);
    await generateManifest();
    expect(await readFile(join(directory, 'tools-manifest.json'), 'utf8')).toContain('backstage-catalog');
  });
});
