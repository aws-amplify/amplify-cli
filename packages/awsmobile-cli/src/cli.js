const { build } = require('gluegun')

/**
 * Create the cli and kick it off
 */
async function run (argv) {
  // create a CLI runtime

  let pluginDir = __dirname + '/../../';
  let nodeModuleDir = __dirname + '/../node_modules'; 

  const cli = build()
    .brand('awsmobile')
    .src(__dirname)
    .plugins(pluginDir, { matching: 'awsmobile-cli-*', hidden: true })
    .plugins('./node_modules', { matching: 'awsmobile-cli-*', hidden: true })
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .create()

  // and run it
  const context = await cli.run(argv)

  // send it back (for testing, mostly)
  return context
}

module.exports = { run }
