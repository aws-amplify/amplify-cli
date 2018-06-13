const subcommand = 'remove'
const category = 'auth'

module.exports = {
  name: subcommand,
  run: async (context) => {
    const {awsmobile, parameters} = context;
    let resourceName = parameters.first;

    return awsmobile.removeResource(context, category);
   }
}