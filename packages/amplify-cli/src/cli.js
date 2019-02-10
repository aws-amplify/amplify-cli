const fs = require('fs-extra');
const { build } = require('gluegun');
const path = require('path');
const globalPrefix = require('./lib/global-prefix');

const MIGRATE = 'migrate';

async function run(argv) {
  const localNodeModulesDirPath = getLocalNodeModulesDirPath();
  const globalNodeModulesDirPath = globalPrefix.getGlobalNodeModuleDirPath();

  console.log('The @multienv version of the CLI was an experimental and beta version of the CLI for testing purposes. We\'ve merged all the changes to the main CLI version.');
  console.log('Install the latest version of the CLI using \'npm install -g @aws-amplify/cli\'');
  process.exit(1);

  // Check for old version of projects and ask for migration steps
  const cli = build()
    .brand('amplify')
    .src(__dirname)
    .plugins(localNodeModulesDirPath, { matching: 'amplify-*', hidden: false })
    .plugins(globalNodeModulesDirPath, { matching: 'amplify-*', hidden: false })
    .version() // provides default for version, v, --version, -v
    .create();

  if (argv[2] !== MIGRATE) {
    await cli.run(MIGRATE);
  }

  normalizeArgv(cli, argv);

  const context = await cli.run(argv);

  // send it back (for testing, mostly)
  return context;
}

function getLocalNodeModulesDirPath() {
  let result;
  let baseDirPath = path.join(__dirname, '../');

  do {
    const localNMDirPath = path.join(baseDirPath, 'node_modules');
    if (fs.existsSync(localNMDirPath)) {
      result = localNMDirPath;
      break;
    } else {
      const parentDirPath = path.dirname(baseDirPath);
      if (baseDirPath === parentDirPath) {
        break;
      } else {
        baseDirPath = parentDirPath;
      }
    }
  } while (true); // eslint-disable-line

  return result;
}


function normalizeArgv(cli, argv) {
  const pluginNames = cli.plugins.map((plugin) => {
    const strs = plugin.name.split('-');
    return strs[strs.length - 1];
  });
  if (argv.length > 3) {
    if ((!pluginNames.includes(argv[2])) && pluginNames.includes(argv[3])) {
      /*eslint-disable */
      const temp = argv[2];
      argv[2] = argv[3];
      argv[3] = temp;
      /* eslint-enable */
    }
  }

  return argv;
}

module.exports = { run };
