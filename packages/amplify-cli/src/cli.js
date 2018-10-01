const fs = require('fs-extra');
const { build } = require('gluegun');
const path = require('path');
const globalPrefix = require('./lib/global-prefix');

async function run(argv) {
  const localNodeModulesDirPath = getLocalNodeModulesDirPath();
  const globalNodeModulesDirPath = globalPrefix.getGlobalNodeModuleDirPath();

  const cli = build()
    .brand('amplify')
    .src(__dirname)
    .plugins(localNodeModulesDirPath, { matching: 'amplify-*', hidden: false })
    .plugins(globalNodeModulesDirPath, { matching: 'amplify-*', hidden: false })
    .version() // provides default for version, v, --version, -v
    .create();

  normalizeArgv(cli, argv);

  // and run it
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
  } while (true);

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
