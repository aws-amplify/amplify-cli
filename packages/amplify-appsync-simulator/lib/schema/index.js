"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResolvers = void 0;
const graphql_1 = require("graphql");
const schema_1 = require("@graphql-tools/schema");
const appsync_scalars_1 = require("./appsync-scalars");
const directives_1 = require("./directives");
function generateResolvers(schema, resolversConfig = [], simulatorContext) {
    const appSyncScalars = new graphql_1.Source(Object.keys(appsync_scalars_1.scalars)
        .map((scalar) => `scalar ${scalar}`)
        .join('\n'), 'AppSync-scalar.json');
    const documents = [schema, appSyncScalars, (0, directives_1.getDirectiveTypeDefs)()].map((s) => (0, graphql_1.parse)(s));
    const doc = (0, graphql_1.concatAST)([...documents]);
    const resolvers = resolversConfig.reduce((acc, resolverConfig) => {
        const typeObj = acc[resolverConfig.typeName] || {};
        const fieldName = resolverConfig.fieldName;
        const typeName = resolverConfig.typeName;
        typeObj[resolverConfig.fieldName] = {
            resolve: async (source, args, context, info) => {
                const resolver = simulatorContext.getResolver(resolverConfig.typeName, resolverConfig.fieldName);
                try {
                    if (typeName !== 'Subscription') {
                        const res = await resolver.resolve(source, args, context, info);
                        return res;
                    }
                    else if (!source) {
                        const res = await resolver.resolve(source, args, context, info);
                        return res;
                    }
                    return source;
                }
                catch (e) {
                    context.appsyncErrors.push(e);
                }
                return undefined;
            },
            ...(typeName === 'Subscription'
                ? {
                    subscribe: (source, args, context) => {
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
    }, { Subscription: {} });
    const defaultSubscriptions = generateDefaultSubscriptions(doc, resolversConfig, simulatorContext);
    if (Object.keys(defaultSubscriptions).length || Object.keys(resolvers.Subscription).length) {
        resolvers.Subscription = {
            ...defaultSubscriptions,
            ...resolvers.Subscription,
        };
    }
    else {
        delete resolvers.Subscription;
    }
    return (0, directives_1.transformSchemaWithDirectives)((0, schema_1.makeExecutableSchema)({
        typeDefs: doc,
        resolvers: {
            ...resolvers,
            ...appsync_scalars_1.scalars,
        },
    }), simulatorContext);
}
exports.generateResolvers = generateResolvers;
function generateDefaultSubscriptions(doc, configuredResolvers, simulatorContext) {
    const configuredSubscriptions = configuredResolvers.filter((cfg) => cfg.fieldName === 'Subscription').map((cfg) => cfg.typeName);
    const schema = (0, graphql_1.buildASTSchema)(doc);
    const subscriptionType = schema.getSubscriptionType();
    if (subscriptionType) {
        const f = schema.getType(subscriptionType.name);
        if (f) {
            const fields = f.getFields();
            return Object.keys(fields)
                .filter((sub) => !configuredSubscriptions.includes(sub))
                .reduce((acc, sub) => {
                const resolver = {
                    resolve: (data) => data,
                    subscribe: () => simulatorContext.asyncIterator(sub),
                };
                return { ...acc, [sub]: resolver };
            }, {});
        }
    }
    return {};
}
//# sourceMappingURL=index.js.map