import { GraphQLObjectType, GraphQLSchema } from "graphql";
const pascalCase = require("pascal-case");

import { generateOperation } from "./generateOperation";
import { GQLTemplateOp, GQLOperationTypeEnum } from "./types";

export function generateQueries(queries: GraphQLObjectType, schema: GraphQLSchema): Array<GQLTemplateOp> | undefined {
  if (queries) {
    const allQueries = queries.getFields();
    const processedQueries: Array<GQLTemplateOp> = Object.keys(allQueries).map(queryName => {
      const type: GQLOperationTypeEnum = GQLOperationTypeEnum.QUERY;
      const op = generateOperation(allQueries[queryName], schema);
      const name: string = pascalCase(queryName);
      return { type, name, ...op };
    });
    return processedQueries;
  }
}

export function generateMutations(mutations: GraphQLObjectType, schema: GraphQLSchema): Array<any> {
  if (mutations) {
    const allMutations = mutations.getFields();
    const processedMutations = Object.keys(allMutations).map(mutationName => {
      const type = "mutation";
      const op = generateOperation(allMutations[mutationName], schema);
      const name = pascalCase(mutationName);
      return { type, name, ...op };
    });
    return processedMutations;
  }
}

export function generateSubscriptions(subscriptions: GraphQLObjectType, schema: GraphQLSchema): Array<any> {
  if (subscriptions) {
    const allSubscriptions = subscriptions.getFields();
    const processedMutations = Object.keys(allSubscriptions).map(subscriptionName => {
      const type = "subscription";
      const op = generateOperation(allSubscriptions[subscriptionName], schema);
      const name = pascalCase(subscriptionName);
      return { type, name, ...op };
    });
    return processedMutations;
  }
}