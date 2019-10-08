module.exports = {
  name: 'android',
  run: async context => {
    const { print } = context;
    print.info('Android front-end plugin found');
  },
};
