/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { generateManifest } from '../dist/index.mjs';

await generateManifest();
process.stdout.write('Manifest generated\n');
