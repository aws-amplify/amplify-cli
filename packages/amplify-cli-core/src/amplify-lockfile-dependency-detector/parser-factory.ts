import { LockfileParser } from './lock-file-interface';
import { LockfileType } from './lock-file-types';
import { PackageLockParser } from './package-lock-parser';
import { YarnLockParser } from './yarn-lock-parser';

/**
 * lock file parser factory
 */
export class LockFileParserFactory {
  /**
   * get lock file Parser
   */
  public static getLockFileParser(lockfileType: string): LockfileParser {
    switch (lockfileType) {
      case LockfileType.NPM:
        return new PackageLockParser();
      case LockfileType.YARN:
        return new YarnLockParser();
      default:
        throw new Error(
          'Unsupported lockfile type '
                  + `${lockfileType} provided. Only 'npm' or 'yarn' is currently `
                  + 'supported.',
        );
    }
  }
}
