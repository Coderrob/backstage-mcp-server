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
