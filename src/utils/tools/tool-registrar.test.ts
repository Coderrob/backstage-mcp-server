import { z } from 'zod';

import { IBackstageCatalogApi, ITool, IToolMetadata, IToolRegistrationContext } from '../../types';
import { logger } from '../core/logger';
import { DefaultToolRegistrar } from './tool-registrar';

jest.mock('../core/logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}));
jest.mock('../core/mapping', () => ({
  toZodRawShape: jest.fn(() => 'zodShape'),
}));

describe('DefaultToolRegistrar', () => {
  const mockTool: ITool = {
    execute: jest.fn(),
  };
  const mockServerTool = jest.fn();
  const mockServer = {
    tool: mockServerTool,
  } as unknown as IToolRegistrationContext['server'] & { tool: jest.Mock };
  const mockContext: IToolRegistrationContext = {
    server: mockServer,
    catalogClient: {} as unknown as IBackstageCatalogApi,
  };
  const toolMetadata: IToolMetadata = {
    name: 'testTool',
    description: 'A test tool',
    paramsSchema: z.object({ foo: z.string() }),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call logger.debug when registering', () => {
    const registrar = new DefaultToolRegistrar(mockContext);
    registrar.register(mockTool, toolMetadata);

    expect(logger.debug).toHaveBeenCalledWith('Registering tool: testTool');
    expect(logger.debug).toHaveBeenCalledWith('Tool registered successfully: testTool');
  });

  it('should call server.tool with correct arguments', async () => {
    const registrar = new DefaultToolRegistrar(mockContext);
    registrar.register(mockTool, toolMetadata);

    expect(mockServer.tool).toHaveBeenCalledWith('testTool', 'A test tool', 'zodShape', expect.any(Function));
  });

  it('should call toolClass.execute with correct arguments when handler is invoked', async () => {
    const registrar = new DefaultToolRegistrar(mockContext);
    registrar.register(mockTool, toolMetadata);

    const handler = mockServer.tool.mock.calls[0][3];
    const args = { a: 1 };
    const extra = { b: 2 };

    await handler(args, extra);

    expect(mockTool.execute).toHaveBeenCalledWith(args, { ...mockContext, extra });
  });
});
