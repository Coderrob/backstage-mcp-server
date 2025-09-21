import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { IBackstageCatalogApi } from '../../shared/types/apis.js';
import { IToolRegistrationContext } from '../../shared/types/tools.js';

/**
 * Plugin interface for extending MCP server functionality
 */
export interface IMcpPlugin {
  name: string;
  version: string;
  description?: string;

  /**
   * Initialize the plugin with the server context
   */
  initialize(context: IToolRegistrationContext): Promise<void>;

  /**
   * Cleanup resources when the plugin is unloaded
   */
  destroy?(): Promise<void>;
}

/**
 * Plugin manager for loading and managing MCP plugins
 */
export class PluginManager {
  private plugins: Map<string, IMcpPlugin> = new Map();
  private context?: IToolRegistrationContext;

  /**
   * Set the server context for plugins
   */
  setContext(context: IToolRegistrationContext): void {
    this.context = context;
  }

  /**
   * Register a plugin
   */
  async register(plugin: IMcpPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    this.plugins.set(plugin.name, plugin);

    if (this.context) {
      await plugin.initialize(this.context);
    }
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    if (plugin.destroy) {
      await plugin.destroy();
    }

    this.plugins.delete(pluginName);
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): IMcpPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin by name
   */
  getPlugin(name: string): IMcpPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Initialize all registered plugins
   */
  async initializeAll(): Promise<void> {
    if (!this.context) {
      throw new Error('Server context not set');
    }

    for (const plugin of this.plugins.values()) {
      await plugin.initialize(this.context);
    }
  }

  /**
   * Destroy all registered plugins
   */
  async destroyAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.destroy) {
        await plugin.destroy();
      }
    }
    this.plugins.clear();
  }
}

/**
 * Base plugin class with common functionality
 */
export abstract class BasePlugin implements IMcpPlugin {
  abstract name: string;
  abstract version: string;
  description?: string;

  protected context?: IToolRegistrationContext;

  async initialize(context: IToolRegistrationContext): Promise<void> {
    this.context = context;
    await this.onInitialize();
  }

  async destroy(): Promise<void> {
    await this.onDestroy();
    this.context = undefined;
  }

  /**
   * Override this method to implement plugin initialization
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Override this method to implement plugin cleanup
   */
  protected onDestroy(): Promise<void> {
    // Default implementation does nothing
    return Promise.resolve();
  }

  /**
   * Get the server instance
   */
  protected get server(): McpServer {
    if (!this.context) {
      throw new Error('Plugin not initialized');
    }
    return this.context.server;
  }

  /**
   * Get the catalog client
   */
  protected get catalogClient(): IBackstageCatalogApi {
    if (!this.context) {
      throw new Error('Plugin not initialized');
    }
    return this.context.catalogClient;
  }

  /**
   * Get the backstage catalog API
   */
  protected get backstageCatalogApi(): IBackstageCatalogApi {
    if (!this.context) {
      throw new Error('Plugin not initialized');
    }
    return this.context.catalogClient;
  }
}
