import { prompter } from 'amplify-prompts';
import * as apnsCertConfig from '../apns-cert-config';
import * as p12decoder from '../apns-cert-p12decoder';
import { ICertificateInfo } from '../apns-cert-p12decoder';

jest.mock('../apns-cert-p12decoder');
jest.mock('amplify-prompts');
const prompterMock = prompter as jest.Mocked<typeof prompter>;

describe('apns-cert-config', () => {
  const mockFilePath = 'mock_p12_file_path';
  const mockPassword = 'mock_password';

  const mockAnswers = {
    P12FilePath: mockFilePath,
    P12FilePassword: mockPassword,
  };
  const mockP12DecoderReturn = {};

  beforeAll(() => {
    const p12DecoderMock = p12decoder as jest.Mocked<typeof p12decoder>;
    p12DecoderMock.run.mockReturnValue(mockP12DecoderReturn as unknown as ICertificateInfo);
  });

  test('p12decoder invoked', async () => {
    prompterMock.input
      .mockResolvedValueOnce(mockFilePath)
      .mockResolvedValueOnce(mockPassword);

    const result = await apnsCertConfig.run(undefined);
    expect(p12decoder.run).toBeCalledWith(mockAnswers);
    expect(result).toBe(mockP12DecoderReturn);
  });
});
