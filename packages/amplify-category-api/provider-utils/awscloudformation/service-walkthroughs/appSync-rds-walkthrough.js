

async function serviceWalkthrough(context, defaultValuesFilename) {
  const { amplify } = context;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  let answers = {
    paths: [],
  };

  const apiNames = await askApiNames(context, allDefaultValues);
  answers = { ...answers, ...apiNames };

  return pathFlow(context, answers);
}
