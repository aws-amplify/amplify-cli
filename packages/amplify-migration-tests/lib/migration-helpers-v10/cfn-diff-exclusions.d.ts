import { ExcludeFromCFNDiff } from '../migration-helpers/utils';
/**
 * Due to a known limitation of APIGateway, we do not want the AWS::ApiGateway::Deployment resource
 * from being compared in the CFN diff because it is regenerated whenever an amplify app is pulled down.
 * This would produce a false positive when checking for differences in the CFN templates of project1 & project2.
 * https://github.com/aws/aws-cdk/issues/8646#issuecomment-647561856
 *
 * AWS::ApiGateway::GatewayResponse is also excluded
 */
export declare const cfnDiffExclusions: ExcludeFromCFNDiff;
