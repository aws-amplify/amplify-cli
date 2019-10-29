const inquirer = require('inquirer');
const mockirer = require('mockirer');
const p8decoder = require('../../lib/p8decoder');

const apnsKeyConfig = require('../../lib/apns-key-config');

describe('apns-key-config', () => {
  const mockBundleId = 'mockBundleId';
  const mockTeamId = 'mockTeamId';
  const mockTokenKeyId = 'mockTokenKeyId';
  const mockFielPath = 'mock_p8_file_path';

  const mockKeyConfig = {
    BundleId: mockBundleId,
    TeamId: mockTeamId,
    TokenKeyId: mockTokenKeyId,
    P8FilePath: mockFielPath,
  };
  const mockP8DecoderReturn = 'mockP8DecoderReturn';

  beforeAll(() => {
    mockirer(inquirer, mockKeyConfig);
    p8decoder.run = jest.fn();
    p8decoder.run.mockReturnValue(mockP8DecoderReturn);
  });

  beforeEach(() => {});

  test('p8decoder invoked', async () => {
    const result = await apnsKeyConfig.run();
    expect(p8decoder.run).toBeCalledWith(mockFielPath);
    expect(result).toBe(mockKeyConfig);
  });
});
