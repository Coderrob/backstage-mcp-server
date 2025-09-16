import { ITool, IToolMetadata, IToolRegistrar, IToolRegistrationContext } from '../../types/index.js';
import { logger } from '../core/logger.js';
import { toZodRawShape } from '../core/mapping.js';

export class DefaultToolRegistrar implements IToolRegistrar {
  constructor(private readonly context: IToolRegistrationContext) {}

  register(toolClass: ITool, { name, description, paramsSchema }: IToolMetadata): void {
    logger.debug(`Registering tool: ${name}`);
    const schemaArg = paramsSchema ? toZodRawShape(paramsSchema) : {};
    this.context.server.tool(name, description, schemaArg, async (args, extra) =>
      toolClass.execute(args, { ...this.context, extra })
    );
    logger.debug(`Tool registered successfully: ${name}`);
  }
}
