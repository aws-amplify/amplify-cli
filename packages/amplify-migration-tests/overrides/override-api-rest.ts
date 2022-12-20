export function override(resources: any) {
  const desc = {
    'Fn::Join': [' ', ['Description', 'override', 'successful']],
  };

  resources.addCfnParameter(
    {
      type: 'String',
      description: 'Test parameter',
    },
    'DESCRIPTION',
    desc,
  );

  resources.restApi.description = { Ref: 'DESCRIPTION' };
}
