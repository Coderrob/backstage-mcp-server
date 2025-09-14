import { IToolRegistrationContext, ToolConstructor, ToolMetadata, ToolRegistrar } from '../types';
import { toZodRawShape } from '../utils/mapping';
import { logger } from '../utils';

export class DefaultToolRegistrar implements ToolRegistrar {
  constructor(private readonly context: IToolRegistrationContext) {}

  register(toolClass: ToolConstructor, { name, description, paramsSchema }: ToolMetadata): void {
    logger.debug(`Registering tool: ${name}`);
    this.context.server.tool(name, description, toZodRawShape(paramsSchema), async (args, extra) =>
      toolClass.execute(args, { ...this.context, extra })
    );
    logger.debug(`Tool registered successfully: ${name}`);
  }
}
