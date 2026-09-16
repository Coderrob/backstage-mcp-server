/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, ListResourcesResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

import { McpFeatureKind } from '../shared/constants/mcp-protocol.js';
import type {
  CompiledFeature,
  McpFeatureRuntime,
  PromptDefinition,
  ResourceDefinition,
  ResourceTemplateDefinition,
  SdkRequestExtra,
  ToolDefinition,
} from '../types/mcp.js';

export type { McpFeatureRuntime, SdkRequestExtra } from '../types/mcp.js';

type CompiledPrompt<TContext> = CompiledFeature<TContext> & { feature: PromptDefinition<TContext> };
type CompiledResource<TContext> = CompiledFeature<TContext> & { feature: ResourceDefinition<TContext> };
type CompiledResourceTemplate<TContext> = CompiledFeature<TContext> & {
  feature: ResourceTemplateDefinition<TContext>;
};
type CompiledTool<TContext> = CompiledFeature<TContext> & { feature: ToolDefinition<TContext> };

/**
 * Returns a Zod object's raw shape with the concrete type expected by the SDK.
 * @param schema - Harness object schema being registered.
 * @returns Raw Zod property shape.
 */
function schemaShape(schema: Readonly<z.AnyZodObject>): z.ZodRawShape {
  return schema.shape as z.ZodRawShape;
}

/**
 * Registers one tool with the SDK server.
 * @param server - SDK server receiving the tool.
 * @param compiled - Tool and owning plugin metadata.
 * @param runtime - Harness callbacks used for invocation.
 */
function registerToolFeature<TContext>(
  server: Readonly<McpServer>,
  compiled: Readonly<CompiledTool<TContext>>,
  runtime: Readonly<McpFeatureRuntime<TContext>>
): void {
  const { feature } = compiled;
  server.registerTool(
    feature.name,
    {
      title: feature.title,
      description: feature.description,
      inputSchema: schemaShape(feature.inputSchema),
      outputSchema: feature.outputSchema ? schemaShape(feature.outputSchema) : undefined,
      annotations: feature.annotations,
    },
    /** Invokes the registered harness tool. */ async (
      input: Record<string, unknown>,
      extra: SdkRequestExtra
    ): Promise<CallToolResult> => runtime.invokeTool(compiled, input, extra)
  );
}

/**
 * Registers one fixed resource with the SDK server.
 * @param server - SDK server receiving the resource.
 * @param compiled - Resource and owning plugin metadata.
 * @param runtime - Harness callbacks used for invocation.
 */
function registerResourceFeature<TContext>(
  server: Readonly<McpServer>,
  compiled: Readonly<CompiledResource<TContext>>,
  runtime: Readonly<McpFeatureRuntime<TContext>>
): void {
  const { feature } = compiled;
  server.registerResource(
    feature.name,
    feature.uri,
    { title: feature.title, description: feature.description, mimeType: feature.mimeType },
    /** Invokes the registered fixed resource. */ async (uri, extra) => runtime.invokeResource(compiled, uri, extra)
  );
}

/**
 * Creates the SDK template wrapper for a parameterized resource.
 * @param compiled - Resource template and owning plugin metadata.
 * @param runtime - Harness callbacks used for listing resources.
 * @returns SDK resource template wrapper.
 */
function createSdkResourceTemplate<TContext>(
  compiled: Readonly<CompiledResourceTemplate<TContext>>,
  runtime: Readonly<McpFeatureRuntime<TContext>>
): ResourceTemplate {
  const { feature } = compiled;
  return new ResourceTemplate(feature.uriTemplate, {
    list: feature.list
      ? /** Lists concrete resources exposed by the registered URI template. */ async (
          extra
        ): Promise<ListResourcesResult> => runtime.listResourceTemplate(compiled, extra)
      : undefined,
  });
}

/**
 * Registers one parameterized resource with the SDK server.
 * @param server - SDK server receiving the resource template.
 * @param compiled - Resource template and owning plugin metadata.
 * @param runtime - Harness callbacks used for invocation.
 */
function registerResourceTemplateFeature<TContext>(
  server: Readonly<McpServer>,
  compiled: Readonly<CompiledResourceTemplate<TContext>>,
  runtime: Readonly<McpFeatureRuntime<TContext>>
): void {
  const { feature } = compiled;
  server.registerResource(
    feature.name,
    createSdkResourceTemplate(compiled, runtime),
    { title: feature.title, description: feature.description, mimeType: feature.mimeType },
    /** Invokes the registered parameterized resource. */ async (uri, variables, extra) =>
      runtime.invokeResourceTemplate(compiled, uri, variables, extra)
  );
}

/**
 * Registers one prompt with the SDK server.
 * @param server - SDK server receiving the prompt.
 * @param compiled - Prompt and owning plugin metadata.
 * @param runtime - Harness callbacks used for invocation.
 */
function registerPromptFeature<TContext>(
  server: Readonly<McpServer>,
  compiled: Readonly<CompiledPrompt<TContext>>,
  runtime: Readonly<McpFeatureRuntime<TContext>>
): void {
  const { feature } = compiled;
  server.registerPrompt(
    feature.name,
    {
      title: feature.title,
      description: feature.description,
      argsSchema: feature.argsSchema.shape,
    },
    /** Invokes the registered prompt. */ async (input, extra) => runtime.invokePrompt(compiled, input, extra)
  );
}

/**
 * Dispatches one compiled feature to its SDK registration adapter.
 * @param server - SDK server receiving the feature.
 * @param compiled - Feature and owning plugin metadata.
 * @param runtime - Harness callbacks used for invocation.
 */
function registerSdkFeature<TContext>(
  server: Readonly<McpServer>,
  compiled: Readonly<CompiledFeature<TContext>>,
  runtime: Readonly<McpFeatureRuntime<TContext>>
): void {
  if (compiled.feature.kind === McpFeatureKind.TOOL) {
    registerToolFeature(server, compiled as CompiledTool<TContext>, runtime);
  } else if (compiled.feature.kind === McpFeatureKind.RESOURCE) {
    registerResourceFeature(server, compiled as CompiledResource<TContext>, runtime);
  } else if (compiled.feature.kind === McpFeatureKind.RESOURCE_TEMPLATE) {
    registerResourceTemplateFeature(server, compiled as CompiledResourceTemplate<TContext>, runtime);
  } else {
    registerPromptFeature(server, compiled as CompiledPrompt<TContext>, runtime);
  }
}

/**
 * Registers compiled harness features with an SDK server.
 * @param server - SDK server receiving the features.
 * @param features - Validated feature collection.
 * @param runtime - Harness callbacks used for invocation.
 */
export function registerSdkFeatures<TContext>(
  server: Readonly<McpServer>,
  features: readonly CompiledFeature<TContext>[],
  runtime: Readonly<McpFeatureRuntime<TContext>>
): void {
  for (const compiled of features) {
    registerSdkFeature(server, compiled, runtime);
  }
}
