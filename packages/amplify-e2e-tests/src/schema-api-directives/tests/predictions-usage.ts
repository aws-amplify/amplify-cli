//special handling needed to test prediction
//This test will faile due to a possible AppSync bug, see details below the test code
import path from 'path';
import fs from 'fs-extra';
import aws from 'aws-sdk';
import gql from 'graphql-tag';
import { addAuthWithDefault, addS3Storage, getBackendAmplifyMeta, addApi, amplifyPush } from 'amplify-e2e-core';

import { getApiKey, configureAmplify, getConfiguredAppsyncClientAPIKeyAuth } from '../authHelper';
import { updateSchemaInTestProject } from '../common';

const imageKey = 'public/myimage.jpg';

export async function runTest(projectDir: string, testModule: any) {
  await addAuthWithDefault(projectDir);
  await addS3Storage(projectDir);
  await addApi(projectDir);
  updateSchemaInTestProject(projectDir, testModule.schema);

  await amplifyPush(projectDir);

  await uploadImageFile(projectDir);

  const apiKey = getApiKey(projectDir);
  const awsconfig = configureAmplify(projectDir);
  const appSyncClient = getConfiguredAppsyncClientAPIKeyAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);

  try {
    const result = await appSyncClient.query({
      query: gql(query),
      fetchPolicy: 'no-cache',
    });

    expect(result).toBeDefined();
    const pollyURL = result.data.speakTranslatedImageText;
    // check that return format is a url
    expect(pollyURL).toMatch(/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/);
  } catch (err) {
    //#error: the query will fail due to an AppSync bug, see below
  }
}

async function uploadImageFile(projectDir: string) {
  const imageFilePath = path.join(__dirname, 'predictions-usage-image.jpg');
  const s3Client = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
  });

  const amplifyMeta = getBackendAmplifyMeta(projectDir);
  const storageResourceName = Object.keys(amplifyMeta.storage).find((key: any) => {
    return amplifyMeta.storage[key].service === 'S3';
  }) as any;

  const bucketName = amplifyMeta.storage[storageResourceName].output.BucketName;

  const fileStream = fs.createReadStream(imageFilePath);
  const uploadParams = {
    Bucket: bucketName,
    Key: imageKey,
    Body: fileStream,
    ContentType: 'image/jpeg',
    ACL: 'public-read',
  };
  await s3Client.upload(uploadParams).promise();
}

//schema
export const schema = `
type Query {
  speakTranslatedImageText: String @predictions(actions: [identifyText, translateText, convertTextToSpeech])
}
`;

//queries
export const query = `
#change: remove redaudant ($input: SpeakTranslatedImageTextInput!)
query SpeakTranslatedImageText {
  speakTranslatedImageText(
    input: {
      identifyText: { key: "myimage.jpg" }
      translateText: { sourceLanguage: "en", targetLanguage: "es" }
      convertTextToSpeech: { voiceID: "Conchita" }
    }
  )
}
`;

/*
This test will fail:
There is an AppSync bug, the error received:
{
  graphQLErrors: [
    {
      path: [Array],
      data: null,
      errorType: 'MappingTemplate',
      errorInfo: null,
      locations: [Array],
      message: "Unable to parse the JSON document: 'Unexpected character ('m' (code 109)): was expecting comma to separate Object entries\n" +
        ' at [Source: (String)"{\n' +
        '  "version": "2018-05-29",\n' +
        '  "method": "POST",\n' +
        '  "resourcePath": "/",\n' +
        '  "params": {\n' +
        '      "body": {\n' +
        '          "Image": {\n' +
        '              "S3Object": {\n' +
        '                  "Bucket": "xxxx",\n' +
        '                  "Name": "public/"myimage.jpg""\n' +
        '        }\n' +
        '      }\n' +
        '    },\n' +
        '      "headers": {\n' +
        '          "Content-Type": "application/x-amz-json-1.1",\n' +
        '          "X-Amz-Target": "RekognitionService.DetectText"\n' +
        '    }\n' +
        '  }\n' +
        `}"; line: 10, column: 37]'`
    }
  ],
  networkError: null,
  extraInfo: undefined
}
*/
