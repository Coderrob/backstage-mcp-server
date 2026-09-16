/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type {
  CallToolResult,
  GetPromptResult,
  ListResourcesResult,
  ReadResourceResult,
  ServerNotification,
  ServerRequest,
  ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

import type { McpFeatureKind } from '../shared/constants/mcp-protocol.js';
import type { Logger } from './logging.js';

/** A value that may be produced synchronously or asynchronously. */
export type MaybePromise<T> = T | Promise<T>;

/** Identity and authorization data resolved by the active transport. */
export interface McpPrincipal {
  id: string;
  scopes: readonly string[];
  attributes?: Readonly<Record<string, unknown>>;
}

/** Metadata shared by middleware and handlers for one protocol request. */
export interface McpRequestContext {
  id: string;
  feature: string;
  plugin: string;
  transport: string;
  signal: AbortSignal;
  startedAt: Date;
  principal?: McpPrincipal;
}

/** Strongly typed input, application dependencies, and request metadata passed to a handler. */
export interface McpInvocation<TInput, TContext> {
  input: TInput;
  context: TContext;
  request: McpRequestContext;
}

/** Controls local result caching for a read-only tool. */
export interface McpToolCachePolicy {
  ttlMs: number;
  /** Cache entries are isolated by principal unless this is explicitly false. */
  varyByPrincipal?: boolean;
  tags?: readonly string[];
}

/** Controls the per-principal request allowance for a tool. */
export interface McpToolRateLimitPolicy {
  maxRequests: number;
  windowMs: number;
}

/** Declarative execution policies enforced by the MCP application boundary. */
export interface McpToolPolicy {
  timeoutMs?: number;
  requiredScopes?: readonly string[];
  cache?: McpToolCachePolicy;
  rateLimit?: McpToolRateLimitPolicy;
  invalidates?: readonly string[];
}

/** Immutable runtime definition for an MCP tool. */
export interface ToolDefinition<TContext> {
  readonly kind: McpFeatureKind.TOOL;
  readonly name: string;
  readonly title?: string;
  readonly description: string;
  readonly inputSchema: z.AnyZodObject;
  readonly outputSchema?: z.AnyZodObject;
  readonly annotations?: ToolAnnotations;
  readonly policy?: McpToolPolicy;
  readonly handler: (invocation: McpInvocation<Record<string, unknown>, TContext>) => MaybePromise<CallToolResult>;
}

/** Immutable runtime definition for a fixed-URI MCP resource. */
export interface ResourceDefinition<TContext> {
  readonly kind: McpFeatureKind.RESOURCE;
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly uri: string;
  readonly mimeType?: string;
  readonly handler: (invocation: McpInvocation<{ uri: URL }, TContext>) => MaybePromise<ReadResourceResult>;
}

/** Immutable runtime definition for a parameterized MCP resource. */
export interface ResourceTemplateDefinition<TContext> {
  readonly kind: McpFeatureKind.RESOURCE_TEMPLATE;
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly uriTemplate: string;
  readonly mimeType?: string;
  readonly list?: (invocation: McpInvocation<Record<string, never>, TContext>) => MaybePromise<ListResourcesResult>;
  readonly handler: (
    invocation: McpInvocation<{ uri: URL; variables: Readonly<Record<string, string | string[]>> }, TContext>
  ) => MaybePromise<ReadResourceResult>;
}

/** Zod shape accepted by the MCP SDK for prompt string arguments. */
export type McpPromptArgsShape = Record<string, z.ZodString | z.ZodOptional<z.ZodString>>;

/** Immutable runtime definition for an MCP prompt. */
export interface PromptDefinition<TContext> {
  readonly kind: McpFeatureKind.PROMPT;
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly argsSchema: z.ZodObject<McpPromptArgsShape>;
  readonly handler: (invocation: McpInvocation<Record<string, unknown>, TContext>) => MaybePromise<GetPromptResult>;
}

/** Union of all feature kinds supported by the generic harness. */
export type McpFeature<TContext> =
  | ToolDefinition<TContext>
  | ResourceDefinition<TContext>
  | ResourceTemplateDefinition<TContext>
  | PromptDefinition<TContext>;

/** Dependencies supplied to plugin startup and disposal hooks. */
export interface McpPluginLifecycle<TContext> {
  context: TContext;
  signal: AbortSignal;
  logger: Logger;
}

/** A named, versioned collection of MCP features and lifecycle hooks. */
export interface PluginDefinition<TContext> {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly features: readonly McpFeature<TContext>[];
  readonly setup?: (lifecycle: McpPluginLifecycle<TContext>) => MaybePromise<void>;
  readonly dispose?: (lifecycle: McpPluginLifecycle<TContext>) => MaybePromise<void>;
}

/** Registry entry that retains both a feature and its owning plugin. */
export interface CompiledFeature<TContext> {
  readonly plugin: PluginDefinition<TContext>;
  readonly feature: McpFeature<TContext>;
}

/** Data visible to middleware for the current feature invocation. */
export interface McpMiddlewareInvocation<TContext> {
  input: unknown;
  context: TContext;
  request: McpRequestContext;
  kind: McpFeatureKind;
}

/** Onion-style middleware that may observe, transform, short-circuit, or delegate an invocation. */
export type McpMiddleware<TContext> = (
  invocation: McpMiddlewareInvocation<TContext>,
  next: () => Promise<unknown>
) => Promise<unknown>;

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
  createContext(runtime: McpRuntimeContext): MaybePromise<TContext>;
  disposeContext?(context: TContext): MaybePromise<void>;
  middleware?: readonly McpMiddleware<TContext>[];
  logger?: Logger;
  defaultTimeoutMs?: number;
}

/** Lazily creates a named SDK transport for an application instance. */
export interface McpTransportFactory {
  readonly name: string;
  create(): Transport;
}

/** MCP SDK request metadata supplied to registered feature callbacks. */
export type SdkRequestExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

/** Application callbacks consumed by the MCP SDK registration adapter. */
export interface McpFeatureRuntime<TContext> {
  invokeTool(
    compiled: CompiledFeature<TContext> & { feature: ToolDefinition<TContext> },
    input: Record<string, unknown>,
    extra: SdkRequestExtra
  ): Promise<CallToolResult>;
  invokeResource(
    compiled: CompiledFeature<TContext> & { feature: ResourceDefinition<TContext> },
    uri: URL,
    extra: SdkRequestExtra
  ): Promise<ReadResourceResult>;
  invokeResourceTemplate(
    compiled: CompiledFeature<TContext> & { feature: ResourceTemplateDefinition<TContext> },
    uri: URL,
    variables: Readonly<Record<string, string | string[]>>,
    extra: SdkRequestExtra
  ): Promise<ReadResourceResult>;
  listResourceTemplate(
    compiled: CompiledFeature<TContext> & { feature: ResourceTemplateDefinition<TContext> },
    extra: SdkRequestExtra
  ): Promise<ListResourcesResult>;
  invokePrompt(
    compiled: CompiledFeature<TContext> & { feature: PromptDefinition<TContext> },
    input: Record<string, unknown>,
    extra: SdkRequestExtra
  ): Promise<GetPromptResult>;
}

/** Serializable manifest metadata for one registered feature. */
export interface McpManifestFeature {
  kind: McpFeatureKind;
  name: string;
  plugin: string;
  title?: string;
  description?: string;
  uri?: string;
  uriTemplate?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: ToolAnnotations;
  policy?: McpToolPolicy;
}

/** Deterministic description of a server and all registered plugin features. */
export interface McpManifest {
  server: { name: string; version: string };
  plugins: Array<{ name: string; version: string; description?: string }>;
  features: McpManifestFeature[];
}

/** Official SDK client connection paired with an in-memory server transport. */
export interface McpTestConnection {
  client: Client;
  close(): Promise<void>;
}
