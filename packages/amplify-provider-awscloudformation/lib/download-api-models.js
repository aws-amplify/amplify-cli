const fs = require('fs-extra');
const extract = require('extract-zip');
const sequential = require('promise-sequential');
const APIGateway = require('../src/aws-utils/aws-apigw');

function downloadAPIModels(context, allResources) {
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

function extractAPIModel(context, resource, framework) {
  return new APIGateway(context).then(apigw => {
    const apigwParams = getAPIGWRequestParams(context, resource, framework);

    const apiName = resource.output.ApiName;

    return apigw.apigw
      .getSdk(apigwParams)
      .promise()
      .then(data => {
        const backendDir = context.amplify.pathManager.getBackendDirPath();

        const tempDir = `${backendDir}/.temp`;

        fs.ensureDirSync(tempDir);

        const buff = Buffer.from(data.body);
        return new Promise((resolve, reject) => {
          fs.writeFile(`${tempDir}/${apiName}.zip`, buff, err => {
            if (err) {
              reject(err);
            }
            extract(`${tempDir}/${apiName}.zip`, { dir: tempDir }, err => {
              if (err) {
                reject(err);
              }
              // Copy files to src
              copyFilesToSrc(context, apiName, framework);
              fs.removeSync(tempDir);
              resolve();
            });
          });
        });
      });
  });
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

function getAPIGWRequestParams(context, resource, framework) {
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

module.exports = {
  downloadAPIModels,
};
