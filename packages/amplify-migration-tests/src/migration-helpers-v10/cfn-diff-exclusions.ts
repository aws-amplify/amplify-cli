import { ExcludeFromCFNDiff } from '../migration-helpers/utils';

/**
 * Due to a known limitation of APIGateway, we do not want the AWS::ApiGateway::Deployment resource
 * from being compared in the CFN diff because it is regenerated whenever an amplify app is pulled down.
 * This would produce a false positive when checking for differences in the CFN templates of project1 & project2.
 * https://github.com/aws/aws-cdk/issues/8646#issuecomment-647561856
 *
 * AWS::ApiGateway::GatewayResponse is also excluded
 */
export const cfnDiffExclusions: ExcludeFromCFNDiff = (currentCategory: string, currentResourceKey: string, cfnTemplates: {
  project1: Record<string, unknown>;
  project2: Record<string, unknown>;
}) => {
  const excludeAPIGateWayDeploymentResource = (cfnTemplate: Record<string, unknown>): void => {
    const resources = cfnTemplate.Resources ?? {};
    const resourceKeys = Object.keys(resources);
    for(const key of resourceKeys){
      const resource = resources[key];
      if(resource.Type === 'AWS::ApiGateway::Deployment'
        || resource.Type === 'AWS::ApiGateway::GatewayResponse'
      ){
        delete resources[key];
      }
      if(resource.Type === 'AWS::AppSync::ApiKey' && resource.Properties){
        delete resource.Properties.Expires;
      }
    }
  }
  if(currentCategory === 'api'){
    excludeAPIGateWayDeploymentResource(cfnTemplates.project1);
    excludeAPIGateWayDeploymentResource(cfnTemplates.project2);
  }
  return { project1: cfnTemplates.project1, project2: cfnTemplates.project2 };
}
