import { pathToFileURL } from 'url';

import { ITool, IToolFactory } from '../../types';
import { isFunction, logger } from '../core';

export class DefaultToolFactory implements IToolFactory {
  async loadTool(filePath: string): Promise<ITool | undefined> {
    try {
      logger.debug(`Loading tool module from ${filePath}`);
      const modulePath = filePath.replace(/\.ts$/, '.js');
      const module = await import(pathToFileURL(modulePath).href);
      const toolClass = Object.values(module).find(isFunction) as unknown as ITool;
      if (toolClass != null) {
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
