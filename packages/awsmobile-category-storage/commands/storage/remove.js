const subcommand = 'remove'
const category = 'storage'

module.exports = {
  name: subcommand,
  run: async (context) => {
    const {awsmobile, parameters} = context;
    let resourceName = parameters.first;

    return awsmobile.removeResource(context, category);
   }
}