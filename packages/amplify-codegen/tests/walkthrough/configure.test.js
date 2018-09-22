const selectProject = require('../../src/walkthrough/questions/selectProject');
const askCodegenTargetLanguage = require('../../src/walkthrough/questions/languageTarget');
const askCodegneQueryFilePattern = require('../../src/walkthrough/questions/queryFilePattern');
const askGeneratedFileName = require('../../src/walkthrough/questions/generatedFileName');
const configure = require('../../src/walkthrough/configure');

jest.mock('../../src/walkthrough/questions/selectProject');
jest.mock('../../src/walkthrough/questions/languageTarget');
jest.mock('../../src/walkthrough/questions/queryFilePattern');
jest.mock('../../src/walkthrough/questions/generatedFileName');
jest.mock('../../src/utils');

describe('configure walk-through', () => {
  const mockAPI = 'two';
  const mockTargetLanguage = 'MOCK_TARGET_LANGUAGE';
  const mockIncludes = 'MOCK_INCLUDE_PATTERN';
  const mockContext = 'MOCK_CONTEXT';
  const mockGeneratedFileName = 'MOCK_FILE_NAME.ts';
  const mockConfigs = [
    {
      projectName: 'One',
      includes: ['one/**/*.gql', 'one/**/*.graohql'],
      amplifyExtension: {
        graphQLApiId: 'one',
        generatedFileName: 'one-1.ts',
        codeGenTarget: 'language-one',
      },
    },
    {
      projectName: 'Two',
      includes: ['two/**/*.gql', 'two/**/*.graohql'],
      amplifyExtension: {
        graphQLApiId: 'two',

        generatedFileName: 'two-2.ts',
        codeGenTarget: 'language-two',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    selectProject.mockReturnValue(mockAPI);
    askCodegenTargetLanguage.mockReturnValue(mockTargetLanguage);
    askCodegneQueryFilePattern.mockReturnValue(mockIncludes);
    askGeneratedFileName.mockReturnValue(mockGeneratedFileName);
  });

  it('should pass the available list of AppSync APIs', async () => {
    const results = await configure(mockContext, mockConfigs);
    const mockProjectSelect = [
      {
        name: mockConfigs[0].projectName,
        value: mockConfigs[0].amplifyExtension.graphQLApiId,
      },
      {
        name: mockConfigs[1].projectName,
        value: mockConfigs[1].amplifyExtension.graphQLApiId,
      },
    ];
    expect(selectProject).toHaveBeenCalledWith(mockContext, mockProjectSelect);
    expect(askCodegenTargetLanguage).toHaveBeenCalledWith(
      mockContext,
      mockConfigs[1].amplifyExtension.codeGenTarget,
    );
    expect(askCodegneQueryFilePattern).toHaveBeenCalledWith(mockConfigs[1].includes);
    expect(askGeneratedFileName).toHaveBeenCalledWith(
      mockConfigs[1].amplifyExtension.generatedFileName,
      mockTargetLanguage,
    );
    expect(results).toEqual({
      projectName: mockConfigs[1].projectName,
      includes: mockIncludes,
      amplifyExtension: {
        graphQLApiId: mockConfigs[1].amplifyExtension.graphQLApiId,
        generatedFileName: mockGeneratedFileName,
        codeGenTarget: mockTargetLanguage,
      },
    });
  });
});
