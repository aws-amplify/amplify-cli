import { PackageRequest, PackageResult } from 'amplify-function-plugin-interface';
import archiver from 'archiver';
import { getPipenvDir } from './pyUtils';
import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';

// packages python lambda functions and writes the archive to the specified file
export async function pythonPackage(context: any, params: PackageRequest): Promise<PackageResult> {
  if (!params.lastPackageTimeStamp || params.lastBuildTimeStamp > params.lastPackageTimeStamp || params.currentHash) {
    // zip source and dependencies and write to specified file
    const file = fs.createWriteStream(params.dstFilename);
    const packageHash = await context.amplify.hashDir(params.srcRoot, ['dist']);
    const zip = archiver.create('zip', {});

    if (params.service) {
      return new Promise(async (resolve, reject) => {
        file.on('close', () => {
          resolve({ packageHash });
        });
        file.on('error', () => {
          reject(new Error('Failed to zip code.'));
        });

        const libGlob = glob.sync(await getPipenvDir(params.srcRoot));
        const layerDirPath = path.join(params.srcRoot, '../../');
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
            `${libs} sub director${plural} found in both "/lib" and "/opt". These folders will be merged and the files in "/opt" will take precedence if a conflict exists.`,
          );
        }

        zip.pipe(file);
        [optPath, ...libGlob]
          .filter(folder => fs.lstatSync(folder).isDirectory())
          .forEach(folder =>
            zip.directory(
              folder,
              // opt files need to be in the root of the zipped dir
              path.basename(folder) === 'opt' ? false : path.basename(folder),
            ),
          );
        zip.finalize();
      });
    } else {
      return new Promise(async (resolve, reject) => {
        file.on('close', () => {
          resolve({ packageHash });
        });
        file.on('error', err => {
          reject(new Error(`Failed to zip with error: [${err}]`));
        });
        zip.pipe(file);
        zip.glob('**/*', {
          // TODO potentially get 'src' as an input from template breadcrumb
          cwd: path.join(params.srcRoot, 'src'),
          ignore: ['**/dist/**', '**/__pycache__/**'],
        });
        zip.directory(await getPipenvDir(params.srcRoot), false);
        zip.finalize();
      });
    }
  }
  return Promise.resolve({});
}
