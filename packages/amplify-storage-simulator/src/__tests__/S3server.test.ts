import { AmplifyStorageSimulator } from '..';
import * as AWS from 'aws-sdk';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as request from 'request';

let port = 20005; // for testing
let route = '/mock-testing';
let bucket = 'mock-testing';
let localDirS3 = __dirname + '/test-data/';
const actual_file = __dirname + '/test-data/2.png';

let s3client;
let simulator;

jest.setTimeout(2000000);

beforeAll(async () => {
  AWS.config.update({
    accessKeyId: 'fakeaccesskeyidfortesting',
    secretAccessKey: 'fakeaccesssecretkeyfortesting',
    region: 'eu-west-2',
  });

  let ep = new AWS.Endpoint('http://localhost:20005');
  s3client = new AWS.S3({
    apiVersion: '2006-03-01',
    endpoint: ep.href,
    s3BucketEndpoint: true,
    sslEnabled: false,
    s3ForcePathStyle: true,
  });

  simulator = new AmplifyStorageSimulator({ port, route, localDirS3 });
  await simulator.start();
});

afterAll(async () => {
  if (simulator) {
    await simulator.stop();
  }
});

/**
 * Test api below
 */

describe('test server running', () => {
  test('server is running', async () => {
    try {
      expect(simulator).toBeDefined();
      expect(simulator.url).toEqual('http://localhost:20005');
    } catch (e) {
      console.log(e);
      expect(true).toEqual(false);
    }
  });
});

describe('Test get api', () => {
  const actual_file = __dirname + '/test-data/2.png';
  test('get image work ', async () => {
    const data = await s3client.getObject({ Bucket: bucket, Key: '2.png' }).promise();
    expect(data).toBeDefined();
    expect(data.Body).toBeDefined();
  });

  test('get text file', async () => {
    const data = await s3client.getObject({ Bucket: bucket, Key: 'abc.txt' }).promise();
    expect(data).toBeDefined();
    expect(data.Body).toBeDefined();
    expect(data.Body.toString()).toEqual('Helloworld1234');
  });
});

describe('Test list api', () => {
  test('get list', async () => {
    const response = await s3client.listObjects({ Bucket: bucket, Prefix: 'normal' }).promise();
    expect(response).toBeDefined();
    expect(response.Contents[0].Key).toEqual('normal/2.png');
    expect(response.Contents.length).toEqual(1);
  });
  test('get list', async () => {
    const response = await s3client.listObjects({ Bucket: bucket }).promise();
    expect(response).toBeDefined();
    //expect(response.Contents.length).toEqual(1);
  });
  test('empty bucket', async () => {
    const response = await s3client.listObjects({ Bucket: bucket, Prefix: 'public' }).promise();
    expect(response).toBeDefined();
    expect(response.Contents.length).toEqual(0);
  });

  test('list object pagination', async () => {
    let maxKeys = 2;
    let total = 7;
    let response = await s3client
      .listObjects({
        Bucket: bucket,
        Prefix: 'pagination',
        Marker: '',
        MaxKeys: maxKeys,
      })
      .promise();
    while (response.IsTruncated === true) {
      expect(response).toBeDefined();
      expect(response.Contents.length).toEqual(maxKeys);
      response = await s3client
        .listObjects({
          Bucket: bucket,
          Prefix: 'pagination',
          Marker: response.NextMarker,
          MaxKeys: maxKeys,
        })
        .promise();
      total = total - maxKeys;
    }
    expect(response.Contents.length).toEqual(total);
  });
});

describe('Test delete api', () => {
  const dirPathOne = __dirname + '/test-data/deleteOne';
  beforeEach(() => {
    fs.ensureDirSync(dirPathOne);
    fs.copySync(__dirname + '/test-data/normal/', dirPathOne + '/');
  });
  test('test one delete ', async () => {
    const data = await s3client.deleteObject({ Bucket: bucket, Key: 'deleteOne/2.png' }).promise();
    expect(fs.rmdirSync(dirPathOne)).toBeUndefined;
  });
});

describe('Test put api', () => {
  const actual_file = __dirname + '/test-data/2.png';
  const buffer = fs.readFileSync(actual_file);
  test('put image', async () => {
    const params = {
      Bucket: bucket, // pass your bucket name
      Key: '2.png',
      Prefix: 'upload',
      Body: buffer,
    };
    const data = await s3client.upload(params).promise();
    expect(data).toBeDefined();
  });

  const file = __dirname + '/test-data/abc.txt';
  const buf1 = fs.readFileSync(file);

  test('put text', async () => {
    const params = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/abc.txt',
      Body: buf1,
    };
    const data = await s3client.upload(params).promise();
    expect(data).toBeDefined();
  });

  const file1 = __dirname + '/test-data/Snake_River_(5mb).jpg';
  const buf2 = fs.readFileSync(file1);

  test(' multipart upload', async () => {
    const params = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image.jpg',
      Body: buf2,
    };
    const data = await s3client.upload(params).promise();
    expect(data.Key).toBe('upload/long_image.jpg');
  });

  test(' async uploads', async () => {
    const params1 = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image1.jpg',
      Body: buf2,
    };
    const data = await s3client.upload(params1).promise();

    const params2 = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image2.jpg',
      Body: buf2,
    };
    const data2 = await s3client.upload(params2).promise();

    const params3 = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image3.jpg',
      Body: buf2,
    };
    const data3 = await s3client.upload(params3).promise();

    expect(data.Key).toBe('upload/long_image1.jpg');
    expect(data2.Key).toBe('upload/long_image2.jpg');
    expect(data3.Key).toBe('upload/long_image3.jpg');
  });

  test(" async uploads", async () => {
    const params1 = {
      Bucket: bucket, // pass your bucket name
      Key: "upload/long_image1.jpg",
      Body: buf2
    };
    const params2 = {
      Bucket: bucket, // pass your bucket name
      Key: "upload/long_image2.jpg",
      Body: buf2
    };
    const params3 = {
      Bucket: bucket, // pass your bucket name
      Key: "upload/long_image3.jpg",
      Body: buf2
    };

    const uploadPromises = [];
    uploadPromises.push(s3client.upload(params1).promise());
    uploadPromises.push(s3client.upload(params2).promise());
    uploadPromises.push(s3client.upload(params3).promise());

    const uploadResults = await Promise.all(uploadPromises);
    expect(uploadResults[0].Key).toBe('upload/long_image1.jpg');
    expect(uploadResults[1].Key).toBe("upload/long_image2.jpg");
    expect(uploadResults[2].Key).toBe("upload/long_image3.jpg");
  });
});
