import * as fs from 'fs-extra';
import * as path from 'path';
import {
  Extractor,
  ExtractorConfig
} from '@microsoft/api-extractor';

const packagesDir = path.join(__dirname, '..', 'packages');

const packages = fs.readdirSync(packagesDir)
const configTemplatePath = path.join(__dirname, 'api-extractor.json');

for (let pkg of packages) {
  const hasTypeScript = fs.pathExistsSync(path.join(packagesDir, pkg, 'tsconfig.json'));
  const hasEntryPoint = fs.pathExistsSync(path.join(packagesDir, pkg, 'lib', 'index.js'));
  if (!hasTypeScript || !hasEntryPoint) {
    console.log('Skipping ' + pkg);
    continue;
  } else {
    console.log('Extracting ' + pkg)
  }

  const pkgConfigPath = path.join(packagesDir, pkg, 'api-extractor.json');
  fs.copySync(configTemplatePath, pkgConfigPath);
  try {
    const extractorConfig = ExtractorConfig.loadFileAndPrepare(pkgConfigPath);
    Extractor.invoke(
      extractorConfig,
      {
        localBuild: true,
        showVerboseMessages: false
      });
  } finally {
    const tmpPath = path.join(packagesDir, pkg, 'temp');
    if (fs.pathExistsSync(tmpPath)) {
      fs.removeSync(tmpPath);
    }
    fs.removeSync(pkgConfigPath);
  }
}
