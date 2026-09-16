/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { createBackstageServer } from './server.js';

/**
 * Generates manifest.
 * @param outputPath - The manifest output path.
 */
export async function generateManifest(outputPath = resolve(process.cwd(), 'tools-manifest.json')): Promise<void> {
  const manifest = createBackstageServer().manifest();
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}
