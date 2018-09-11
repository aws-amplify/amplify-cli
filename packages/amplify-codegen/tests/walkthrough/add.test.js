const askAppSyncAPITarget = require('../../src/walkthrough/questions/apiTarget')
const askCodegenTargetLanguage = require('../../src/walkthrough/questions/languageTarget')
const askCodegneQueryFilePattern = require('../../src/walkthrough/questions/queryFilePattern')
const askGeneratedFileName = require('../../src/walkthrough/questions/generatedFileName')
const askGenerateCode = require('../../src/walkthrough/questions/generateCode')
const askShouldGenerateOps = require('../../src/walkthrough/questions/generateDocs')
const {
  getAppSyncAPIDetails,
  getSchemaDownloadLocation,
  getFrontEndHandler,
  getIncludePattern,
} = require('../../src/utils')
const add = require('../../src/walkthrough/add')
const { AmplifyCodeGenNoAppSyncAPIAvailableError } = require('../../src/errors')

jest.mock('../../src/walkthrough/questions/apiTarget')
jest.mock('../../src/walkthrough/questions/languageTarget')
jest.mock('../../src/walkthrough/questions/queryFilePattern')
jest.mock('../../src/walkthrough/questions/generatedFileName')
jest.mock('../../src/utils')
jest.mock('../../src/walkthrough/questions/generateCode')
jest.mock('../../src/walkthrough/questions/generateDocs')

describe('Add walk-through', () => {
  const mockAPI = 'two'
  const mockTargetLanguage = 'MOCK_TARGET_LANGUAGE'
  const mockIncludePattern = 'MOCK_INCLUDE_PATTERN'
  const mockContext = 'MOCK_CONTEXT'
  const mockGeneratedFileName = 'MOCK_FILE_NAME.ts'
  const mockDownloadLocation = 'MOCK_SCHEMA_DIR/graphql/schema.json'

  const mockAvailableApis = [
    {
      id: 'one',
      name: 'One',
    },
    {
      id: 'two',
      name: 'Two',
    },
  ]
  const mockConfigs = []

  beforeEach(() => {
    jest.clearAllMocks()
    askAppSyncAPITarget.mockReturnValue(mockAPI)
    askCodegenTargetLanguage.mockReturnValue(mockTargetLanguage)
    askGeneratedFileName.mockReturnValue(mockGeneratedFileName)
    getAppSyncAPIDetails.mockReturnValue(mockAvailableApis)
    askGenerateCode.mockReturnValue(true)
    askShouldGenerateOps.mockReturnValue(true)
    getSchemaDownloadLocation.mockReturnValue(mockDownloadLocation)
    askCodegneQueryFilePattern.mockReturnValue(mockIncludePattern)
    getFrontEndHandler.mockReturnValue('ios')
    getIncludePattern.mockReturnValue({ graphQLDirectory: 'src/graphql', graphQLExtension: '*.js' })
  })

  it('should show questions in walkthrough', async () => {
    const results = await add(mockContext, mockConfigs)
    expect(askAppSyncAPITarget).toHaveBeenCalledWith(mockContext, mockAvailableApis, null)
    expect(askCodegenTargetLanguage).toHaveBeenCalledWith(mockContext)
    expect(askCodegneQueryFilePattern).toHaveBeenCalledWith(['src/graphql/**/*.js'])
    expect(askGeneratedFileName).toHaveBeenCalledWith('API', mockTargetLanguage)
    expect(results).toEqual({
      api: mockAvailableApis[1],
      target: mockTargetLanguage,
      includePattern: mockIncludePattern,
      excludePattern: ['./amplify/**'],
      generatedFileName: mockGeneratedFileName,
      shouldGenerateCode: true,
      schemaLocation: mockDownloadLocation,
      docsFilePath: 'src/graphql',
      shouldGenerateDocs: true,
    })
  })

  it('should not ask code generation specific questions in android projects', async () => {
    getFrontEndHandler.mockReturnValue('android')
    const results = await add(mockContext, mockConfigs)
    expect(askAppSyncAPITarget).toHaveBeenCalledWith(mockContext, mockAvailableApis, null)
    expect(askCodegenTargetLanguage).not.toHaveBeenCalled()
    expect(askCodegneQueryFilePattern).toHaveBeenCalledWith(['src/graphql/**/*.js'])
    expect(askGeneratedFileName).not.toHaveBeenCalled()
    expect(results).toEqual({
      api: mockAvailableApis[1],
      target: '',
      includePattern: mockIncludePattern,
      excludePattern: ['./amplify/**'],
      generatedFileName: '',
      shouldGenerateCode: false,
      schemaLocation: mockDownloadLocation,
      docsFilePath: 'src/graphql',
      shouldGenerateDocs: true,
    })
  })

  it('should filter out already added AppSync API when asking for API target', async () => {
    const configs = [
      {
        amplifyExtension: {
          graphQLApiId: mockAvailableApis[0].id,
        },
      },
    ]
    await add(mockContext, configs)
    const filteredApiList = [mockAvailableApis[1]]
    expect(askAppSyncAPITarget).toHaveBeenCalledWith(mockContext, filteredApiList, null)
  })

  it('should thrown an error if there are no APIs available', async () => {
    getAppSyncAPIDetails.mockReturnValue([])
    await expect(add(mockContext, mockConfigs)).rejects.toBeInstanceOf(
      AmplifyCodeGenNoAppSyncAPIAvailableError,
    )
  })
})
