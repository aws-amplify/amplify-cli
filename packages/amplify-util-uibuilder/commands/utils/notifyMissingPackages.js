const fs = require('fs-extra');
const path = require('path');
const { extractArgs } = require('./extractArgs');
const REQUIRED_PACKAGES = ['@aws-amplify/ui-react', 'aws-amplify'];

const notifyMissingPackages = context => {
  const args = extractArgs(context);
  const localEnvFilePath = args.localEnvFilePath ? args.localEnvFilePath : context.amplify._pathManager.getLocalEnvFilePath();
  const localEnvJson = JSON.parse(fs.readFileSync(localEnvFilePath).toString());
  const packageJsonPath = path.join(localEnvJson.projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return;
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
  REQUIRED_PACKAGES.forEach(packageName => {
    const packageIsInstalled = Object.keys(packageJson.dependencies).includes(packageName);
    if (!packageIsInstalled) {
      console.warn(
        `UIBuilder components required "${packageName}" that is not in your package.json. Please run \`npm install ${packageName}\``,
      );
    }
  });
};

module.exports = {
  notifyMissingPackages,
};
