/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
    const manifest: unknown = JSON.parse(await readFile(outputPath, 'utf8'));
    expect(manifest).toBeTypeOf('object');
    expect(JSON.stringify(manifest)).toContain('"name":"backstage-mcp-server"');
    expect(JSON.stringify(manifest)).toContain('"name":"get_entities"');
  });

  it('should default to tools-manifest.json in the working directory', async () => {
    const directory = await temporaryDirectory();
    process.chdir(directory);
    await generateManifest();
    expect(await readFile(join(directory, 'tools-manifest.json'), 'utf8')).toContain('backstage-catalog');
  });
});
