import { PackageRequest, PackageResult, ZipEntry } from 'amplify-function-plugin-interface';
import * as fs from 'fs-extra';
import glob from 'glob';
import * as path from 'path';
import { execAsStringPromise, getPipenvDir, getPythonBinaryName, majMinPyVersion } from './pyUtils';

// packages python lambda functions and writes the archive to the specified file
export async function pythonPackage(context: any, params: PackageRequest): Promise<PackageResult> {
  if (!params.lastPackageTimeStamp || params.lastBuildTimeStamp > params.lastPackageTimeStamp || params.currentHash) {
    const packageHash = await context.amplify.hashDir(params.srcRoot, ['dist']);
    const zipEntries: ZipEntry[] = [];
    if (params.service) {
      const pyBinary = getPythonBinaryName();
      const pyVersion = await execAsStringPromise(`${pyBinary} --version`);
      const layerPythonPath = path.join(params.srcRoot, 'lib', 'python' + majMinPyVersion(pyVersion), 'site-packages');
      const pipEnvDir = await getPipenvDir(params.srcRoot);
      // copy from virtualenv to layer path to maintain layer required structure
      fs.copySync(pipEnvDir, layerPythonPath, { overwrite: true });
      const libGlob = glob.sync(path.join(params.srcRoot, '..'));
      const layerDirPath = path.join(params.srcRoot, '..', '..');
      const optPath = path.join(layerDirPath, 'opt');

      let conflicts: string[] = [];
      libGlob.forEach(lib => {
        const basename = path.basename(lib);
        if (fs.pathExistsSync(path.join(optPath, basename))) {
          conflicts.push(basename);
        }
      });

      if (conflicts.length > 0) {
        const libs = conflicts.map(lib => `"/${lib}"`).join(', ');
        const plural = conflicts.length > 1 ? 'ies' : 'y';
        context.print.warning(
          `${libs} subdirector${plural} found in both "/lib" and "/opt". These folders will be merged and the files in "/opt" will take precedence if a conflict exists.`,
        );
      }

      [optPath, ...libGlob].forEach(folder => {
        if (fs.lstatSync(folder).isDirectory()) {
          zipEntries.push({ packageFolder: folder });
        }
      });
    } else {
      zipEntries.push({
        sourceFolder: path.join(params.srcRoot, 'src'),
        packageFolder: await getPipenvDir(params.srcRoot),
        ignoreFiles: ['**/dist/**', '**/__pycache__/**'],
      });
    }
    return Promise.resolve({ packageHash, zipEntries });
  }
  return Promise.resolve({});
}
