import { buildClientSchema, GraphQLObjectType, GraphQLSchema, IntrospectionQuery } from 'graphql'

import { generateQueries, generateMutations, generateSubscriptions } from './generateAllOperations'
import * as types from './types'
export default function generate(
  schemaDocument: IntrospectionQuery,
  maxDepth: number
): types.GQLAllOperations {
  try {
    const schemaDoc: GraphQLSchema = buildClientSchema(schemaDocument)
    const queryTypes: GraphQLObjectType = schemaDoc.getQueryType()
    const mutationType: GraphQLObjectType = schemaDoc.getMutationType()
    const subscriptionType: GraphQLObjectType = schemaDoc.getSubscriptionType()
    const queries = generateQueries(queryTypes, schemaDoc, maxDepth) || []
    const mutations = generateMutations(mutationType, schemaDoc, maxDepth) || []
    const subscriptions = generateSubscriptions(subscriptionType, schemaDoc, maxDepth) || []
    return { queries, mutations, subscriptions }
  } catch (e) {
    throw new Error('GraphQL schema file should contain a valid GraphQL introspection query result')
  }
}
