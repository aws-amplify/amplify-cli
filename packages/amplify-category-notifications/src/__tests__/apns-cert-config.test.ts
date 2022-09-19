/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable spellcheck/spell-checker */
import * as apnsCertConfig from '../apns-cert-config';
import * as p12decoder from '../apns-cert-p12decoder';
import { ICertificateInfo } from '../apns-cert-p12decoder';

const inquirer = require('inquirer');
const mockirer = require('mockirer');

jest.mock('../apns-cert-p12decoder');

describe('apns-cert-config', () => {
  const mockFilePath = 'mock_p12_file_path';
  const mockPassword = 'mock_password';

  const mockAnswers = {
    P12FilePath: mockFilePath,
    P12FilePassword: mockPassword,
  };
  const mockP12DecoderReturn = {};

  beforeAll(() => {
    mockirer(inquirer, mockAnswers);
    const p12DecoderMock = p12decoder as jest.Mocked<typeof p12decoder>;
    p12DecoderMock.run.mockReturnValue(mockP12DecoderReturn as unknown as ICertificateInfo);
  });

  beforeEach(() => {});

  test('p12decoder invoked', async () => {
    const result = await apnsCertConfig.run(undefined);
    expect(p12decoder.run).toBeCalledWith(mockAnswers);
    expect(result).toBe(mockP12DecoderReturn);
  });
});
