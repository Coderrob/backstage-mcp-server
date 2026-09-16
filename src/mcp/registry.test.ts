/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  definePlugin,
  definePrompt,
  defineResource,
  defineResourceTemplate,
  defineTool,
  type McpToolPolicy,
  type ToolDefinition,
} from './definitions.js';
import { McpConfigurationError } from './errors.js';
import { McpRegistry } from './registry.js';
import { jsonResult } from './results.js';

/** Creates a minimal tool with optional policy overrides. */
function tool(name: string, policy?: Readonly<McpToolPolicy>): ToolDefinition<object> {
  return defineTool<object>()({
    name,
    description: 'Test tool.',
    inputSchema: z.object({ value: z.string().optional() }),
    outputSchema: z.object({ value: z.string().optional() }),
    annotations: { readOnlyHint: true },
    policy,
    handler: () => jsonResult({ value: 'ok' }),
  });
}

describe('McpRegistry', () => {
  it('should compile every feature kind into a deterministic manifest', () => {
    const resource = defineResource<object>({
      name: 'fixed_resource',
      uri: 'test://fixed',
      handler: () => ({ contents: [] }),
    });
    const template = defineResourceTemplate<object>({
      name: 'templated_resource',
      uriTemplate: 'test://items/{id}',
      handler: () => ({ contents: [] }),
    });
    const prompt = definePrompt<object>()({
      name: 'explain_prompt',
      argsSchema: z.object({ topic: z.string() }),
      handler: () => ({ messages: [] }),
    });
    const plugin = definePlugin({
      name: 'catalog_plugin',
      version: '1.0.0',
      description: 'Catalog features',
      features: [tool('read_value', { timeoutMs: 10 }), resource, template, prompt],
    });
    const registry = new McpRegistry([plugin]);

    expect(registry.list()).toHaveLength(4);
    expect(registry.manifest({ name: 'server', version: '2.0.0' })).toMatchObject({
      server: { name: 'server', version: '2.0.0' },
      plugins: [{ name: 'catalog_plugin', description: 'Catalog features' }],
      features: [
        { kind: 'tool', name: 'read_value', inputSchema: { type: 'object' }, outputSchema: { type: 'object' } },
        { kind: 'resource', uri: 'test://fixed' },
        { kind: 'resource-template', uriTemplate: 'test://items/{id}' },
        { kind: 'prompt', inputSchema: { type: 'object' } },
      ],
    });
  });

  it.each([
    ['invalid plugin name', [definePlugin({ name: '_bad', version: '1', features: [] })]],
    ['missing plugin version', [definePlugin({ name: 'valid_plugin', version: ' ', features: [] })]],
    [
      'duplicate plugin',
      [
        definePlugin({ name: 'same_plugin', version: '1', features: [] }),
        definePlugin({ name: 'same_plugin', version: '2', features: [] }),
      ],
    ],
    ['invalid feature name', [definePlugin({ name: 'valid_plugin', version: '1', features: [tool('_bad')] })]],
  ])('should reject %s', (_description, plugins) => {
    expect(() => new McpRegistry(plugins)).toThrow(McpConfigurationError);
  });

  it('should reject duplicate feature namespaces and unsafe cache declarations', () => {
    const resource = defineResource<object>({
      name: 'same_name',
      uri: 'test://one',
      handler: () => ({ contents: [] }),
    });
    const template = defineResourceTemplate<object>({
      name: 'same_name',
      uriTemplate: 'test://{id}',
      handler: () => ({ contents: [] }),
    });
    expect(
      () => new McpRegistry([definePlugin({ name: 'duplicates', version: '1', features: [resource, template] })])
    ).toThrow(/Duplicate/);

    const cached = defineTool<object>()({
      name: 'unsafe_cache',
      description: 'Unsafe cached tool.',
      inputSchema: z.object({}),
      policy: { cache: { ttlMs: 1 } },
      handler: () => jsonResult({ ok: true }),
    });
    expect(() => new McpRegistry([definePlugin({ name: 'cache_plugin', version: '1', features: [cached] })])).toThrow(
      /readOnlyHint/
    );
  });

  it.each([
    { timeoutMs: 0 },
    { cache: { ttlMs: Number.NaN } },
    { rateLimit: { maxRequests: 1.5, windowMs: 100 } },
    { rateLimit: { maxRequests: 1, windowMs: -1 } },
  ])('should reject invalid policy %#', (policy) => {
    expect(
      () =>
        new McpRegistry([
          definePlugin({ name: 'policy_plugin', version: '1', features: [tool('invalid_policy', policy)] }),
        ])
    ).toThrow(McpConfigurationError);
  });
});
