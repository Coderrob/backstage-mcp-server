/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  CallToolResult,
  GetPromptResult,
  ListResourcesResult,
  ReadResourceResult,
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';

import type {
  CompiledFeature,
  McpPromptArgsShape,
  PromptDefinition,
  ResourceDefinition,
  ResourceTemplateDefinition,
  ToolDefinition,
} from './definitions.js';

export type SdkRequestExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

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
  ): Promise<import('@modelcontextprotocol/sdk/types.js').ListResourcesResult>;
  invokePrompt(
    compiled: CompiledFeature<TContext> & { feature: PromptDefinition<TContext> },
    input: Record<string, unknown>,
    extra: SdkRequestExtra
  ): Promise<GetPromptResult>;
}

/**
 * Registers sdk features.
 * @param server - The server.
 * @param features - The features.
 * @param runtime - The runtime.
 */
export function registerSdkFeatures<TContext>(
  server: Readonly<McpServer>,
  features: readonly CompiledFeature<TContext>[],
  runtime: Readonly<McpFeatureRuntime<TContext>>
): void {
  for (const compiled of features) {
    const { feature } = compiled;

    if (feature.kind === 'tool') {
      const tool = compiled as CompiledFeature<TContext> & { feature: ToolDefinition<TContext> };
      server.registerTool(
        feature.name,
        {
          title: feature.title,
          description: feature.description,
          inputSchema: feature.inputSchema.shape,
          outputSchema: feature.outputSchema?.shape,
          annotations: feature.annotations,
        },
        /**
         * Handles the anonymous callback.
         */
        async (input: Record<string, unknown>, extra: SdkRequestExtra): Promise<CallToolResult> =>
          runtime.invokeTool(tool, input, extra)
      );
      continue;
    }

    if (feature.kind === 'resource') {
      const resource = compiled as CompiledFeature<TContext> & { feature: ResourceDefinition<TContext> };
      server.registerResource(
        feature.name,
        feature.uri,
        {
          title: feature.title,
          description: feature.description,
          mimeType: feature.mimeType,
        },
        /**
         * Handles the anonymous callback.
         */
        async (uri, extra) => runtime.invokeResource(resource, uri, extra)
      );
      continue;
    }

    if (feature.kind === 'resource-template') {
      const resource = compiled as CompiledFeature<TContext> & { feature: ResourceTemplateDefinition<TContext> };
      const template = new ResourceTemplate(feature.uriTemplate, {
        list: feature.list
          ? /** Lists concrete resources exposed by the registered URI template. */ async (
              extra
            ): Promise<ListResourcesResult> => runtime.listResourceTemplate(resource, extra)
          : undefined,
      });
      server.registerResource(
        feature.name,
        template,
        {
          title: feature.title,
          description: feature.description,
          mimeType: feature.mimeType,
        },
        /**
         * Handles the anonymous callback.
         */
        async (uri, variables, extra) => runtime.invokeResourceTemplate(resource, uri, variables, extra)
      );
      continue;
    }

    const prompt = compiled as CompiledFeature<TContext> & { feature: PromptDefinition<TContext> };
    server.registerPrompt(
      feature.name,
      {
        title: feature.title,
        description: feature.description,
        argsSchema: feature.argsSchema.shape as McpPromptArgsShape,
      },
      /**
       * Handles the anonymous callback.
       */
      async (input, extra) => runtime.invokePrompt(prompt, input, extra)
    );
  }
}
