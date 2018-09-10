import generate from '../../src/generator/generate'
import {
  generateQueries,
  generateMutations,
  generateSubscriptions,
} from '../../src/generator/generateAllOperations'
import { buildClientSchema } from 'graphql'

jest.mock('../../src/generator/generateAllOperations')
jest.mock('graphql')
describe('generate', () => {
  const MOCK_SCHEMA_DOC = 'MOCK_SCHEMA_DOC'
  const getQueryType = jest.fn()
  const getMutationType = jest.fn()
  const getSubscriptionType = jest.fn()

  const mockSchema = {
    getQueryType,
    getMutationType,
    getSubscriptionType,
  }
  const maxDepth = 4

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

  it('should build the client schema from schema document', () => {
    generate(MOCK_SCHEMA_DOC)
    expect(buildClientSchema).toHaveBeenCalledWith(MOCK_SCHEMA_DOC)
  })

  it('should generate operations using the helper methods', () => {
    generate(MOCK_SCHEMA_DOC, maxDepth)
    expect(generateQueries).toHaveBeenCalledWith(mockSchema.getQueryType(), mockSchema, maxDepth)
    expect(generateMutations).toHaveBeenCalledWith(
      mockSchema.getMutationType(),
      mockSchema,
      maxDepth
    )
    expect(generateSubscriptions).toHaveBeenCalledWith(
      mockSchema.getSubscriptionType(),
      mockSchema,
      maxDepth
    )
  })

  it('should call the individual operation gnerator and return the value from them', () => {
    expect(generate(MOCK_SCHEMA_DOC)).toEqual({
      queries: 'MOCK_GENERATED_QUERY',
      subscriptions: 'MOCK_GENERATED_SUBSCRIPTION',
      mutations: 'MOCK_GENERATED_MUTATION',
    })
  })
})
