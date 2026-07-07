const { RekognitionClient, DeleteFacesCommand, IndexFacesCommand, ListFacesCommand } = require('@aws-sdk/client-rekognition');
const querystring = require('querystring');

async function deleteImageIndex(rekognition, result, externalImageID) {
  const len = result.Faces.length;
  let resultDeleted = false;
  for (let i = 0; i < len; i++) {
    if (result.Faces[i].ExternalImageId === externalImageID) {
      const params1 = {
        CollectionId: process.env.collectionId,
        FaceIds: [result.Faces[i].FaceId],
      };

      const result1 = await rekognition.send(new DeleteFacesCommand(params1));

      if (result1.DeletedFaces) {
        console.log('deleted faces from collection successfully');
      } else {
        console.log('error occurred');
        console.log(result1);
      }
      resultDeleted = true;
      break;
    }
  }

  return resultDeleted;
}

exports.handler = async (event) => {
  const numberOfRecords = event.Records.length;
  console.log(numberOfRecords);
  const rekognition = new RekognitionClient({ region: event.Records[0].awsRegion });
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

      const result = await rekognition.send(new IndexFacesCommand(params1));

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

      let result = await rekognition.send(new ListFacesCommand(params));
      let resultDeleted = await deleteImageIndex(rekognition, result, externalImageId);

      while (!resultDeleted && result.NextToken) {
        params = {
          CollectionId: process.env.collectionId,
          MaxResults: 1000,
          NextToken: result.NextToken,
        };
        result = await rekognition.send(new ListFacesCommand(params));
        resultDeleted = await deleteImageIndex(rekognition, result, externalImageId);
      }

      if (!resultDeleted) {
        console.log(`Unable to find the index to delete for ${decodeKey}`);
      }
    }
  }
};
