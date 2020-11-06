import { serviceMetadataFor } from './utils/dynamic-imports';
import fs from 'fs-extra';
import path from 'path';
import { EcsStack } from './ecs-stack';

export const addResource = async (serviceWalkthroughPromise: Promise<any>, context, category, service, options) => {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const walkthroughOptions = await serviceWalkthroughPromise;

    const { resourceName, containerName, authName } = walkthroughOptions;

    const dependsOn = [];

    // TODO: Find a place to put this
    // for now copied from NETWORK_STACK_LOGICAL_ID (amplify-provider-awscloudformation/src/network/stack.ts)
    const x = 'NetworkStack';
    dependsOn.push(
        {
            "category": "",
            "resourceName": x,
            "attributes": [
                "ClusterName",
                "VpcId",
                "SubnetIds"
            ]
        });

    // TODO: conditional, depends on access !== public
    dependsOn.push(
        {
            "category": "auth",
            "resourceName": authName,
            "attributes": [
                "UserPoolId"
            ]
        });

    dependsOn.push(
        {
            "category": "function",
            "resourceName": containerName,
            "attributes": [
                "TaskDefinitionArn"
            ]
        }
    )

    options = { resourceName, containerName, dependsOn, ...options };

    const authFullName = `auth${authName}UserPoolId`;
    const functionFullName = `function${containerName}TaskDefinitionArn`;

    const stack = new EcsStack(undefined, "ContainersStack", {
        apiName: resourceName,
        containerPort: 8080,
        authFullName,
        functionFullName,
    });
    const cfn = (stack as any)._toCloudFormation();

    // TODO: Add this output to stack
    // containerTemplate['Outputs']['ApiName']['Value'] = resourceName;

    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);

    fs.ensureDirSync(resourceDirPath);
    
    const cfnFileName = `${resourceName}-cloudformation-template.json`;
    fs.writeFileSync(path.join(resourceDirPath, cfnFileName), JSON.stringify(cfn, null, 2));

    context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);

    return resourceName;
}