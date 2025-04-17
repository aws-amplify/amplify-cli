import { Gen2ExecuteCommand } from './execute_command';
import { runCommandAsync } from '../../../test-utils/command_runner';
import yargs, { CommandModule } from 'yargs';
import assert from 'node:assert';
import { ResourceMapping } from '@aws-sdk/client-cloudformation';

const mockHandler = jest.fn();
jest.mock('../../../command-handlers', () => ({
  ...jest.requireActual('../../../command-handlers'),
  executeStackRefactor: (from: string, to: string, resourceMappings?: ResourceMapping[]) => mockHandler(from, to, resourceMappings),
}));

const resourceMappings: ResourceMapping[] = [
  {
    Source: { StackName: 'gen1Stack', LogicalResourceId: 'customResourceA' },
    Destination: { StackName: 'gen2Stack', LogicalResourceId: 'customResourceA' },
  },
];

const stubReadFile = jest.fn().mockResolvedValue(JSON.stringify(resourceMappings));
jest.mock('node:fs/promises', () => ({
  readFile: () => stubReadFile(),
}));

describe('Gen2ExecuteCommand', () => {
  beforeEach(() => {
    mockHandler.mockClear();
  });

  it('should run command successfully', async () => {
    const parser = yargs().command(new Gen2ExecuteCommand() as unknown as CommandModule);
    await runCommandAsync(parser, 'execute --from foo --to bar');
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith('foo', 'bar', undefined);
  });

  it('should run command successfully with resourceMappings option', async () => {
    const parser = yargs().command(new Gen2ExecuteCommand() as unknown as CommandModule);
    await runCommandAsync(parser, 'execute --from foo --to bar --resourceMappings file://resourceMap.json');
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith('foo', 'bar', resourceMappings);
  });

  it('should fail command when resourceMappings does not start with file protocol', async () => {
    const parser = yargs().command(new Gen2ExecuteCommand() as unknown as CommandModule);
    await assert.rejects(
      () => runCommandAsync(parser, 'execute --from foo --to bar --resourceMappings resourceMap.json'),
      (err: Error) => {
        assert.equal(err.message, 'Expected resourceMap to start with file://');
        return true;
      },
    );
  });

  it('should fail command when resourceMappings only has file://', async () => {
    const parser = yargs().command(new Gen2ExecuteCommand() as unknown as CommandModule);
    await assert.rejects(
      () => runCommandAsync(parser, 'execute --from foo --to bar --resourceMappings file://'),
      (err: Error) => {
        assert.equal(err.message, 'Expected resourceMap to have a path after file://');
        return true;
      },
    );
  });

  it('should fail command when resourceMappings is invalid JSON', async () => {
    stubReadFile.mockResolvedValue('invalid json');
    const parser = yargs().command(new Gen2ExecuteCommand() as unknown as CommandModule);
    await assert.rejects(
      () => runCommandAsync(parser, 'execute --from foo --to bar --resourceMappings file://resourceMap.json'),
      (err: Error) => {
        assert.equal(
          err.message,
          'Failed to parse resourceMappings from resourceMap.json: Unexpected token \'i\', "invalid json" is not valid JSON',
        );
        return true;
      },
    );
  });

  it('should fail command when resourceMappings is not an array', async () => {
    stubReadFile.mockResolvedValue(JSON.stringify({}));
    const parser = yargs().command(new Gen2ExecuteCommand() as unknown as CommandModule);
    await assert.rejects(
      () => runCommandAsync(parser, 'execute --from foo --to bar --resourceMappings file://resourceMap.json'),
      (err: Error) => {
        assert.equal(err.message, 'Invalid resourceMappings structure');
        return true;
      },
    );
  });

  it('should fail command when resourceMappings has an invalid structure', async () => {
    const clonedResourceMappings = JSON.parse(JSON.stringify(resourceMappings)) as ResourceMapping[];
    delete clonedResourceMappings[0].Source;
    stubReadFile.mockResolvedValue(JSON.stringify(clonedResourceMappings));
    const parser = yargs().command(new Gen2ExecuteCommand() as unknown as CommandModule);
    await assert.rejects(
      () => runCommandAsync(parser, 'execute --from foo --to bar --resourceMappings file://resourceMap.json'),
      (err: Error) => {
        assert.equal(err.message, 'Invalid resourceMappings structure');
        return true;
      },
    );
  });

  it('should fail command when required arguments are not provided', async () => {
    const parser = yargs().command(new Gen2ExecuteCommand() as unknown as CommandModule);
    await assert.rejects(
      () => runCommandAsync(parser, 'execute'),
      (err: Error) => {
        assert.equal(err.message, 'Missing required arguments: from, to');
        return true;
      },
    );
  });
});
