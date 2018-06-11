const { build } = require('gluegun')

/**
 * Create the cli and kick it off
 */
async function run (argv) {
  // create a CLI runtime

  let nodeModuleDir = __dirname + '/../node_modules'; 
  let pluginDir = __dirname + '/../../';

  const cli = build()
    .brand('awsmobile')
    .src(__dirname)
    .plugins(nodeModuleDir, { matching: 'awsmobile-*', hidden: false })
    // .plugins(nodeModuleDir, { matching: 'awsmobile-provider-*', hidden: true })
    // .plugins(nodeModuleDir, { matching: 'awsmobile-frontend-*', hidden: true })
    .plugins(pluginDir, { matching: 'awsmobile-category-*', hidden: true })
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .create()

  // and run it
  const context = await cli.run(argv)

  // send it back (for testing, mostly)
  return context
}

module.exports = { run }
