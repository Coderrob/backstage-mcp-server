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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type {
  McpFeatureRuntime,
  McpPromptInvoker,
  McpResourceInvoker,
  McpResourceTemplateInvoker,
  McpResourceTemplateLister,
  McpToolInvoker,
} from '../types/mcp.js';
import { definePlugin, definePrompt, defineResource, defineResourceTemplate, defineTool } from './definitions.js';
import { McpRegistry } from './registry.js';
import { jsonResult } from './results.js';
import { registerSdkFeatures } from './sdk-adapter.js';

describe('registerSdkFeatures', () => {
  it('should register every feature kind with the SDK server', () => {
    const features = [
      defineTool<object>()({
        name: 'read_value',
        description: 'Read a value.',
        inputSchema: z.object({ id: z.string() }),
        handler: () => jsonResult({ ok: true }),
      }),
      defineResource<object>({ name: 'fixed_resource', uri: 'test://fixed', handler: () => ({ contents: [] }) }),
      defineResourceTemplate<object>({
        name: 'template_resource',
        uriTemplate: 'test://items/{id}',
        list: () => ({ resources: [] }),
        handler: () => ({ contents: [] }),
      }),
      defineResourceTemplate<object>({
        name: 'unlisted_template',
        uriTemplate: 'test://unlisted/{id}',
        handler: () => ({ contents: [] }),
      }),
      definePrompt<object>()({
        name: 'explain_prompt',
        argsSchema: z.object({ topic: z.string() }),
        handler: () => ({ messages: [] }),
      }),
    ];
    const compiled = new McpRegistry([definePlugin({ name: 'sdk_plugin', version: '1.0.0', features })]).list();
    const server = new McpServer({ name: 'sdk-adapter-test', version: '1.0.0' });
    const registerTool = vi.spyOn(server, 'registerTool');
    const registerResource = vi.spyOn(server, 'registerResource');
    const registerPrompt = vi.spyOn(server, 'registerPrompt');
    const runtime = {
      invokeTool: vi.fn<McpToolInvoker<object>>(async () => jsonResult({ ok: true })),
      invokeResource: vi.fn<McpResourceInvoker<object>>(async () => ({ contents: [] })),
      invokeResourceTemplate: vi.fn<McpResourceTemplateInvoker<object>>(async () => ({
        contents: [],
      })),
      listResourceTemplate: vi.fn<McpResourceTemplateLister<object>>(async () => ({ resources: [] })),
      invokePrompt: vi.fn<McpPromptInvoker<object>>(async () => ({ messages: [] })),
    } satisfies McpFeatureRuntime<object>;

    registerSdkFeatures(server, compiled, runtime);

    expect(registerTool).toHaveBeenCalledTimes(1);
    expect(registerResource).toHaveBeenCalledTimes(3);
    expect(registerPrompt).toHaveBeenCalledTimes(1);
  });
});
