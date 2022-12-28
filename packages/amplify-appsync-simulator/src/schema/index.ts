import { buildASTSchema, concatAST, DocumentNode, GraphQLObjectType, parse, Source } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorPipelineResolverConfig, AppSyncSimulatorUnitResolverConfig } from '../type-definition';
import { scalars } from './appsync-scalars';
import { getDirectiveTypeDefs, transformSchemaWithDirectives } from './directives';

export function generateResolvers(
  schema: Source,
  resolversConfig: (AppSyncSimulatorUnitResolverConfig | AppSyncSimulatorPipelineResolverConfig)[] = [],
  simulatorContext: AmplifyAppSyncSimulator,
) {
  const appSyncScalars = new Source(
    Object.keys(scalars)
      .map(scalar => `scalar ${scalar}`)
      .join('\n'),
    'AppSync-scalar.json',
  );

  const documents = [schema, appSyncScalars, getDirectiveTypeDefs()].map(s => parse(s));
  const doc = concatAST([...documents]);

  const resolvers = resolversConfig.reduce(
    (acc, resolverConfig) => {
      const typeObj = acc[resolverConfig.typeName] || {};
      const fieldName = resolverConfig.fieldName;
      const typeName = resolverConfig.typeName;
      typeObj[resolverConfig.fieldName] = {
        resolve: async (source, args, context, info) => {
          const resolver = simulatorContext.getResolver(resolverConfig.typeName, resolverConfig.fieldName);
          try {
            // Mutation and Query
            if (typeName !== 'Subscription') {
              const res = await resolver.resolve(source, args, context, info);
              return res;
            } else if (!source) {
              // Subscription at connect time
              const res = await resolver.resolve(source, args, context, info);
              return res;
            }
            // subscription at publish time. No filtering
            return source;
          } catch (e) {
            context.appsyncErrors.push(e);
          }
          return undefined;
        },
        ...(typeName === 'Subscription'
          ? {
              subscribe: (source, args, context, info) => {
                // Connect time error. Not allowing subscription
                if (context.appsyncErrors.length) {
                  throw new Error('Subscription failed');
                }
                return simulatorContext.asyncIterator(fieldName);
              },
            }
          : {}),
      };
      return {
        ...acc,
        [resolverConfig.typeName]: typeObj,
      };
    },
    { Subscription: {} },
  );
  const defaultSubscriptions = generateDefaultSubscriptions(doc, resolversConfig, simulatorContext);

  if (Object.keys(defaultSubscriptions).length || Object.keys(resolvers.Subscription).length) {
    resolvers.Subscription = {
      ...defaultSubscriptions,
      ...resolvers.Subscription,
    };
  } else {
    // When there are no subscriptions in the doc, don't include subscription resolvers
    delete resolvers.Subscription;
  }

  return transformSchemaWithDirectives(
    makeExecutableSchema({
      typeDefs: doc,
      resolvers: {
        ...resolvers,
        ...scalars,
      },
    }),
    simulatorContext,
  );
}

function generateDefaultSubscriptions(
  doc: DocumentNode,
  configuredResolvers: (AppSyncSimulatorUnitResolverConfig | AppSyncSimulatorPipelineResolverConfig)[],
  simulatorContext: AmplifyAppSyncSimulator,
) {
  const configuredSubscriptions = configuredResolvers.filter(cfg => cfg.fieldName === 'Subscription').map(cfg => cfg.typeName);
  const schema = buildASTSchema(doc);
  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType) {
    const f = schema.getType(subscriptionType.name) as GraphQLObjectType;
    if (f) {
      const fields = f.getFields();
      return Object.keys(fields)
        .filter(sub => !configuredSubscriptions.includes(sub))
        .reduce((acc, sub) => {
          const resolver = {
            resolve: data => data,
            subscribe: () => simulatorContext.asyncIterator(sub),
          };
          return { ...acc, [sub]: resolver };
        }, {});
    }
  }
  return {};
}
