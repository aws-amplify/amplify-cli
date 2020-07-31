import fs from 'fs';
import fsExtra from 'fs-extra';
import { getEnvInfo } from '../../../../lib/extensions/amplify-helpers/get-env-info';

describe('get-env-info helper: ', () => {
  it('...should return info when env file exists', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fsExtra, 'readFileSync').mockReturnValue('{"test": true}');
    expect(getEnvInfo()).toHaveProperty('test', true);
  });

  it('...should throw UndeterminedEnvironmentError when env file does not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(() => {
      getEnvInfo();
    }).toThrow();
  });
});
