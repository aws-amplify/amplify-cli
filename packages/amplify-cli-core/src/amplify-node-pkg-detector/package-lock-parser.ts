import _ from 'lodash';
import { AmplifyFault } from '../errors/amplify-fault';
import { JSONUtilities } from '../jsonUtilities';
import { LockfileType } from './lock-file-types';

/**
 * package lock interface
 */
export interface PackageLock {
    name: string;
    version: string;
    dependencies?: PackageLockDependency;
    lockfileVersion: 1 | 2;
    type: LockfileType.NPM;
}

/**
 * package lock dependency interface
 */
export interface PackageLockDependency {
    [depName: string]: PackageLockDependencyType;
}

/**
 * package lock dependencies type
 */
export interface PackageLockDependencyType {
    version: string;
    requires?: {
      [depName: string]: string;
    };
    dependencies?: PackageLockDependency;
    dev?: boolean;
}

/**
 * package lock parser
 */
export class PackageLockParser {
  type: LockfileType;
  dependenciesMap:Record<string, Record<string, PackageLockDependencyType>>;

  constructor() {
    this.type = LockfileType.NPM;
    this.dependenciesMap = {};
  }

  /**
    * parse lock file
    */
  public parseLockFile = (lockFileContents: string): PackageLock => {
    try {
      const packageLock: PackageLock = JSONUtilities.parse<PackageLock>(lockFileContents);
      packageLock.type = LockfileType.NPM;
      return packageLock;
    } catch (e) {
      throw new AmplifyFault('LockFileParsingFault', {
        message: `package-lock.json parsing failed with an error: ${e.message}`,
      }, e);
    }
  }

  /**
     * this function takes dependencyTo search and lockFile content as input and
     * returns a map of < allPackages ,dependencyToSearchPayload>
     */
   public getDependentPackageMap = (packageName: string,
     lockFileContents: string): Record<string, Record<string, PackageLockDependencyType>> | undefined => {
     const lockFileDependenciesMap = this.parseLockFile(lockFileContents);
     if (lockFileDependenciesMap.dependencies) {
       for (const dependency of Object.keys(lockFileDependenciesMap.dependencies)) {
         if (_.isEmpty(this.dependenciesMap[dependency])) {
           if (dependency === packageName) {
             this.dependenciesMap[packageName] = {};
             this.dependenciesMap[dependency][packageName] = lockFileDependenciesMap.dependencies[dependency];
           }
           this.dfs(dependency, lockFileDependenciesMap, packageName);
         }
       }
     }
     return this.dependenciesMap;
   };

   /**
     * traverses dependency tree
     */
   private dfs = (dependency: string, lockFileDependenciesMap: PackageLock,
     dependencyToSearch: string): void => {
     if (lockFileDependenciesMap.dependencies !== undefined) {
       const dependencyObj = lockFileDependenciesMap.dependencies[dependency];
       if (dependencyObj !== undefined && dependencyObj.requires !== undefined) {
         const dependencyObjDeps = dependencyObj.requires;
         for (const nestedDependency of Object.keys(dependencyObjDeps)) {
           if (nestedDependency === dependencyToSearch || !_.isEmpty(this.dependenciesMap[nestedDependency]?.[dependencyToSearch])) {
             const payload = lockFileDependenciesMap.dependencies[dependencyToSearch];
             this.dependenciesMap[dependency] = {};
             this.dependenciesMap[dependency][dependencyToSearch] = payload ?? this.dependenciesMap[nestedDependency][dependencyToSearch];
             return;
           }
           if (_.isEmpty(this.dependenciesMap[nestedDependency]?.[dependencyToSearch])) {
             this.dfs(nestedDependency, lockFileDependenciesMap, dependencyToSearch);
           }
         }
       }
     }
   }
}
