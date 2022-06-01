/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable spellcheck/spell-checker */
import * as p8decoder from '../src/apns-cert-p8decoder';
import * as apnsKeyConfig from '../src/apns-key-config';

const inquirer = require('inquirer');
const mockirer = require('mockirer');

jest.mock('../src/apns-cert-p8decoder');
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
    const p8DecoderMock = p8decoder as jest.Mocked<typeof p8decoder>;
    p8DecoderMock.run.mockReturnValue(mockP8DecoderReturn);
  });

  beforeEach(() => {});

  test('p8decoder invoked', async () => {
    const result = await apnsKeyConfig.run(undefined);
    expect(p8decoder.run).toBeCalledWith(mockFielPath);
    expect(result).toBe(mockKeyConfig);
  });
});
