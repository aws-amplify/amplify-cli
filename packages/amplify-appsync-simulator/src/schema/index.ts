import { buildASTSchema, concatAST, DocumentNode, GraphQLObjectType, parse, Source } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';
import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorBaseResolverConfig } from '../type-definition';
import { scalars } from './appsync-scalars';
import { AwsAuth, AwsSubscribe, protectResolversWithAuthRules } from './directives';
import { AppSyncSimulatorDirectiveBase } from './directives/directive-base';
const KNOWN_DIRECTIVES: {
  name: string;
  visitor: typeof AppSyncSimulatorDirectiveBase;
}[] = [];

export function generateResolvers(
  schema: Source,
  resolversConfig: AppSyncSimulatorBaseResolverConfig[],
  simulatorContext: AmplifyAppSyncSimulator
) {
  const appSyncScalars = new Source(
    Object.keys(scalars)
      .map(scalar => `scalar ${scalar}`)
      .join('\n'),
    'AppSync-scalar.json'
  );

  const directives = KNOWN_DIRECTIVES.reduce((set, d) => {
    set.add(d.visitor);
    return set;
  }, new Set());

  const directiveAST = [];
  directives.forEach(d => {
    directiveAST.push(parse((d as any).typeDefinitions));
  });

  const documents = [schema, appSyncScalars].map(s => parse(s));
  const doc = concatAST([...documents, ...directiveAST]);

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
        },
        ...(typeName === 'Subscription'
          ? {
              subscribe: (source, args, context, info) => {
                // Connect time error. Not allowing subscription
                if (context.appsyncErrors.length) {
                  throw new Error('Subscription failed');
                }
                return simulatorContext.pubsub.asyncIterator(fieldName);
              },
            }
          : {}),
      };
      return {
        ...acc,
        [resolverConfig.typeName]: typeObj,
      };
    },
    { Subscription: {} }
  );
  const defaultSubscriptions = generateDefaultSubscriptions(doc, resolversConfig, simulatorContext);
  const schemaDirectives = KNOWN_DIRECTIVES.reduce((sum, d) => {
    d.visitor.simulatorContext = simulatorContext;
    return { ...sum, [d.name]: d.visitor };
  }, {});

  if (Object.keys(defaultSubscriptions).length || Object.keys(resolvers.Subscription).length) {
    resolvers.Subscription = {
      ...defaultSubscriptions,
      ...resolvers.Subscription,
    };
  } else {
    // When there are no subscriptions in the doc, don't include subscription resolvers
    delete resolvers.Subscription;
  }

  const resolverMapWithAuth = protectResolversWithAuthRules(doc, resolvers, simulatorContext);

  return makeExecutableSchema({
    typeDefs: doc,
    resolvers: resolverMapWithAuth,
    schemaDirectives,
  });
}

function generateDefaultSubscriptions(
  doc: DocumentNode,
  configuredResolvers: AppSyncSimulatorBaseResolverConfig[],
  simulatorContext: AmplifyAppSyncSimulator
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
            subscribe: () => simulatorContext.pubsub.asyncIterator(sub),
          };
          return { ...acc, [sub]: resolver };
        }, {});
    }
  }
  return {};
}

export function addDirective(name: string, visitor: typeof AppSyncSimulatorDirectiveBase) {
  KNOWN_DIRECTIVES.push({
    name,
    visitor,
  });
}

addDirective('aws_subscribe', AwsSubscribe);
addDirective('aws_api_key', AwsAuth);
addDirective('aws_oidc', AwsAuth);
addDirective('aws_cognito_user_pools', AwsAuth);
addDirective('aws_auth', AwsAuth);
