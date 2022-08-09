import * as AWS from 'aws-sdk';
// import * as fs from 'fs-extra';
import { AmplifyAuthSimulator } from '..';

const port = 20009; // for testing
const route = '/mock-testing';
// const bucket = 'mock-testing';
const localDir = `${__dirname}/test-data/`;
// const actual_file = `${__dirname}/test-data/2.png`;

let simulator;

jest.setTimeout(2000000);

beforeAll(async () => {
  AWS.config.update({
    accessKeyId: 'testKey',
    secretAccessKey: 'testSecretKey',
    region: 'eu-west-2',
  });

  simulator = new AmplifyAuthSimulator({ port, route, localDir });
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
      expect(simulator.url).toEqual('http://localhost:20009');
    } catch (e) {
      console.log(e);
      // eslint-disable-next-line jest/no-conditional-expect
      expect(true).toEqual(false);
    }
  });
});
