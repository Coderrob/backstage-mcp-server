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

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { definePlugin, definePrompt, defineResource, defineResourceTemplate, defineTool } from './definitions.js';
import { jsonResult } from './results.js';

describe('MCP definitions', () => {
  it('should create immutable definitions for every feature kind', () => {
    const tool = defineTool<object>()({
      name: 'read_value',
      description: 'Read a value.',
      inputSchema: z.object({ id: z.string() }),
      handler: ({ input }) => jsonResult({ id: input.id }),
    });
    const resource = defineResource<object>({
      name: 'fixed_resource',
      uri: 'test://fixed',
      handler: ({ input }) => ({ contents: [{ uri: String(input.uri), text: 'fixed' }] }),
    });
    const template = defineResourceTemplate<object>({
      name: 'template_resource',
      uriTemplate: 'test://items/{id}',
      handler: ({ input }) => ({ contents: [{ uri: String(input.uri), text: String(input.variables.id) }] }),
    });
    const prompt = definePrompt<object>()({
      name: 'write_prompt',
      argsSchema: z.object({ topic: z.string() }),
      handler: ({ input }) => ({ messages: [{ role: 'user', content: { type: 'text', text: input.topic } }] }),
    });
    const plugin = definePlugin({
      name: 'all-features',
      version: '1.0.0',
      features: [tool, resource, template, prompt],
    });

    expect(plugin.features.map(({ kind }) => kind)).toEqual(['tool', 'resource', 'resource-template', 'prompt']);
    expect(Object.isFrozen(plugin)).toBe(true);
    expect(Object.isFrozen(plugin.features)).toBe(true);
  });
});
