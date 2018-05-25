var fs = require('fs');
var pathManager = require('./path-manager');
var configureProvider = require('./configure-provider').configureProvider;

function enableCategory(context, category) {
  const {print} = context;
  // Add check for configs- access/secret Keys - if not present prompt the user to enter them
  let configure = context.parameters.options.configure;

  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  let projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
  let defaultProviders = projectConfig.defaultProviders;

  if(configure) {
    return configureProvider(context)
      .then((answers) => {
        updateCategoryConfig(projectConfig, projectConfigFilePath, category, answers.providers)
        print.success("Successfully enabled " + category + " with the providers - " + answers.providers)
      });
  } else {
      updateCategoryConfig(projectConfig, projectConfigFilePath, category, defaultProviders)
      print.success("Successfully enabled " + category + " with default providers - " + defaultProviders);
  }
}

function updateCategoryConfig(projectConfig,projectConfigFilePath, category, providers) {
  let defaultProvider = projectConfig.defaultProvider;

  projectConfig.category[category] = {
    providers: providers,
    enabled: true
  };

  let jsonString = JSON.stringify(projectConfig, null, '\t');

  fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');

}

module.exports = {
    enableCategory
}