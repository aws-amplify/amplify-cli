const { getProjectConfig } = require('./get-project-config');
const { showResourceTable } = require('./resource-status');
const { onCategoryOutputsChange } = require('./on-category-outputs-change');
const { getProviderPlugins } = require('./get-provider-plugins');

async function pushResources(context, category, resourceName) {
  await showResourceTable(category, resourceName);

  let continueToPush = context.exeInfo.inputParams.yes; 
  if(!continueToPush){
    continueToPush = await context.prompt.confirm('Are you sure you want to continue?');
  }

  if(continueToPush){
    try{
      await providersPush(context);
      await onCategoryOutputsChange(context);
    }catch(err){
      // Handle the errors and print them nicely for the user.
      context.print.error(`\n${err.message}`);
    };
  }
  
  return context; 
}

function providersPush(context, category, resourceName){
  const { providers } = context.exeInfo.projectConfig; 
  const providerPlugins = getProviderPlugins(context);
  const providerPromises = [];

  providers.forEach((provider) => {
    const providerModule = require(providerPlugins[provider]);
    providerPromises.push(providerModule.pushResources(context, category, resourceName));
  });

  return Promise.all(providerPromises);
}

module.exports = {
  pushResources,
};
