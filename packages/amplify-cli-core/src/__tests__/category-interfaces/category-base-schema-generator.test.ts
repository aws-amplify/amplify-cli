import * as path from 'path';
import { $TSContext, CLIInputSchemaValidator } from '../..';

const mockContext: $TSContext = {
  amplify: {
    getCategoryPluginInfo: jest.fn(),
  },
  parameters: {
    options: {},
  },
} as unknown as $TSContext;
const mockGetCategoryPluginInfo = mockContext.amplify.getCategoryPluginInfo as jest.MockedFunction<
  $TSContext['amplify']['getCategoryPluginInfo']
>;

describe('CLIInputSchemaValidator', () => {
  it('getUserInputSchema returns user input schema', async () => {
    mockGetCategoryPluginInfo.mockImplementation(() => ({
      packageLocation: path.join(__dirname, 'mock-plugin', 'custom-override-plugin'),
    }));
    const validator = new CLIInputSchemaValidator(mockContext, 'customService', 'customOverride', 'customOverrideCLIInputs');
    expect(await validator.getUserInputSchema()).toEqual({
      type: 'object',
      default: {
        type: 'object',
        properties: {
          version: {
            description: 'The schema version.',
            type: 'number',
            enum: [1],
          },
          param1: {
            type: 'string',
          },
        },
        required: ['param1', 'version'],
        $schema: 'http://json-schema.org/draft-07/schema#',
      },
      properties: {
        version: {
          description: 'The schema version.',
          type: 'number',
          enum: [1],
        },
        param1: {
          type: 'string',
        },
      },
      required: ['param1', 'version'],
      $schema: 'http://json-schema.org/draft-07/schema#',
    });
  });

  it('getUserInputSchema throws error when no schema file exists', async () => {
    mockGetCategoryPluginInfo.mockImplementation(() => ({
      packageLocation: path.join(__dirname, 'mock-plugin', 'custom-override-plugin'),
    }));
    const validator = new CLIInputSchemaValidator(mockContext, 'customService', 'customOverride', 'invalid');
    await expect(validator.getUserInputSchema()).rejects.toThrow("Schema definition doesn't exist");
  });

  it('validateInput returns true when userInput is valid', async () => {
    mockGetCategoryPluginInfo.mockImplementation(() => ({
      packageLocation: path.join(__dirname, 'mock-plugin', 'custom-override-plugin'),
    }));
    const validator = new CLIInputSchemaValidator(mockContext, 'customService', 'customOverride', 'customOverrideCLIInputs');
    await expect(
      validator.validateInput(
        JSON.stringify({
          version: 1,
          param1: 'value1',
        }),
      ),
    ).resolves.toBe(true);
  });

  it('validateInput throws error when userInput is invalid', async () => {
    mockGetCategoryPluginInfo.mockImplementation(() => ({
      packageLocation: path.join(__dirname, 'mock-plugin', 'custom-override-plugin'),
    }));
    const validator = new CLIInputSchemaValidator(mockContext, 'customService', 'customOverride', 'customOverrideCLIInputs');
    await expect(
      validator.validateInput(
        JSON.stringify({
          version: 1,
        }),
      ),
    ).rejects.toThrow('Data did not validate against the supplied schema.');
  });
});
