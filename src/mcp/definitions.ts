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

import type { CallToolResult, GetPromptResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

import { McpFeatureKind } from '../shared/constants/mcp-protocol.js';
import type {
  MaybePromise,
  McpInvocation,
  McpPromptArgsShape,
  PluginDefinition,
  PromptDefinition,
  ResourceDefinition,
  ResourceTemplateDefinition,
  ToolDefinition,
} from '../types/mcp.js';

export type {
  CompiledFeature,
  MaybePromise,
  McpFeature,
  McpInvocation,
  McpPluginLifecycle,
  McpPrincipal,
  McpPromptArgsShape,
  McpRequestContext,
  McpToolCachePolicy,
  McpToolPolicy,
  McpToolRateLimitPolicy,
  PluginDefinition,
  PromptDefinition,
  ResourceDefinition,
  ResourceTemplateDefinition,
  ToolDefinition,
} from '../types/mcp.js';

type ToolDefinitionInput<TContext, TInputSchema extends z.AnyZodObject> = Omit<
  ToolDefinition<TContext>,
  'kind' | 'inputSchema' | 'handler'
> & {
  inputSchema: TInputSchema;
  handler(invocation: McpInvocation<z.output<TInputSchema>, TContext>): MaybePromise<CallToolResult>;
};

type PromptDefinitionInput<TContext, TArgsShape extends McpPromptArgsShape> = Omit<
  PromptDefinition<TContext>,
  'kind' | 'argsSchema' | 'handler'
> & {
  argsSchema: z.ZodObject<TArgsShape>;
  handler(invocation: McpInvocation<z.output<z.ZodObject<TArgsShape>>, TContext>): MaybePromise<GetPromptResult>;
};

/**
 * Creates an immutable plugin definition and freezes its feature collection.
 * @param definition - The plugin metadata, lifecycle hooks, and features.
 * @returns The immutable plugin definition consumed by the registry.
 */
export function definePlugin<TContext>(definition: Readonly<PluginDefinition<TContext>>): PluginDefinition<TContext> {
  return Object.freeze({ ...definition, features: Object.freeze([...definition.features]) });
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
    return Object.freeze({ kind: McpFeatureKind.PROMPT, ...definition });
  };
}

/**
 * Creates an immutable fixed-URI resource definition.
 * @param definition - The resource metadata and handler.
 * @returns The resource definition consumed by the registry.
 */
export function defineResource<TContext>(
  definition: Readonly<Omit<ResourceDefinition<TContext>, 'kind'>>
): ResourceDefinition<TContext> {
  return Object.freeze({ kind: McpFeatureKind.RESOURCE, ...definition });
}

/**
 * Creates an immutable parameterized-resource definition.
 * @param definition - The resource-template metadata and handler.
 * @returns The resource-template definition consumed by the registry.
 */
export function defineResourceTemplate<TContext>(
  definition: Readonly<Omit<ResourceTemplateDefinition<TContext>, 'kind'>>
): ResourceTemplateDefinition<TContext> {
  return Object.freeze({ kind: McpFeatureKind.RESOURCE_TEMPLATE, ...definition });
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
    return Object.freeze({ kind: McpFeatureKind.TOOL, ...definition });
  };
}
