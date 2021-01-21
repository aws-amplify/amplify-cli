require = require('esm')(module, { cache: false });
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { EOL } = require('os');

// Delete stale ESM cache
try {
  const cachePath = path.join(__dirname, '..', 'node_modules', '.cache', 'esm');
  if (fs.existsSync(cachePath)) {
    fs.removeSync(cachePath);
  }
} catch (e) {
  // could not delete the cache directory but don't want to fail the installation
}
console.log(EOL);
console.log(chalk.green('----------------------------------------'));
console.log(chalk.green('Successfully installed the Amplify CLI'));
console.log(chalk.green('----------------------------------------'));
console.log(EOL);

console.log(chalk.green('JavaScript Getting Started - https://docs.amplify.aws/start'));
console.log(EOL);
console.log(chalk.green('Android Getting Started - https://docs.amplify.aws/start/q/integration/android'));
console.log(EOL);
console.log(chalk.green('iOS Getting Started - https://docs.amplify.aws/start/q/integration/ios'));
console.log(EOL);
console.log(chalk.green('Flutter (Developer Preview) Getting Started - https://docs.amplify.aws/start/q/integration/flutter'));
console.log(EOL);

console.log(
  chalk.blue(
    `Amplify CLI collects anonymized usage data, which is used to help understand${EOL}\
how to improve the product. If you don't wish to send anonymized Amplify CLI${EOL}\
usage data to AWS, run `,
  ) +
    chalk.blue.italic.bgWhite('amplify configure --usage-data-off ') +
    chalk.blue(` to opt-out.${EOL}${EOL}\
Learn more - https://docs.amplify.aws/cli/reference/usage-data`),
);
console.log(EOL);

if (fs.existsSync('../lib/plugin-manager.js')) {
  require('../lib/plugin-manager').scan();
}
