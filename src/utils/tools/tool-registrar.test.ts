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
import { jest } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { IBackstageCatalogApi } from '../../types/apis.js';
import { ITool, IToolMetadata, IToolRegistrationContext } from '../../types/tools.js';
import { logger } from '../core/logger.js';
import { DefaultToolRegistrar } from './tool-registrar.js';

// Mock modules first
jest.mock('../core/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Now import everything
describe('DefaultToolRegistrar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockServer: jest.Mocked<McpServer>;
  let mockContext: IToolRegistrationContext;
  let mockTool: jest.Mocked<ITool>;
  let registrar: DefaultToolRegistrar;

  beforeEach(() => {
    mockServer = {
      tool: jest.fn(),
    } as unknown as jest.Mocked<McpServer>;
    mockContext = {
      server: mockServer,
      catalogClient: {} as IBackstageCatalogApi,
    };
    mockTool = {
      execute: jest.fn(),
    };
    registrar = new DefaultToolRegistrar(mockContext);
  });

  describe('register', () => {
    it('should register tool with params schema', () => {
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
        paramsSchema: z.object({
          param1: z.string(),
        }),
      };

      registrar.register(mockTool, metadata);

      expect(mockServer.tool).toHaveBeenCalledWith('test-tool', 'Test tool', expect.any(Object), expect.any(Function));
    });

    it('should register tool without params schema', () => {
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
      };

      registrar.register(mockTool, metadata);

      expect(mockServer.tool).toHaveBeenCalledWith('test-tool', 'Test tool', {}, expect.any(Function));
    });

    it('should call tool execute with correct context', async () => {
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
      };
      const args = { param: 'value' };
      const extra = { extra: 'data' };
      const result = { content: [] };

      mockTool.execute.mockResolvedValue(result);

      registrar.register(mockTool, metadata);

      const toolFunction = mockServer.tool.mock.calls[0][3] as unknown as (
        args: unknown,
        extra: unknown
      ) => Promise<unknown>;
      const actualResult = await toolFunction(args, extra);

      expect(mockTool.execute).toHaveBeenCalledWith(args, {
        ...mockContext,
        extra,
      });
      expect(actualResult).toBe(result);
    });

    it('should handle registration errors', () => {
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
      };
      const error = new Error('Registration failed');
      mockServer.tool.mockImplementation(() => {
        throw error;
      });
      const loggerErrorSpy = jest.spyOn(logger, 'error');

      expect(() => registrar.register(mockTool, metadata)).toThrow('Registration failed');

      expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to register tool test-tool', { error });
    });
  });
});
