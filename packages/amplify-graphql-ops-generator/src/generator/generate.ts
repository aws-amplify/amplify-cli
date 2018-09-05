import { buildClientSchema, GraphQLObjectType, GraphQLSchema, IntrospectionQuery } from "graphql";

import { generateQueries, generateMutations, generateSubscriptions } from "./generateQueries";
import * as types from './types'
export default function generate(schemaDocument: IntrospectionQuery): types.GQLAllOperations {
  try {
    const schemaDoc: GraphQLSchema = buildClientSchema(schemaDocument);
    const queryTypes: GraphQLObjectType = schemaDoc.getQueryType();
    const mutationType: GraphQLObjectType = schemaDoc.getMutationType();
    const subscriptionType: GraphQLObjectType = schemaDoc.getSubscriptionType();
    const queries = generateQueries(queryTypes, schemaDoc) || [];
    const mutations = generateMutations(mutationType, schemaDoc) || [];
    const subscriptions = generateSubscriptions(subscriptionType, schemaDoc) || [];
    return {queries, mutations, subscriptions};
  } catch (e) {
    throw new Error("GraphQL schema file should contain a valid GraphQL introspection query result");
  }
}