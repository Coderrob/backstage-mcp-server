import { jest } from '@jest/globals';

// Create typed mocks so mockResolvedValueOnce / mockRejectedValueOnce accept values.
const mockStartServer = jest.fn() as jest.MockedFunction<() => Promise<void>>;
const mockLoggerError = jest.fn() as jest.MockedFunction<(msg: string, meta?: unknown) => void>;
const mockIsError = jest.fn() as jest.MockedFunction<(e: unknown) => boolean>;

jest.unstable_mockModule('./server.js', () => ({
  startServer: mockStartServer,
}));

jest.unstable_mockModule('./utils/core/logger.js', () => ({
  logger: {
    error: mockLoggerError,
  },
}));

jest.unstable_mockModule('./utils/index.js', () => ({
  isError: mockIsError,
}));

describe('src/index main IIFE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules(); // ensure fresh module import for each test
  });

  it('starts the server successfully and does not log errors', async () => {
    mockStartServer.mockResolvedValueOnce(undefined);

    // Importing the ESM module triggers the IIFE
    await import('./index.js');

    expect(mockStartServer).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledTimes(0);
  });

  it('logs an Error object message and exits with code 1', async () => {
    const error = new Error('boom');
    mockStartServer.mockRejectedValueOnce(error);
    mockIsError.mockReturnValueOnce(true);

    // Spy on process.exit to prevent the test runner from exiting
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Importing the module should complete; exitSpy will have been called from the catch handler
    await import('./index.js');

    expect(mockStartServer).toHaveBeenCalledTimes(1);
    expect(mockIsError).toHaveBeenCalledWith(error);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith('Fatal server startup error', {
      error: error.message,
    });
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  it('logs a non-Error object and exits with code 1', async () => {
    const err = 'oh no';
    mockStartServer.mockRejectedValueOnce(err);
    mockIsError.mockReturnValueOnce(false);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await import('./index.js');

    expect(mockStartServer).toHaveBeenCalledTimes(1);
    expect(mockIsError).toHaveBeenCalledWith(err);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith('Fatal server startup error', {
      error: String(err),
    });
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
