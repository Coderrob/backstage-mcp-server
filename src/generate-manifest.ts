/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { createBackstageServer } from './server.js';

const DEFAULT_MANIFEST_FILENAME = 'tools-manifest.json';
const JSON_INDENT_SPACES = 2;
const TEXT_ENCODING = 'utf8';

/**
 * Generates manifest.
 * @param outputPath - The manifest output path.
 */
export async function generateManifest(outputPath = resolve(process.cwd(), DEFAULT_MANIFEST_FILENAME)): Promise<void> {
  const manifest = createBackstageServer().manifest();
  await writeFile(outputPath, `${JSON.stringify(manifest, null, JSON_INDENT_SPACES)}\n`, TEXT_ENCODING);
}
