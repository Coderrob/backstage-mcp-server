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

import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { McpApplicationState, McpFeatureKind } from '../shared/constants/mcp-protocol.js';
import type { Logger } from '../shared/logging/logger.js';
import type { CompiledToolFeature } from '../types/mcp.js';
import type { IMcpApplicationTestContext as TestContext } from '../types/mcp-testing.js';
import type { McpApplication } from './application.js';
import { createMcpServer } from './application.js';
import { definePlugin, definePrompt, defineResource, defineResourceTemplate, defineTool } from './definitions.js';
import { McpConfigurationError, McpErrorCode, McpNotFoundError } from './errors.js';
import { errorResult as createErrorResult, jsonResult } from './results.js';
import type { SdkRequestExtra } from './sdk-adapter.js';
import { connectTestClient } from './testing.js';
import { defineTransport } from './transports.js';

const CATALOG_READ_SCOPE = 'catalog:read';

/**
 * Creates a logger that records error messages without writing test output.
 * @param errors - Mutable collection receiving error messages.
 * @returns A logger suitable for lifecycle failure tests.
 */
function createRecordingLogger(errors: string[]): Logger {
  return {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: (message) => errors.push(message),
  };
}

/**
 * Creates the SDK request metadata needed for direct application-boundary tests.
 * @param scopes - Optional authenticated caller scopes.
 * @param clientId - Authenticated caller identity used by principal-aware policies.
 * @returns Request metadata with an isolated cancellation signal.
 */
function createRequestExtra(
  scopes?: readonly string[],
  clientId = 'test-client',
  signal = new AbortController().signal
): SdkRequestExtra {
  return {
    signal,
    requestId: 'direct-request',
    authInfo: scopes ? { token: 'test-token', clientId, scopes: [...scopes], extra: { tenant: 'test' } } : undefined,
    sendNotification: async (): Promise<void> => undefined,
    sendRequest: async (): Promise<never> => {
      throw new Error('Nested requests are not supported by this test');
    },
  };
}

/**
 * Creates an application containing every supported MCP feature kind.
 * @param counter - Mutable call counter used to verify result caching.
 * @returns An isolated MCP application for a contract test.
 */
function createTestApplication(counter = { calls: 0 }): McpApplication<TestContext> {
  const echo = defineTool<TestContext>()({
    name: 'echo_value',
    description: 'Echo a value.',
    inputSchema: z.object({ value: z.string().min(1) }),
    outputSchema: z.object({ echo: z.string() }),
    annotations: { readOnlyHint: true },
    policy: { cache: { ttlMs: 10_000 } },
    handler({ input, context }) {
      counter.calls += 1;
      return jsonResult({ echo: `${context.prefix}${input.value}` });
    },
  });

  const missing = defineTool<TestContext>()({
    name: 'missing_value',
    description: 'Return a typed not-found error.',
    inputSchema: z.object({}),
    handler() {
      throw new McpNotFoundError('Value', 'missing');
    },
  });

  const status = defineResource<TestContext>({
    name: 'server_status',
    uri: 'test://status',
    description: 'Current test status.',
    handler({ input, context }) {
      return { contents: [{ uri: String(input.uri), mimeType: 'text/plain', text: `${context.prefix}ready` }] };
    },
  });

  const item = defineResourceTemplate<TestContext>({
    name: 'catalog_item',
    uriTemplate: 'test://items/{id}',
    description: 'A test item.',
    list() {
      return { resources: [{ name: 'one', uri: 'test://items/one' }] };
    },
    handler({ input }) {
      return { contents: [{ uri: String(input.uri), text: String(input.variables.id) }] };
    },
  });

  const explain = definePrompt<TestContext>()({
    name: 'explain_topic',
    description: 'Create an explanation request.',
    argsSchema: z.object({ topic: z.string().min(1) }),
    handler({ input, context }) {
      return {
        messages: [{ role: 'user', content: { type: 'text', text: `${context.prefix}${input.topic}` } }],
      };
    },
  });

  return createMcpServer<TestContext>({
    identity: { name: 'test-server', version: '1.0.0' },
    plugins: [
      definePlugin({ name: 'test-plugin', version: '1.0.0', features: [echo, missing, status, item, explain] }),
    ],
    createContext: () => ({ prefix: 'test:' }),
  });
}

/**
 * Finds a compiled tool and preserves its discriminated runtime type.
 * @param app - Application whose registry is inspected.
 * @param name - Tool name to resolve.
 * @returns The named compiled tool.
 */
function findTool(
  app: Readonly<McpApplication<TestContext>>,
  name: string
): CompiledToolFeature<TestContext> {
  const compiled = app.listFeatures().find(
    /** Selects the requested compiled tool. */ (entry): entry is CompiledToolFeature<TestContext> =>
      entry.kind === McpFeatureKind.TOOL && entry.feature.name === name
  );
  if (!compiled) throw new Error(`Missing test tool '${name}'`);
  return compiled;
}

/**
 * Creates a rejected promise for testing defensive handling of non-Error failures.
 * @param reason - Foreign rejection value to propagate.
 * @returns A promise rejected with the supplied value.
 */
function rejectWith(reason: unknown): Promise<never> {
  const deferred = Promise.withResolvers<never>();
  deferred.reject(reason);
  return deferred.promise;
}

describe('MCP generic harness', () => {
  it('should validate construction and enforce terminal lifecycle states', async () => {
    expect(() =>
      createMcpServer({ identity: { name: '', version: '1.0.0' }, plugins: [], createContext: () => ({}) })
    ).toThrow(McpConfigurationError);
    expect(() =>
      createMcpServer({
        identity: { name: 'invalid-capacity', version: '1.0.0' },
        plugins: [],
        cacheCapacity: 0,
        createContext: () => ({}),
      })
    ).toThrow(McpConfigurationError);
    expect(() =>
      createMcpServer({
        identity: { name: 'invalid-timeout', version: '1.0.0' },
        plugins: [],
        defaultTimeoutMs: 0,
        createContext: () => ({}),
      })
    ).toThrow(McpConfigurationError);

    const app = createTestApplication();
    expect(app.listFeatures()).toHaveLength(5);
    await app.stop();
    expect(app.state).toBe(McpApplicationState.STOPPED);
    const [, serverTransport] = InMemoryTransport.createLinkedPair();
    await expect(app.start(defineTransport('invalid-restart', () => serverTransport))).rejects.toThrow(
      /Cannot start an application/
    );
  });

  it('should serve tools, resources, templates, and prompts through the SDK', async () => {
    const app = createTestApplication();
    const connection = await connectTestClient(app);
    try {
      const tools = await connection.client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual(['echo_value', 'missing_value']);

      const called = await connection.client.callTool({ name: 'echo_value', arguments: { value: 'hello' } });
      expect(called.isError).not.toBe(true);
      expect(called.structuredContent).toEqual({ echo: 'test:hello' });

      const resources = await connection.client.listResources();
      expect(resources.resources.map((resource) => resource.uri)).toContain('test://status');
      const read = await connection.client.readResource({ uri: 'test://status' });
      expect(read.contents[0]).toMatchObject({ text: 'test:ready' });

      const templates = await connection.client.listResourceTemplates();
      expect(templates.resourceTemplates[0]).toMatchObject({ name: 'catalog_item', uriTemplate: 'test://items/{id}' });
      const templated = await connection.client.readResource({ uri: 'test://items/one' });
      expect(templated.contents[0]).toMatchObject({ text: 'one' });

      const prompts = await connection.client.listPrompts();
      expect(prompts.prompts.map((prompt) => prompt.name)).toContain('explain_topic');
      const prompt = await connection.client.getPrompt({ name: 'explain_topic', arguments: { topic: 'MCP' } });
      expect(prompt.messages[0]).toMatchObject({ content: { type: 'text', text: 'test:MCP' } });
    } finally {
      await connection.close();
    }
    expect(app.state).toBe(McpApplicationState.STOPPED);
  });

  it('should map typed failures to MCP error results', async () => {
    const app = createTestApplication();
    const connection = await connectTestClient(app);
    try {
      const result = await connection.client.callTool({ name: 'missing_value', arguments: {} });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toEqual({
        error: { code: McpErrorCode.NOT_FOUND, message: 'Value was not found', details: { reference: 'missing' } },
      });
    } finally {
      await connection.close();
    }
  });

  it('should enforce cache policy and create a deterministic manifest', async () => {
    const counter = { calls: 0 };
    const app = createTestApplication(counter);
    const firstManifest = app.manifest();
    expect(app.manifest()).toEqual(firstManifest);
    expect(firstManifest.features).toHaveLength(5);
    expect(firstManifest.features[0]).toMatchObject({
      kind: 'tool',
      name: 'echo_value',
      plugin: 'test-plugin',
      outputSchema: { type: 'object' },
    });

    const connection = await connectTestClient(app);
    try {
      await connection.client.callTool({ name: 'echo_value', arguments: { value: 'cached' } });
      await connection.client.callTool({ name: 'echo_value', arguments: { value: 'cached' } });
      expect(counter.calls).toBe(1);
    } finally {
      await connection.close();
    }
  });

  it('should enforce authorization, rate limits, timeouts, and output schemas', async () => {
    const protectedTool = defineTool<TestContext>()({
      name: 'protected_value',
      description: 'Require a caller scope.',
      inputSchema: z.object({}),
      policy: { requiredScopes: [CATALOG_READ_SCOPE] },
      handler: () => jsonResult({ allowed: true }),
    });
    const limitedTool = defineTool<TestContext>()({
      name: 'limited_value',
      description: 'Allow one request.',
      inputSchema: z.object({}),
      policy: { rateLimit: { maxRequests: 1, windowMs: 10_000 } },
      handler: () => jsonResult({ allowed: true }),
    });
    const slowTool = defineTool<TestContext>()({
      name: 'slow_value',
      description: 'Exceed its timeout.',
      inputSchema: z.object({}),
      policy: { timeoutMs: 5 },
      async handler() {
        await new Promise<never>(() => undefined);
        return jsonResult({ completed: true });
      },
    });
    const invalidOutputTool = defineTool<TestContext>()({
      name: 'invalid_output',
      description: 'Return output that violates its schema.',
      inputSchema: z.object({}),
      outputSchema: z.object({ value: z.string() }),
      handler: () => jsonResult({ value: 42 }),
    });
    const app = createMcpServer<TestContext>({
      identity: { name: 'policy-server', version: '1.0.0' },
      plugins: [
        definePlugin({
          name: 'policy-plugin',
          version: '1.0.0',
          features: [protectedTool, limitedTool, slowTool, invalidOutputTool],
        }),
      ],
      createContext: () => ({ prefix: '' }),
    });
    const connection = await connectTestClient(app);
    try {
      const unauthorized = await connection.client.callTool({ name: 'protected_value', arguments: {} });
      expect(unauthorized).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.AUTHENTICATION_REQUIRED } },
      });

      const first = await connection.client.callTool({ name: 'limited_value', arguments: {} });
      const second = await connection.client.callTool({ name: 'limited_value', arguments: {} });
      expect(first.isError).not.toBe(true);
      expect(second).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.RATE_LIMITED } },
      });

      vi.useFakeTimers();
      const timedOutPromise = connection.client.callTool({ name: 'slow_value', arguments: {} });
      await vi.advanceTimersByTimeAsync(5);
      const timedOut = await timedOutPromise;
      vi.useRealTimers();
      expect(timedOut).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.TIMEOUT } },
      });

      const invalidOutput = await connection.client.callTool({ name: 'invalid_output', arguments: {} });
      expect(invalidOutput).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.INTERNAL_ERROR } },
      });
    } finally {
      vi.useRealTimers();
      await connection.close();
    }
  });

  it('should cover authenticated policy, cache, rate-limit, and output-result branches', async () => {
    let cachedCalls = 0;
    let sharedCachedCalls = 0;
    const authenticated = defineTool<TestContext>()({
      name: 'authenticated',
      description: 'Require both test scopes.',
      inputSchema: z.object({}),
      policy: { requiredScopes: [CATALOG_READ_SCOPE, 'catalog:write'] },
      handler: () => jsonResult({ allowed: true }),
    });
    const cached = defineTool<TestContext>()({
      name: 'principal_cache',
      description: 'Cache independently for each caller.',
      inputSchema: z.object({ nested: z.object({ values: z.array(z.string()) }) }),
      annotations: { readOnlyHint: true },
      policy: { cache: { ttlMs: 10, tags: ['principal-values'] } },
      handler: () => jsonResult({ call: ++cachedCalls }),
    });
    const limited = defineTool<TestContext>()({
      name: 'two_requests',
      description: 'Permit two requests per window.',
      inputSchema: z.object({}),
      policy: { rateLimit: { maxRequests: 2, windowMs: 10_000 } },
      handler: () => jsonResult({ allowed: true }),
    });
    const sharedCached = defineTool<TestContext>()({
      name: 'shared_cache',
      description: 'Share cached values only when explicitly configured.',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
      policy: { cache: { ttlMs: 10, varyByPrincipal: false } },
      handler: () => jsonResult({ call: ++sharedCachedCalls }),
    });
    const missingStructuredOutput = defineTool<TestContext>()({
      name: 'missing_structured_output',
      description: 'Return no structured output.',
      inputSchema: z.object({}),
      outputSchema: z.object({ value: z.string() }),
      handler: () => ({ content: [{ type: 'text', text: 'missing' }] }),
    });
    const errorResult = defineTool<TestContext>()({
      name: 'error_result',
      description: 'Return an explicit error result.',
      inputSchema: z.object({}),
      outputSchema: z.object({ status: z.literal('success') }),
      handler: () => createErrorResult(McpErrorCode.CONFLICT, 'expected error'),
    });
    const unmatchedInvalidation = defineTool<TestContext>()({
      name: 'unmatched_invalidation',
      description: 'Invalidate an unrelated cache tag.',
      inputSchema: z.object({}),
      policy: { invalidates: ['other-values'] },
      handler: () => jsonResult({ updated: true }),
    });
    const stringFailure = defineTool<TestContext>()({
      name: 'string_failure',
      description: 'Throw a non-Error value.',
      inputSchema: z.object({}),
      handler: () => rejectWith('string failure'),
    });
    const app = createMcpServer<TestContext>({
      identity: { name: 'branch-server', version: '1.0.0' },
      plugins: [
        definePlugin({
          name: 'branch-plugin',
          version: '1.0.0',
          features: [
            authenticated,
            cached,
            sharedCached,
            limited,
            missingStructuredOutput,
            errorResult,
            unmatchedInvalidation,
            stringFailure,
          ],
        }),
      ],
      createContext: () => ({ prefix: '' }),
    });
    const connection = await connectTestClient(app);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    try {
      const insufficient = await app.invokeTool(
        findTool(app, 'authenticated'),
        {},
        createRequestExtra([CATALOG_READ_SCOPE])
      );
      expect(insufficient.structuredContent).toMatchObject({
        error: { code: McpErrorCode.INSUFFICIENT_PERMISSIONS },
      });
      const allowed = await app.invokeTool(
        findTool(app, 'authenticated'),
        {},
        createRequestExtra([CATALOG_READ_SCOPE, 'catalog:write'])
      );
      expect(allowed.isError).not.toBe(true);

      const cacheInput = { nested: { values: ['b', 'a'] } };
      await app.invokeTool(findTool(app, 'principal_cache'), cacheInput, createRequestExtra([CATALOG_READ_SCOPE]));
      await app.invokeTool(findTool(app, 'principal_cache'), cacheInput, createRequestExtra([CATALOG_READ_SCOPE]));
      await app.invokeTool(findTool(app, 'principal_cache'), cacheInput, createRequestExtra());
      await app.invokeTool(
        findTool(app, 'principal_cache'),
        cacheInput,
        createRequestExtra([CATALOG_READ_SCOPE], 'other-client')
      );
      expect(cachedCalls).toBe(3);
      vi.advanceTimersByTime(11);
      await app.invokeTool(findTool(app, 'principal_cache'), cacheInput, createRequestExtra([CATALOG_READ_SCOPE]));
      expect(cachedCalls).toBe(4);

      await app.invokeTool(findTool(app, 'shared_cache'), {}, createRequestExtra([CATALOG_READ_SCOPE], 'first-client'));
      await app.invokeTool(
        findTool(app, 'shared_cache'),
        {},
        createRequestExtra([CATALOG_READ_SCOPE], 'second-client')
      );
      expect(sharedCachedCalls).toBe(1);

      await app.invokeTool(findTool(app, 'two_requests'), {}, createRequestExtra());
      const second = await app.invokeTool(findTool(app, 'two_requests'), {}, createRequestExtra());
      const third = await app.invokeTool(findTool(app, 'two_requests'), {}, createRequestExtra());
      expect(second.isError).not.toBe(true);
      expect(third.structuredContent).toMatchObject({ error: { code: McpErrorCode.RATE_LIMITED } });

      const missingOutput = await app.invokeTool(findTool(app, 'missing_structured_output'), {}, createRequestExtra());
      expect(missingOutput.structuredContent).toMatchObject({ error: { code: McpErrorCode.INTERNAL_ERROR } });
      const expectedError = await app.invokeTool(findTool(app, 'error_result'), {}, createRequestExtra());
      expect(expectedError.structuredContent).toMatchObject({ error: { code: McpErrorCode.CONFLICT } });
      await app.invokeTool(findTool(app, 'unmatched_invalidation'), {}, createRequestExtra());
      expect((await app.invokeTool(findTool(app, 'string_failure'), {}, createRequestExtra())).isError).toBe(true);
    } finally {
      vi.useRealTimers();
      await connection.close();
    }
  });

  it('should return an empty template list and reject invocation before startup', async () => {
    const unlisted = defineResourceTemplate<TestContext>({
      name: 'unlisted',
      uriTemplate: 'test://unlisted/{id}',
      handler: ({ input }) => ({ contents: [{ uri: String(input.uri), text: 'value' }] }),
    });
    const tool = defineTool<TestContext>()({
      name: 'not_started',
      description: 'Exercise lifecycle validation.',
      inputSchema: z.object({}),
      handler: () => jsonResult({ value: true }),
    });
    const app = createMcpServer<TestContext>({
      identity: { name: 'created-server', version: '1.0.0' },
      plugins: [definePlugin({ name: 'created-plugin', version: '1.0.0', features: [unlisted, tool] })],
      createContext: () => ({ prefix: '' }),
    });
    const [template, compiledTool] = app.listFeatures();
    if (
      template.kind !== McpFeatureKind.RESOURCE_TEMPLATE ||
      compiledTool.kind !== McpFeatureKind.TOOL
    ) {
      throw new Error('Expected test features were not compiled');
    }
    await expect(
      app.listResourceTemplate({ ...template, feature: template.feature }, createRequestExtra())
    ).resolves.toEqual({
      resources: [],
    });
    const result = await app.invokeTool({ ...compiledTool, feature: compiledTool.feature }, {}, createRequestExtra());
    expect(result.structuredContent).toMatchObject({ error: { code: McpErrorCode.INVALID_LIFECYCLE } });
  });

  it('should cancel active work and make concurrent stops idempotent', async () => {
    const pending = defineTool<TestContext>()({
      name: 'pending',
      description: 'Wait until application shutdown.',
      inputSchema: z.object({}),
      handler: ({ request }) =>
        new Promise((resolve) => {
          request.signal.addEventListener(
            'abort',
            () => {
              resolve(jsonResult({ aborted: true }));
            },
            { once: true }
          );
        }),
    });
    const app = createMcpServer<TestContext>({
      identity: { name: 'cancellation-server', version: '1.0.0' },
      plugins: [definePlugin({ name: 'cancellation-plugin', version: '1.0.0', features: [pending] })],
      createContext: () => ({ prefix: '' }),
    });
    const connection = await connectTestClient(app);
    const invocation = app.invokeTool(findTool(app, 'pending'), {}, createRequestExtra());
    const firstStop = app.stop('first-stop');
    const secondStop = app.stop('second-stop');
    await Promise.all([firstStop, secondStop, invocation]);
    await connection.close();
    expect(app.state).toBe(McpApplicationState.STOPPED);
  });

  it('should reject an already-aborted request without invoking its handler', async () => {
    const handler = vi.fn(() => jsonResult({ invoked: true }));
    const tool = defineTool<TestContext>()({
      name: 'pre_aborted',
      description: 'Must not run after request cancellation.',
      inputSchema: z.object({}),
      handler,
    });
    const app = createMcpServer<TestContext>({
      identity: { name: 'pre-aborted-server', version: '1.0.0' },
      plugins: [definePlugin({ name: 'pre-aborted-plugin', version: '1.0.0', features: [tool] })],
      createContext: () => ({ prefix: '' }),
    });
    const connection = await connectTestClient(app);
    const controller = new AbortController();
    controller.abort();
    try {
      const result = await app.invokeTool(findTool(app, 'pre_aborted'), {}, createRequestExtra([], 'client', controller.signal));
      expect(handler).not.toHaveBeenCalled();
      expect(result.structuredContent).toMatchObject({ error: { code: McpErrorCode.CANCELLED } });
    } finally {
      await connection.close();
    }
  });

  it('should cancel and clean up startup before stop resolves', async () => {
    const context = Promise.withResolvers<TestContext>();
    const disposeContext = vi.fn();
    const app = createMcpServer<TestContext>({
      identity: { name: 'startup-race-server', version: '1.0.0' },
      plugins: [],
      createContext: () => context.promise,
      disposeContext,
    });
    const [, serverTransport] = InMemoryTransport.createLinkedPair();
    const startTransport = vi.spyOn(serverTransport, 'start');

    const starting = app.start(defineTransport('delayed-start', () => serverTransport));
    expect(app.state).toBe(McpApplicationState.STARTING);
    const stopping = app.stop('cancel-startup');
    context.resolve({ prefix: '' });

    await expect(starting).rejects.toThrow('startup was cancelled');
    await expect(stopping).resolves.toBeUndefined();
    expect(app.state).toBe(McpApplicationState.STOPPED);
    expect(startTransport).toHaveBeenCalledTimes(0);
    expect(disposeContext).toHaveBeenCalledTimes(1);
  });

  it('should classify only request-schema failures as invalid input', async () => {
    const validating = defineTool<TestContext>()({
      name: 'validate_inside_handler',
      description: 'Validate an internal value after request parsing.',
      inputSchema: z.object({ value: z.string() }),
      handler() {
        z.object({ upstreamValue: z.string() }).parse({ upstreamValue: false });
        return jsonResult({ unreachable: true });
      },
    });
    const app = createMcpServer<TestContext>({
      identity: { name: 'validation-boundary-server', version: '1.0.0' },
      plugins: [definePlugin({ name: 'validation-plugin', version: '1.0.0', features: [validating] })],
      createContext: () => ({ prefix: '' }),
    });
    const [, serverTransport] = InMemoryTransport.createLinkedPair();
    await app.start(defineTransport('validation-test', () => serverTransport));
    try {
      const compiled = findTool(app, 'validate_inside_handler');
      const invalidRequest = await app.invokeTool(compiled, { value: false }, createRequestExtra());
      const internalFailure = await app.invokeTool(compiled, { value: 'valid' }, createRequestExtra());

      expect(invalidRequest.structuredContent).toMatchObject({ error: { code: McpErrorCode.INVALID_INPUT } });
      expect(internalFailure.structuredContent).toEqual({
        error: {
          code: McpErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
          details: { requestId: 'direct-request' },
        },
      });
    } finally {
      await app.stop('validation-test-complete');
    }
  });

  it('should isolate cleanup failures and continue releasing owned resources', async () => {
    const errors: string[] = [];
    const firstPlugin = definePlugin<TestContext>({
      name: 'first-cleanup-plugin',
      version: '1.0.0',
      features: [],
      dispose() {
        throw new Error('first dispose failed');
      },
    });
    const secondPlugin = definePlugin<TestContext>({
      name: 'second-cleanup-plugin',
      version: '1.0.0',
      features: [],
      dispose: () => rejectWith('second dispose failed'),
    });
    const app = createMcpServer<TestContext>({
      identity: { name: 'cleanup-server', version: '1.0.0' },
      plugins: [firstPlugin, secondPlugin],
      logger: createRecordingLogger(errors),
      createContext: () => ({ prefix: '' }),
      disposeContext: () => rejectWith('context dispose failed'),
    });
    const [, serverTransport] = InMemoryTransport.createLinkedPair();
    vi.spyOn(serverTransport, 'close').mockRejectedValueOnce(new Error('transport close failed'));
    await app.start(defineTransport('failing-close', () => serverTransport));
    await app.stop('cleanup-test');
    expect(errors).toEqual([
      'Failed to close MCP server',
      'Failed to dispose MCP plugin',
      'Failed to dispose MCP plugin',
      'Failed to dispose MCP context',
    ]);
  });

  it('should invalidate tagged cache entries after successful mutations', async () => {
    let reads = 0;
    const read = defineTool<TestContext>()({
      name: 'read_value',
      description: 'Read a cached value.',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
      policy: { cache: { ttlMs: 10_000, tags: ['values'] } },
      handler() {
        reads += 1;
        return jsonResult({ reads });
      },
    });
    const write = defineTool<TestContext>()({
      name: 'write_value',
      description: 'Invalidate cached values.',
      inputSchema: z.object({}),
      policy: { invalidates: ['values'] },
      handler: () => jsonResult({ updated: true }),
    });
    const app = createMcpServer<TestContext>({
      identity: { name: 'cache-server', version: '1.0.0' },
      plugins: [definePlugin({ name: 'cache-plugin', version: '1.0.0', features: [read, write] })],
      createContext: () => ({ prefix: '' }),
    });
    const connection = await connectTestClient(app);
    try {
      await connection.client.callTool({ name: 'read_value', arguments: {} });
      await connection.client.callTool({ name: 'read_value', arguments: {} });
      expect(reads).toBe(1);
      await connection.client.callTool({ name: 'write_value', arguments: {} });
      await connection.client.callTool({ name: 'read_value', arguments: {} });
      expect(reads).toBe(2);
    } finally {
      await connection.close();
    }
  });

  it('should bound cache and rate-limit state by evicting the oldest entries', async () => {
    let cachedCalls = 0;
    const cached = defineTool<TestContext>()({
      name: 'bounded_cache',
      description: 'Cache unique values within a fixed capacity.',
      inputSchema: z.object({ key: z.string() }),
      annotations: { readOnlyHint: true },
      policy: { cache: { ttlMs: 10_000 } },
      handler() {
        cachedCalls += 1;
        return jsonResult({ cachedCalls });
      },
    });
    const limited = defineTool<TestContext>()({
      name: 'bounded_rate_limit',
      description: 'Rate limit callers within a fixed capacity.',
      inputSchema: z.object({}),
      policy: { rateLimit: { maxRequests: 1, windowMs: 10_000 } },
      handler: () => jsonResult({ allowed: true }),
    });
    const app = createMcpServer<TestContext>({
      identity: { name: 'bounded-state-server', version: '1.0.0' },
      plugins: [definePlugin({ name: 'bounded-state-plugin', version: '1.0.0', features: [cached, limited] })],
      cacheCapacity: 1,
      rateLimitCapacity: 1,
      createContext: () => ({ prefix: '' }),
    });
    const connection = await connectTestClient(app);
    try {
      for (const key of ['first', 'second', 'third', 'first']) {
        await app.invokeTool(findTool(app, 'bounded_cache'), { key }, createRequestExtra());
      }
      expect(cachedCalls).toBe(4);
      for (const clientId of ['first', 'second', 'third']) {
        await app.invokeTool(findTool(app, 'bounded_rate_limit'), {}, createRequestExtra([], clientId));
      }
      const evictedCaller = await app.invokeTool(
        findTool(app, 'bounded_rate_limit'),
        {},
        createRequestExtra([], 'first')
      );
      expect(evictedCaller.isError).not.toBe(true);
    } finally {
      await connection.close();
    }
  });

  it('should roll back initialized plugins and context when startup fails', async () => {
    const events: string[] = [];
    const app = createMcpServer<Record<string, never>>({
      identity: { name: 'rollback-server', version: '1.0.0' },
      plugins: [
        definePlugin({
          name: 'first-plugin',
          version: '1.0.0',
          features: [],
          setup: () => {
            events.push('setup:first');
          },
          dispose: () => {
            events.push('dispose:first');
          },
        }),
        definePlugin({
          name: 'second-plugin',
          version: '1.0.0',
          features: [],
          setup() {
            events.push('setup:second');
            throw new Error('setup failed');
          },
        }),
      ],
      createContext() {
        events.push('context:create');
        return {};
      },
      disposeContext() {
        events.push('context:dispose');
      },
    });
    const [, serverTransport] = InMemoryTransport.createLinkedPair();

    await expect(app.start(defineTransport('unused', () => serverTransport))).rejects.toThrow('setup failed');
    expect(app.state).toBe(McpApplicationState.STOPPED);
    expect(events).toEqual(['context:create', 'setup:first', 'setup:second', 'dispose:first', 'context:dispose']);
  });
});
