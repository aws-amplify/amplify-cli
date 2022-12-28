import { GraphQLFieldMap, GraphQLSchema } from 'graphql';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { AmplifyAppSyncSimulator } from '../..';

const directiveName = 'aws_subscribe';
export const getAwsSubscribeDirective = () => `directive @${directiveName}(mutations: [String!]) on FIELD_DEFINITION`;

export const getAwsSubscribeDirectiveTransformer = (
  simulatorContext: AmplifyAppSyncSimulator,
): ((schema: GraphQLSchema) => GraphQLSchema) => {
  return schema => {
    return mapSchema(schema, {
      [MapperKind.MUTATION_ROOT_FIELD]: mutation => {
        const allSubscriptions = schema.getSubscriptionType()?.getFields();
        const subscriptions = getSubscriberForMutation(schema, allSubscriptions || {}, mutation.astNode?.name.value);
        if (subscriptions.length) {
          const resolve = mutation.resolve;
          const newResolver = async (parent, args, context, info) => {
            const result = await resolve(parent, args, context, info);
            subscriptions.forEach(subscriptionName => {
              simulatorContext.pubsub.publish(subscriptionName, result);
            });
            return result;
          };
          mutation.resolve = newResolver;
        }
        return mutation;
      },
    });
  };
};

const getSubscriberForMutation = (schema: GraphQLSchema, subscriptions: GraphQLFieldMap<any, any>, mutation: string) => {
  return Object.entries(subscriptions)
    .map(([subscriptionName, node]) => {
      const subscriptionDirective = getDirective(schema, node, 'aws_subscribe')?.[0];
      if (subscriptionDirective) {
        const { mutations } = subscriptionDirective;
        if (mutations.includes(mutation)) {
          return subscriptionName;
        }
      }
      return undefined;
    })
    .filter(Boolean);
};
