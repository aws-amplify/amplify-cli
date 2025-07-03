import { AmplifyStorageSimulator } from 'amplify-storage-simulator';
import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs-extra';

const port = 20005; // for testing
const route = '/mock-testing';
const bucket = 'mock-testing';
const localDirS3 = __dirname + '/test-data/';

const fakeAccessId = 'fakeaccesskeyidfortesting';
const fakeSecretKey = 'fakeaccesssecretkeyfortesting';
const fakeRegion = 'eu-west-2';

let s3client;
let simulator;

jest.setTimeout(2000000);

beforeAll(async () => {
  s3client = new S3Client({
    credentials: {
      accessKeyId: fakeAccessId,
      secretAccessKey: fakeSecretKey,
    },
    region: fakeRegion,
    apiVersion: '2006-03-01',
    endpoint: 'http://localhost:20005',
    forcePathStyle: true,
    tls: false,
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
  test('get image work ', async () => {
    const data = await s3client.send(new GetObjectCommand({ Bucket: bucket, Key: '2.png' }));
    expect(data).toBeDefined();
    expect(data.Body).toBeDefined();
  });

  test('get text file', async () => {
    const data = await s3client.send(new GetObjectCommand({ Bucket: bucket, Key: 'abc.txt' }));
    expect(data).toBeDefined();
    expect(data.Body).toBeDefined();
    const bodyString = await data.Body.transformToString();
    expect(bodyString).toEqual('Helloworld1234');
  });
});

describe('Test list api', () => {
  test('get list', async () => {
    const response = await s3client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'normal' }));
    expect(response).toBeDefined();
    expect(response.Contents[0].Key).toEqual('normal/2.png');
    expect(response.Contents.length).toEqual(1);
  });
  test('get list 2', async () => {
    const response = await s3client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: '' }));
    expect(response).toBeDefined();
    //expect(response.Contents.length).toEqual(1);
  });
  test('empty bucket', async () => {
    const response = await s3client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'public' }));
    expect(response).toBeDefined();
    expect(response.Contents).toBeUndefined();
  });

  test('list object pagination', async () => {
    const maxKeys = 2;
    let total = 7;
    let response = await s3client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'pagination',
        MaxKeys: maxKeys,
      }),
    );
    while (response.IsTruncated === true) {
      expect(response).toBeDefined();
      expect(response.Contents.length).toEqual(maxKeys);
      response = await s3client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: 'pagination',
          MaxKeys: maxKeys,
        }),
      );
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
    await s3client.send(new DeleteObjectCommand({ Bucket: bucket, Key: 'deleteOne/2.png' }));
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
    const upload = new Upload({
      client: s3client,
      params,
    });
    const data = await upload.done();
    expect(data).toBeDefined();
  });

  const file = __dirname + '/test-data/abc.txt';
  const buf1 = fs.readFileSync(file);
  const Jsonobj = {
    __typename: 'UserData',
    id: 'a9a394ea-feaa-4bf9-a612-d80aa38e6b31',
    name: 'Test Mock Storage',
    users: null,
    completionStatus: null,
    parentId: null,
    time: { __typename: 'Time', cDate: 1578985237505, mDate: null, rDate: null, freq: null },
    Type: 'ROOT',
    Manager: null,
    logo: {
      __typename: 'S3File',
      id: null,
      name: 'logo.png',
      names: null,
      typeId: 'a9a394ea-feaa-4bf9-a612-d80aa38e6b31',
      fileType: 'LOGO',
      contentType: 'image/png',
      length: null,
      key: 'a9a394ea-feaa-4bf9-a612-d80aa38e6b31/LOGO/logo.png.png',
    },
    integrate: null,
    Setting: { __typename: 'Setting', dueInDays: null, fre: 'ANN', sur: 'high', art: null, access: 'PHYSICAL' },
    createdBy: null,
    createdAt: 1578985237505,
    modifiedBy: null,
    modifiedAt: 1578985237505,
    Details: null,
    effect: 'HEALTH',
  };

  test('put text', async () => {
    const params = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/abc.txt',
      Body: buf1,
    };
    const data = await new Upload({
      client: s3client,
      params,
    }).done();
    expect(data).toBeDefined();
  });

  test('put JSON', async () => {
    const params = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/abc.json',
      Body: JSON.stringify(Jsonobj),
      ContentType: 'application/json',
    };
    const data = await new Upload({
      client: s3client,
      params,
    }).done();
    const jsonFile = __dirname + '/test-data/upload/abc.json';
    const contents = fs.readFileSync(jsonFile);
    const obj = JSON.parse(contents.toString());
    expect(data).toBeDefined();
    expect(JSON.stringify(obj)).toBe(JSON.stringify(Jsonobj));
  });

  const file1 = __dirname + '/test-data/Snake_River_(5mb).jpg';
  const buf2 = fs.readFileSync(file1);

  test(' multipart upload', async () => {
    const params = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image.jpg',
      Body: buf2,
    };
    const data = await new Upload({
      client: s3client,
      params,
    }).done();
    expect(data.Key).toBe('upload/long_image.jpg');
  });

  test(' async uploads', async () => {
    const params1 = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image1.jpg',
      Body: buf2,
    };
    const data = await new Upload({
      client: s3client,
      params: params1,
    }).done();

    const params2 = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image2.jpg',
      Body: buf2,
    };
    const data2 = await new Upload({
      client: s3client,
      params: params2,
    }).done();

    const params3 = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image3.jpg',
      Body: buf2,
    };
    const data3 = await new Upload({
      client: s3client,
      params: params3,
    }).done();

    expect(data.Key).toBe('upload/long_image1.jpg');
    expect(data2.Key).toBe('upload/long_image2.jpg');
    expect(data3.Key).toBe('upload/long_image3.jpg');
  });

  test(' async uploads', async () => {
    const params1 = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image1.jpg',
      Body: buf2,
    };
    const params2 = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image2.jpg',
      Body: buf2,
    };
    const params3 = {
      Bucket: bucket, // pass your bucket name
      Key: 'upload/long_image3.jpg',
      Body: buf2,
    };

    const uploadPromises = [];
    uploadPromises.push(new Upload({ client: s3client, params: params1 }).done());
    uploadPromises.push(new Upload({ client: s3client, params: params2 }).done());
    uploadPromises.push(new Upload({ client: s3client, params: params3 }).done());

    const uploadResults = await Promise.all(uploadPromises);
    expect(uploadResults[0].Key).toBe('upload/long_image1.jpg');
    expect(uploadResults[1].Key).toBe('upload/long_image2.jpg');
    expect(uploadResults[2].Key).toBe('upload/long_image3.jpg');
  });
});
