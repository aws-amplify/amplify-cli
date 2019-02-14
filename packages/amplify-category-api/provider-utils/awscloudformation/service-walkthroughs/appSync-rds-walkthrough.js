async function serviceWalkthrough(context, defaultValuesFilename, datasourceMetadata) {
  const { amplify } = context;
  const { inputs } = datasourceMetadata;

  console.log(inputs)

  const resourceQuestions = [
    {
      type: inputs[1].type,
      name: inputs[1].key,
      message: inputs[1].question,
      validate: amplify.inputValidation(inputs[1]),
    },
  ];

  console.log(resourceQuestions)


  let answers = {
    paths: [],
  };

  return resourceQuestions
}

module.exports = {
  serviceWalkthrough
}
