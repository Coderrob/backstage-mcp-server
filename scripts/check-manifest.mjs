/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { readFile } from 'node:fs/promises';

import { createBackstageServer } from '../dist/index.mjs';

const expected = `${JSON.stringify(createBackstageServer().manifest(), null, 2)}\n`;
const actual = (await readFile('tools-manifest.json', 'utf8')).replace(/\r\n/g, '\n');

if (actual !== expected) {
  throw new Error('tools-manifest.json is out of date; run the manifest generator and commit the result');
}

process.stdout.write('Manifest is current\n');
