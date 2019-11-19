module.exports = {
  name: 'ios',
  run: async context => {
    const { print } = context;
    print.info('iOS front-end plugin enabled.');
  },
};
