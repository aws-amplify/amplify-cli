import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import { PackageRequest, PackageResult } from 'amplify-function-plugin-interface/src';

export const packageAssemblies = async (request: PackageRequest, context: any): Promise<PackageResult> => {
  const distPath = path.join(request.srcRoot, 'dist');

  if (fs.existsSync(request.dstFilename)) {
    fs.removeSync(request.dstFilename);
  }

  const zipFile = path.basename(request.dstFilename);
  const packageHash = (await context.amplify.hashDir(distPath, [])) as string;
  const output = fs.createWriteStream(request.dstFilename);

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve({ packageHash });
    });

    output.on('error', err => {
      reject(new Error(`Failed to zip with error: [${err}]`));
    });

    const zip = archiver.create('zip', {});

    zip.pipe(output);
    zip.glob('**', {
      cwd: distPath,
      ignore: [zipFile],
    });
    zip.finalize();
  });
};
