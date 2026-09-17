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

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, ListResourcesResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

import { McpFeatureKind } from '../shared/constants/mcp-protocol.js';
import type {
  CompiledFeature,
  CompiledPromptFeature,
  CompiledResourceFeature,
  CompiledResourceTemplateFeature,
  CompiledToolFeature,
  McpFeatureRuntime,
  SdkRequestExtra,
} from '../types/mcp.js';

export type { McpFeatureRuntime, SdkRequestExtra } from '../types/mcp.js';

/**
 * Creates the SDK template wrapper for a parameterized resource.
 * @param compiled - Resource template and owning plugin metadata.
 * @param runtime - Harness callbacks used for listing resources.
 * @returns SDK resource template wrapper.
 */
function createSdkResourceTemplate<TContext>(
  compiled: Readonly<CompiledResourceTemplateFeature<TContext>>,
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
 * Registers one prompt with the SDK server.
 * @param server - SDK server receiving the prompt.
 * @param compiled - Prompt and owning plugin metadata.
 * @param runtime - Harness callbacks used for invocation.
 */
function registerPromptFeature<TContext>(
  server: Readonly<McpServer>,
  compiled: Readonly<CompiledPromptFeature<TContext>>,
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
 * Registers one fixed resource with the SDK server.
 * @param server - SDK server receiving the resource.
 * @param compiled - Resource and owning plugin metadata.
 * @param runtime - Harness callbacks used for invocation.
 */
function registerResourceFeature<TContext>(
  server: Readonly<McpServer>,
  compiled: Readonly<CompiledResourceFeature<TContext>>,
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
 * Registers one parameterized resource with the SDK server.
 * @param server - SDK server receiving the resource template.
 * @param compiled - Resource template and owning plugin metadata.
 * @param runtime - Harness callbacks used for invocation.
 */
function registerResourceTemplateFeature<TContext>(
  server: Readonly<McpServer>,
  compiled: Readonly<CompiledResourceTemplateFeature<TContext>>,
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
  if (compiled.kind === McpFeatureKind.TOOL) {
    registerToolFeature(server, compiled, runtime);
  } else if (compiled.kind === McpFeatureKind.RESOURCE) {
    registerResourceFeature(server, compiled, runtime);
  } else if (compiled.kind === McpFeatureKind.RESOURCE_TEMPLATE) {
    registerResourceTemplateFeature(server, compiled, runtime);
  } else {
    registerPromptFeature(server, compiled, runtime);
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

/**
 * Registers one tool with the SDK server.
 * @param server - SDK server receiving the tool.
 * @param compiled - Tool and owning plugin metadata.
 * @param runtime - Harness callbacks used for invocation.
 */
function registerToolFeature<TContext>(
  server: Readonly<McpServer>,
  compiled: Readonly<CompiledToolFeature<TContext>>,
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
      input: Readonly<Record<string, unknown>>,
      extra: Readonly<SdkRequestExtra>
    ): Promise<CallToolResult> => runtime.invokeTool(compiled, input, extra)
  );
}

/**
 * Returns a Zod object's raw shape with the concrete type expected by the SDK.
 * @param schema - Harness object schema being registered.
 * @returns Raw Zod property shape.
 */
function schemaShape(schema: Readonly<z.ZodObject<z.ZodRawShape>>): z.ZodRawShape {
  return schema.shape;
}
