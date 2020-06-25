require = require('esm')(module, { cache: false });
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

// Delete stale ESM cache
try {
  const cachePath = path.join(__dirname, '..', 'node_modules', '.cache', 'esm');
  if (fs.existsSync(cachePath)) {
    fs.removeSync(cachePath);
  }
} catch (e) {
  // could not delete the cache directory but don't want to fail the installation
}
console.log('\n');
console.log(chalk.green('----------------------------------------'));
console.log(chalk.green('Successfully installed the Amplify CLI'));
console.log(chalk.green('----------------------------------------'));
console.log('\n');

console.log(chalk.green('JavaScript Getting Started - https://docs.amplify.aws/start'));
console.log('\n');
console.log(chalk.green('Android Getting Started - https://docs.amplify.aws/start/q/integration/android'));
console.log('\n');
console.log(chalk.green('iOS Getting Started - https://docs.amplify.aws/start/q/integration/ios'));
console.log('\n');

if (fs.existsSync('../lib/plugin-manager.js')) {
  require('../lib/plugin-manager').scan();
}
