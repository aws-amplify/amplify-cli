module.exports = {
  name: 'android',
  run: async (context) => {
    const { print } = context;
    print.info('Android frontend plugin found');
  },
};
