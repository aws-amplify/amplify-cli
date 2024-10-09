import { GenerateTemplatesCommand } from './generate-templates_command';
import { runCommandAsync } from '../../../test-utils/command_runner';
import yargs, { CommandModule } from 'yargs';
import assert from 'node:assert';

const mockHandler = jest.fn();
jest.mock('../../../index', () => ({
  ...jest.requireActual('../../../index'),
  generateTemplates: (from: string, to: string) => mockHandler(from, to),
}));

describe('GenerateTemplateCommand', () => {
  it('should run command successfully', async () => {
    const parser = yargs().command(new GenerateTemplatesCommand() as unknown as CommandModule);
    await runCommandAsync(parser, 'generate-templates --from foo --to bar');
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith('foo', 'bar');
  });

  it('should fail command when arguments are not provided', async () => {
    const parser = yargs().command(new GenerateTemplatesCommand() as unknown as CommandModule);
    await assert.rejects(
      () => runCommandAsync(parser, 'generate-templates'),
      (err: Error) => {
        assert.equal(err.message, 'Missing required arguments: from, to');
        return true;
      },
    );
  });
});
