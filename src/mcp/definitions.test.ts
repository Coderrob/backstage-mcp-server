/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

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
      handler: ({ input }) => ({ contents: [{ uri: input.uri.toString(), text: 'fixed' }] }),
    });
    const template = defineResourceTemplate<object>({
      name: 'template_resource',
      uriTemplate: 'test://items/{id}',
      handler: ({ input }) => ({ contents: [{ uri: input.uri.toString(), text: String(input.variables.id) }] }),
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
