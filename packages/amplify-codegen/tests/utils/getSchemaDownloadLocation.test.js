const { join, dirname } = require('path')

const getSchemaDownloadLocation = require('../../src/utils/getSchemaDownloadLocation')
const getAndroidResDir = require('../../src/utils/getAndroidResDir')

jest.mock('../../src/utils/getAndroidResDir')

let mockContext
const mockBackEndPath = 'MOCK_BACKEND_DIR'
const mockResDir = 'MOCK_RES_DIR/Res'
const mockAPIName = 'FooAPI'
const mockGetBackendDirPath = jest.fn()
describe('getSchemaDownloadLocation', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    mockGetBackendDirPath.mockReturnValue(mockBackEndPath)

    getAndroidResDir.mockImplementation(() => {
      throw new Error()
    })
    mockContext = {
      amplify: {
        pathManager: {
          getBackendDirPath: mockGetBackendDirPath,
        },
      },
    }
  })

  it('should use the backend api directory for schema', () => {
    const downloadLocation = getSchemaDownloadLocation(mockContext, mockAPIName)
    expect(downloadLocation).toEqual(join(mockBackEndPath, 'api', mockAPIName, 'schema.json'))
  })

  it('should use main directory in Android', () => {
    getAndroidResDir.mockReturnValue(mockResDir)
    const downloadLocation = getSchemaDownloadLocation(mockContext, mockAPIName)
    expect(downloadLocation).toEqual(join(dirname(mockResDir), 'graphql', 'schema.json'))
  })
})
