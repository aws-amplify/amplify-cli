const inquirer = require('inquirer');
const mockirer = require('mockirer');
const p12decoder = require('../../lib/p12decoder');

const apnsCertConfig = require('../../lib/apns-cert-config');

describe('apns-cert-config', () => {
  const mockFielPath = 'mock_p12_file_path';
  const mockPassword = 'mock_password';

  const mockAnswers = {
    P12FilePath: mockFielPath,
    P12FilePassword: mockPassword,
  };
  const mockP12DecoderReturn = {};

  beforeAll(() => {
    mockirer(inquirer, mockAnswers);
    p12decoder.run = jest.fn();
    p12decoder.run.mockReturnValue(mockP12DecoderReturn);
  });

  beforeEach(() => {});

  test('p12decoder invoked', async () => {
    const result = await apnsCertConfig.run();
    expect(p12decoder.run).toBeCalledWith(mockAnswers);
    expect(result).toBe(mockP12DecoderReturn);
  });
});
