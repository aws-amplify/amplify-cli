import _ from 'lodash';
import * as yaml from 'yaml';
import { AmplifyFault } from '../errors/amplify-fault';
import { LockfileType } from './lock-file-types';
import {
  YarnLockDependency, YarnLockDependencyType, YarnLock, YarnLockParser, YarnLockFileTypes,
} from './yarn-lock-parser';

/**
 *  Yarn2LockParser
 */
export class Yarn2LockParser extends YarnLockParser {
  type: YarnLockFileTypes;
  dependenciesMap:Record<string, Record<string, YarnLockDependencyType>>;

  constructor() {
    super();
    this.type = LockfileType.YARN2;
    this.dependenciesMap = {};
  }

  /**
   * parseLockFile
   */
  public parseLockFile = (lockFileContents: string): YarnLock => {
    try {
      const yarn2LockContent = yaml.parse(lockFileContents);
      delete yarn2LockContent.__metadata;
      const object: YarnLockDependency = {};
      _.forEach(yarn2LockContent, (packageValue, packageKey) => {
        const actualPackageKeys = this.convertToYarnParserKeys(packageKey);
        actualPackageKeys.forEach(key => {
          object[key.trim()] = packageValue;
        });
      });
      const yarnLock: YarnLock = {
        object,
        type: this.type,
        lockfileVersion: 2,
        lockfileType: LockfileType.YARN2,
      };
      yarnLock.dependencies = yarnLock.object;
      return yarnLock;
    } catch (e) {
      throw new AmplifyFault('LockFileParsingFault', {
        message: `yarn.lock parsing failed`,
      }, e);
    }
  }

  /**
   * converts yarn2 lock files keys to yarn lock , for comma separated keys will be taking semver version
   * ("@aws-amplify/graphql-transformer-interfaces@npm:1.14.9, @aws-amplify/graphql-transformer-interfaces@npm:^1.14.9")
   * will be converted to @aws-amplify/graphql-transformer-interfaces@^1.14.9.
   * We can take any comma separated package to detect dependency
   **/
  private convertToYarnParserKeys = (packageKey: string): string[] => {
    if (packageKey.includes(',')) {
      return packageKey.split(',').map(key => key.replace(/npm:/g, ''));
    }
    return [packageKey.replace(/npm:/g, '')];
  }
}
