"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAwsSubscribeDirectiveTransformer = exports.getAwsSubscribeDirective = void 0;
const utils_1 = require("@graphql-tools/utils");
const directiveName = 'aws_subscribe';
const getAwsSubscribeDirective = () => `directive @${directiveName}(mutations: [String!]) on FIELD_DEFINITION`;
exports.getAwsSubscribeDirective = getAwsSubscribeDirective;
const getAwsSubscribeDirectiveTransformer = (simulatorContext) => {
    return (schema) => {
        return (0, utils_1.mapSchema)(schema, {
            [utils_1.MapperKind.MUTATION_ROOT_FIELD]: (mutation) => {
                var _a, _b;
                const allSubscriptions = (_a = schema.getSubscriptionType()) === null || _a === void 0 ? void 0 : _a.getFields();
                const subscriptions = getSubscriberForMutation(schema, allSubscriptions || {}, (_b = mutation.astNode) === null || _b === void 0 ? void 0 : _b.name.value);
                if (subscriptions.length) {
                    const resolve = mutation.resolve;
                    const newResolver = async (parent, args, context, info) => {
                        const result = await resolve(parent, args, context, info);
                        await Promise.all(subscriptions.map(async (subscriptionName) => {
                            await simulatorContext.pubsub.publish(subscriptionName, result);
                        }));
                        return result;
                    };
                    mutation.resolve = newResolver;
                }
                return mutation;
            },
        });
    };
};
exports.getAwsSubscribeDirectiveTransformer = getAwsSubscribeDirectiveTransformer;
const getSubscriberForMutation = (schema, subscriptions, mutation) => {
    return Object.entries(subscriptions)
        .map(([subscriptionName, node]) => {
        var _a;
        const subscriptionDirective = (_a = (0, utils_1.getDirective)(schema, node, 'aws_subscribe')) === null || _a === void 0 ? void 0 : _a[0];
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
//# sourceMappingURL=aws-subscribe.js.map