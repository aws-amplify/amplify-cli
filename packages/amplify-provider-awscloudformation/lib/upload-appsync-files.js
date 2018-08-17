const fs = require('fs');
const path = require('path');

const pythonStreamingFunctionFileName = 'python_streaming_function.zip';
const schemaFileName = 'schema.graphql';
const S3 = require('../src/aws-utils/aws-s3');

function uploadAppSyncFiles(context, resources) {
  resources = resources.filter(resource => resource.service === 'AppSync');
  const buildTimeStamp = new Date().getTime().toString();
  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    const resourceBuildDir = path.normalize(path.join(backEndDir, category, resourceName, 'build'));
    const resolverDir = path.normalize(path.join(resourceBuildDir, 'resolvers'));
    const functionsDir = path.normalize(path.join(resourceBuildDir, 'functions'));
    const schemaFilePath = path.normalize(path.join(resourceBuildDir, schemaFileName));
    const pythonStreamingFunctionFilePath = path.normalize(path.join(functionsDir, pythonStreamingFunctionFileName));
    const uploadFilePromises = [];
    const s3LocationMap = {};

    // Upload schema file
    uploadFilePromises.push(uploadAppSyncFile(
      context, schemaFileName,
      schemaFilePath, s3LocationMap, buildTimeStamp,
    ));

    // Upload streaming lambda function
    if (fs.existsSync(pythonStreamingFunctionFilePath)) {
      uploadFilePromises.push(uploadLambdaStreamingFunction(
        context, pythonStreamingFunctionFileName,
        pythonStreamingFunctionFilePath, s3LocationMap,
      ));
    }

    const resolverFiles = fs.readdirSync(resolverDir);

    resolverFiles.forEach((file) => {
      const resolverFilePath = path.join(resolverDir, file);

      uploadFilePromises.push(uploadAppSyncFile(
        context, file,
        resolverFilePath, s3LocationMap, buildTimeStamp,
      ));
    });

    return Promise.all(uploadFilePromises)
      .then(() => {
        const parametersFilePath = path.join(backEndDir, category, resourceName, 'parameters.json');
        let currentParameters;

        if (fs.existsSync(parametersFilePath)) {
          try {
            currentParameters = JSON.parse(fs.readFileSync(parametersFilePath));
          } catch (e) {
            currentParameters = {};
          }
        }

        Object.assign(currentParameters, s3LocationMap);
        const jsonString = JSON.stringify(currentParameters, null, 4);
        fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
      });
  }
}

function uploadAppSyncFile(context, fileName, filePath, s3LocationMap, buildTimeStamp) {
  const formattedName = fileName.split('.').map((s, i) => (i > 0 ? `${s[0].toUpperCase()}${s.slice(1, s.length)}` : s)).join('');

  const s3Key = `amplify-appsync-files/${fileName}.${buildTimeStamp}`;

  return new S3(context)
    .then((s3) => {
      const s3Params = {
        Body: fs.createReadStream(filePath),
        Key: s3Key,
      };
      return s3.uploadFile(s3Params);
    })
    .then((bucket) => {
      s3LocationMap[formattedName] = `s3://${path.join(bucket, s3Key)}`;
    });
}

function uploadLambdaStreamingFunction(context, fileName, filePath, s3LocationMap) {
  const bucketKeyParameterName = 'ElasticSearchStreamingLambdaCodeS3Bucket';
  const bucketKeyParameterKey = 'ElasticSearchStreamingLambdaCodeS3Key';
  const s3Key = `amplify-appsync-files/${fileName}`;

  return new S3(context)
    .then((s3) => {
      const s3Params = {
        Body: fs.createReadStream(filePath),
        Key: s3Key,
      };
      return s3.uploadFile(s3Params);
    })
    .then((bucket) => {
      s3LocationMap[bucketKeyParameterKey] = s3Key;
      s3LocationMap[bucketKeyParameterName] = bucket;
    });
}

module.exports = {
  uploadAppSyncFiles,
};
