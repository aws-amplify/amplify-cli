
module.exports = {
  name: 'test',
  run: async (context) => {
    console.log(context.runtime.plugins);
    console.log(Object.prototype.toString.call(context.runtime.plugins));
  },
};

