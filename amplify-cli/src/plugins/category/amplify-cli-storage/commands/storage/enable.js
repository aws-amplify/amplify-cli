const subcommand = 'enable'
const category = 'storage'

module.exports = {
  name: subcommand,
  run: async (context) => {
    const {amplify} = context;

    return amplify.enableCategory(context, category)
   }
}
