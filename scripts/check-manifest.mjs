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

import { readFile } from 'node:fs/promises';

import { createBackstageServer } from '../dist/index.mjs';

const expected = `${JSON.stringify(createBackstageServer().manifest(), null, 2)}\n`;
const actual = (await readFile('tools-manifest.json', 'utf8')).replace(/\r\n/g, '\n');

if (actual !== expected) {
  throw new Error('tools-manifest.json is out of date; run the manifest generator and commit the result');
}

process.stdout.write('Manifest is current\n');
