import { DefaultToolFactory } from './tool-factory';

describe('DefaultToolFactory', () => {
  let factory: DefaultToolFactory;

  beforeEach(() => {
    factory = new DefaultToolFactory();
  });

  describe('constructor', () => {
    it('should create an instance of DefaultToolFactory', () => {
      expect(factory).toBeInstanceOf(DefaultToolFactory);
    });
  });

  describe('loadTool', () => {
    it('should have a loadTool method', () => {
      expect(typeof factory.loadTool).toBe('function');
    });

    it('should return a Promise from loadTool', () => {
      const result = factory.loadTool('/some/path.ts');
      expect(result).toBeInstanceOf(Promise);
    });

    // Note: Testing the actual loading logic is complex due to dynamic imports
    // and Node.js module mocking. The core functionality is tested through
    // integration tests in tool-loader.test.ts
  });
});
