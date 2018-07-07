function run(context) {
  return new Promise((resolve) => {
    const projectPath = process.cwd();
    const projectName = path.basename(projectPath);

    context.exeInfo = {}; 

    context.exeInfo.projectConfig = {
        projectName,
        projectPath
    };

    context.exeInfo.metaData = {
    };

    context.exeInfo.rcData = {
    };

    scanWithFrontendHandlers(context);

    resolve(context);
  });
}

module.exports = {
  run,
};
