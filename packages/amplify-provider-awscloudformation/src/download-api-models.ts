import { $TSContext, $TSObject, pathManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import extract from 'extract-zip';
import * as fs from 'fs-extra';
import sequential from 'promise-sequential';
import { APIGateway } from './aws-utils/aws-apigw';

export async function downloadAPIModels(context: $TSContext, allResources: $TSObject[]) {
  const { amplify } = context;
  const projectConfig = amplify.getProjectConfig();

  const framework = projectConfig.frontend;

  if (['javascript', 'flutter'].includes(framework)) {
    return;
  }

  const resources = allResources.filter(resource => resource.service === 'API Gateway');
  const promises = [];

  if (resources.length > 0) {
    printer.info('\nCreating API models...');
  }

  for (const resource of resources) {
    if (resource.output.ApiName) {
      promises.push(() => extractAPIModel(context, resource, framework));
    }
  }

  return sequential(promises);
}

async function extractAPIModel(context: $TSContext, resource: $TSObject, framework: string) {
  const apigw = await APIGateway.getInstance(context);
  const apigwParams = getAPIGWRequestParams(resource, framework);

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

function copyFilesToSrc(context: $TSContext, apiName: string, framework: string) {
  const backendDir = pathManager.getBackendDirPath();
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

function getAPIGWRequestParams(resource: $TSObject, framework: string) {
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
