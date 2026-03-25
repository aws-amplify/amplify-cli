import { parseResourceMappings } from '../../../../commands/gen2-migration/refactor/legacy-custom-resource';
import fs from 'fs-extra';

jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('parseResourceMappings', () => {
  afterEach(() => jest.restoreAllMocks());

  it('parses valid resource mappings file', async () => {
    const mappings = [{ Source: { StackName: 'src', LogicalResourceId: 'A' }, Destination: { StackName: 'dst', LogicalResourceId: 'B' } }];
    mockFs.pathExists.mockResolvedValue(true as never);
    mockFs.readFile.mockResolvedValue(JSON.stringify(mappings) as never);

    const result = await parseResourceMappings('file:///path/to/mappings.json');
    expect(result).toEqual(mappings);
  });

  it('throws when path does not start with file://', async () => {
    await expect(parseResourceMappings('/path/to/file.json')).rejects.toThrow('must start with file://');
  });

  it('throws when path after file:// is empty', async () => {
    await expect(parseResourceMappings('file://')).rejects.toThrow('Invalid resource mappings path');
  });

  it('throws when file does not exist', async () => {
    mockFs.pathExists.mockResolvedValue(false as never);
    await expect(parseResourceMappings('file:///nonexistent.json')).rejects.toThrow('not found');
  });

  it('throws when file contains invalid JSON', async () => {
    mockFs.pathExists.mockResolvedValue(true as never);
    mockFs.readFile.mockResolvedValue('not json' as never);
    await expect(parseResourceMappings('file:///bad.json')).rejects.toThrow('Failed to parse JSON');
  });

  it('throws when structure is invalid', async () => {
    mockFs.pathExists.mockResolvedValue(true as never);
    mockFs.readFile.mockResolvedValue(JSON.stringify([{ bad: 'shape' }]) as never);
    await expect(parseResourceMappings('file:///invalid.json')).rejects.toThrow('Invalid resource mappings structure');
  });
});
