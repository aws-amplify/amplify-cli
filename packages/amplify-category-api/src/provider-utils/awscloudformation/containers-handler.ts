import { serviceMetadataFor } from './utils/dynamic-imports';
import fs from 'fs-extra';
import path from 'path';
import { EcsStack } from './ecs-stack';
import { ServiceConfiguration } from './service-walkthroughs/containers-walkthrough';
import { containerFiles } from './container-artifacts';
import { prepareApp } from "@aws-cdk/core/lib/private/prepare-app";
import { provider } from './aws-constants';

export const addResource = async (serviceWalkthroughPromise: Promise<ServiceConfiguration>, context, category, service, options) => {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const walkthroughOptions = await serviceWalkthroughPromise;

    const { resourceName, authName, imageTemplate, githubPath, githubToken, deploymentMechanism } = walkthroughOptions;

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

    options = { 
        resourceName, 
        dependsOn, 
        ...walkthroughOptions, 
        build: true,
        providerPlugin: 'awscloudformation',
        service: 'ElasticContainer'
    };
    
    // TODO: only if required
    const authFullName = `auth${authName}UserPoolId`; 

    const deploymentBucket = `${context.amplify.getProjectMeta().providers[provider].DeploymentBucketName}`;

    // TODO: create secret in Secrets Manager
    const tokenSecretArn = 'arn:aws:secretsmanager:us-west-2:660457156595:secret:github-access-token-wB6AcW'; 
    const stack = new EcsStack(undefined, "ContainersStack", {
        apiName: resourceName,
        containerPort: 8080,
        authFullName,
        githubSourceActionInfo: githubPath && { path: githubPath, tokenSecretArn},
        deploymentMechanism,
        deploymentBucket
    });

    prepareApp(stack);

    const cfn = (stack as any)._toCloudFormation();

    Object.keys(cfn.Parameters).forEach(k => {
        if(k.startsWith('AssetParameters')) {
          let value = '';
          
          if(k.includes('Bucket')) {
            value = deploymentBucket;
          } else if (k.includes('VersionKey')) {
            value = 'custom-resource-pipeline-awaiter.zip||';
          }
    
          cfn.Parameters[k].Default = value;
        }
      });

    // TODO: Add this output to stack
    // containerTemplate['Outputs']['ApiName']['Value'] = resourceName;

    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);

    fs.ensureDirSync(resourceDirPath);
    fs.ensureDirSync(path.join(resourceDirPath, 'src'));

    Object.entries(containerFiles).forEach(([fileName, fileContents]) => {
        fs.writeFileSync(path.join(resourceDirPath, 'src', fileName), fileContents);
      });  

    const cfnFileName = `${resourceName}-cloudformation-template.json`;
    fs.writeFileSync(path.join(resourceDirPath, cfnFileName), JSON.stringify(cfn, null, 2));

    context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);

    return resourceName;
}