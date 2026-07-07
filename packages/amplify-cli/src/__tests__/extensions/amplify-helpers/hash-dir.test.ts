import { hashDir } from '../../../extensions/amplify-helpers/hash-dir';

const sample_hash = '7jPByCYcxC1QZJJ3Kckln1TnrTY=';

jest.mock('folder-hash', () => ({
  hashElement: jest.fn().mockImplementation(async () => ({
    hash: sample_hash,
  })),
}));

describe('hash-dir', () => {
  const testDirName = 'test';
  const exclude = [];
  it('should return a hash encoded in hex', async () => {
    const hash = await hashDir(testDirName, exclude);
    const expected = Buffer.from(sample_hash).toString('hex').substr(0, 20);
    expect(hash).toBe(expected);
  });
});
