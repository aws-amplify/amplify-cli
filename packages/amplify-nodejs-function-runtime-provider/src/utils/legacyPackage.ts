import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { PackageRequest, PackageResult, ZipEntry } from '@aws-amplify/amplify-function-plugin-interface';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';

export async function packageResource(request: PackageRequest, context: $TSContext): Promise<PackageResult> {
  if (!request.lastPackageTimeStamp || request.lastBuildTimeStamp > request.lastPackageTimeStamp || request.currentHash) {
    const resourcePath = request.service ? path.join(request.srcRoot, '..') : path.join(request.srcRoot, 'src');
    const packageHash = !request.skipHashing ? await context.amplify.hashDir(resourcePath, ['node_modules']) : undefined;
    const zipEntries: ZipEntry[] = [];
    if (request.service) {
      const libGlob = glob.sync(resourcePath);
      const layerDirPath = path.join(request.srcRoot, '..', '..');
      const optPath = path.join(layerDirPath, 'opt');

      const conflicts: string[] = [];
      libGlob.forEach((lib) => {
        const basename = path.basename(lib);
        if (fs.pathExistsSync(path.join(optPath, basename))) {
          conflicts.push(basename);
        }
      });

      if (conflicts.length > 0) {
        const libs = conflicts.map((lib) => `"/${lib}"`).join(', ');
        const plural = conflicts.length > 1 ? 'ies' : 'y';
        context.print.warning(
          // eslint-disable-next-line spellcheck/spell-checker
          `${libs} subdirector${plural} found in both "/lib" and "/opt". These folders will be merged and the files in "/opt" will take precedence if a conflict exists.`,
        );
      }

      [...libGlob].forEach((folder) => {
        if (fs.lstatSync(folder).isDirectory()) {
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
