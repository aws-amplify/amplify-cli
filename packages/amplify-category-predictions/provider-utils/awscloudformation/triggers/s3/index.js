const AWS = require('aws-sdk'); //eslint-disable-line
const querystring = require('querystring');

async function deleteImageIndex(rekognition, result, externalImageID) {
  const len = result.Faces.length;
  let resultDeleted = false;
  for (let i = 0; i < len; i++) {
    if (result.Faces[i].ExternalImageId === externalImageID) {
      const params1 = {
        CollectionId: process.env.collectionId,
        FaceIds: [
          result.Faces[i].FaceId,
        ],
      };

      const result1 = await rekognition.deleteFaces(params1).promise();

      if (result1.DeletedFaces) {
        console.log('deleted faces from collection successfully');
      } else {
        console.log('error occured');
        console.log(result1);
      }
      resultDeleted = true;
      break;
    }
  }

  return resultDeleted;
}

exports.handler = async (event) => {
  AWS.config.update({
    region: event.Records[0].awsRegion,
  });

  const numberOfRecords = event.Records.length;
  console.log(numberOfRecords);
  const rekognition = new AWS.Rekognition();
  for (let j = 0; j < numberOfRecords; j++) {
    const key = event.Records[j].s3.object.key;
    const decodeKey = Object.keys(querystring.parse(key))[0];
    const bucketName = event.Records[j].s3.bucket.name;
    const lastIndex = decodeKey.lastIndexOf('/');
    const imageName = decodeKey.substring(lastIndex + 1);
    if (imageName === '') {
      console.log('creation of folder');
      return;
    }
    const externalImageId = decodeKey.replace(/\//g, '::');
    console.log(decodeKey);

    if (event.Records[j].eventName === 'ObjectCreated:Put') {
      const params1 = {
        CollectionId: process.env.collectionId,
        ExternalImageId: externalImageId,
        Image: {
          S3Object: {
            Bucket: bucketName,
            Name: decodeKey,
          },
        },
      };

      const result = await rekognition.indexFaces(params1).promise();

      if (result.FaceRecords) {
        console.log('Indexed image successfully');
      } else {
        console.log('Request Failed');
        console.log(result);
      }
    } else {
      let params = {
        CollectionId: process.env.collectionId,
        MaxResults: 1000,
      };

      let result = await rekognition.listFaces(params).promise();
      let resultDeleted = await deleteImageIndex(rekognition, result, externalImageId);

      while (!resultDeleted && result.NextToken) {
        params = {
          CollectionId: process.env.collectionId,
          MaxResults: 1000,
          NextToken: result.NextToken,
        };
        result = await rekognition.listFaces(params).promise();
        resultDeleted = await deleteImageIndex(rekognition, result, externalImageId);
      }

      if (!resultDeleted) {
        console.log(`Unable to find the index to delete for ${decodeKey}`);
      }
    }
  }
};
