import { toZodRawShape } from '../utils/mapping';
import {
  IToolRegistrationContext,
  ToolConstructor,
  ToolMetadata,
  ToolRegistrar,
} from '../types';

export class DefaultToolRegistrar implements ToolRegistrar {
  constructor(private readonly context: IToolRegistrationContext) {}

  register(
    toolClass: ToolConstructor,
    { name, description, paramsSchema }: ToolMetadata
  ): void {
    this.context.server.tool(
      name,
      description,
      toZodRawShape(paramsSchema),
      async (args, extra) => toolClass.execute(args, { ...this.context, extra })
    );
  }
}
