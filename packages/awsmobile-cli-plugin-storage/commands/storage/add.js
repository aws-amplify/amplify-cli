const subcommand = 'add'
const category = 'storage'

module.exports = {
  name: subcommand,
  run: async (context) => {
  	const {awsmobile} = context;
  	
  	return awsmobile.addResource(context, category);
   }
}
