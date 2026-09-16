/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { definePlugin, definePrompt, defineResource, defineResourceTemplate, defineTool } from './definitions.js';
import { McpRegistry } from './registry.js';
import { jsonResult } from './results.js';
import { type McpFeatureRuntime,registerSdkFeatures } from './sdk-adapter.js';

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
    const server = {
      registerTool: vi.fn(),
      registerResource: vi.fn(),
      registerPrompt: vi.fn(),
    } as unknown as McpServer;
    const runtime = {
      invokeTool: vi.fn(),
      invokeResource: vi.fn(),
      invokeResourceTemplate: vi.fn(),
      listResourceTemplate: vi.fn(),
      invokePrompt: vi.fn(),
    } as unknown as McpFeatureRuntime<object>;

    registerSdkFeatures(server, compiled, runtime);

    expect(server.registerTool).toHaveBeenCalledTimes(1);
    expect(server.registerResource).toHaveBeenCalledTimes(3);
    expect(server.registerPrompt).toHaveBeenCalledTimes(1);
  });
});
