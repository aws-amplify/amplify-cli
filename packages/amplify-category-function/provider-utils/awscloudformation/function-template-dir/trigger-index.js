exports.handler = async () => {
  const modules = process.env.MODULES.split();
  for (let i = 0; i < modules.length; i += 1) {
    const { handler } = require(modules[i]);
    handler();
  }
};
