
module.exports = {
  name: 'test',
  run: async (context) => {
    console.log(context.parameters); 
    // console.log(Object.prototype.toString.call(context.runtime.plugins));
  },
};

