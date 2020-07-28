const loadConfig = require('../codegen-config');
const configureProjectWalkThrough = require('../walkthrough/configure');
const add = require('./add');

async function configure(context) {
  let withoutInit = false;
  try {
    context.amplify.getProjectMeta();
  } catch (e) {
    withoutInit = true;
  }
  const config = loadConfig(context, withoutInit);
  if (!config.getProjects().length) {
    await add(context);
    return;
  }
  const project = await configureProjectWalkThrough(context, config.getProjects(), withoutInit);
  config.addProject(project);
  config.save();
  console.log('Amplify codegen configured. Remember to run `amplify codegen` to rerun the codegen.')
}

module.exports = configure;
