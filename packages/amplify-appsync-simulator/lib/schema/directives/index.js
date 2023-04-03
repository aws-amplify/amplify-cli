"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSchemaWithDirectives = exports.getDirectiveTypeDefs = void 0;
const auth_1 = require("./auth");
const aws_subscribe_1 = require("./aws-subscribe");
const getDirectiveTypeDefs = () => {
    return [(0, auth_1.getAuthDirectives)(), (0, aws_subscribe_1.getAwsSubscribeDirective)()].join('\n');
};
exports.getDirectiveTypeDefs = getDirectiveTypeDefs;
const transformSchemaWithDirectives = (schema, context) => {
    const authDirectiveTransformer = (0, auth_1.getAuthDirectiveTransformer)(context);
    const awsSubscribeDirectiveTransformer = (0, aws_subscribe_1.getAwsSubscribeDirectiveTransformer)(context);
    return authDirectiveTransformer(awsSubscribeDirectiveTransformer(schema));
};
exports.transformSchemaWithDirectives = transformSchemaWithDirectives;
//# sourceMappingURL=index.js.map