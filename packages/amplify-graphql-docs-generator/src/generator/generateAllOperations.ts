import { GraphQLObjectType, GraphQLSchema } from 'graphql'
const pascalCase = require('pascal-case')

import generateOperation from './generateOperation'
import { GQLTemplateOp, GQLOperationTypeEnum } from './types'

export function generateQueries(
  queries: GraphQLObjectType,
  schema: GraphQLSchema,
  maxDepth: number
): Array<GQLTemplateOp> | undefined {
  if (queries) {
    const allQueries = queries.getFields()
    const processedQueries: Array<GQLTemplateOp> = Object.keys(allQueries).map((queryName) => {
      const type: GQLOperationTypeEnum = GQLOperationTypeEnum.QUERY
      const op = generateOperation(allQueries[queryName], schema, maxDepth)
      const name: string = pascalCase(queryName)
      return { type, name, ...op }
    })
    return processedQueries
  }
}

export function generateMutations(
  mutations: GraphQLObjectType,
  schema: GraphQLSchema,
  maxDepth: number
): Array<any> {
  if (mutations) {
    const allMutations = mutations.getFields()
    const processedMutations = Object.keys(allMutations).map((mutationName) => {
      const type: GQLOperationTypeEnum = GQLOperationTypeEnum.MUTATION
      const op = generateOperation(allMutations[mutationName], schema, maxDepth)
      const name = pascalCase(mutationName)
      return { type, name, ...op }
    })
    return processedMutations
  }
}

export function generateSubscriptions(
  subscriptions: GraphQLObjectType,
  schema: GraphQLSchema,
  maxDepth: number
): Array<any> {
  if (subscriptions) {
    const allSubscriptions = subscriptions.getFields()
    const processedMutations = Object.keys(allSubscriptions).map((subscriptionName) => {
      const type: GQLOperationTypeEnum = GQLOperationTypeEnum.SUBSCRIPTION
      const op = generateOperation(allSubscriptions[subscriptionName], schema, maxDepth)
      const name = pascalCase(subscriptionName)
      return { type, name, ...op }
    })
    return processedMutations
  }
}
