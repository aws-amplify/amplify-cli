import * as cdk from '@aws-cdk/core';
interface PolicyDocument {
  [key: string]: any;
}

export const createPolicyDocumentForManagedPolicy = (resources: Set<string>) => {
  const policyDocuments = new Array<PolicyDocument>();
  let policyDocumentResources = new Array<string>();
  let resourceSize = 0;

  // 6144 bytes is the maximum policy payload size, but there is structural overhead, hence the 6000 bytes
  const MAX_BUILT_SIZE_BYTES = 6000;
  // The overhead is the amount of static policy arn contents like region, accountid, etc.
  // arn:aws:appsync:${AWS::Region}:${AWS::AccountId}:apis/${apiId}/types/${typeName}/fields/${fieldName}
  // 16              15             13                5    27       6     X+1         7      Y
  // 89 + 11 extra = 100
  const RESOURCE_OVERHEAD = 100;

  const createPolicyDocument = (newPolicyDocumentResources: Array<string>): PolicyDocument => {
    return {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['appsync:GraphQL'],
          Resource: newPolicyDocumentResources,
        },
      ],
    };
  };

  for (const resource of resources) {
    // We always have 2 parts, no need to check
    const [typeName, fieldName] = resource.split('/');

    if (fieldName !== 'null') {
      policyDocumentResources.push(
        cdk.Fn.sub('arn:aws:appsync:${AWS::Region}:${AWS::AccountId}:apis/${apiId}/types/${typeName}/fields/${fieldName}', {
          apiId: cdk.Fn.getAtt('GraphQLAPI', 'ApiId').toString(),
          typeName,
          fieldName,
        }).toString(),
      );
      resourceSize += RESOURCE_OVERHEAD + typeName.length + fieldName.length;
    } else {
      policyDocumentResources.push(
        cdk.Fn.sub('arn:aws:appsync:${AWS::Region}:${AWS::AccountId}:apis/${apiId}/types/${typeName}/*', {
          apiId: cdk.Fn.getAtt('GraphQLAPI', 'ApiId').toString(),
          typeName,
        }).toString(),
      );
      resourceSize = RESOURCE_OVERHEAD + typeName.length;
    }
    //
    // Check size of resource and if needed create a new one and clear the resources and
    // reset accumulated size
    //
    if (resourceSize > MAX_BUILT_SIZE_BYTES) {
      const policyDocument = createPolicyDocument(policyDocumentResources.slice(0, policyDocumentResources.length - 1));
      policyDocuments.push(policyDocument);
      // Remove all but the last item
      policyDocumentResources = policyDocumentResources.slice(-1);
      resourceSize = 0;
    }
  }
  if (policyDocumentResources.length > 0) {
    policyDocuments.push(createPolicyDocument(policyDocumentResources));
  }
  return policyDocuments;
};
