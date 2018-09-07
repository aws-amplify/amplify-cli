const codeGen = require('../../src/index')

const featureName = 'add'

module.exports = {
  name: featureName,
  run: async (context) => {
    try {
      await codeGen.add(context)
    } catch (ex) {
      // context.print.error(ex.message)
      context.print.error(ex)
    }
  },
}
