const extractArgs = context => {
  if (!context.input.options) {
    context.input.options = {};
  }

  const environmentName = context.input.options.envName || null;
  const appId = context.input.options.appId || null;
  const amplifyDir = context.input.options.amplifyDir || null;
  const srcDir = context.input.options.srcDir || null;
  const localEnvFilePath = context.input.options.localEnvFilePath || null;
  const sourceEnvName = context.input.options.sourceEnvName || null;
  const newEnvName = context.input.options.newEnvName || null;

  return {
    environmentName,
    appId,
    amplifyDir,
    srcDir,
    localEnvFilePath,
    sourceEnvName,
    newEnvName,
  };
};

module.exports = {
  extractArgs,
};
