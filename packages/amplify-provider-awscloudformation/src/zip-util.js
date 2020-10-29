const extract = require('extract-zip');
const fs = require('fs-extra');
const path = require('path');

function downloadZip(s3, tempDir, zipFileName, envName) {
  return new Promise((resolve, reject) => {
    s3.getFile(
      {
        Key: zipFileName,
      },
      envName,
    ).then((objectResult, objectError) => {
      if (objectError) {
        reject(objectError);
        return;
      }

      fs.ensureDirSync(tempDir);

      const buff = Buffer.from(objectResult);
      const tempfile = `${tempDir}/${zipFileName}`;

      fs.writeFile(tempfile, buff, err => {
        if (err) {
          reject(err);
          return;
        }
        resolve(tempfile);
      });
    });
  });
}

async function extractZip(tempdir, zipFile) {
  const filenameext = path.basename(zipFile);
  const filename = filenameext.split('.')[0];
  const unzippedDir = path.join(tempdir, filename);

  await extract(zipFile, { dir: unzippedDir });

  return unzippedDir;
}

module.exports = {
  downloadZip,
  extractZip,
};
