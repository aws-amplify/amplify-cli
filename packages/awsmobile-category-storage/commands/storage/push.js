const subcommand = 'push'
const category = 'storage'

module.exports = {
  name: subcommand,
  run: async (context) => {
  	const {awsmobile, parameters} = context;
  	let resourceName = parameters.first;
  	
  	return awsmobile.pushResources(context, category, resourceName);
   }
}