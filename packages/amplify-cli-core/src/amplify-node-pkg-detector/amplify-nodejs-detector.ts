import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { AmplifyError } from '../errors/amplify-error';
import { AmplifyFault } from '../errors/amplify-fault';
import { getPackageManager, PackageManager } from '../utils/packageManager';
import { Lockfile, LockfileParser } from './lock-file-interface';
import { PackageJson } from './lock-file-types';
import { LockFileParserFactory } from './parser-factory';

/**
 * return type of detectAffectedDirectDependencies
 */
type DetectedDependencies = {
  packageName: string;
  dependentPackage:{
    name: string,
    version: string,
  }
}

/**
 * props required by amplify detector
 */
export type AmplifyNodePkgDetectorProps = {
    projectRoot: string,
    dependencyToSearch: string,
  }

/**
 * Amplify Node lock file dependency detector
 * detects packages depending on pkg passed to Engine
 * by parsing lock files
 */
export class AmplifyNodePkgDetector {
     private readonly packageManager: PackageManager | null;
     private readonly dependencyToSearch: string;
     private readonly pkgJsonObj: PackageJson;
     private readonly lockFileContents: string;
     private readonly lockFileParser: LockfileParser;

     constructor(amplifyDetectorProps: AmplifyNodePkgDetectorProps) {
       this.packageManager = getPackageManager(amplifyDetectorProps.projectRoot);
       if (this.packageManager === null) {
         throw new AmplifyError('MissingOverridesInstallationRequirementsError', {
           message: 'No package manager found.',
           resolution: 'Install npm or yarn to compile overrides for this project.',
         });
       }
       this.pkgJsonObj = this.parsePkgJson(amplifyDetectorProps.projectRoot);
       this.dependencyToSearch = amplifyDetectorProps.dependencyToSearch;
       this.lockFileContents = this.getFileContent(amplifyDetectorProps.projectRoot);
       this.lockFileParser = LockFileParserFactory.getLockFileParser(this.packageManager!.packageManager);
     }

     /**
      * parses lock file
      */
     parseLockFile():Lockfile {
       return this.lockFileParser.parseLockFile(this.lockFileContents);
     }

     /**
    * parses package.json project files
    */
     private parsePkgJson = (projectRoot: string): PackageJson => {
       const pkgJsonFullPath = path.resolve(projectRoot, 'package.json');
       return <PackageJson>JSON.parse(fs.readFileSync(pkgJsonFullPath, 'utf-8'));
     }

     /**
      * get file content as string
      */
     private getFileContent = (projectRoot: string) : string => {
       const lockFileFullPath = path.resolve(projectRoot, this.packageManager!.lockFile);
       if (!fs.existsSync(lockFileFullPath)) {
         throw new AmplifyFault('FileNotFoundFault', {
           message: 'Lockfile not found at location: ${lockFileFullPath}',
         });
       }
       return fs.readFileSync(lockFileFullPath, 'utf-8');
     };

     /**
     * returns  explicit dependencies from package.json if lock file package depends on passed dependency else undefined
     */
     detectAffectedDirectDependencies(): Array<DetectedDependencies> | undefined {
       const allPackagesWithDependency = this.lockFileParser.getDependentPackage(this.dependencyToSearch, this.lockFileContents);
       const explicitDependencies = Object.keys(allPackagesWithDependency!).map(pkg => {
         if (Object.keys(this.pkgJsonObj.dependencies).includes(pkg)) {
           const obj: DetectedDependencies = {
             packageName: pkg,
             dependentPackage: {
               name: this.dependencyToSearch,
               version: allPackagesWithDependency![pkg][this.dependencyToSearch].version,

             },
           };
           return obj;
         }
         return undefined;
       }).filter(key => !!key);
       if (!_.isEmpty(explicitDependencies)) {
         return explicitDependencies as Array<DetectedDependencies>;
       }
       return undefined;
     }
}
