import fs from 'fs-extra';
import extract from 'extract-zip';
import sequential from 'promise-sequential';
import { $TSContext, pathManager } from 'amplify-cli-core';
import { APIGateway } from './aws-utils/aws-apigw';

export async function downloadAPIModels(context: $TSContext, allResources) {
  const { amplify } = context;
  const projectConfig = amplify.getProjectConfig();

  const framework = projectConfig.frontend;

  if (framework === 'javascript') {
    return;
  }

  const resources = allResources.filter(resource => resource.service === 'API Gateway');
  const promises = [];

  if (resources.length > 0) {
    context.print.info('\nCreating API models...');
  }

  for (let i = 0; i < resources.length; i += 1) {
    if (resources[i].output.ApiName) {
      promises.push(() => extractAPIModel(context, resources[i], framework));
    }
  }

  return sequential(promises);
}

async function extractAPIModel(context: $TSContext, resource, framework) {
  const apigw = await APIGateway.getInstance(context);
  const apigwParams = getAPIGWRequestParams(context, resource, framework);

  const apiName = resource.output.ApiName;

  const data = await apigw.apigw.getSdk(apigwParams).promise();

  const backendDir = pathManager.getBackendDirPath();

  const tempDir = `${backendDir}/.temp`;

  fs.ensureDirSync(tempDir);

  const buff = Buffer.from(data.body);
  fs.writeFileSync(`${tempDir}/${apiName}.zip`, buff);
  await extract(`${tempDir}/${apiName}.zip`, { dir: tempDir });

  // Copy files to src
  copyFilesToSrc(context, apiName, framework);
  fs.removeSync(tempDir);
}

function copyFilesToSrc(context, apiName, framework) {
  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const tempDir = `${backendDir}/.temp`;

  switch (framework) {
    case 'android':
      {
        const generatedSrc = `${tempDir}/${apiName}-Artifact-1.0/src/main/java`;

        const target = `${context.amplify.getEnvInfo().projectPath}/app/src/main/java`;

        fs.ensureDirSync(target);

        fs.copySync(generatedSrc, target);
      }
      break;
    case 'ios':
      {
        const generatedSrc = `${tempDir}/aws-apigateway-ios-swift/generated-src`;

        const target = `${context.amplify.getEnvInfo().projectPath}/generated-src`;

        fs.ensureDirSync(target);

        fs.copySync(generatedSrc, target);
      }
      break;
    default:
      throw new Error(`Unsupported framework. ${framework}`);
  }
}

function getAPIGWRequestParams(_: $TSContext, resource, framework) {
  const apiUrl = resource.output.RootUrl;
  const apiName = resource.output.ApiName;
  const firstSplit = apiUrl.split('/');
  const stage = firstSplit[3];

  const secondSplit = firstSplit[2].split('.');
  const apiId = secondSplit[0];

  switch (framework) {
    case 'android':
      return {
        restApiId: apiId,
        sdkType: framework,
        stageName: stage,
        parameters: {
          groupId: `${apiName}-GroupID`,
          invokerPackage: apiName,
          artifactId: `${apiName}-Artifact`,
          artifactVersion: '1.0',
        },
      };

    case 'ios':
      return {
        restApiId: apiId,
        sdkType: 'swift',
        stageName: stage,
        parameters: {
          classPrefix: apiName,
        },
      };

    default:
      throw new Error(`Unsupported framework. ${framework}`);
  }
}
