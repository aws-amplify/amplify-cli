import * as fs from 'fs-extra';
import * as path from 'path';
import {
  Extractor,
  ExtractorConfig
} from '@microsoft/api-extractor';

const configTemplatePath = path.join(__dirname, 'api-extractor.json');

const extractApi = (packagePath: string): void => {
  const hasTypeScript = fs.pathExistsSync(path.join(packagePath, 'tsconfig.json'));
  const hasEntryPoint = fs.pathExistsSync(path.join(packagePath, 'lib', 'index.js'));
  if (!hasTypeScript || !hasEntryPoint) {
    console.log('Skipping ' + packagePath);
    return;
  } else {
    console.log('Extracting ' + packagePath)
  }

  const pkgConfigPath = path.join(packagePath, 'api-extractor.json');
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
    const tmpPath = path.join(packagePath, 'temp');
    if (fs.pathExistsSync(tmpPath)) {
      fs.removeSync(tmpPath);
    }
    fs.removeSync(pkgConfigPath);
  }
}

extractApi(process.cwd());
