import fs from 'fs-extra';
import path from 'path';
import { ServiceConfiguration } from './service-walkthroughs/containers-walkthrough';
import { containerFiles } from './container-artifacts';

export const addResource = async (serviceWalkthroughPromise: Promise<ServiceConfiguration>, context, category, service, options) => {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const walkthroughOptions = await serviceWalkthroughPromise;

  const { resourceName, authName, imageTemplate, githubPath, githubToken, deploymentMechanism } = walkthroughOptions;
  const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);

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
        "SubnetIds",
        "VpcLinkId",
        "CloudMapNamespaceId"
      ]
    });

  // TODO: conditional, depends on access !== public
  dependsOn.push(
    {
      "category": "auth",
      "resourceName": authName,
      "attributes": [
        "UserPoolId",
        "AppClientIDWeb"
      ]
    });

  const githubTokenSecretArn = 'arn:aws:secretsmanager:us-west-2:660457156595:secret:github-access-token-wB6AcW';

  options = {
    resourceName,
    dependsOn,
    ...walkthroughOptions,
    build: true,
    providerPlugin: 'awscloudformation',
    service: 'ElasticContainer',
    githubInfo: {
      path: githubPath,
      tokenSecretArn: githubTokenSecretArn
    }
  };

  fs.ensureDirSync(resourceDirPath);
  fs.ensureDirSync(path.join(resourceDirPath, 'src'));

  Object.entries(containerFiles).forEach(([fileName, fileContents]) => {
    fs.writeFileSync(path.join(resourceDirPath, 'src', fileName), fileContents);
  });

  context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);

  return resourceName;
}