/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { createBackstageServer } from '../dist/index.mjs';

process.stdout.write(`${JSON.stringify(createBackstageServer().manifest(), null, 2)}\n`);
