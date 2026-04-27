import execa from 'execa';
import { Logger } from './logger';

export class Git {
  constructor(private readonly cwd: string, private readonly logger: Logger) {}

  public async checkout(branch: string, create: boolean): Promise<void> {
    await this.commit(`commit prior to switching to ${branch}`);
    const args = create ? ['-b', branch] : [branch];
    await this.run('checkout', ...args);
  }

  public async commit(message: string): Promise<void> {
    await this.run('add', '.');
    await this.run('commit', '--allow-empty', '-m', message);
  }

  public async init(): Promise<void> {
    await this.run('init', '--initial-branch=main');
  }

  public async diff(): Promise<void> {
    this.logger.info('git diff');
    await execa('git', ['--no-pager', 'diff'], { cwd: this.cwd, stdio: 'inherit' });
  }

  public async run(...args: string[]): Promise<void> {
    this.logger.info(`git ${args.join(' ')}`);
    await execa('git', args, { cwd: this.cwd });
  }
}
