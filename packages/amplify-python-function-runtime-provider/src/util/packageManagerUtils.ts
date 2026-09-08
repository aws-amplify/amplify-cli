import path from 'path';
import fs from 'fs-extra';
import execa from 'execa';
import { AmplifyError, execWithOutputAsString } from '@aws-amplify/amplify-cli-core';

export enum PackageManager {
  UV = 'uv',
  PIPENV = 'pipenv',
}

export interface PackageManagerInfo {
  manager: PackageManager;
  available: boolean;
}

/**
 * Detects which Python package manager is available on the system.
 * Prefers uv over pipenv for performance.
 * @returns The detected package manager
 */
export async function detectPackageManager(): Promise<PackageManager> {
  // Check for uv first (preferred for performance)
  try {
    await execWithOutputAsString('uv --version');
    return PackageManager.UV;
  } catch (err) {
    // uv not available, fall back to pipenv
  }

  // Check for pipenv
  try {
    await execWithOutputAsString('pipenv --version');
    return PackageManager.PIPENV;
  } catch (err) {
    // Neither available
    throw new AmplifyError('PackagingLambdaFunctionError', {
      message:
        'Neither uv nor pipenv is installed. You must have either uv or pipenv installed and available on your PATH. ' +
        'Install uv from https://docs.astral.sh/uv/ (recommended for faster builds) or ' +
        'pipenv by running "pip3 install --user pipenv".',
    });
  }
}

/**
 * Gets the virtual environment path for the given source root.
 * Works with both uv (.venv) and pipenv (pipenv --venv).
 * @param srcRoot - The source root directory
 * @param manager - The package manager being used (optional, will auto-detect if not provided)
 * @returns The path to the site-packages directory
 */
export async function getVirtualEnvPath(srcRoot: string, manager?: PackageManager): Promise<string> {
  const packageManager = manager || (await detectPackageManager());

  if (packageManager === PackageManager.UV) {
    // UV uses .venv by default
    const venvPath = path.join(srcRoot, '.venv');

    if (!fs.existsSync(venvPath)) {
      throw new AmplifyError('PackagingLambdaFunctionError', {
        message: `Could not find uv virtual environment at ${venvPath}. Run 'uv sync' or 'uv venv' first.`,
      });
    }

    // Determine the site-packages path based on platform
    let sitePackagesPath: string;
    if (process.platform.startsWith('win')) {
      sitePackagesPath = path.join(venvPath, 'Lib', 'site-packages');
    } else {
      // Find the Python version directory in .venv/lib/
      const libPath = path.join(venvPath, 'lib');
      if (fs.existsSync(libPath)) {
        const pythonDirs = fs.readdirSync(libPath).filter((dir) => dir.startsWith('python'));
        if (pythonDirs.length > 0) {
          sitePackagesPath = path.join(libPath, pythonDirs[0], 'site-packages');
        } else {
          throw new AmplifyError('PackagingLambdaFunctionError', {
            message: `Could not find Python version directory in ${libPath}`,
          });
        }
      } else {
        throw new AmplifyError('PackagingLambdaFunctionError', {
          message: `Could not find lib directory at ${libPath}`,
        });
      }
    }

    if (fs.existsSync(sitePackagesPath)) {
      return sitePackagesPath;
    }

    throw new AmplifyError('PackagingLambdaFunctionError', {
      message: `Could not find uv site-packages directory at ${sitePackagesPath}`,
    });
  } else {
    // PIPENV uses pipenv --venv
    const pipEnvDir = await execWithOutputAsString('pipenv --venv', { cwd: srcRoot });

    // Get Python version from Pipfile
    const pipfilePath = path.join(srcRoot, 'Pipfile');
    if (!fs.existsSync(pipfilePath)) {
      throw new AmplifyError('PackagingLambdaFunctionError', {
        message: `Could not find Pipfile at ${pipfilePath}`,
      });
    }

    const { parse } = await import('ini');
    const pipfile = parse(fs.readFileSync(pipfilePath, 'utf-8'));
    const version = pipfile?.requires?.python_version;
    if (!version) {
      throw new AmplifyError('PackagingLambdaFunctionError', {
        message: `Did not find Python version specified in ${pipfilePath}`,
      });
    }

    let pipEnvPath: string;
    if (process.platform.startsWith('win')) {
      pipEnvPath = path.join(pipEnvDir, 'Lib', 'site-packages');
    } else {
      pipEnvPath = path.join(pipEnvDir, 'lib', `python${version}`, 'site-packages');
    }

    if (fs.existsSync(pipEnvPath)) {
      return pipEnvPath;
    }

    throw new AmplifyError('PackagingLambdaFunctionError', {
      message: `Could not find a pipenv site-packages directory at ${pipEnvPath}`,
    });
  }
}

/**
 * Installs dependencies using the appropriate package manager.
 * @param srcRoot - The source root directory
 * @param manager - The package manager to use (optional, will auto-detect if not provided)
 */
export async function installDependencies(srcRoot: string, manager?: PackageManager): Promise<void> {
  const packageManager = manager || (await detectPackageManager());

  if (packageManager === PackageManager.UV) {
    // UV can work with different dependency file formats
    // Check for pyproject.toml first, then requirements.txt, then Pipfile
    const hasPyproject = fs.existsSync(path.join(srcRoot, 'pyproject.toml'));
    const hasRequirements = fs.existsSync(path.join(srcRoot, 'requirements.txt'));
    const hasPipfile = fs.existsSync(path.join(srcRoot, 'Pipfile'));

    if (hasPyproject) {
      // Use uv sync for pyproject.toml projects
      await execa.command('uv sync', { cwd: srcRoot, stdio: 'inherit' });
    } else if (hasRequirements) {
      // Create venv if it doesn't exist
      const venvPath = path.join(srcRoot, '.venv');
      if (!fs.existsSync(venvPath)) {
        await execa.command('uv venv', { cwd: srcRoot, stdio: 'inherit' });
      }
      // Use uv pip install for requirements.txt
      await execa.command('uv pip install -r requirements.txt', { cwd: srcRoot, stdio: 'inherit' });
    } else if (hasPipfile) {
      // UV can also work with Pipfile
      // Create venv if it doesn't exist
      const venvPath = path.join(srcRoot, '.venv');
      if (!fs.existsSync(venvPath)) {
        await execa.command('uv venv', { cwd: srcRoot, stdio: 'inherit' });
      }
      // Convert Pipfile to requirements and install
      // Note: uv doesn't natively support Pipfile, so we'll use pipenv for this case
      // Fall back to pipenv if only Pipfile is present
      await execa.command('pipenv install', { cwd: srcRoot, stdio: 'inherit' });
    } else {
      throw new AmplifyError('PackagingLambdaFunctionError', {
        message: `No dependency file found in ${srcRoot}. Expected pyproject.toml, requirements.txt, or Pipfile.`,
      });
    }
  } else {
    // Use pipenv
    await execa.command('pipenv install', { cwd: srcRoot, stdio: 'inherit' });
  }
}

/**
 * Gets the command prefix to run a command in the virtual environment.
 * @param manager - The package manager being used
 * @returns The command prefix (e.g., 'uv run' or 'pipenv run')
 */
export function getRunPrefix(manager: PackageManager): string[] {
  if (manager === PackageManager.UV) {
    return ['uv', 'run'];
  } else {
    return ['pipenv', 'run'];
  }
}
