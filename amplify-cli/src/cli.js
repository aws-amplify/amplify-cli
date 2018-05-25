const { build } = require('gluegun')

/**
 * Create the cli and kick it off
 */
async function run (argv) {
  // create a CLI runtime

  let pluginDir = __dirname + '/plugins/category';
  let nodeModuleDir = __dirname + '/../node_modules';  


  const cli = build()
    .brand('amplify')
    .src(__dirname)
    .plugins(pluginDir, { matching: 'amplify-cli-*', hidden: true })
    //.plugins(nodeModuleDir, { matching: 'amplify-cli-*', hidden: true })
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .create();

  // and run it
  const context = await cli.run(argv);

  // send it back (for testing, mostly)
  return context;
}

module.exports = { run }
