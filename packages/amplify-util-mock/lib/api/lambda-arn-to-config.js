"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lambdaArnToConfig = void 0;
const lodash_1 = require("lodash");
const amplify_cli_core_1 = require("amplify-cli-core");
const _ = require("lodash");
const load_lambda_config_1 = require("../utils/lambda/load-lambda-config");
const lambdaArnToConfig = async (context, arn) => {
    const version = await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context);
    const documentLink = (0, amplify_cli_core_1.getGraphQLTransformerFunctionDocLink)(version);
    const errorSuffix = `\nSee ${documentLink} for information on how to configure Lambda resolvers.`;
    let searchString = '';
    if (typeof arn === 'string') {
        searchString = arn;
    }
    else if (typeof arn === 'object' && (0, lodash_1.keys)(arn).length === 1) {
        const value = arn['Fn::GetAtt'] || arn['Fn::Sub'];
        if (Array.isArray(value) && value.length > 0) {
            searchString = value[0];
        }
        else if (typeof value === 'string') {
            searchString = value;
        }
        else {
            throw new Error(`Malformed Lambda ARN [${JSON.stringify(arn)}]${errorSuffix}`);
        }
    }
    else {
        throw new Error(`Cannot interpret Lambda ARN [${JSON.stringify(arn)}]${errorSuffix}`);
    }
    const lambdaNames = _.entries(_.get(amplify_cli_core_1.stateManager.getMeta(), ['function']))
        .filter(([_, funcMeta]) => funcMeta.service === "Lambda")
        .map(([key]) => key);
    const foundLambdaName = lambdaNames.find((name) => searchString.includes(name));
    if (!foundLambdaName) {
        throw new Error(`Did not find a Lambda matching ARN [${JSON.stringify(arn)}] in the project. Local mocking only supports Lambdas that are configured in the project.${errorSuffix}`);
    }
    return (0, load_lambda_config_1.loadLambdaConfig)(context, foundLambdaName, true);
};
exports.lambdaArnToConfig = lambdaArnToConfig;
//# sourceMappingURL=lambda-arn-to-config.js.map