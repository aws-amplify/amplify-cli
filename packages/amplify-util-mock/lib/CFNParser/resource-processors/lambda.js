"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lambdaEventSourceHandler = exports.lambdaFunctionHandler = void 0;
const field_parser_1 = require("../field-parser");
const lambdaFunctionHandler = (resourceName, resource, cfnContext) => {
    var _a, _b, _c;
    const name = (0, field_parser_1.parseValue)((_a = resource.Properties.FunctionName) !== null && _a !== void 0 ? _a : resourceName, cfnContext);
    const handler = (0, field_parser_1.parseValue)(resource.Properties.Handler, cfnContext);
    const cfnEnvVars = ((_c = (_b = resource === null || resource === void 0 ? void 0 : resource.Properties) === null || _b === void 0 ? void 0 : _b.Environment) === null || _c === void 0 ? void 0 : _c.Variables) || {};
    const environment = Object.entries(cfnEnvVars).reduce((acc, [varName, varVal]) => ({
        ...acc,
        [varName]: (0, field_parser_1.parseValue)(varVal, cfnContext),
    }), {});
    return {
        cfnExposedAttributes: { Arn: 'arn' },
        arn: `arn:aws:lambda:{aws-region}:{aws-account-number}:function/${name}/LATEST`,
        ref: `arn:aws:lambda:{aws-region}:{aws-account-number}:function/${name}/LATEST`,
        name,
        handler,
        environment,
    };
};
exports.lambdaFunctionHandler = lambdaFunctionHandler;
const lambdaEventSourceHandler = (resourceName, resource, cfnContext) => {
    const batchSize = (0, field_parser_1.parseValue)(resource.Properties.BatchSize, cfnContext);
    const eventSourceArn = (0, field_parser_1.parseValue)(resource.Properties.EventSourceArn, cfnContext);
    const functionName = (0, field_parser_1.parseValue)(resource.Properties.FunctionName, cfnContext);
    const startingPosition = (0, field_parser_1.parseValue)(resource.Properties.StartingPosition, cfnContext);
    return {
        cfnExposedAttributes: {},
        batchSize,
        eventSourceArn,
        functionName,
        startingPosition,
    };
};
exports.lambdaEventSourceHandler = lambdaEventSourceHandler;
//# sourceMappingURL=lambda.js.map