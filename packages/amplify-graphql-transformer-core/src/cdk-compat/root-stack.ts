import { CfnElement, Stack, CfnResource, ISynthesisSession } from '@aws-cdk/core';

export class TransformerRootStack extends Stack {
  private readonly resoureTypeWithLogicalName: string[] = [
    'AWS::DynamoDB::Table',
    'AWS::Elasticsearch::Domain',
    'AWS::RDS::DBCluster',
    'AWS::CloudFormation::Stack',
  ];

  /**
   * Allocate logical id based on the resource presense in the stack mapping. If an resource is already
   * created using older version of the transformer, then keep the name the same. Otherwiser use the CDK
   * stack naming convention to avoid logical name collision
   * @param cfnElement
   */

  protected allocateLogicalId = (cfnElement: CfnElement): string => {
    const regExPattern = /[^A-Za-z0-9]/g;
    if (cfnElement instanceof CfnResource && this.resoureTypeWithLogicalName.includes(cfnElement.cfnResourceType)) {
      // Each L2 Construct creates a lower level CFN socpe with name Resource. We want to get the id of the parent scope
      const scope = cfnElement.node.scopes.reverse().find(scope => scope.node.id !== 'Resource');
      if (scope) {
        const logicalId = scope.node.id.replace('.NestedStackResource', '');
        // if the id contains non alphanumeric char, fallback to CDK resource naming
        if (!regExPattern.test(logicalId)) return logicalId;
      }
    }

    return super.allocateLogicalId(cfnElement);
  };

  /**
   * GraphQL transformer keeps the generated resources in memory and passes it to Amplify CLI. Updating the logic
   * of stack sythesize to support that.
   * @param session
   */
  public renderCloudFormationTemplate = (_: ISynthesisSession): string => {
    return JSON.stringify((this as any)._toCloudFormation(), undefined, 2);
  };
}
