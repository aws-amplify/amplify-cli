import * as fs from 'fs-extra';
import * as path from 'path';
import { AmplifyError } from '../errors/amplify-error';
import { AmplifyFault } from '../errors/amplify-fault';
import { getPackageManager, PackageManager } from '../utils/packageManager';
import { LockfileParser } from './lock-file-interface';
import { PackageJson } from './lock-file-types';
import { LockFileParserFactory } from './parser-factory';

/**
 * return type of detectAffectedDirectDependencies
 */
export type DetectedDependency = {
  packageName?: string;
  dependentPackage?:{
    name: string,
    version: string,
  }
}

/**
 * props required by amplify detector
 */
export type AmplifyNodePkgDetectorProps = {
    projectRoot: string,
  }

/**
 * Amplify Node lock file dependency detector
 * detects packages depending on pkg passed to Engine
 * by parsing lock files
 */
export class AmplifyNodePkgDetector {
     private readonly packageManager: PackageManager;
     private readonly pkgJsonObj: PackageJson;
     private readonly lockFileContents: string;
     private readonly lockFileParser: LockfileParser;

     constructor(amplifyDetectorProps: AmplifyNodePkgDetectorProps) {
       const packageManager = getPackageManager(amplifyDetectorProps.projectRoot);
       if (packageManager === null) {
         throw new AmplifyError('MissingOverridesInstallationRequirementsError', {
           message: 'No package manager found.',
           resolution: 'Install npm or yarn to compile overrides for this project.',
         });
       }
       this.packageManager = packageManager;
       this.pkgJsonObj = this.parsePkgJson(amplifyDetectorProps.projectRoot);
       this.lockFileContents = this.getLockFileContent(amplifyDetectorProps.projectRoot);
       this.lockFileParser = LockFileParserFactory.getLockFileParser(this.packageManager.packageManager);
     }

     /**
    * parses package.json project files
    */
     private parsePkgJson = (projectRoot: string): PackageJson => {
       const pkgJsonFullPath = path.resolve(projectRoot, 'package.json');
       return <PackageJson>JSON.parse(fs.readFileSync(pkgJsonFullPath, 'utf-8'));
     }

     /**
      * get lock file content as string
      */
     private getLockFileContent = (projectRoot: string) : string => {
       const lockFileFullPath = path.join(projectRoot, this.packageManager.lockFile);
       if (!fs.existsSync(lockFileFullPath)) {
         throw new AmplifyFault('LockFileNotFoundFault', {
           message: `Lockfile not found at location: ${lockFileFullPath}`,
         });
       }
       return fs.readFileSync(lockFileFullPath, 'utf-8');
     };

     /**
     * returns  explicit dependencies from package.json if lock file package depends on passed dependency else []
     */
     public detectAffectedDirectDependencies = (dependencyToSearch: string): Array<DetectedDependency> | [] => {
       let explicitDependencies = new Array<DetectedDependency>();
       const allPkgJsonDependencies = Object.assign(this.pkgJsonObj.dependencies, this.pkgJsonObj.peerDependencies);
       const allPackagesWithDependency = this.lockFileParser.getDependentPackageMap(dependencyToSearch, this.lockFileContents);
       if (allPackagesWithDependency !== undefined) {
         explicitDependencies = Object.keys(allPackagesWithDependency).map(pkg => {
           if (allPkgJsonDependencies[pkg]) {
             const obj: DetectedDependency = {
               packageName: pkg,
               dependentPackage: {
                 name: dependencyToSearch,
                 version: allPackagesWithDependency[pkg][dependencyToSearch].version,

               },
             };
             return obj;
           }
           return {};
         }).filter(value => Object.keys(value).length !== 0);
       }
       return explicitDependencies;
     }
}
