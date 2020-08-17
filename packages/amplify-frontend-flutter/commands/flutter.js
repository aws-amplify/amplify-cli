module.exports = {
  name: 'flutter',
  run: async context => {
    const { print } = context;
    print.info('Flutter front-end plugin found');
  },
};
