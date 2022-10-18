import fs from 'fs';
import path from 'path';
import configCreator from '../frontend-config-creator';

jest.mock('amplify-cli-core');
describe('Get angular project config file', () => {
  let context;

  const projectPath = path.resolve('./');
  const srcDirPath = 'src'; // change if need be
  beforeAll(() => {
    context = {
      amplify: {
        getEnvInfo: jest.fn().mockReturnValue({
          projectPath,
        }),
        getProjectConfig: jest.fn().mockReturnValue({
          javascript: {
            config: {
              SourceDir: srcDirPath,
            },
          },
        }),
      },
    };
  });

  beforeEach(() => {

  });

  afterEach(() => {

  });

  it('should load ESM', async () => {
    const result = await configCreator.getCurrentAWSExports(context);
    expect(result).toEqual(awsmobile);
  });

  it('should load CommonJS', async () => {
    const result = await configCreator.getCurrentAWSExports(context);
    expect(result).toEqual(awsmobile);
    // expect(configCreator.getCurrentAWSExports(context)).toThrowError('Unable to parse aws-exports.js. Has this file been modified?');
  });

  it('should load with babel.config.json present', async () => {
    const babelConfigPath = path.join(projectPath, 'babel.config.json');
    const babelConfigContent = JSON.stringify({ presets: ['es2015'] });
    try {
      fs.writeFileSync(babelConfigPath, babelConfigContent);
      const result = await configCreator.getCurrentAWSExports(context);
      expect(result).toEqual(awsmobile);
    } finally {
      fs.unlinkSync(babelConfigPath);
    }
  });

  it('should throw error if file does not have exports', async () => {
    expect.assertions(1);
    fs.writeFileSync(awsExportsPath, generateAwsExportsFileContents(null));
    const ERROR_MESSAGE = 'Unable to find aws-exports.js. Has this file been modified?';
    let err;
    try {
      await configCreator.getCurrentAWSExports(context);
    } catch (error) {
      err = error;
    } finally {
      expect(err.message).toEqual(ERROR_MESSAGE);
    }
  });

  it('should throw error if file contains a syntax error', async () => {
    expect.assertions(1);
    fs.writeFileSync(awsExportsPath, 'awsmobile = {');
    const ERROR_MESSAGE = 'Unable to parse aws-exports.js. Has this file been modified?';
    let err;
    try {
      await configCreator.getCurrentAWSExports(context);
    } catch (error) {
      err = error;
    } finally {
      expect(err.message).toEqual(ERROR_MESSAGE);
    }
  });
});
