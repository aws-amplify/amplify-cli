import * as execa from 'execa';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as pty from 'node-pty';
import yargs from 'yargs';

export const NPM = {
  install(pkgName: string, isGlobal: boolean = false) {
    const args = ['install', pkgName];
    if (isGlobal) {
      args.push('-g');
    }
    execa.sync('npm', args, { stdio: 'inherit' });
  },
  uninstall(pkgName: string, isGlobal: boolean = false) {
    const args = ['uninstall', pkgName];
    if (isGlobal) {
      args.push('-g');
    }
    execa.sync('npm', args, { stdio: 'inherit' });
  },
};

export type SmoketestArgs = {
  projectDirectory: string;
  cliVersion: string;
  destructive: boolean;
};

async function getArgs(): Promise<SmoketestArgs> {
  const args = await yargs(process.argv.slice(2))
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
    .option('project-directory', {
      type: 'string',
      default: path.join(os.tmpdir(), 'smoketest'),
    })
    .help()
    .alias('help', 'h').argv;
  return {
    projectDirectory: args['project-directory'],
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
  evaluate(data: string, ptyProcess: pty.IPty): Promise<boolean>;
};
export class Amplify {
  private executionArgs: { cwd: string; encoding: 'utf8' };
  private static carriageReturn = process.platform === 'win32' ? '\r' : os.EOL;
  private static timeout = 1000 * 60 * 10;
  constructor(projectDirectory: string) {
    this.executionArgs = { cwd: projectDirectory, encoding: 'utf8' };
  }
  init = async () => {
    const args = ['init', '-y'];
    const result = execa('amplify', args, this.executionArgs);
    result.stdout?.pipe(process.stdout);
    const exitCode = (await result).exitCode;
    if (exitCode !== 0) {
      throw new Error(`${exitCode}`);
    }
    return exitCode;
  };
  delete = async (): Promise<number> => {
    const args = ['delete', '--force'];
    const result = execa('amplify', args, this.executionArgs);
    result.stdout?.pipe(process.stdout);
    const exitCode = (await result).exitCode;
    if (exitCode !== 0) {
      throw new Error(`${exitCode}`);
    }
    return exitCode;
  };
  private static wait = (term: string) => ({
    async evaluate(data: string, _: pty.IPty): Promise<boolean> {
      return Promise.resolve(data.includes(term));
    },
  });
  private static delay = 1500;
  private static send = (val: string) => ({
    evaluate(_: string, ptyProcess: pty.IPty): Promise<boolean> {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          ptyProcess.write(val);
          resolve(true);
        }, Amplify.delay);
      });
    },
  });
  private runProcess = (command: string[], queue: Evaluatable[]): Promise<number> => {
    return new Promise((resolve, reject) => {
      const ptyProcess = pty.spawn(command[0], command.slice(1), { ...this.executionArgs, cols: 120, rows: 30 });
      const timeout = setTimeout(() => {
        console.error('Timed out waiting for process to complete');
        process.exit(1);
      }, Amplify.timeout);
      process.on('exit', () => ptyProcess.kill());
      ptyProcess.onExit(({ exitCode }) => {
        clearTimeout(timeout);
        if (exitCode === 0) {
          resolve(exitCode);
        } else {
          reject(exitCode);
        }
      });
      ptyProcess.onData(async (data) => {
        const dataString = data.toString();
        process.stdout.write(dataString);
        if (queue.length) {
          const { evaluate } = queue[0];
          if (await evaluate(dataString, ptyProcess)) {
            queue.shift();
          }
        }
      });
    });
  };
  addApi = (): Promise<number> => {
    const queue: Evaluatable[] = [
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
  push = async () => {
    const result = execa('amplify', ['push', '-y'], this.executionArgs);
    result.stdout?.pipe(process.stdout);
    const exitCode = (await result).exitCode;
    if (exitCode !== 0) {
      throw new Error(`${exitCode}`);
    }
    return exitCode;
  };
  pull = async (appId?: string, envName?: string) => {
    const args = ['pull', '-y'];
    if (appId) {
      args.push('--appId', appId);
    }
    if (envName) {
      args.push('--envName', envName);
    }
    const result = execa('amplify', args, this.executionArgs);
    result.stdout?.pipe(process.stdout);
    const exitCode = (await result).exitCode;
    if (exitCode !== 0) {
      throw new Error(`${exitCode}`);
    }
    return exitCode;
  };
  addAuth = () => {
    const queue: Evaluatable[] = [
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
  updateAuth = () => {
    const queue: Evaluatable[] = [
      Amplify.wait('What do you want to do?'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('What domain name prefix do you want to use?'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Enter your redirect signin URI:'),
      Amplify.send('http://localhost:3000/'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Do you want to add another redirect signin URI'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Enter your redirect signout URI:'),
      Amplify.send('http://localhost:3000/'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Do you want to add another redirect signout URI'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Select the identity providers you want to configure for your user pool:'),
      Amplify.send(' '),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Enter your Facebook App ID for your OAuth flow:'),
      Amplify.send('1234567890'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Enter your Facebook App Secret for your OAuth flow:'),
      Amplify.send('1234567890'),
      Amplify.send(Amplify.carriageReturn),
    ];
    return this.runProcess(['amplify', 'update', 'auth'], queue);
  };
  addRestApi = () => {
    const queue: Evaluatable[] = [
      Amplify.send('\x1b[B'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Provide a friendly name for your resource to be used as a label for this category in the project:'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Provide a path (e.g., /book/{isbn}):'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Choose a Lambda source'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Provide an AWS Lambda function name:'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Choose the runtime that you want to use:'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Choose the function template that you want to use:'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Do you want to configure advanced settings?'),
      Amplify.send('n'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Do you want to edit the local lambda function now?'),
      Amplify.send('n'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Restrict API access?'),
      Amplify.send('n'),
      Amplify.send(Amplify.carriageReturn),
      Amplify.wait('Do you want to add another path?'),
      Amplify.send('n'),
      Amplify.send(Amplify.carriageReturn),
    ];
    return this.runProcess(['amplify', 'add', 'api'], queue);
  };
  status = () => {
    const result = execa.sync('amplify', ['status'], this.executionArgs);
    console.log(result.stdout.toString());
    const exitCode = result.exitCode;
    if (exitCode !== 0) {
      return Promise.reject(exitCode);
    }
    return Promise.resolve(exitCode);
  };
  modifyGraphQlSchema = (schema: string) => {
    try {
      const [apiName] = fs.readdirSync(path.join(this.executionArgs.cwd, 'amplify', 'backend', 'api'));
      const targetPath = path.join(this.executionArgs.cwd, 'amplify', 'backend', 'api', apiName, 'schema.graphql');
      fs.writeFileSync(targetPath, schema);
      console.info('Wrote to', targetPath);
      return Promise.resolve(0);
    } catch (e) {
      return Promise.reject(1);
    }
  };
}

type Command = {
  run: () => Promise<number>;
  description: string;
};

const newGraphqlSchema = `

input AMPLIFY { globalAuthRule: AuthRule = { allow: public } } # FOR TESTING ONLY!

type Todo @model {
  id: ID!
  name: String!
  description: String
  helloWorld: String
}
`;

const createCommands = (amplify: Amplify, cliVersion: string): Command[] => [
  {
    description: 'Install Amplify CLI',
    run: () => {
      try {
        NPM.install(`@aws-amplify/cli@${cliVersion}`, true);
        return Promise.resolve(0);
      } catch (e) {
        console.error(e);
        return Promise.reject(1);
      }
    },
  },
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
    description: 'Modify the GraphQL schema',
    run: () => amplify.modifyGraphQlSchema(newGraphqlSchema),
  },
  {
    description: 'Update Auth',
    run: () => amplify.updateAuth(),
  },
  {
    description: 'Push the Amplify project',
    run: () => amplify.push(),
  },
  {
    description: 'Add REST API',
    run: () => amplify.addRestApi(),
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
    description: 'Delete the Amplify project',
    run: () => amplify.delete(),
  },
];

function writeBanner(text: string) {
  const count = text.length;
  const textPadding = 3;
  console.log('\n');
  console.log('#'.repeat(count + 2 + textPadding * 2));
  console.log(`#${' '.repeat(count + textPadding * 2)}#`);
  console.log(`#${' '.repeat(textPadding)}${text}${' '.repeat(textPadding)}#`);
  console.log(`#${' '.repeat(count + textPadding * 2)}#`);
  console.log('#'.repeat(count + 2 + textPadding * 2));
  console.log('\n');
}

async function main() {
  const args = await getArgs();
  console.info(args.projectDirectory);

  const amplify = new Amplify(args.projectDirectory);
  createProjectDirectory(args.projectDirectory);
  if (args.destructive) {
    fs.emptyDirSync(args.projectDirectory);
  }
  assertEmpty(args.projectDirectory);

  const commands = createCommands(amplify, args.cliVersion);
  for (const command of commands) {
    writeBanner(command.description);
    try {
      await command.run();
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}
