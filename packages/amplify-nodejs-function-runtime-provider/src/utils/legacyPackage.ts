import fs from 'fs-extra';
import path from 'path';
import { PackageRequest, PackageResult, ZipEntry } from 'amplify-function-plugin-interface';
import glob from 'glob';

export async function packageResource(request: PackageRequest, context: any): Promise<PackageResult> {
  if (!request.lastPackageTimeStamp || request.lastBuildTimeStamp > request.lastPackageTimeStamp || request.currentHash) {
    const resourcePath = request.service ? request.srcRoot : path.join(request.srcRoot, 'src');
    const packageHash = !request.skipHashing ? ((await context.amplify.hashDir(resourcePath, ['node_modules'])) as string) : undefined;
    const zipEntries: ZipEntry[] = [];
    if (request.service) {
      const libGlob = glob.sync(resourcePath);
      const layerDirPath = path.join(request.srcRoot, '..', '..');
      const optPath = path.join(layerDirPath, 'opt');

      const conflicts: string[] = [];
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
      // opt files need to be in the root of the zipped dir
      [optPath, ...libGlob]
        .filter(folder => fs.lstatSync(folder).isDirectory())
        .forEach(folder => {
          if (path.basename(folder) === 'opt' ? false : path.basename(folder)) {
            zipEntries.push({
              packageFolder: folder,
            });
          }
        });
    } else {
      zipEntries.push({
        sourceFolder: resourcePath,
      });
    }
    return Promise.resolve({ packageHash, zipEntries });
  }
  return Promise.resolve({});
}
