import generate from '../../src/generator/generate'
import {
  generateQueries,
  generateMutations,
  generateSubscriptions,
  collectExternalFragments
} from '../../src/generator/generateAllOperations'
import { buildClientSchema } from 'graphql'
import { GQLDocsGenOptions } from '../../src/generator/types'

jest.mock('../../src/generator/generateAllOperations')
jest.mock('graphql')
describe('generate', () => {
  const MOCK_SCHEMA_DOC = 'MOCK_SCHEMA_DOC'
  const getQueryType = jest.fn()
  const getMutationType = jest.fn()
  const getSubscriptionType = jest.fn()

  const MOCK_GENERATED_QUERY = ['MOCK_GENERATED_QUERY'];
  const MOCK_GENERATED_MUTATION = ['MOCK_GENERATED_MUTATION']
  const MOCK_GENERATED_SUBSCRIPTION = ['MOCK_GENERATED_SUBSCRIPTION']
  const MOCK_GENERATED_FRAGMENTS = ['MOCK_GENERATED_FRAGMENT'];
  const mockSchema = {
    getQueryType,
    getMutationType,
    getSubscriptionType,
  }
  const maxDepth = 4
  const generateOption: GQLDocsGenOptions = { useExternalFragmentForS3Object: false }
  beforeEach(() => {
    jest.resetAllMocks()
    getQueryType.mockReturnValue('QUERY_TYPE')
    getMutationType.mockReturnValue('MUTATION_TYPE')
    getSubscriptionType.mockReturnValue('SUBSCRIPTION_TYPE')

    buildClientSchema.mockReturnValue(mockSchema)
    generateQueries.mockReturnValue(MOCK_GENERATED_QUERY)
    generateMutations.mockReturnValue(MOCK_GENERATED_MUTATION)
    generateSubscriptions.mockReturnValue(MOCK_GENERATED_SUBSCRIPTION)
    collectExternalFragments.mockReturnValue(MOCK_GENERATED_FRAGMENTS)
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
    expect(collectExternalFragments).not.toHaveBeenCalled()
  })

  it('should call the individual operation generator and return the value from them', () => {
    expect(generate(mockSchema, maxDepth, generateOption)).toEqual({
      queries: MOCK_GENERATED_QUERY,
      subscriptions: MOCK_GENERATED_SUBSCRIPTION,
      mutations: MOCK_GENERATED_MUTATION,
      fragments: []
    })
  })

  it('should generate fragnents when useExternalFragmentForS3Object is passed', () => {
      expect(generate(mockSchema, maxDepth, { useExternalFragmentForS3Object: true })).toEqual({
      queries: MOCK_GENERATED_QUERY,
      subscriptions: MOCK_GENERATED_SUBSCRIPTION,
      mutations: MOCK_GENERATED_MUTATION,
      fragments: MOCK_GENERATED_FRAGMENTS,
    })
    expect(collectExternalFragments).toHaveBeenCalledWith([...MOCK_GENERATED_QUERY, ...MOCK_GENERATED_MUTATION, ...MOCK_GENERATED_SUBSCRIPTION ])
  })
})
