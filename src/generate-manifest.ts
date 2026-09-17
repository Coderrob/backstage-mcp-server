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
