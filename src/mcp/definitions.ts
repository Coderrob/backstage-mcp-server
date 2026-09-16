/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import type {
  CallToolResult,
  GetPromptResult,
  ListResourcesResult,
  ReadResourceResult,
  ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import type { Logger } from '../shared/logging/logger.js';

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
  readonly kind: 'tool';
  readonly name: string;
  readonly title?: string;
  readonly description: string;
  readonly inputSchema: z.AnyZodObject;
  readonly outputSchema?: z.AnyZodObject;
  readonly annotations?: ToolAnnotations;
  readonly policy?: McpToolPolicy;
  readonly handler: (invocation: McpInvocation<Record<string, unknown>, TContext>) => MaybePromise<CallToolResult>;
}

type ToolDefinitionInput<TContext, TInputSchema extends z.AnyZodObject> = Omit<
  ToolDefinition<TContext>,
  'kind' | 'inputSchema' | 'handler'
> & {
  inputSchema: TInputSchema;
  handler(invocation: McpInvocation<z.output<TInputSchema>, TContext>): MaybePromise<CallToolResult>;
};

/**
 * Creates an immutable plugin definition and freezes its feature collection.
 * @param definition - The plugin metadata, lifecycle hooks, and features.
 * @returns The immutable plugin definition consumed by the registry.
 */
export function definePlugin<TContext>(definition: Readonly<PluginDefinition<TContext>>): PluginDefinition<TContext> {
  return Object.freeze({ ...definition, features: Object.freeze([...definition.features]) });
}

/** Immutable runtime definition for a fixed-URI MCP resource. */
export interface ResourceDefinition<TContext> {
  readonly kind: 'resource';
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly uri: string;
  readonly mimeType?: string;
  readonly handler: (invocation: McpInvocation<{ uri: URL }, TContext>) => MaybePromise<ReadResourceResult>;
}

/**
 * Creates a typed MCP prompt-definition factory for an application context.
 * @returns A factory that infers handler arguments from the supplied Zod schema.
 */
export function definePrompt<TContext>() {
  return /** Freezes a prompt definition while preserving schema-driven argument inference. */ <
    TArgsShape extends McpPromptArgsShape,
  >(
    definition: Readonly<PromptDefinitionInput<TContext, TArgsShape>>
  ): PromptDefinition<TContext> => {
    return Object.freeze({ kind: 'prompt', ...definition }) as unknown as PromptDefinition<TContext>;
  };
}

/** Immutable runtime definition for a parameterized MCP resource. */
export interface ResourceTemplateDefinition<TContext> {
  readonly kind: 'resource-template';
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

/**
 * Creates an immutable fixed-URI resource definition.
 * @param definition - The resource metadata and handler.
 * @returns The resource definition consumed by the registry.
 */
export function defineResource<TContext>(
  definition: Readonly<Omit<ResourceDefinition<TContext>, 'kind'>>
): ResourceDefinition<TContext> {
  return Object.freeze({ kind: 'resource', ...definition });
}

/** Zod shape accepted by the MCP SDK for prompt string arguments. */
export type McpPromptArgsShape = Record<string, z.ZodString | z.ZodOptional<z.ZodString>>;

/** Immutable runtime definition for an MCP prompt. */
export interface PromptDefinition<TContext> {
  readonly kind: 'prompt';
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly argsSchema: z.ZodObject<McpPromptArgsShape>;
  readonly handler: (invocation: McpInvocation<Record<string, unknown>, TContext>) => MaybePromise<GetPromptResult>;
}

type PromptDefinitionInput<TContext, TArgsShape extends McpPromptArgsShape> = Omit<
  PromptDefinition<TContext>,
  'kind' | 'argsSchema' | 'handler'
> & {
  argsSchema: z.ZodObject<TArgsShape>;
  handler(invocation: McpInvocation<z.output<z.ZodObject<TArgsShape>>, TContext>): MaybePromise<GetPromptResult>;
};

/**
 * Defines resource template.
 * @param definition - The feature definition.
 * @returns The operation result.
 */
export function defineResourceTemplate<TContext>(
  definition: Readonly<Omit<ResourceTemplateDefinition<TContext>, 'kind'>>
): ResourceTemplateDefinition<TContext> {
  return Object.freeze({ kind: 'resource-template', ...definition });
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

/**
 * Creates a typed MCP tool-definition factory for an application context.
 * @returns A factory that infers handler input from the supplied Zod schema.
 */
export function defineTool<TContext>() {
  return /** Freezes a tool definition while preserving schema-driven input inference. */ <
    TInputSchema extends z.AnyZodObject,
  >(
    definition: Readonly<ToolDefinitionInput<TContext, TInputSchema>>
  ): ToolDefinition<TContext> => {
    return Object.freeze({ kind: 'tool', ...definition }) as unknown as ToolDefinition<TContext>;
  };
}

/** Registry entry that retains both a feature and its owning plugin. */
export interface CompiledFeature<TContext> {
  readonly plugin: PluginDefinition<TContext>;
  readonly feature: McpFeature<TContext>;
}
