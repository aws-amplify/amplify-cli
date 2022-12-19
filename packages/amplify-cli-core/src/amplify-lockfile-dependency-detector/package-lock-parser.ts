import _ from 'lodash';
import { JSONUtilities } from '../jsonUtilities';
import { LockfileType } from './lock-file-types';

/**
 * package lock interface
 */
export interface PackageLock {
    name: string;
    version: string;
    dependencies?: PackageLockDeps;
    lockfileVersion: 1 | 2;
    type: LockfileType.NPM;
}

/**
 * package lock dependency interface
 */
export interface PackageLockDeps {
    [depName: string]: PackageLockDep;
}

/**
 * package lock dependencies type
 */
export interface PackageLockDep {
    version: string;
    requires?: {
      [depName: string]: string;
    };
    dependencies?: PackageLockDeps;
    dev?: boolean;
}

/**
 * package lock parser
 */
export class PackageLockParser {
  type: LockfileType;
  dependenciesMap:Record<string, Record<string, PackageLockDep>>;

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
      throw new Error(
        'package-lock.json parsing failed with '
              + `error ${(e as Error).message}`,
      );
    }
  }

  /**
     * getDependentNpmPackage()
     */
   public getDependentPackage = (packageName: string, packageVersion: string,
     lockFileContents: string): Record<string, Record<string, PackageLockDep>> | undefined => {
     const lockFileDependenciesMap = this.parseLockFile(lockFileContents);
     for (const dependency of Object.keys(lockFileDependenciesMap.dependencies!)) {
       if (_.isEmpty(this.dependenciesMap[dependency])) {
         if (dependency === packageName) {
           this.dependenciesMap[packageName] = {};
           this.dependenciesMap[dependency][packageName] = lockFileDependenciesMap.dependencies![dependency];
         }
         this.dfs(dependency, lockFileDependenciesMap, packageName, '');
       }
     }
     return this.dependenciesMap;
   };

   private getDependencyObj = (dependency: string, lockFileDependenciesMap: PackageLock, parent: string): PackageLockDep => {
     const dependencyObj = lockFileDependenciesMap.dependencies![dependency];
     console.log(Object.keys(lockFileDependenciesMap.dependencies!).filter(ans => ans.includes('json')));
     if (_.isEmpty(dependencyObj)) {
       // should be present here
       console.log('parent', parent);
       console.log('dependnecy', dependency);
       console.log('depenndeyObj', dependencyObj);
       console.log('depenndeyObjActual', lockFileDependenciesMap.dependencies![dependency]);
       const parentDependencyObj = lockFileDependenciesMap.dependencies![parent]!.dependencies![dependency];
       return parentDependencyObj;
     }
     return dependencyObj;
   }

   /**
     * traverses dependency tree
     */
   private dfs = (dependency: string, lockFileDependenciesMap: PackageLock,
     dependencyToSearch: string, parent: string): void => {
     const dependencyObj = this.getDependencyObj(dependency, lockFileDependenciesMap, parent);
     if (!_.isEmpty(dependencyObj) && !_.isEmpty(dependencyObj.requires)) {
       const dependencyObjDeps = dependencyObj.requires!;
       if (!_.isEmpty(dependencyObjDeps)) {
         for (const nestedDependency of Object.keys(dependencyObjDeps)) {
           if (nestedDependency === dependencyToSearch || !_.isEmpty(this.dependenciesMap[nestedDependency]?.[dependencyToSearch])) {
             const payload = lockFileDependenciesMap.dependencies![dependencyToSearch];
             this.dependenciesMap[dependency] = {};
             this.dependenciesMap[dependency][dependencyToSearch] = payload ?? this.dependenciesMap[nestedDependency][dependencyToSearch];
             return;
           }
           if (_.isEmpty(this.dependenciesMap[nestedDependency]?.[dependencyToSearch])) {
             this.dfs(nestedDependency, lockFileDependenciesMap, dependencyToSearch, dependency);
           }
         }
       }
     }
   }
}
