import execa from 'execa';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as pty from 'node-pty';
import { nspawn as spawn } from '@aws-amplify/amplify-e2e-core';

export const NPM = {
  install(pkgName: string, isGlobal: boolean = false): Promise<void> {
    return new Promise((resolve) => {
      const args = ['install'];
      if (isGlobal) {
        args.push('-g');
      }
      args.push(pkgName);
      execa.sync('npm', args, { stdio: 'inherit' });
      resolve();
    });
  },
  uninstall(pkgName: string, isGlobal: boolean = false): Promise<void> {
    return new Promise((resolve) => {
      const args = ['uninstall', pkgName];
      if (isGlobal) {
        args.push('-g');
      }
      execa.sync('npm', args, { stdio: 'inherit' });
      resolve();
    });
  },
};

export type SmoketestArgs = {
  projectDirectory: string;
  cliVersion: string;
  destructive: boolean;
};

function getArgs(): SmoketestArgs {
  const { DESTRUCTIVE, CLI_VERSION, PROJECT_DIRECTORY } = process.env;
  if (!CLI_VERSION) {
    throw new TypeError('CLI_VERSION must be defined');
  }
  return {
    projectDirectory: PROJECT_DIRECTORY || path.join(os.tmpdir(), 'smoketest'),
    cliVersion: CLI_VERSION,
    destructive: DESTRUCTIVE === 'true',
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
  constructor(projectDirectory: string) {
    this.executionArgs = { cwd: projectDirectory, encoding: 'utf8' };
  }
  init = async () => {
    const args = ['init', '-y'];
    return spawn('amplify', args, this.executionArgs).runAsync();
  };
  delete = async () => {
    const args = ['delete', '--force'];
    return spawn('amplify', args, this.executionArgs).runAsync();
  };
  addApi = async () => {
    return spawn('amplify', ['add', 'api'], this.executionArgs)
      .wait('Select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait('Here is the GraphQL API that we will create.')
      .sendCarriageReturn()
      .wait('Choose a schema template')
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now')
      .sendNo()
      .runAsync();
  };
  push = async () => {
    return spawn('amplify', ['push', '-y'], this.executionArgs).runAsync();
  };
  pull = async (appId?: string, envName?: string) => {
    const args = ['pull', '-y'];
    if (appId) {
      args.push('--appId', appId);
    }
    if (envName) {
      args.push('--envName', envName);
    }
    return spawn('amplify', args, this.executionArgs).runAsync();
  };
  addAuth = () => {
    return spawn('amplify', ['add', 'auth'], this.executionArgs)
      .wait('Do you want to use the default authentication and security configuration?')
      .sendCarriageReturn()
      .wait('How do you want users to be able to sign in?')
      .sendCarriageReturn()
      .wait('Do you want to configure advanced settings?')
      .sendCarriageReturn()
      .runAsync();
  };
  updateAuth = () => {
    return spawn('amplify', ['update', 'auth'], this.executionArgs)
      .wait('What do you want to do?')
      .sendCarriageReturn()
      .wait('What domain name prefix do you want to use?')
      .sendCarriageReturn()
      .wait('Enter your redirect signin URI:')
      .send('http://localhost:3000/')
      .sendCarriageReturn()
      .wait('Do you want to add another redirect signin URI')
      .sendCarriageReturn()
      .wait('Enter your redirect signout URI:')
      .send('http://localhost:3000/')
      .sendCarriageReturn()
      .wait('Do you want to add another redirect signout URI')
      .sendCarriageReturn()
      .wait('Select the identity providers you want to configure for your user pool:')
      .send(' ')
      .sendCarriageReturn()
      .wait('Enter your Facebook App ID for your OAuth flow:')
      .send('1234567890')
      .sendCarriageReturn()
      .wait('Enter your Facebook App Secret for your OAuth flow:')
      .send('1234567890')
      .sendCarriageReturn()
      .runAsync();
  };
  addRestApi = () => {
    return spawn('amplify', ['add', 'api'], this.executionArgs)
      .wait('Select from one of the below mentioned services')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Provide a friendly name')
      .sendCarriageReturn()
      .wait('Provide a path (e.g. /book/{isbn}):')
      .sendCarriageReturn()
      .wait('Choose a Lambda source')
      .sendCarriageReturn()
      .wait('Provide an AWS Lambda function name:')
      .sendCarriageReturn()
      .wait('Choose the runtime that you want to use:')
      .sendCarriageReturn()
      .wait('Choose the function template that you want to use:')
      .sendCarriageReturn()
      .wait('Do you want to configure advanced settings?')
      .sendNo()
      .wait('Do you want to edit the local lambda function now?')
      .sendNo()
      .wait('Restrict API access?')
      .sendCarriageReturn()
      .wait('Do you want to add another path?')
      .sendNo()
      .runAsync();
  };
  status = () => {
    return spawn('amplify', ['status'], this.executionArgs).runAsync();
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
  run: () => Promise<any>;
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

function writeBanner(text: string) {
  const count = text.length;
  const textPadding = 3;
  console.log('\n');
  process.stdout.write('#'.repeat(count + 2 + textPadding * 2));
  process.stdout.write('\n');
  process.stdout.write(`#${' '.repeat(count + textPadding * 2)}#`);
  process.stdout.write('\n');
  process.stdout.write(`#${' '.repeat(textPadding)}${text}${' '.repeat(textPadding)}#`);
  process.stdout.write('\n');
  process.stdout.write(`#${' '.repeat(count + textPadding * 2)}#`);
  process.stdout.write('\n');
  process.stdout.write('#'.repeat(count + 2 + textPadding * 2));
  process.stdout.write('\n');
  process.stdout.write('\n');
}

describe('Release Smoke Tests', () => {
  const createCommands = (amplify: Amplify, cliVersion: string): Command[] => [
    {
      description: `Install Amplify CLI v${cliVersion}`,
      run: () => NPM.install(`@aws-amplify/cli@${cliVersion}`, true),
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
  test('An amplify project can be created without error', async () => {
    const args = getArgs();
    console.info(args.projectDirectory);

    const amplify = new Amplify(args.projectDirectory);
    createProjectDirectory(args.projectDirectory);
    if (args.destructive) {
      writeBanner('Deleting contents of ' + args.projectDirectory);
      fs.emptyDirSync(args.projectDirectory);
    }
    assertEmpty(args.projectDirectory);

    const commands = createCommands(amplify, args.cliVersion);
    for (const command of commands) {
      writeBanner(command.description);
      await command.run();
    }
    expect.assertions(0);
  });
});
