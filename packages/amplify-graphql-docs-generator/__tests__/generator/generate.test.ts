import generate from '../../src/generator/generate'
import {
  generateQueries,
  generateMutations,
  generateSubscriptions,
} from '../../src/generator/generateAllOperations'
import { buildClientSchema } from 'graphql'
import { GQLDocsGenOptions } from '../../src/generator/types'

jest.mock('../../src/generator/generateAllOperations')
jest.mock('graphql')
describe('generate', () => {
  const getQueryType = jest.fn()
  const getMutationType = jest.fn()
  const getSubscriptionType = jest.fn()

  const mockSchema = {
    getQueryType,
    getMutationType,
    getSubscriptionType,
  }
  const maxDepth = 4
  const generateOption: GQLDocsGenOptions = { useExternalFragmentForS3Object: true }
  beforeEach(() => {
    jest.resetAllMocks()
    getQueryType.mockReturnValue('QUERY_TYPE')
    getMutationType.mockReturnValue('MUTATION_TYPE')
    getSubscriptionType.mockReturnValue('SUBSCRIPTION_TYPE')

    buildClientSchema.mockReturnValue(mockSchema)
    generateQueries.mockReturnValue('MOCK_GENERATED_QUERY')
    generateMutations.mockReturnValue('MOCK_GENERATED_MUTATION')
    generateSubscriptions.mockReturnValue('MOCK_GENERATED_SUBSCRIPTION')
  })

  it('should generate operations using the helper methods', () => {
    generate(mockSchema, maxDepth, generateOption)
    expect(generateQueries).toHaveBeenCalledWith(
      mockSchema.getQueryType(),
      mockSchema,
      maxDepth,
      generateOption
    )
    expect(generateMutations).toHaveBeenCalledWith(
      mockSchema.getMutationType(),
      mockSchema,
      maxDepth,
      generateOption
    )
    expect(generateSubscriptions).toHaveBeenCalledWith(
      mockSchema.getSubscriptionType(),
      mockSchema,
      maxDepth,
      generateOption
    )
  })

  it('should call the individual operation generator and return the value from them', () => {
    expect(generate(mockSchema, maxDepth, generateOption)).toEqual({
      queries: 'MOCK_GENERATED_QUERY',
      subscriptions: 'MOCK_GENERATED_SUBSCRIPTION',
      mutations: 'MOCK_GENERATED_MUTATION',
    })
  })
})
