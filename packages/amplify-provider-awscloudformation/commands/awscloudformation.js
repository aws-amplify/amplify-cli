module.exports = {
  name: 'awscloudformation',
  alias: ['awscfn'],
  run: async (context) => {
    const { print } = context;
    print.info('awscfn///');
  },
};
