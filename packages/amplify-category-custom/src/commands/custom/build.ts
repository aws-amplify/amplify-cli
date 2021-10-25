import { buildCustomResources } from '../../utils/build-custom-resources';

module.exports = {
  name: 'build',
  run: async (context: any) => {
    const { parameters } = context;
    const resourceName = parameters.first;

    await buildCustomResources(context, resourceName);
  },
};
