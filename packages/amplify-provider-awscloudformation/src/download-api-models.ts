import { $TSAny, $TSContext, $TSObject, AmplifyError, AmplifyFrontend, pathManager, extract } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import * as fs from 'fs-extra';
import sequential from 'promise-sequential';
import { APIGateway } from './aws-utils/aws-apigw';
import { GetSdkCommand } from '@aws-sdk/client-api-gateway';

/**
 * Download API models from API Gateway
 */
export const downloadAPIModels = async (context: $TSContext, allResources: $TSObject[]): Promise<$TSAny[]> => {
  const { amplify } = context;
  const projectConfig = amplify.getProjectConfig();

  const framework = projectConfig.frontend;

  if (['javascript', 'flutter'].includes(framework)) {
    return;
  }

  const resources = allResources.filter((resource) => resource.service === 'API Gateway');
  const promises = [];

  if (resources.length > 0) {
    printer.blankLine();
    printer.info('Creating API models...');
  }

  for (const resource of resources) {
    if (resource.output.ApiName) {
      promises.push(() => extractAPIModel(context, resource, framework));
    }
  }

  // eslint-disable-next-line consistent-return
  return sequential(promises);
};

const extractAPIModel = async (context: $TSContext, resource: $TSObject, framework: AmplifyFrontend): Promise<void> => {
  const apigw = await APIGateway.getInstance(context);
  const apigwParams = getAPIGWRequestParams(resource, framework);

  const apiName = resource.output.ApiName;

  const data = await apigw.apigw.send(new GetSdkCommand(apigwParams));

  const backendDir = pathManager.getBackendDirPath();

  const tempDir = `${backendDir}/.temp`;

  fs.ensureDirSync(tempDir);

  // After updating node types from 12.x to 18.x the objectResult
  // became not directly assignable to Buffer.from parameter type.
  // However, this code has been running fine since 2022 which means that
  // runtime types are compatible.
  // The alternative would require multiple logical branches to handle type mismatch
  // that doesn't seem to exist in runtime.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const buff = Buffer.from(data.body);
  fs.writeFileSync(`${tempDir}/${apiName}.zip`, buff);
  await extract(`${tempDir}/${apiName}.zip`, { dir: tempDir });

  // Copy files to src
  copyFilesToSrc(context, apiName, framework);
  fs.removeSync(tempDir);
};

const copyFilesToSrc = (context: $TSContext, apiName: string, framework: AmplifyFrontend): void => {
  const backendDir = pathManager.getBackendDirPath();
  const tempDir = `${backendDir}/.temp`;

  switch (framework) {
    case AmplifyFrontend.android:
      {
        const generatedSrc = `${tempDir}/${apiName}-Artifact-1.0/src/main/java`;

        const target = `${context.amplify.getEnvInfo().projectPath}/app/src/main/java`;

        fs.ensureDirSync(target);

        fs.copySync(generatedSrc, target);
      }
      break;
    case AmplifyFrontend.ios:
      {
        const generatedSrc = `${tempDir}/aws-apigateway-ios-swift/generated-src`;

        const target = `${context.amplify.getEnvInfo().projectPath}/generated-src`;

        fs.ensureDirSync(target);

        fs.copySync(generatedSrc, target);
      }
      break;
    default:
      throw new AmplifyError('FrameworkNotSupportedError', {
        message: `Unsupported framework. ${framework}`,
      });
  }
};

const getAPIGWRequestParams = (resource: $TSObject, framework: AmplifyFrontend): $TSAny => {
  const apiUrl = resource.output.RootUrl;
  const apiName = resource.output.ApiName;
  const firstSplit = apiUrl.split('/');
  const stage = firstSplit[3];

  const secondSplit = firstSplit[2].split('.');
  const apiId = secondSplit[0];

  switch (framework) {
    case AmplifyFrontend.android:
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

    case AmplifyFrontend.ios:
      return {
        restApiId: apiId,
        sdkType: 'swift',
        stageName: stage,
        parameters: {
          classPrefix: apiName,
        },
      };

    default:
      throw new AmplifyError('FrameworkNotSupportedError', {
        message: `Unsupported framework. ${framework}`,
      });
  }
};
