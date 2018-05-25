const subcommand = 'add'
const category = 'storage'

module.exports = {
  name: subcommand,
  run: async (context) => {
  	const {amplify} = context;
  	
  	return amplify.addResource(context, category);
   }
}
