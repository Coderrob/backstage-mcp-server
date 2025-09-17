import { ITool, IToolMetadata, IToolRegistrar, IToolRegistrationContext } from '../../types/tools.js';
import { logger } from '../core/logger.js';
import { toZodRawShape } from '../core/mapping.js';

/**
 * Default implementation of the tool registrar.
 * Handles registration of tools with the MCP server including schema validation.
 */
export class DefaultToolRegistrar implements IToolRegistrar {
  constructor(private readonly context: IToolRegistrationContext) {}

  /**
   * Registers a tool with the MCP server.
   * Converts Zod schema to raw shape and handles registration errors.
   * @param toolClass - The tool class to register
   * @param metadata - Tool metadata including name, description, and parameter schema
   * @throws Error if tool registration fails
   */
  register(toolClass: ITool, { name, description, paramsSchema }: IToolMetadata): void {
    try {
      logger.debug(`Registering tool: ${name}`);
      const schemaArg = paramsSchema ? toZodRawShape(paramsSchema) : {};
      this.context.server.tool(name, description, schemaArg, async (args, extra) =>
        toolClass.execute(args, { ...this.context, extra })
      );
      logger.debug(`Tool registered successfully: ${name}`);
    } catch (error) {
      logger.error(`Failed to register tool ${name}`, { error });
      throw error;
    }
  }
}
