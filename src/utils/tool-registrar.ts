import { IToolConstructor, IToolMetadata, IToolRegistrar, IToolRegistrationContext } from '../types';
import { logger } from '../utils';
import { toZodRawShape } from '../utils/mapping';

export class DefaultToolRegistrar implements IToolRegistrar {
  constructor(private readonly context: IToolRegistrationContext) {}

  register(toolClass: IToolConstructor, { name, description, paramsSchema }: IToolMetadata): void {
    logger.debug(`Registering tool: ${name}`);
    const schemaArg = paramsSchema ? toZodRawShape(paramsSchema) : {};
    this.context.server.tool(name, description, schemaArg, async (args, extra) =>
      toolClass.execute(args, { ...this.context, extra })
    );
    logger.debug(`Tool registered successfully: ${name}`);
  }
}
