module.exports = {
  name: 'awscfn',
  run: async (context) => {
    const { print } = context;
    print.info('awscfn///');
  },
};
