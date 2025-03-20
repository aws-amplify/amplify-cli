import { generateCommandFailureHandler } from './error_handler';
import { createMainParser } from './main_parser_factory';
import { version } from '../package.json';
import { printer } from './printer';

jest.mock('./printer.ts');
jest.mock('./format', () => ({
  format: {
    error: jest.fn((message) => message),
    command: jest.fn((command) => command),
    highlight: jest.fn((command) => command),
    success: jest.fn((message) => message)
  }
}));

jest.mock('yargs', () => {
  const mockYargsInstance = {
    version: jest.fn().mockReturnThis(),
    options: jest.fn().mockReturnThis(),
    strict: jest.fn().mockReturnThis(),
    command: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    demandCommand: jest.fn().mockReturnThis(),
    strictCommands: jest.fn().mockReturnThis(),
    recommendCommands: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    showHelp: jest.fn(),
  };

  return jest.fn(() => mockYargsInstance);
});

describe('Error handler tests', () => {
  let errorHandler: (message: string, error: Error, debug?: boolean) => Promise<void>;
  beforeAll(() => {
    const parser = createMainParser(version);
    errorHandler = generateCommandFailureHandler(parser);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should print error without debug flag', async () => {
    const printSpy = jest.spyOn(printer, 'print');
    const message = 'Unauthorized';
    const error = new Error('Unauthorized');
    expect.assertions(3);
    try {
      await errorHandler(message, error);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(printSpy).toBeCalledTimes(1);
      expect(printSpy).toBeCalledWith(message);
    }
  });

  it('should print error with debug flag', async () => {
    const printSpy = jest.spyOn(printer, 'print');
    const message = 'Unauthorized';
    const error = new Error('Unauthorized');
    expect.assertions(4);
    try {
      await errorHandler(message, error, true);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(printSpy).toBeCalledTimes(2);
      expect(printSpy).toHaveBeenNthCalledWith(1, message);
      expect(printSpy.mock.calls[1][0]).toContain('at Promise');
    }
  });
});
