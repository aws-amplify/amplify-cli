module.exports = {
  name: 'aws-cloudformation',
  alias: ['awscfn'],
  run: async (context) => {
    const { print } = context;
    print.info('awscfn///');
  },
};
