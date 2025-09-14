import { pathToFileURL } from 'url';

import { ToolConstructor, ToolFactory } from '../types';
import { isFunction } from '../utils/guards';
import { logger } from '../utils';

export class DefaultToolFactory implements ToolFactory {
  async loadTool(filePath: string): Promise<ToolConstructor | undefined> {
    try {
      logger.debug(`Loading tool module from ${filePath}`);
      const modulePath = filePath.replace(/\.ts$/, '.js');
      const module = await import(pathToFileURL(modulePath).href);
      const toolClass = Object.values(module).find(isFunction) as unknown as ToolConstructor;
      if (toolClass) {
        logger.debug(`Successfully loaded tool class from ${filePath}`);
      } else {
        logger.warn(`No function found in module ${filePath}`);
      }
      return toolClass;
    } catch (error) {
      logger.error(`Failed to load tool from ${filePath}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }
}
