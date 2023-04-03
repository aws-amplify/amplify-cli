"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cfnDiffExclusions = void 0;
/**
 * Due to a known limitation of APIGateway, we do not want the AWS::ApiGateway::Deployment resource
 * from being compared in the CFN diff because it is regenerated whenever an amplify app is pulled down.
 * This would produce a false positive when checking for differences in the CFN templates of project1 & project2.
 * https://github.com/aws/aws-cdk/issues/8646#issuecomment-647561856
 *
 * AWS::ApiGateway::GatewayResponse is also excluded
 */
const cfnDiffExclusions = (currentCategory, currentResourceKey, cfnTemplates) => {
    const excludeAPIGateWayDeploymentResource = (cfnTemplate) => {
        var _a;
        const resources = (_a = cfnTemplate.Resources) !== null && _a !== void 0 ? _a : {};
        const resourceKeys = Object.keys(resources);
        for (const key of resourceKeys) {
            const resource = resources[key];
            if (resource.Type === 'AWS::ApiGateway::Deployment' || resource.Type === 'AWS::ApiGateway::GatewayResponse') {
                delete resources[key];
            }
            if (resource.Type === 'AWS::AppSync::ApiKey' && resource.Properties) {
                delete resource.Properties.Expires;
            }
        }
    };
    if (currentCategory === 'api') {
        excludeAPIGateWayDeploymentResource(cfnTemplates.project1);
        excludeAPIGateWayDeploymentResource(cfnTemplates.project2);
    }
    return { project1: cfnTemplates.project1, project2: cfnTemplates.project2 };
};
exports.cfnDiffExclusions = cfnDiffExclusions;
//# sourceMappingURL=cfn-diff-exclusions.js.map