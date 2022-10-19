import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { $TSAny } from 'amplify-cli-core';
import configMapping from '../framework-config-mapping';

describe('Get angular project config file for new projects created with application', () => {
  let context;
  const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
  const projectPath = path.resolve('./');
  const angularDirName = 'angular-app';
  const angularPath = path.join(projectPath, angularDirName);

  const angularDefaultConfig = {
    SourceDir: 'src',
    DistributionDir: 'dist',
    BuildCommand: `${npm} run-script build`,
    StartCommand: 'ng serve',
  };
  const angularProjectConfig = {
    SourceDir: 'src',
    DistributionDir: `dist/${angularDirName}`,
    BuildCommand: `${npm} run-script build ${angularDirName}`,
    StartCommand: `ng serve ${angularDirName}`,
  };
  const angularGeneratedProjectConfig = (name): $TSAny => ({
    SourceDir: `projects/${name}/src`,
    DistributionDir: `dist/${name}`,
    BuildCommand: `${npm} run-script build ${name}`,
    StartCommand: `ng serve ${name}`,
  });

  beforeAll(() => {
    context = {
      exeInfo: {
        localEnvInfo: {
          projectPath: angularPath,
        },
      },
    };
  });

  beforeEach(() => {
    execSync(`ng new ${angularDirName} --defaults=true --interactive=false --minimal=true --skip-git=true --skip-install=true --skip-tests=true`);
  });

  afterEach(() => {
    fs.rmSync(angularPath, { recursive: true, force: true });
  });

  it('Should return project config from angular.json with initial project', async () => {
    const result = configMapping.getProjectConfiguration(context, 'angular');
    expect(result).toEqual(angularProjectConfig);
  });

  it('Should return a project config even if project name doesn\'t match dir name', async () => {
    fs.cpSync(angularPath, './foo', { recursive: true });
    const result = configMapping.getProjectConfiguration(context, 'angular', path.join(projectPath, 'foo'));
    expect(result).toEqual(angularProjectConfig);
    fs.rmSync('./foo', { recursive: true, force: true });
  });

  it('Should return a project config for generated projects', async () => {
    execSync(`ng generate app foo --minimal=true --skip-install=true --skip-tests=true`, { cwd: angularPath });
    const result = configMapping.getProjectConfiguration(context, 'angular', path.join(angularPath, 'projects', 'foo'));
    expect(result).toEqual(angularGeneratedProjectConfig('foo'));
  });

  it('Should return a default config if couldn\'t find project name', async () => {
    execSync(`ng generate app foo --minimal=true --skip-install=true --skip-tests=true`, { cwd: angularPath });
    const result = configMapping.getProjectConfiguration(context, 'angular', path.join(angularPath, 'projects', 'bar'));
    expect(result).toEqual(angularDefaultConfig);
  });
});

// fs.cpSync(angularPath, './foo', { recursive: true });
//     expect.assertions(1);
//     const ERROR_MESSAGE = 'There is no project named foo in angular.json. Have you renamed any folder?';
//     let err;
//     try {
//       await configMapping.getProjectConfiguration(context, 'angular', path.join(projectPath, 'foo'));
//     } catch (error) {
//       err = error;
//     } finally {
//       expect(err.message).toEqual(ERROR_MESSAGE);
//     }
//     fs.rmSync('./foo', { recursive: true, force: true });

describe('Get angular project config file for new projects created without application', () => {
  let context;
  const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
  const projectPath = path.resolve('./');
  const angularDirName = 'angular-app';
  const angularPath = path.join(projectPath, angularDirName);

  const angularDefaultConfig = {
    SourceDir: 'src',
    DistributionDir: 'dist',
    BuildCommand: `${npm} run-script build`,
    StartCommand: 'ng serve',
  };
  const angularGeneratedProjectConfig = (name): $TSAny => ({
    SourceDir: `projects/${name}/src`,
    DistributionDir: `dist/${name}`,
    BuildCommand: `${npm} run-script build ${name}`,
    StartCommand: `ng serve ${name}`,
  });

  beforeAll(() => {
    context = {
      exeInfo: {
        localEnvInfo: {
          projectPath: angularPath,
        },
      },
    };
  });

  beforeEach(() => {
    execSync(`ng new ${angularDirName} --defaults=true --interactive=false --minimal=true --skip-git=true --skip-install=true --skip-tests=true --create-application=false`);
  });

  afterEach(() => {
    fs.rmSync(angularPath, { recursive: true, force: true });
  });

  it('Should return default config from angular.json without any project', async () => {
    const result = configMapping.getProjectConfiguration(context, 'angular');
    expect(result).toEqual(angularDefaultConfig);
  });

  it('Should return a project config for generated projects', async () => {
    execSync(`ng generate app foo --minimal=true --skip-install=true --skip-tests=true`, { cwd: angularPath });
    const result = configMapping.getProjectConfiguration(context, 'angular', path.join(angularPath, 'projects', 'foo'));
    expect(result).toEqual(angularGeneratedProjectConfig('foo'));
  });

  it('Should return a default config if couldn\'t find project name', async () => {
    execSync(`ng generate app foo --minimal=true --skip-install=true --skip-tests=true`, { cwd: angularPath });
    const result = configMapping.getProjectConfiguration(context, 'angular', path.join(angularPath, 'projects', 'bar'));
    expect(result).toEqual(angularDefaultConfig);
  });
});
