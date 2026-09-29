import * as yarnLockfileParser from '@yarnpkg/lockfile';
import _ from 'lodash';
import { AmplifyFault } from '../errors/amplify-fault';
import { LockfileType } from './lock-file-types';

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
  type: LockfileType.YARN;
  dependenciesMap: Record<string, Record<string, YarnLockDependencyType>>;

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
      throw new AmplifyFault(
        'LockFileParsingFault',
        {
          message: `yarn.lock parsing failed with an error: ${e.message}`,
        },
        e,
      );
    }
  };

  /**
   * this function takes dependencyTo search and lockFile content as input and
   * returns a map of < allPackages, dependencyToSearchPayload>
   */
  getDependentPackageMap(
    packageName: string,
    lockFileContents: string,
  ): Record<string, Record<string, YarnLockDependencyType>> | undefined {
    const lockFileDependenciesMap = this.parseLockFile(lockFileContents);
    if (lockFileDependenciesMap.dependencies) {
      for (const dependency of Object.keys(lockFileDependenciesMap.dependencies)) {
        const dependencyPkgKey = dependency.substring(0, dependency.lastIndexOf('@'));
        if (_.isEmpty(this.dependenciesMap[dependency])) {
          if (dependencyPkgKey === packageName) {
            this.dependenciesMap[packageName] = {};
            this.dependenciesMap[packageName][dependencyPkgKey] = lockFileDependenciesMap.dependencies[dependency];
          }
          this.dfs(dependency, lockFileDependenciesMap, packageName, new Set<string>());
        }
      }
    }
    return this.dependenciesMap;
  }

  /**
   * traverses dependency tree
   */
  private dfs(dependency: string, lockFileDependenciesMap: YarnLock, dependencyToSearch: string, visited: Set<string>): void {
    if (visited.has(dependency)) {
      return;
    }
    visited.add(dependency);
    if (lockFileDependenciesMap.dependencies) {
      const dependencyPkgKey = dependency.substring(0, dependency.lastIndexOf('@'));
      const dependencyObj = lockFileDependenciesMap.dependencies[dependency];
      if (dependencyObj !== undefined && dependencyObj.dependencies !== undefined) {
        const dependencyObjDeps = dependencyObj.dependencies;
        for (const nestedDependency of Object.keys(dependencyObjDeps)) {
          const nestedDependencyActual = this.getDependencyKey(nestedDependency, `${dependencyObjDeps[nestedDependency]}`);
          if (nestedDependency === dependencyToSearch || !_.isEmpty(this.dependenciesMap?.[nestedDependency]?.[dependencyToSearch])) {
            // mark as dependency
            this.dependenciesMap[dependencyPkgKey] = {};
            this.dependenciesMap[dependencyPkgKey][dependencyToSearch] =
              this.dependenciesMap?.[nestedDependency]?.[dependencyToSearch] ??
              lockFileDependenciesMap.dependencies[nestedDependencyActual];
            return;
          }
          if (_.isEmpty(this.dependenciesMap[nestedDependency])) {
            // un visited node
            this.dfs(nestedDependencyActual, lockFileDependenciesMap, dependencyToSearch, visited);
          }
        }
      }
    }
  }

  /**
   * get dependency key from package name
   */
  private getDependencyKey = (packageName: string, version?: string): string => `${packageName}@${version}`;
}
