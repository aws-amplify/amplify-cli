exports.handler = async function({ RequestType, PhysicalResourceId, ResourceProperties }) {
  switch (RequestType) {
    case 'Delete':
    case 'Update':
      return { PhysicalResourceId };
  }

  const { pipelineName } = ResourceProperties;

  const result = {
    PhysicalResourceId: `pipelineawaiter-${pipelineName}`,
  };

  return result;
};
