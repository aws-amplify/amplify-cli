const codeGen = require('../../src/index')

const featureName = 'generate-ops'

module.exports = {
  name: featureName,
  run: async (context) => {
    try {
      const forceDownloadSchema = context.parameters.options.download || false
      await codeGen.generateAllOps(context, forceDownloadSchema)
    } catch (ex) {
      context.print.info(ex)
      process.exit(1)
    }
  },
}
