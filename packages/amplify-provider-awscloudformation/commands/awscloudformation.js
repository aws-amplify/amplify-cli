module.exports = {
  name: 'awscloudformation',
  alias: ['awscfn', 'aws'],
  run: async (context) => {
  	if(/^win/.test(process.platform)) {
  		try {
  			const {run} = require(`./awscloudformation/${context.parameters.first}`);
  			return run(context);
  		} catch(e) {
  			context.print.error('Command not found');
  		}
  	}
    const { print } = context;
    print.info('awscfn///');
  },
};
