const { getPinpointRegionMapping, getConfiguredPinpointClient } = require('../../aws-utils/aws-pinpoint');

let region = 'non-existent-region';

jest.mock('../../configuration-manager', () => ({
  loadConfiguration: jest.fn(() => ({
    region: region,
  })),
}));

jest.mock('../../aws-utils/user-agent', () => ({
  formUserAgentParam: jest.fn(),
}));

describe('getConfiguredPinpointClient', () => {
  const regionMap = getPinpointRegionMapping();
  test('return mapped region based on config', async () => {
    const { config } = await getConfiguredPinpointClient();
    expect(config.region).toBe('us-east-1');
    for (const regionKey in regionMap) {
      region = regionMap[regionKey];
      const { config } = await getConfiguredPinpointClient();
      expect(config.region).toBe(regionMap[regionKey]);
    }
  });
});
