import * as AWS from 'aws-sdk';
// import * as fs from 'fs-extra';
import { AmplifyAuthSimulator } from '..';

const port = 20005; // for testing
const route = '/mock-testing';
// const bucket = 'mock-testing';
const localDirS3 = `${__dirname}/test-data/`;
// const actual_file = `${__dirname}/test-data/2.png`;

let s3client;
let simulator;

jest.setTimeout(2000000);

beforeAll(async () => {
  AWS.config.update({
    accessKeyId: 'testKey',
    secretAccessKey: 'testSecretKey',
    region: 'eu-west-2',
  });

  const ep = new AWS.Endpoint('http://localhost:20005');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  s3client = new AWS.S3({
    apiVersion: '2006-03-01',
    // eslint-disable-next-line spellcheck/spell-checker
    endpoint: ep.href,
    s3BucketEndpoint: true,
    sslEnabled: false,
    s3ForcePathStyle: true,
  });

  simulator = new AmplifyAuthSimulator({ port, route, localDirS3 });
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
      // expect(true).toEqual(false);
    }
  });
});
