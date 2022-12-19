import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { PackageManager, PackageManagerType } from '../utils/packageManager';
import { Lockfile } from './lock-file-interface';
import { PkgJsonType } from './lock-file-types';
import { PackageLockDep } from './package-lock-parser';
import { LockFileParserFactory } from './parser-factory';
import { YarnLockDependencyType } from './yarn-lock-parser';

/**
 * props required by amplify detector
 */
export type AmplifyNodeJsDetectorProps = {
    projectRoot: string,
    dependencyToSearch: string,
    dependencyVersion: string,
    packageManager: PackageManager,
  }

/**
 * Amplify Node lock file dependency detector
 * detects packages depending on pkg passed to Engine
 * by parsing lock files
 */
export class AmplifyNodePkgDetector {
     packageManager: PackageManager;
     dependencyToSearch: string;
     dependencyVersion: string;
     pkgJsonObj: PkgJsonType;
     lockFileType: PackageManagerType;
     lockFileContents: string;

     constructor(amplifyDetectorProps: AmplifyNodeJsDetectorProps) {
       this.packageManager = amplifyDetectorProps.packageManager;
       this.lockFileType = this.packageManager.packageManager;
       this.pkgJsonObj = this.parsePkgJson(amplifyDetectorProps.projectRoot);
       this.dependencyToSearch = amplifyDetectorProps.dependencyToSearch;
       this.dependencyVersion = amplifyDetectorProps.dependencyVersion;
       this.lockFileContents = this.getFileContent(amplifyDetectorProps.projectRoot);
     }

     /**
      * parses lock file
      */
     parseLockFile():Lockfile {
       return LockFileParserFactory.getLockFileParser(this.lockFileType).parseLockFile(this.lockFileContents);
     }

     /**
    * parses package.json project files
    */
     parsePkgJson = (projectRoot: string): PkgJsonType => {
       const pkgJsonFullPath = path.resolve(projectRoot, 'package.json');
       return <PkgJsonType>JSON.parse(fs.readFileSync(pkgJsonFullPath, 'utf-8'));
     }

     /**
      * get file content as string
      */
     private getFileContent = (projectRoot: string) : string => {
       const lockFileFullPath = path.resolve(projectRoot, this.packageManager.lockFile);
       console.log(lockFileFullPath);
       if (!fs.existsSync(lockFileFullPath)) {
         throw new Error(
           `   Lockfile not found at location: ${lockFileFullPath}`,
         );
       }
       return fs.readFileSync(lockFileFullPath, 'utf-8');
     };

     /**
     * returns  dependent package if lock file package depends on passed dependency else undefined
     */
     getDependentPackage(packageName: string): YarnLockDependencyType | PackageLockDep | undefined {
       // compare with pkgJson version
       const lockFileType: PackageManagerType = this.packageManager.packageManager;
       const obj = LockFileParserFactory.getLockFileParser(lockFileType)
         .getDependentPackage(this.dependencyToSearch, this.dependencyVersion, this.lockFileContents);
       return obj?.[packageName]?.[this.dependencyToSearch];
     }

  /**
      * returns a list of packages depending on dependency to search
      */

  //  getAllDependentPackages(packageName: string): Array< YarnLockDependencyType | PackageLockDep > {
  //     return Object.keys(this.dependenciesMap[packageName]).filter(pkg => {
  //         const pkg = this.dependenciesMap[pkg].dependencies;
  //     })
  //  }
}
