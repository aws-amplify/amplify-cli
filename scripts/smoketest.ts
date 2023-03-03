import * as execa from 'execa';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as pty from 'node-pty';
import yargs from 'yargs';

export const NPM = {
  install(pkgName: string, global: boolean = false) {
    const command = ['npm', 'install', pkgName];
    if (global) {
      command.push('-g');
    }
    execa.sync(command[0], command.slice(1), { stdio: 'inherit' });
  },
  uninstall(pkgName: string, global: boolean = false) {
    const command = ['npm', 'uninstall', pkgName];
    if (global) {
      command.push('-g');
    }
    execa.sync(command[0], command.slice(1), { stdio: 'inherit' });
  },
};

export type SmoketestArgs = {
  projectDirectory: string;
  cliVersion: string;
  destructive: boolean;
};

function getArgs(): SmoketestArgs {
  const args = yargs
    .option('destructive', {
      type: 'boolean',
      description: 'DANGEROUS: Deletes the project directory if it exists',
      default: false,
      demandOption: false,
    })
    .option('cli-version', {
      type: 'string',
      description: 'The version of @aws-amplify/cli to test',
      demandOption: true,
    })
    .option('projectDirectory', {
      type: 'string',
      default: path.join(os.tmpdir(), 'smoketest'),
    })
    .help()
    .alias('help', 'h').argv;
  return {
    projectDirectory: args.projectDirectory,
    cliVersion: args['cli-version'],
    destructive: args.destructive,
  };
}

export function assertEmpty(directory: string) {
  const contents = fs.readdirSync(directory);
  if (contents.length > 0) {
    throw new Error(`Project directory ${directory} is not empty`);
  }
}

export function createProjectDirectory(projectDirectory: string) {
  fs.ensureDirSync(projectDirectory);
}

export function removeProjectDirectory(projectDirectory: string) {
  fs.removeSync(projectDirectory);
}

export type Evaluatable = {
  evaluate(data: string, ptyProcess: pty.IPty): boolean;
};
export class Amplify {
  private executionArgs: { cwd: string; encoding: 'utf8' };
  private static carriageReturn = process.platform === 'win32' ? '\r' : os.EOL;
  constructor(projectDirectory: string) {
    this.executionArgs = { cwd: projectDirectory, encoding: 'utf8' };
  }
  init = () => {
    const command = ['amplify', 'init', '-y'];
    const result = execa.sync(command[0], command.slice(1), this.executionArgs);
    console.log(result.stdout.toString());
    return Promise.resolve(result.exitCode);
  };
  delete = (): Promise<number> => {
    const command = ['amplify', 'delete', '--force'];
    const result = execa.sync(command[0], command.slice(1), this.executionArgs);
    console.log(result.stdout.toString());
    return Promise.resolve(result.exitCode);
  };
  private static wait = (term: string) => ({
    evaluate(data: string) {
      return data.includes(term);
    },
  });
  private static send = (val: string) => ({
    evaluate(_: string, ptyProcess: pty.IPty) {
      ptyProcess.write(val);
      return true;
    },
  });
  private runProcess = (command: string[], queue: Evaluatable[]): Promise<number> => {
    return new Promise((resolve, reject) => {
      const ptyProcess = pty.spawn(command[0], command.slice(1), { ...this.executionArgs, cols: 120, rows: 30 });
      process.on('exit', () => ptyProcess.kill());
      ptyProcess.onExit(({ exitCode }) => {
        if (exitCode === 0) {
          resolve(exitCode);
        } else {
          reject(exitCode);
        }
      });
      ptyProcess.onData((data) => {
        const dataString = data.toString();
        console.log(dataString);
        if (queue.length) {
          const { evaluate } = queue[0];
          if (evaluate(dataString, ptyProcess)) {
            queue.shift();
          }
        }
      });
    });
  };
  addApi = (): Promise<number> => {
    const queue: { evaluate(data: string, ptyProcess: pty.IPty): boolean }[] = [
      Amplify.wait('Select from one of the below mentioned services:'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Here is the GraphQL API that we will create.'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Choose a schema template'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Do you want to edit the schema now'),
      Amplify.send('n'),
    ];
    return this.runProcess(['amplify', 'add', 'api'], queue);
  };
  push = () => {
    return new Promise((resolve, reject) => {
      const result = execa.command('amplify push -y', this.executionArgs);
      result.stdout?.on('data', (data: string) => {
        console.log(data.toString());
      });
      result.on('close', (code: number) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  };
  pull = (appId?: string, envName?: string) => {
    const args = ['pull', '-y'];
    if (appId) {
      args.push('--appId', appId);
    }
    if (envName) {
      args.push('--envName', envName);
    }
    const result = execa.sync('amplify', args, this.executionArgs);
    return Promise.resolve(result.exitCode);
  };
  addAuth = () => {
    const queue: { evaluate(data: string, ptyProcess: pty.IPty): boolean }[] = [
      Amplify.wait('Do you want to use the default authentication and security configuration?'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('How do you want users to be able to sign in?'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Do you want to configure advanced settings?'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Do you want to edit the schema now'),
      Amplify.send('n'),
    ];
    return this.runProcess(['amplify', 'add', 'auth'], queue);
  };
  status = () => {
    const result = execa.sync('amplify', ['status'], this.executionArgs);
    console.log(result.stdout.toString());
    return Promise.resolve(result.exitCode);
  };
}

type Command = {
  run: () => Promise<number>;
  description: string;
};

async function main() {
  const args = getArgs();
  console.info(args.projectDirectory);

  const amplify = new Amplify(args.projectDirectory);
  createProjectDirectory(args.projectDirectory);
  if (args.destructive) {
    fs.emptyDirSync(args.projectDirectory);
  }
  const commands: Command[] = [
    {
      description: 'Create an Amplify project',
      run: () => amplify.init(),
    },
    {
      description: 'Add an API to the Amplify project',
      run: () => amplify.addApi(),
    },
    {
      description: 'Get project status',
      run: () => amplify.status(),
    },
    {
      description: 'Add Auth to the Amplify project',
      run: () => amplify.addAuth(),
    },
    {
      description: 'Get project status',
      run: () => amplify.status(),
    },
    {
      description: 'Push the Amplify project',
      run: () => amplify.push(),
    },
    {
      description: 'Get project status',
      run: () => amplify.status(),
    },
    {
      description: 'Delete the Amplify project',
      run: () => amplify.delete(),
    },
  ];
  assertEmpty(args.projectDirectory);

  NPM.install(`@aws-amplify/cli@${args.cliVersion}`, true);

  for (const command of commands) {
    console.log(`Running command: ${command.description}`);
    await command.run();
  }
}

if (require.main === module) {
  main();
}
