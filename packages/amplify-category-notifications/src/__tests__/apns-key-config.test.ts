import { prompter } from 'amplify-prompts';
import * as p8decoder from '../apns-cert-p8decoder';
import * as apnsKeyConfig from '../apns-key-config';

jest.mock('../apns-cert-p8decoder');
jest.mock('amplify-prompts');
const prompterMock = prompter as jest.Mocked<typeof prompter>;

describe('apns-key-config', () => {
  const mockBundleId = 'mockBundleId';
  const mockTeamId = 'mockTeamId';
  const mockTokenKeyId = 'mockTokenKeyId';
  const mockFilePath = 'mock_p8_file_path';
  const mockP8DecoderReturn = 'mockP8DecoderReturn';
  const mockKeyConfig = {
    BundleId: mockBundleId,
    TeamId: mockTeamId,
    TokenKeyId: mockTokenKeyId,
    TokenKey: mockP8DecoderReturn,
  };

  beforeAll(() => {
    const p8DecoderMock = p8decoder as jest.Mocked<typeof p8decoder>;
    p8DecoderMock.run.mockReturnValue(mockP8DecoderReturn);
  });

  test('p8decoder invoked', async () => {
    prompterMock.input
      .mockResolvedValueOnce(mockBundleId)
      .mockResolvedValueOnce(mockTeamId)
      .mockResolvedValueOnce(mockTokenKeyId)
      .mockResolvedValueOnce(mockFilePath);

    const result = await apnsKeyConfig.run(undefined);
    expect(p8decoder.run).toBeCalledWith(mockFilePath);
    expect(result).toMatchObject(mockKeyConfig);
  });
});
