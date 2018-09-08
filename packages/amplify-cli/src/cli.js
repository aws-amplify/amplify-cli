const { build } = require('gluegun');
const path = require('path');
const globalPrefix = require('global-prefix');
const yarnGlobalModules = require('yarn-global-modules');

async function run(argv) {
  const nodeModulesDirPath = path.join(__dirname, '../node_modules');
  const globalNodeModulesDirPath = getGlobalNodeModulesDirPath()

  const cli = build()
    .brand('amplify')
    .src(__dirname)
    .plugins(nodeModulesDirPath, { matching: 'amplify-*', hidden: false })
    .plugins(globalNodeModulesDirPath, { matching: 'amplify-*', hidden: false })
    .version() // provides default for version, v, --version, -v
    .create();

  normalizeArgv(cli, argv);

  // and run it
  const context = await cli.run(argv);

  // send it back (for testing, mostly)
  return context;
}

function getGlobalNodeModulesDirPath() {
  const globalNodeModulesDirPath = path.join(globalPrefix, 'lib/node_modules');
  const globalYarnModulesDirPath = path.join(yarnGlobalModules(), 'node_modules');

  // if in yarn global directory, use yarn global path
  return __dirname.includes(globalYarnModulesDirPath)
    ? path.join(yarnGlobalModules(), 'node_modules')
    : path.join(globalPrefix, 'lib/node_modules')
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
