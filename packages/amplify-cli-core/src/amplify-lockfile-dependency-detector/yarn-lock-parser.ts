import * as yarnLockfileParser from '@yarnpkg/lockfile';
import _ from 'lodash';
import { LockfileType } from './lock-file-types';

/**
 * yarn lock file types
 */
export type YarnLockFileTypes = LockfileType.YARN;

/**
 * yarn lock interface
 */
export interface YarnLock {
  type: string;
  object: YarnLockDependency;
  dependencies?: YarnLockDependency;
  lockfileType: LockfileType.YARN;
  lockfileVersion: 1 | 2;

}

/**
 *  YarnLockDependency
 */
export interface YarnLockDependency {
  [dependencyName: string]: YarnLockDependencyType;
}

/**
 * YarnLockDependencyType
 */
export interface YarnLockDependencyType {
  version: string;
  dependencies?: {
    [depName: string]: string;
  };
}

/**
 *  YarnLockParser
 */
export class YarnLockParser {
    type: YarnLockFileTypes;
    dependenciesMap:Record<string, Record<string, YarnLockDependencyType>>;

    constructor() {
      this.type = LockfileType.YARN;
      this.dependenciesMap = {};
    }

    /**
     * parseLockFile
     */
    public parseLockFile = (lockFileContents: string): YarnLock => {
      try {
        const yarnLock: YarnLock = {
          lockfileType: this.type,
          lockfileVersion: 1,
          ...yarnLockfileParser.parse(lockFileContents),
        };
        yarnLock.dependencies = yarnLock.object;
        return yarnLock;
      } catch (e) {
        throw new Error(
          `yarn.lock parsing failed with an error: ${(e as Error).message}`,
        );
      }
    }

    /**
     * getDependentNpmPackage()
     */
    getDependentPackage(packageName: string, packageVersion: string,
      lockFileContents: string): Record<string, Record<string, YarnLockDependencyType>> | undefined {
      const lockFileDependenciesMap = this.parseLockFile(lockFileContents);
      const dependencyToSearchActual = this.getDependencyKey(packageName, packageVersion);
      const payload = lockFileDependenciesMap.dependencies![dependencyToSearchActual];
      if (_.isEmpty(payload)) {
        return undefined;
      }
      for (const dependency of Object.keys(lockFileDependenciesMap.dependencies!)) {
        if (_.isEmpty(this.dependenciesMap[dependency])) {
          if (dependency === dependencyToSearchActual) {
            this.dependenciesMap[packageName] = {};
            this.dependenciesMap[dependency.substring(0, dependency.lastIndexOf('@'))][packageName] = payload;
          }
          this.dfs(dependency, lockFileDependenciesMap, packageName, packageVersion);
        }
      }
      return this.dependenciesMap;
    }

    /**
     * traverses dependency tree
     */
    private dfs(dependency: string, lockFileDependenciesMap: YarnLock, dependencyToSearch: string, dependencyVersion: string): void {
      const dependencyPkgKey = dependency.substring(0, dependency.lastIndexOf('@'));
      const dependencyToSearchActual = this.getDependencyKey(dependencyToSearch, dependencyVersion);
      const payload = lockFileDependenciesMap.dependencies![dependencyToSearchActual];
      const dependencyObj = lockFileDependenciesMap.dependencies![dependency];
      if (!_.isEmpty(dependencyObj) && !_.isEmpty(dependencyObj.dependencies)) {
        const dependencyObjDeps = dependencyObj.dependencies!;
        if (!_.isEmpty(dependencyObjDeps)) {
          for (const nestedDependency of Object.keys(dependencyObjDeps)) {
            const nestedDependencyActual = this.getDependencyKey(nestedDependency, `${dependencyObjDeps![nestedDependency]}`);
            if (dependencyToSearch === nestedDependency
               || !_.isEmpty(this.dependenciesMap?.[nestedDependency]?.[dependencyToSearch])) {
              // mark as dependency
              this.dependenciesMap[dependencyPkgKey] = {};
              this.dependenciesMap[dependencyPkgKey][dependencyToSearch] = payload;
              return;
            }
            if (_.isEmpty(this.dependenciesMap[nestedDependency])) {
              // un visited node
              this.dfs(nestedDependencyActual, lockFileDependenciesMap, dependencyToSearch, dependencyVersion);
            }
          }
        }
      }
    }

    /**
    * get dependency key from package name
    */
    private getDependencyKey = (packageName: string, version?: string): string => `${packageName}@${version}`;

  // /**
  //       * get dependency obj dependencies if found else undefined
  //       */
  //  getDependencyObjDeps = (dependencyObj: YarnLockDependencyType) => {  [depName: string]: string;
  //          } | undefined {
  //   return (dependencyObj as YarnLockDependencyType).dependencies;
  // }

  // private getDependencyObj(dependency: string, parent: string): YarnLockDependencyType | PackageLockDep {
  //   if (this.lockFileType === LockfileType.YARN) {
  //     return this.lockFileDependenciesMap.dependencies![dependency];
  //   }
  //   if (this.lockFileType === LockfileType.NPM) {
  //     const dependencyObj = this.lockFileDependenciesMap.dependencies![dependency];
  //     if (_.isEmpty(dependencyObj)) {
  //       const parentObj = this.lockFileDependenciesMap.dependencies![parent].dependencies;
  //       return (parentObj![dependency] as PackageLockDep);
  //     }
  //     return dependencyObj;
  //   }
  //   throw new Error('not supported package manager');
  // }
}
