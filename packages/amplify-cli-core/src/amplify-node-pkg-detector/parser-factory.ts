import { AmplifyError } from '../errors/amplify-error';
import { PackageManager } from '../utils';
import { LockfileParser } from './lock-file-interface';
import { LockfileType } from './lock-file-types';
import { PackageLockParser } from './package-lock-parser';
import { YarnLockParser } from './yarn-lock-parser';
import { Yarn2LockParser } from './yarn2-lock-parser';

/**
 * lock file parser factory
 */
export class LockFileParserFactory {
  /**
   * get lock file Parser
   */
  public static getLockFileParser(packageManager: PackageManager): LockfileParser {
    switch (packageManager.packageManager) {
      case LockfileType.NPM:
        return new PackageLockParser();
      case LockfileType.YARN: {
        if (packageManager?.version?.major && packageManager?.version?.major >= 2) {
          return new Yarn2LockParser();
        } else {
          return new YarnLockParser();
        }
      }
      default:
        throw new AmplifyError('UnsupportedLockFileTypeError', {
          message: 'Unsupported lockfile type ' + `${packageManager.lockFile} provided. Only 'npm' or 'yarn' is currently ` + 'supported.',
          resolution: 'Install npm6 or yarn1 to compile overrides for this project.',
        });
    }
  }
}
