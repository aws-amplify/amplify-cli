const { build } = require('gluegun');

async function run(argv) {
  const nodeModuleDir = `${__dirname}/../node_modules`;
  const cli = build()
    .brand('amplify')
    .src(__dirname)
    .plugins(nodeModuleDir, { matching: 'amplify-*', hidden: false })
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .create();

  // and run it
  const context = await cli.run(argv);

  // send it back (for testing, mostly)
  return context;
}

module.exports = { run };
