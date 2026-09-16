/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  CallToolResult,
  GetPromptResult,
  ListResourcesResult,
  ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';

import type {
  CompiledFeature,
  McpPluginLifecycle,
  McpPrincipal,
  McpRequestContext,
  PluginDefinition,
  PromptDefinition,
  ResourceDefinition,
  ResourceTemplateDefinition,
  ToolDefinition,
} from './definitions.js';
import {
  McpAuthenticationError,
  McpAuthorizationError,
  McpConfigurationError,
  McpInputError,
  McpLifecycleError,
  McpOutputError,
  McpRateLimitError,
  McpTimeoutError,
} from './errors.js';
import type { Logger } from '../shared/logging/logger.js';
import { noopLogger } from '../shared/logging/logger.js';
import { composeMiddleware, type McpMiddleware, type McpMiddlewareInvocation } from './middleware.js';
import { type McpManifest, McpRegistry } from './registry.js';
import { mapToolError } from './results.js';
import { type McpFeatureRuntime, registerSdkFeatures, type SdkRequestExtra } from './sdk-adapter.js';
import type { McpTransportFactory } from './transports.js';

/** Lifecycle states exposed by an MCP application instance. */
export type McpApplicationState = 'created' | 'starting' | 'running' | 'stopping' | 'stopped';

/** Services available while the application context is being created. */
export interface McpRuntimeContext {
  signal: AbortSignal;
  logger: Logger;
}

/** Configuration used to construct an isolated MCP application. */
export interface CreateMcpServerOptions<TContext> {
  identity: { name: string; version: string };
  instructions?: string;
  plugins: readonly PluginDefinition<TContext>[];
  createContext(runtime: McpRuntimeContext): TContext | Promise<TContext>;
  disposeContext?(context: TContext): void | Promise<void>;
  middleware?: readonly McpMiddleware<TContext>[];
  logger?: Logger;
  defaultTimeoutMs?: number;
}

interface CacheEntry {
  expiresAt: number;
  result: CallToolResult;
  tags: readonly string[];
}

interface RateLimitEntry {
  count: number;
  resetsAt: number;
}

/**
 * Builds principal.
 * @param extra - The extra.
 * @returns The operation result.
 */
function buildPrincipal(extra: Readonly<SdkRequestExtra>): McpPrincipal | undefined {
  const auth = extra.authInfo;
  if (!auth) return undefined;
  return {
    id: auth.clientId,
    scopes: Object.freeze([...auth.scopes]),
    attributes: auth.extra,
  };
}

/**
 * Performs the stable value operation.
 * @param value - The value to process.
 * @returns The operation result.
 */
function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(/** Compares two items for sorting. */ ([left], [right]) => left.localeCompare(right))
        .map(/** Maps each item to its transformed value. */ ([key, nested]) => [key, stableValue(nested)])
    );
  }
  return value;
}

/** Owns an MCP registry, SDK server, context, policies, and transport lifecycle. */
export class McpApplication<TContext> implements McpFeatureRuntime<TContext> {
  private currentState: McpApplicationState = 'created';
  private readonly registry: McpRegistry<TContext>;
  private readonly logger: Logger;
  private readonly rootController = new AbortController();
  private readonly cache = new Map<string, CacheEntry>();
  private readonly rateLimits = new Map<string, RateLimitEntry>();
  private context?: TContext;
  private server?: McpServer;
  private startPromise?: Promise<void>;
  private stopPromise?: Promise<void>;
  private transportName = 'not-started';
  private initializedPlugins: PluginDefinition<TContext>[] = [];

  /**
   * Creates an application and validates its identity and policy definitions.
   * @param options - Plugins, context factory, middleware, and runtime services.
   * @throws {McpConfigurationError} When identity or timeout configuration is invalid.
   */
  constructor(private readonly options: Readonly<CreateMcpServerOptions<TContext>>) {
    if (!options.identity.name.trim() || !options.identity.version.trim()) {
      throw new McpConfigurationError('Server name and version are required');
    }
    if (
      options.defaultTimeoutMs !== undefined &&
      (!Number.isFinite(options.defaultTimeoutMs) || options.defaultTimeoutMs <= 0)
    ) {
      throw new McpConfigurationError('defaultTimeoutMs must be greater than zero');
    }
    this.registry = new McpRegistry(options.plugins);
    this.logger = options.logger ?? noopLogger;
  }

  /**
   * Gets the current application lifecycle state.
   * @returns The current lifecycle state.
   */
  get state(): McpApplicationState {
    return this.currentState;
  }

  /**
   * Builds the deterministic manifest without starting a transport.
   * @returns Server, plugin, feature, schema, annotation, and policy metadata.
   */
  manifest(): McpManifest {
    return this.registry.manifest(this.options.identity);
  }

  /**
   * Lists the validated features together with their owning plugins.
   * @returns The immutable compiled feature collection.
   */
  listFeatures(): readonly CompiledFeature<TContext>[] {
    return this.registry.list();
  }

  /**
   * Creates the application context, initializes plugins, and connects the SDK server.
   * @param transportFactory - Factory for the transport owned by this application.
   * @throws {McpLifecycleError} When the application has already been started or stopped.
   */
  async start(transportFactory: Readonly<McpTransportFactory>): Promise<void> {
    if (this.currentState !== 'created') {
      throw new McpLifecycleError(`Cannot start an application in state '${this.currentState}'`);
    }

    this.currentState = 'starting';
    this.transportName = transportFactory.name;
    const startup = this.initialize(transportFactory);
    this.startPromise = startup;
    try {
      await startup;
    } finally {
      this.startPromise = undefined;
    }
  }

  /**
   * Stops the transport and disposes plugins and context in reverse ownership order.
   * @param reason - Diagnostic shutdown reason written to the logger.
   */
  async stop(reason = 'requested'): Promise<void> {
    if (this.currentState === 'stopped') return;
    if (this.currentState === 'created') {
      this.currentState = 'stopped';
      return;
    }
    if (this.currentState === 'stopping') {
      await this.stopPromise;
      return;
    }

    const startup = this.currentState === 'starting' ? this.startPromise : undefined;
    this.currentState = 'stopping';
    this.rootController.abort(reason);
    this.stopPromise = startup ? this.cleanupAfterStartup(startup, reason) : this.cleanup(reason);
    try {
      await this.stopPromise;
    } finally {
      this.currentState = 'stopped';
      this.stopPromise = undefined;
      this.logger.info('MCP application stopped', { reason });
    }
  }

  /**
   * Validates and executes a tool through middleware and configured policies.
   * @param compiled - The tool and its owning plugin.
   * @param input - Untrusted tool arguments supplied by the protocol client.
   * @param extra - SDK request metadata, identity, and cancellation signal.
   * @returns A native MCP result, including a safe error result on failure.
   */
  async invokeTool(
    compiled: CompiledFeature<TContext> & { feature: ToolDefinition<TContext> },
    input: Readonly<Record<string, unknown>>,
    extra: Readonly<SdkRequestExtra>
  ): Promise<CallToolResult> {
    const requestId = String(extra.requestId);
    try {
      const parsed = this.parseToolInput(compiled.feature, input);
      const result = (await this.executeFeature(
        compiled,
        parsed,
        extra,
        /** Invokes the compiled feature implementation. */ (invocation) =>
          this.executeToolHandler(compiled, parsed, invocation)
      )) as CallToolResult;
      return result;
    } catch (error) {
      this.logger.error('MCP tool failed', {
        requestId,
        plugin: compiled.plugin.name,
        feature: compiled.feature.name,
        error: error instanceof Error ? error.message : String(error),
      });
      return mapToolError(error, requestId);
    }
  }

  /**
   * Creates application dependencies, initializes plugins, and connects the selected transport.
   * @param transportFactory - Factory for the transport owned by this application.
   * @throws {Error} When dependency creation, plugin setup, transport connection, or startup cancellation fails.
   */
  private async initialize(transportFactory: Readonly<McpTransportFactory>): Promise<void> {
    try {
      this.context = await this.options.createContext({ signal: this.rootController.signal, logger: this.logger });
      this.assertStartupActive();
      const lifecycle = this.lifecycle(this.context);
      for (const plugin of this.options.plugins) {
        await plugin.setup?.(lifecycle);
        this.initializedPlugins.push(plugin);
        this.assertStartupActive();
      }

      this.server = new McpServer(this.options.identity, { instructions: this.options.instructions });
      registerSdkFeatures(this.server, this.registry.list(), this);
      await this.server.connect(transportFactory.create());
      this.assertStartupActive();
      this.currentState = 'running';
      this.logger.info('MCP application started', {
        transport: this.transportName,
        features: this.registry.list().length,
      });
    } catch (error) {
      await this.cleanup('startup-failure');
      this.currentState = 'stopped';
      throw error;
    }
  }

  /**
   * Rejects startup work that resumed after shutdown began.
   * @throws {McpLifecycleError} When startup has been cancelled.
   */
  private assertStartupActive(): void {
    if (this.currentState !== 'starting' || this.rootController.signal.aborted) {
      throw new McpLifecycleError('MCP application startup was cancelled');
    }
  }

  /**
   * Parses untrusted tool input while keeping handler validation failures outside the input boundary.
   * @param feature - Tool whose input schema validates the request.
   * @param input - Untrusted tool arguments supplied by the protocol client.
   * @returns Parsed tool arguments.
   * @throws {McpInputError} When the request does not satisfy the tool input schema.
   */
  private parseToolInput(
    feature: Readonly<ToolDefinition<TContext>>,
    input: Readonly<Record<string, unknown>>
  ): Record<string, unknown> {
    try {
      return feature.inputSchema.parse(input) as Record<string, unknown>;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new McpInputError('Input validation failed', { issues: error.issues });
      }
      throw error;
    }
  }

  /**
   * Executes a fixed-URI resource through the common middleware boundary.
   * @param compiled - The resource and its owning plugin.
   * @param uri - Resolved resource URI.
   * @param extra - SDK request metadata and cancellation signal.
   * @returns The resource contents produced by the handler.
   */
  async invokeResource(
    compiled: CompiledFeature<TContext> & { feature: ResourceDefinition<TContext> },
    uri: Readonly<URL>,
    extra: Readonly<SdkRequestExtra>
  ): Promise<ReadResourceResult> {
    return (await this.executeFeature(
      compiled,
      { uri },
      extra,
      /** Invokes the compiled feature implementation. */ (invocation) =>
        compiled.feature.handler({ input: { uri }, context: invocation.context, request: invocation.request })
    )) as ReadResourceResult;
  }

  /**
   * Executes a parameterized resource through the common middleware boundary.
   * @param compiled - The resource template and its owning plugin.
   * @param uri - URI resolved from the template.
   * @param variables - Variables parsed from the URI template.
   * @param extra - SDK request metadata and cancellation signal.
   * @returns The resource contents produced by the handler.
   */
  async invokeResourceTemplate(
    compiled: CompiledFeature<TContext> & { feature: ResourceTemplateDefinition<TContext> },
    uri: Readonly<URL>,
    variables: Readonly<Record<string, string | string[]>>,
    extra: Readonly<SdkRequestExtra>
  ): Promise<ReadResourceResult> {
    return (await this.executeFeature(
      compiled,
      { uri, variables },
      extra,
      /** Invokes the compiled feature implementation. */ (invocation) =>
        compiled.feature.handler({
          input: { uri, variables },
          context: invocation.context,
          request: invocation.request,
        })
    )) as ReadResourceResult;
  }

  /**
   * Lists concrete resources exposed by a resource template.
   * @param compiled - The resource template and its owning plugin.
   * @param extra - SDK request metadata and cancellation signal.
   * @returns The listed resources, or an empty list when no lister is defined.
   */
  async listResourceTemplate(
    compiled: CompiledFeature<TContext> & { feature: ResourceTemplateDefinition<TContext> },
    extra: Readonly<SdkRequestExtra>
  ): Promise<ListResourcesResult> {
    if (!compiled.feature.list) return { resources: [] };
    return (await this.executeFeature(
      compiled,
      {},
      extra,
      /** Invokes the compiled feature implementation. */ (invocation) =>
        compiled.feature.list!({ input: {}, context: invocation.context, request: invocation.request })
    )) as ListResourcesResult;
  }

  /**
   * Validates prompt arguments and executes the prompt handler through middleware.
   * @param compiled - The prompt and its owning plugin.
   * @param input - Untrusted prompt arguments supplied by the protocol client.
   * @param extra - SDK request metadata and cancellation signal.
   * @returns The generated MCP prompt messages.
   */
  async invokePrompt(
    compiled: CompiledFeature<TContext> & { feature: PromptDefinition<TContext> },
    input: Readonly<Record<string, unknown>>,
    extra: Readonly<SdkRequestExtra>
  ): Promise<GetPromptResult> {
    const parsed = compiled.feature.argsSchema.parse(input) as Record<string, unknown>;
    return (await this.executeFeature(
      compiled,
      parsed,
      extra,
      /** Invokes the compiled feature implementation. */ (invocation) =>
        compiled.feature.handler({ input: parsed, context: invocation.context, request: invocation.request })
    )) as GetPromptResult;
  }

  /**
   * Executes feature.
   * @param compiled - The compiled.
   * @param input - The input value.
   * @param extra - The extra.
   * @param handler - The handler function.
   * @returns The operation result.
   * @throws {Error} When the operation cannot be completed.
   */
  private async executeFeature(
    compiled: Readonly<CompiledFeature<TContext>>,
    input: unknown,
    extra: Readonly<SdkRequestExtra>,
    handler: (invocation: McpMiddlewareInvocation<TContext>) => unknown | Promise<unknown>
  ): Promise<unknown> {
    if ((this.currentState !== 'running' && this.currentState !== 'starting') || this.context === undefined) {
      throw new McpLifecycleError('The MCP application is not running');
    }

    const controller = new AbortController();
    /**
     * Performs the abort operation.
     * @returns The operation result.
     */
    const abort = (): void => controller.abort();
    this.rootController.signal.addEventListener('abort', abort, { once: true });
    extra.signal.addEventListener('abort', abort, { once: true });

    const timeoutMs = compiled.feature.kind === 'tool' ? compiled.feature.policy?.timeoutMs : undefined;
    const effectiveTimeout = timeoutMs ?? this.options.defaultTimeoutMs;
    let timer: NodeJS.Timeout | undefined;

    const request: McpRequestContext = {
      id: String(extra.requestId),
      feature: compiled.feature.name,
      plugin: compiled.plugin.name,
      transport: this.transportName,
      signal: controller.signal,
      startedAt: new Date(),
      principal: buildPrincipal(extra),
    };
    const invocation: McpMiddlewareInvocation<TContext> = {
      input,
      context: this.context,
      request,
      kind: compiled.feature.kind,
    };

    try {
      const operation = composeMiddleware(
        this.options.middleware ?? [],
        invocation,
        /** Invokes the feature after middleware processing. */ () => Promise.resolve(handler(invocation))
      );
      if (!effectiveTimeout) return await operation;
      const timeout = new Promise<never>(
        /** Runs the asynchronous operation and settles its promise. */ (_resolve, reject) => {
          timer = globalThis.setTimeout(
            /** Handles the scheduled timeout. */ () => {
              controller.abort();
              reject(new McpTimeoutError(effectiveTimeout));
            },
            effectiveTimeout
          );
        }
      );
      return await Promise.race([operation, timeout]);
    } finally {
      if (timer) globalThis.clearTimeout(timer);
      this.rootController.signal.removeEventListener('abort', abort);
      extra.signal.removeEventListener('abort', abort);
    }
  }

  /**
   * Enforces authorization.
   * @param tool - The tool.
   * @param principal - The principal.
   * @throws {Error} When the operation cannot be completed.
   */
  private enforceAuthorization(tool: Readonly<ToolDefinition<TContext>>, principal: McpPrincipal | undefined): void {
    const required = tool.policy?.requiredScopes;
    if (!required?.length) return;
    if (!principal) throw new McpAuthenticationError();
    if (
      !required.every(
        /** Determines whether every item satisfies the predicate. */ (scope) => principal.scopes.includes(scope)
      )
    ) {
      throw new McpAuthorizationError(required);
    }
  }

  /**
   * Executes tool handler.
   * @param compiled - The compiled.
   * @param input - The input value.
   * @param invocation - The invocation.
   * @returns The operation result.
   */
  private async executeToolHandler(
    compiled: CompiledFeature<TContext> & { feature: ToolDefinition<TContext> },
    input: Readonly<Record<string, unknown>>,
    invocation: Readonly<McpMiddlewareInvocation<TContext>>
  ): Promise<CallToolResult> {
    const { feature } = compiled;
    this.enforceAuthorization(feature, invocation.request.principal);
    this.enforceRateLimit(feature, invocation.request.principal);

    const cacheKey = this.cacheKey(feature, input, invocation.request.principal);
    const cached = this.readCache(cacheKey);
    if (cached) return cached;

    const result = await feature.handler({ input, context: invocation.context, request: invocation.request });
    invocation.request.signal.throwIfAborted();
    this.validateToolOutput(feature, result);
    this.commitToolResult(feature, cacheKey, result);
    return result;
  }

  /**
   * Reads cache.
   * @param key - The key.
   * @returns The operation result.
   */
  private readCache(key: string | undefined): CallToolResult | undefined {
    if (!key) return undefined;
    const cached = this.cache.get(key);
    if (!cached) return undefined;
    if (cached.expiresAt > Date.now()) return cached.result;
    this.cache.delete(key);
    return undefined;
  }

  /**
   * Validates tool output.
   * @param feature - The feature definition.
   * @param result - The result.
   * @throws {Error} When the operation cannot be completed.
   */
  private validateToolOutput(feature: Readonly<ToolDefinition<TContext>>, result: Readonly<CallToolResult>): void {
    if (!feature.outputSchema) return;
    if (!result.structuredContent) throw new McpOutputError();
    const parsed = feature.outputSchema.safeParse(result.structuredContent);
    if (!parsed.success) throw new McpOutputError({ cause: parsed.error });
  }

  /**
   * Commits tool result.
   * @param feature - The feature definition.
   * @param cacheKey - The cache key.
   * @param result - The result.
   */
  private commitToolResult(
    feature: Readonly<ToolDefinition<TContext>>,
    cacheKey: string | undefined,
    result: Readonly<CallToolResult>
  ): void {
    if (result.isError) return;
    this.invalidateCache(feature.policy?.invalidates);
    const cachePolicy = feature.policy?.cache;
    if (!cacheKey || !cachePolicy) return;
    this.cache.set(cacheKey, {
      expiresAt: Date.now() + cachePolicy.ttlMs,
      result,
      tags: cachePolicy.tags ?? [],
    });
  }

  /**
   * Enforces rate limit.
   * @param tool - The tool.
   * @param principal - The principal.
   * @throws {Error} When the operation cannot be completed.
   */
  private enforceRateLimit(tool: Readonly<ToolDefinition<TContext>>, principal: McpPrincipal | undefined): void {
    const policy = tool.policy?.rateLimit;
    if (!policy) return;
    const now = Date.now();
    const key = `${tool.name}:${principal?.id ?? 'anonymous'}`;
    const existing = this.rateLimits.get(key);
    if (!existing || existing.resetsAt <= now) {
      this.rateLimits.set(key, { count: 1, resetsAt: now + policy.windowMs });
      return;
    }
    if (existing.count >= policy.maxRequests) throw new McpRateLimitError(existing.resetsAt - now);
    existing.count += 1;
  }

  /**
   * Performs the cache key operation.
   * @param tool - The tool.
   * @param input - The input value.
   * @param principal - The principal.
   * @returns The operation result.
   */
  private cacheKey(
    tool: Readonly<ToolDefinition<TContext>>,
    input: Readonly<Record<string, unknown>>,
    principal: McpPrincipal | undefined
  ): string | undefined {
    const policy = tool.policy?.cache;
    if (!policy) return undefined;
    const isolateByPrincipal = policy.varyByPrincipal ?? true;
    const principalKey = isolateByPrincipal ? (principal?.id ?? 'anonymous') : 'shared';
    return `${tool.name}:${principalKey}:${JSON.stringify(stableValue(input))}`;
  }

  /**
   * Waits for cancelled startup to release partial resources before completing shutdown.
   * @param startup - In-progress startup operation cancelled by `stop`.
   * @param reason - Diagnostic shutdown reason written to the logger.
   */
  private async cleanupAfterStartup(startup: Readonly<Promise<void>>, reason: string): Promise<void> {
    try {
      await startup;
    } catch (error) {
      this.logger.debug('MCP startup cancellation settled before shutdown', {
        errorType: error instanceof Error ? error.name : typeof error,
      });
    }
    await this.cleanup(reason);
  }

  /**
   * Invalidates cache.
   * @param tags - The tags.
   */
  private invalidateCache(tags: readonly string[] | undefined): void {
    if (!tags?.length) return;
    for (const [key, entry] of this.cache) {
      if (entry.tags.some(/** Determines whether any item satisfies the predicate. */ (tag) => tags.includes(tag)))
        this.cache.delete(key);
    }
  }

  /**
   * Performs the lifecycle operation.
   * @param context - The application context.
   * @returns The operation result.
   */
  private lifecycle(context: Readonly<TContext>): McpPluginLifecycle<TContext> {
    return { context, signal: this.rootController.signal, logger: this.logger };
  }

  /**
   * Cleans up the value.
   * @param reason - The shutdown reason.
   */
  private async cleanup(reason: string): Promise<void> {
    this.rootController.abort(reason);
    await this.closeSdkServer();
    const context = this.context;
    if (context !== undefined) {
      await this.disposePlugins(context);
      await this.disposeApplicationContext(context);
    }
    this.initializedPlugins = [];
    this.cache.clear();
    this.rateLimits.clear();
    this.server = undefined;
    this.context = undefined;
  }

  /**
   * Closes sdk server.
   */
  private async closeSdkServer(): Promise<void> {
    try {
      await this.server?.close();
    } catch (error) {
      this.logger.error('Failed to close MCP server', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Disposes plugins.
   * @param context - The application context.
   */
  private async disposePlugins(context: Readonly<TContext>): Promise<void> {
    const lifecycle = this.lifecycle(context);
    for (const plugin of [...this.initializedPlugins].reverse()) {
      try {
        await plugin.dispose?.(lifecycle);
      } catch (error) {
        this.logger.error('Failed to dispose MCP plugin', {
          plugin: plugin.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Disposes application context.
   * @param context - The application context.
   */
  private async disposeApplicationContext(context: Readonly<TContext>): Promise<void> {
    try {
      await this.options.disposeContext?.(context);
    } catch (error) {
      this.logger.error('Failed to dispose MCP context', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Creates an isolated MCP application without starting a transport or process.
 * @param options - Plugins, context factory, middleware, and runtime services.
 * @returns A new application instance in the `created` state.
 */
export function createMcpServer<TContext>(
  options: Readonly<CreateMcpServerOptions<TContext>>
): McpApplication<TContext> {
  return new McpApplication(options);
}
