const subcommand = 'add'
const category = 'storage'

module.exports = {
  name: subcommand,
  run: async (context) => {
  	const {awsmobile} = context;
  	
  	return awsmobile.serviceSelectionPrompt(context, category)
  		.then((result) => awsmobile.addResource(context, result.provider, result.service, category));
   }
}
