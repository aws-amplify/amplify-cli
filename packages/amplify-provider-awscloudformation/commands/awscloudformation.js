module.exports = {
  name: 'awscloudformation',
  alias: ['awscfn', 'aws'],
  run: async (context) => {
    const { print } = context;
    print.info('awscfn///');
  },
};
