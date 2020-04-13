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

console.log(chalk.green('JavaScript Getting Started - https://aws-amplify.github.io/docs/js/start'));
console.log('\n');
console.log(chalk.green('Android Getting Started - https://aws-amplify.github.io/docs/android/start'));
console.log('\n');
console.log(chalk.green('iOS Getting Started - https://aws-amplify.github.io/docs/ios/start'));
console.log('\n');

try {
  const pluginManagerPath = path.normalize(path.join(__dirname, '../lib/plugin-manager.js'));
  if (fs.existsSync(pluginManagerPath)) {
    require(pluginManagerPath).scan();
  }
} catch (e) {
  // do nothing, scan can fail for a variaty of reasons, allow installation to finish
}
