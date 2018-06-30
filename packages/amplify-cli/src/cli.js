const { build } = require('gluegun');
const path = require('path'); 
const globalPrefix = require('global-prefix');

async function run(argv) {
  const nodeModulesDirPath = path.join(__dirname, '../node_modules'); 
  const globalNodeModulesDirPath = path.join(globalPrefix, 'lib/node_modules'); 
  
  const cli = build()
    .brand('amplify')
    .src(__dirname)
    .plugins(nodeModulesDirPath, { matching: 'amplify-*', hidden: false })
    .plugins(globalNodeModulesDirPath, { matching: 'amplify-*', hidden: false })
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .create();

  // and run it
  const context = await cli.run(argv);

  // send it back (for testing, mostly)
  return context;
}

module.exports = { run };
